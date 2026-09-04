// LINE Webhook受信サーバー（常時稼働想定・Renderの別サービスへデプロイする）
// - 署名検証 → 「友だち追加（follow）」イベント時に登録時オートリプライを返すだけの最小サーバー
// - 通常のテキストメッセージには反応しない（このアカウントは告知配信専用のため）
// - 素のNode.js httpモジュールで実装（外部ライブラリ不要）
// - 既存 server/webhook（秘書アイ用・ポート3000）とはポート・トークンを分離している
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lineConfigured, verifySignature, replyText, replyWithQuickReply } from "./lib/line-client.mjs";
import {
  TOTAL_STEPS,
  DONE_LABEL,
  STUCK_LABEL,
  STUCK_PROMPT_TEXT,
  COMPLETION_TEXT,
  START_KEYWORD,
  ESCALATION_TEXT,
  getStep,
  getCategory,
} from "./lib/onboarding-content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// community-ops/.env を読み込む簡易ローダー（dotenv等の外部パッケージは使わない）
function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2];
    if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv(join(__dirname, "..", ".env"));

const PORT = process.env.LINE_WEBHOOK_PORT || 8090;
const WELCOME_PATH = join(__dirname, "templates", "welcome-reply.md");
// 招待リンク・最小実装（scripts/invite-link-gate.gs）のウェブアプリURL。
// population A/B識別の自己申告（postback）を記録するために使う。未設定でも動く（記録をスキップするだけ）。
const INVITE_GATE_URL = process.env.INVITE_GATE_URL || "";

// 「スターターキット」モニター向け はじめかたステップ配信の進捗記録先（scripts/onboarding-progress-gate.gs）
// のウェブアプリURL。未設定でも動く（記録をスキップするだけ。ステップ案内自体は動作する）。
const ONBOARDING_PROGRESS_URL = process.env.ONBOARDING_PROGRESS_URL || "";

function loadWelcomeText() {
  if (!existsSync(WELCOME_PATH)) return "友だち追加ありがとうございます。";
  return readFileSync(WELCOME_PATH, "utf-8").trim();
}

// population A/B の自己申告をinvite-link-gate.gsに記録する（fire-and-forget、失敗しても致命的ではない）。
// GASのレスポンス（リダイレクト用HTML）は使わないため待たない。
function recordSelfReport(src) {
  if (!INVITE_GATE_URL) return;
  const url = `${INVITE_GATE_URL}?src=${encodeURIComponent(src)}&dest=line-selfreport&campaign=line-follow-selfreport`;
  fetch(url).catch((e) => console.error("招待リンク自己申告の記録に失敗:", e.message));
}

// 「スターターキット」モニター向けステップ配信の進捗を scripts/onboarding-progress-gate.gs へ記録する
// （fire-and-forget、応答を待たない。失敗しても致命的ではない＝返信そのものはこの記録の成否に依存しない）。
// event: "started" | "done" | "stuck" | "reason"、code は event === "reason" のときのみ渡す。
function recordOnboardingProgress(userId, step, event, code) {
  if (!ONBOARDING_PROGRESS_URL) return;
  const params = new URLSearchParams({ action: "record", userId, step: String(step), event });
  if (code) params.set("code", code);
  const url = `${ONBOARDING_PROGRESS_URL}?${params.toString()}`;
  fetch(url).catch((e) => console.error("オンボーディング進捗の記録に失敗:", e.message));
}

// ステップNの案内文＋「できました」「わからない・詰まった」クイックリプライを返信する。
// escalated=trueのときは「わからない・詰まった」ボタンに esc=1 を付け、次に押されたときは
// カテゴリ選択を繰り返さずESCALATION_TEXTを返す（無限ループ防止、下記postbackハンドラ参照）。
function buildStepQuickReplyItems(step, { escalated = false } = {}) {
  const stuckData = escalated ? `onb=stuck&step=${step}&esc=1` : `onb=stuck&step=${step}`;
  return [
    { label: DONE_LABEL, data: `onb=done&step=${step}` },
    { label: STUCK_LABEL, data: stuckData },
  ];
}

