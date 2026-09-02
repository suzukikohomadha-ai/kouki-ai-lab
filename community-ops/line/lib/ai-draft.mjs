// 個別メッセージへの返信下書きをAnthropic Messages APIで生成する薄いクライアント。
// 生成した文面は必ず人間が確認してから手動でLINEアプリ上に貼り付けて送信する前提
// （このモジュール自体はLINEへの送信を一切行わない。下書きテキストを返すだけ）。
// n8n-automation/workflows のClaude API呼び出しパターン（HTTP Request + Messages API）を
// 踏襲しているが、ここはn8nではなく素のNode.js（fetchベース・外部ライブラリ不要）。
const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";

export function anthropicConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

// evidence-policy.md（実在しない情報を作らない・断定しない）に沿ったガードレールを明示している。
// 「実務者のAIエージェント勉強会」公式LINEに届く個別の質問・相談への返信下書き専用のシステムプロンプト。
const SYSTEM_PROMPT = `あなたは「実務者のAIエージェント勉強会」（noteメンバーシップ）の公式LINEアカウントに
会員・見込み客から届いた個別メッセージへの、返信文の「下書き」を作成するアシスタントです。

重要な前提：
- ここで作成する文章は必ず運営者（鈴木さん）が内容を確認し、必要なら修正したうえで、
  手動でLINEアプリから送信します。あなたが生成した文章がそのまま自動送信されることはありません。
- 開講日程・価格・受講可否・返金条件・個別の合否判断・在庫や枠の空き状況など、
  今この時点で断定できない具体的な事実は、実在しない数値や日付を作り出さず、
  「〇〇については運営者が確認のうえ改めてご連絡します」のように書いてください。
- 相手のメッセージの意図が不明瞭な場合は、断定せず、確認を促す一文を含めてください。
- クレーム・キャンセル・返金・法的トラブルに関わる内容だと判断した場合は、
  下書きの末尾に「【要人間対応】」と明記し、定型的な返信で済ませようとしないでください。

文面の方針：
- 丁寧で簡潔な日本語。担当者が実際にそのまま送るのに近い、自然な一人称の文章にする。
- 前置き・解説・「以下が下書きです」等のメタ的な言葉は付けず、返信本文のみを出力する。`;

export async function generateDraftReply(userMessage, { displayName } = {}) {
  if (!anthropicConfigured()) {
    throw new Error("ANTHROPIC_API_KEY が未設定です");
  }
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const userPrompt = displayName
    ? `送信者の表示名：${displayName}\n\n受信したメッセージ：\n${userMessage}`
    : `受信したメッセージ：\n${userMessage}`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Anthropic API error: ${res.status} ${detail}`);
  }

  const data = await res.json();
  const block = (data.content || []).find((b) => b.type === "text");
  return (block && block.text) || "";
}