async function replyStep(replyToken, step) {
  const stepData = getStep(step);
  if (!stepData) return; // 想定外のstep番号は何もしない（呼び出し元でガードする）
  await replyWithQuickReply(replyToken, stepData.text, buildStepQuickReplyItems(step));
}

// ステップNの詰まりカテゴリ選択クイックリプライを返信する。
async function replyStuckCategories(replyToken, step) {
  const stepData = getStep(step);
  if (!stepData) return;
  const items = stepData.categories.map((c) => ({
    label: c.label,
    data: `onb=reason&step=${step}&code=${c.code}`,
  }));
  await replyWithQuickReply(replyToken, STUCK_PROMPT_TEXT, items);
}

// カテゴリ回答文言を返信する。続けて同じステップの「できました」「わからない・詰まった」ボタンを
// 再度添える（LINEのクイックリプライは直近のメッセージにしか表示されないため、これを付け直さないと
// ユーザーが元のステップのボタンへ戻れなくなる。フロー設計v3リスク7で指摘されている「クイックリプライが
// 他の配信で隠れる」問題と同種の理由）。ここで付け直す「わからない・詰まった」はescalated扱いにし、
// 次に押されたときはカテゴリ選択を繰り返さない（無限ループ防止）。
async function replyStuckCategoryAnswer(replyToken, step, code) {
  const category = getCategory(step, code);
  if (!category) return;
  await replyWithQuickReply(replyToken, category.reply, buildStepQuickReplyItems(step, { escalated: true }));
}

// GASの進捗記録（scripts/onboarding-progress-gate.gs）に現在の進捗を問い合わせる。
// 「はじめる」再送信時（＝再開したいとき）にのみ使う同期呼び出し。通常のステップ進行では
// 使わない（応答速度優先の設計を維持するため）。タイムアウト・失敗時はnullを返し、
// 呼び出し元でStep1からの開始にフォールバックする。
async function fetchCurrentProgress(userId) {
  if (!ONBOARDING_PROGRESS_URL || !userId) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const url = `${ONBOARDING_PROGRESS_URL}?${new URLSearchParams({ action: "get", userId })}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Number.isInteger(data.currentStep) || data.currentStep < 1) return null;
    return data; // { currentStep, status }
  } catch (e) {
    console.error("進捗取得に失敗（Step1からの開始にフォールバックします）:", e.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ステップ配信の開始・再開処理（postbackの onb=start と、テキストの合言葉「はじめる」の両方から呼ばれる）。
// 既に進行中の記録があれば、そのステップを再表示する（＝「続きから」再開。フロー設計・鈴木さんの
// 運用フィードバックにより、途中で自由文が挟まりボタンが見えなくなった場合の回復手段として、
// モニター・鈴木さんのどちらも「はじめる」と再送信するだけで復帰できるようにしている）。
// 記録が無い、または進捗記録先が未設定の場合はStep1から開始する。
async function startOnboarding(replyToken, userId) {
  const progress = await fetchCurrentProgress(userId);
  if (progress && progress.status === "completed") {
    await replyText(replyToken, COMPLETION_TEXT);
    return;
  }
  if (!progress) {
    recordOnboardingProgress(userId, 1, "started");
    await replyStep(replyToken, 1);
    return;
  }
  await replyStep(replyToken, progress.currentStep);
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, name: "community-ops-line-webhook", lineConfigured: lineConfigured() }));
    return;
  }

  if (req.method !== "POST" || req.url !== "/webhook") {
    res.writeHead(404);
    res.end("not found");
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf-8");
  const signature = req.headers["x-line-signature"] || "";

  if (!lineConfigured() || !verifySignature(rawBody, signature)) {
    res.writeHead(401);
    res.end("bad signature");
    return;
  }

  // LINEには即200を返す（応答が遅いとエラー扱いになるため、後処理は非同期で行う）
  res.writeHead(200);
  res.end();

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return;
  }

  for (const ev of payload.events || []) {
    try {
      if (ev.type === "follow" && ev.replyToken) {
        // ウェルカムメッセージ本文 + population A/B識別のための自己申告クイックリプライを添える
        // （B13：招待リンク最小実装の一部。Discord同様、入室検知そのものは行わない設計を踏襲）。
        await replyWithQuickReply(ev.replyToken, loadWelcomeText(), [
          { label: "すでにご相談中の案件から", data: "src=A" },
          { label: "SNS・noteを見て", data: "src=B" },
        ]);
      } else if (ev.type === "postback" && ev.postback && ev.replyToken) {
        const data = ev.postback.data || "";
        const m = /^src=(A|B)$/.exec(data);
        if (m) {
          // 既存の自己申告処理（変更なし）
          recordSelfReport(m[1]);
          await replyText(ev.replyToken, "ありがとうございます！参考にさせていただきますね。");
        } else if (data.startsWith("onb=")) {
          // 「スターターキット」モニター向け はじめかたステップ配信（onb=プレフィックスで名前空間を分離）。
          // userIdはfollow/postbackイベント共通で ev.source.userId から取得できる。
          const userId = (ev.source && ev.source.userId) || "";
          const params = new URLSearchParams(data);
          const action = params.get("onb");

          if (action === "start") {
            // 冒頭案内の「はじめる」ボタン。ステップ1を案内する。
            await startOnboarding(ev.replyToken, userId);
          } else if (action === "done") {
            const step = Number(params.get("step"));
            if (Number.isInteger(step) && step >= 1 && step <= TOTAL_STEPS) {
              recordOnboardingProgress(userId, step, "done");
              if (step < TOTAL_STEPS) {
                await replyStep(ev.replyToken, step + 1);
              } else {
                await replyText(ev.replyToken, COMPLETION_TEXT);
              }
            }
          } else if (action === "stuck") {
            const step = Number(params.get("step"));
            const escalated = params.get("esc") === "1";
            if (Number.isInteger(step) && step >= 1 && step <= TOTAL_STEPS) {
              if (escalated) {
                // 同じステップで「わからない・詰まった」が2回目以降（カテゴリ回答済みの状態から再度押された）。
                // カテゴリ選択を繰り返さず、担当への引き継ぎ文言で止める（無限ループ防止）。
                // ボタンはescalated状態のまま付け直すため、再度押しても同じ案内が返るだけでループしない。
                recordOnboardingProgress(userId, step, "escalated");
                await replyWithQuickReply(ev.replyToken, ESCALATION_TEXT, buildStepQuickReplyItems(step, { escalated: true }));
              } else {
                recordOnboardingProgress(userId, step, "stuck");
                await replyStuckCategories(ev.replyToken, step);
              }
            }
          } else if (action === "reason") {
            const step = Number(params.get("step"));
            const code = params.get("code") || "";
            if (Number.isInteger(step) && step >= 1 && step <= TOTAL_STEPS && code) {
              recordOnboardingProgress(userId, step, "reason", code);
              await replyStuckCategoryAnswer(ev.replyToken, step, code);
            }
          }
          // 上記いずれにも一致しない onb=... postbackは、現状どおり無視する（ログのみ）。
        }
      } else if (
        ev.type === "message" &&
        ev.message &&
        ev.message.type === "text" &&
        ev.replyToken &&
        (ev.message.text || "").trim() === START_KEYWORD
      ) {
        // 「スターターキット」モニター向けはじめかたステップ配信の開始トリガー（完全一致のみ）。
        // 鈴木さんが個別に送る開始案内（community-ops/line/templates/onboarding-start-invite.md）に
        // 対して、モニターが合言葉「はじめる」を返信した場合にのみ反応する。これ以外の自由文には
        // 一切反応しない設計を維持する（告知配信専用アカウントの原則を、この1語だけの例外で守る）。
        const userId = (ev.source && ev.source.userId) || "";
        await startOnboarding(ev.replyToken, userId);
      }
      // 上記いずれにも該当しないメッセージ・イベントには反応しない設計（告知配信専用アカウントのため）
    } catch (e) {
      console.error("webhook handling error:", e.message);
    }
  }
});

server.listen(PORT, () => {
  console.log(`community-ops LINE webhookサーバー起動: http://localhost:${PORT}/webhook`);
  if (!lineConfigured()) {
    console.warn(
      "⚠ LINE_COMMUNITY_CHANNEL_ACCESS_TOKEN / LINE_COMMUNITY_CHANNEL_SECRET が未設定です。.envを設定してください。"
    );
  }
});
