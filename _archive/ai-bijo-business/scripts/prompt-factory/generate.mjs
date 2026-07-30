#!/usr/bin/env node
// =====================================================================
// prompt-factory / generate.mjs
// 七瀬あかり v3形式 YAMLプロンプト生成スクリプト（T9）
//
// 使い方：
//   node generate.mjs --list
//     → 各軸の候補一覧を表示
//   node generate.mjs --situation cafe --time noon --outfit blouse_cardigan --expression soft_smile
//     → 完成YAMLプロンプトを標準出力に出す（そのままFlow i2iに貼れる）
//   node generate.mjs --situation cafe --matrix
//     → そのシチュエーションで有効な全組み合わせを一覧表示（生成はしない）
//
// motion: ブロック（動画用・T9_動画プロンプト体系v1）：
//   --motion hair_sway|blink_smile|light_flicker [--seconds 2]
//     → 静止画プロンプトの末尾に motion: ブロックを追加して出力
//
//   --i2v --motion hair_sway [--seconds 2]
//     → Flow「フレーム→動画」用の【動きだけの短い自然文】を出力（実地検証済みの正式手順）。
//       勝ち画像を始点フレームにセットし、この短文だけを貼る。
//       静止画部分は出力しない（見た目は画像が持っているため）。
// =====================================================================

import {
  IDENTITY_FACE, SKIN_MAKEUP, NEGATIVE_BASE, NEGATIVE_NO_BOKEH,
  TIMES, OUTFITS, EXPRESSIONS, SITUATIONS, NG_RULES, BANNED_VOCAB,
} from "./data.mjs";

// ---- 動画用 motion プリセット（初期3種・顔崩れリスク低） ----
const MOTIONS = {
  hair_sway: {
    label: "髪が風で揺れる",
    body: (sec) => `motion:
  type: 髪の揺れ
  description:
    ごく弱い風で髪の毛先と顔周りの後れ毛だけがふわりと揺れる、
    頭・顔・肩の位置は動かない
  speed: とてもゆっくり、自然な空気の流れ程度
  amplitude: 極小（毛先数センチ以内）
  loop:
    duration: ${sec}秒
    seamless: 開始フレームと終了フレームで髪の位置を一致させる、
      継ぎ目のないシームレスループ
  lock:
    顔の輪郭・目鼻立ち・表情・体の位置・カメラ位置は完全固定、
    背景は静止`,
    i2v: (sec) => `この写真の女性はそのまま。ごく弱い風で、髪の毛先と顔周りの後れ毛だけがふわりと揺れる。頭・顔・肩・体・カメラは一切動かない。表情は固定、まばたきしない。揺れはとてもゆっくり、毛先数センチ以内。約${sec}秒で開始と終了の髪の位置が同じになる、継ぎ目のないループ映像。背景は静止。`,
  },
  blink_smile: {
    label: "まばたき＋微笑み",
    body: (sec) => `motion:
  type: まばたきと微笑み
  description:
    自然なまばたきを1回、その後に口角がわずかに上がって微笑む、
    頭の角度と顔の位置は動かない
  speed: ゆっくり、自然な人間のまばたき速度
  amplitude: 極小（目と口元のみ）
  loop:
    duration: ${sec}秒
    seamless: 開始と終了を同じ表情（軽い微笑み）でそろえる、
      継ぎ目のないシームレスループ
  lock:
    顔の輪郭・目鼻立ち・髪・体の位置・カメラ位置は完全固定、
    口は開かない、歯は見せない、背景は静止`,
    i2v: (sec) => `この写真の女性はそのまま。自然なまばたきを1回して、そのあと口角がほんの少し上がって微笑む。動くのは目と口元だけ。頭の角度・顔の位置・髪・体・カメラは一切動かない。口は開かない、歯は見せない。まばたきはゆっくり自然な速さ。約${sec}秒で開始と終了が同じ軽い微笑みの表情になる、継ぎ目のないループ映像。背景は静止。`,
  },
  light_flicker: {
    label: "光の揺れ",
    body: (sec) => `motion:
  type: 光の揺らぎ
  description:
    環境光がろうそくの炎のようにごくわずかに明滅し、
    肌と背景の明るさが呼吸するように揺れる、人物は静止
  speed: とてもゆっくり、穏やかな明滅
  amplitude: 極小（明度変化のみ、色相は変えない）
  loop:
    duration: ${sec}秒
    seamless: 開始フレームと終了フレームの明るさを一致させる、
      継ぎ目のないシームレスループ
  lock:
    人物・髪・表情・構図は完全に静止、動くのは光だけ`,
    i2v: (sec) => `この写真の女性はそのまま、完全に静止している。動くのは光だけ。環境光がろうそくの炎のようにごくわずかに明滅し、肌と背景の明るさが呼吸するようにゆっくり揺れる。明るさの変化はごく小さく、色味は変えない。人物・髪・表情・構図・カメラは一切動かない。約${sec}秒で開始と終了の明るさが同じになる、継ぎ目のないループ映像。`,
  },
};

// ---- 引数パース ----
// 値なしで渡されたオプション（例：--motion のあとに値が無い／次も --xxx）は
// true（フラグ扱い）にして、後段のバリデーションで候補一覧つきエラーにする
const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--list") opts.list = true;
  else if (a === "--matrix") opts.matrix = true;
  else if (a === "--i2v") opts.i2v = true;
  else if (a.startsWith("--")) {
    const next = args[i + 1];
    if (next !== undefined && !next.startsWith("--")) { opts[a.slice(2)] = next; i++; }
    else opts[a.slice(2)] = true;
  }
}

function die(msg) { console.error(`❌ ${msg}`); process.exit(1); }

// ---- --list ----
if (opts.list) {
  console.log("■ situation（シチュエーション）");
  for (const [k, v] of Object.entries(SITUATIONS)) console.log(`  ${k.padEnd(14)} ${v.label}　[時間帯: ${v.allowedTimes.join(",")}]`);
  console.log("\n■ time（時間帯）");
  for (const [k, v] of Object.entries(TIMES)) console.log(`  ${k.padEnd(14)} ${v.label}`);
  console.log("\n■ outfit（衣装）");
  for (const [k, v] of Object.entries(OUTFITS)) console.log(`  ${k.padEnd(16)} ${v.label}　[tags: ${v.tags.join(",")}]`);
  console.log("\n■ expression（表情）");
  for (const [k, v] of Object.entries(EXPRESSIONS)) console.log(`  ${k.padEnd(14)} ${v.label}`);
  console.log("\n■ motion（動画用・任意）");
  for (const [k, v] of Object.entries(MOTIONS)) console.log(`  ${k.padEnd(14)} ${v.label}`);
  process.exit(0);
}

// ---- motion の解決（--i2v 用に situation より先に処理する）----
// 値なし（--motion 単独）や不正値は候補一覧を出してエラー終了（黙って無視しない）
let motion = null;
if (opts.motion !== undefined) {
  if (opts.motion === true || !MOTIONS[opts.motion]) {
    die(`--motion には動作名が必要です。候補: ${Object.keys(MOTIONS).map((k) => `${k}（${MOTIONS[k].label}）`).join(", ")}`);
  }
  motion = MOTIONS[opts.motion];
}
const seconds = Math.min(3, Math.max(1, Number(opts.seconds === true ? NaN : opts.seconds) || 2));

// ---- --i2v：Flow「フレーム→動画」用の動きだけの短い自然文を出力 ----
// 勝ち画像を始点フレームにセットし、この短文だけを貼る（静止画部分は出力しない）
if (opts.i2v) {
  if (!motion) die(`--i2v には --motion が必要です。候補: ${Object.keys(MOTIONS).join(", ")}`);
  console.log(motion.i2v(seconds));
  process.exit(0);
}

// ---- situation 必須 ----
const sitKey = opts.situation;
if (!sitKey || !SITUATIONS[sitKey]) die(`--situation を指定してください（候補: ${Object.keys(SITUATIONS).join(", ")}）`);
const sit = SITUATIONS[sitKey];

// ---- --matrix：有効な全組み合わせを列挙 ----
if (opts.matrix) {
  console.log(`■ ${sit.label} の有効な組み合わせ\n`);
  let n = 0;
  for (const t of sit.allowedTimes) {
    for (const [ok, ov] of Object.entries(OUTFITS)) {
      if (!ov.tags.some((tag) => sit.allowedOutfitTags.includes(tag))) continue;
      for (const ek of sit.allowedExpressions) {
        const ng = NG_RULES.find((r) => r.test({ situation: sitKey, time: t, outfit: ok, expression: ek }));
        if (ng) continue;
        n++;
        console.log(`  --situation ${sitKey} --time ${t} --outfit ${ok} --expression ${ek}`);
      }
    }
  }
  console.log(`\n合計 ${n} 通り`);
  process.exit(0);
}

// ---- バリデーション ----
const timeKey = opts.time;
if (!timeKey || !TIMES[timeKey]) die(`--time を指定してください（候補: ${Object.keys(TIMES).join(", ")}）`);
if (!sit.allowedTimes.includes(timeKey)) die(`「${sit.label}」に時間帯 ${timeKey} は使えません（可: ${sit.allowedTimes.join(", ")}）`);

const outfitKey = opts.outfit;
if (!outfitKey || !OUTFITS[outfitKey]) die(`--outfit を指定してください（候補: ${Object.keys(OUTFITS).join(", ")}）`);
const outfit = OUTFITS[outfitKey];
if (!outfit.tags.some((tag) => sit.allowedOutfitTags.includes(tag)))
  die(`「${sit.label}」に衣装 ${outfit.label} は合いません（可タグ: ${sit.allowedOutfitTags.join(", ")}）`);

const exprKey = opts.expression;
if (!exprKey || !EXPRESSIONS[exprKey]) die(`--expression を指定してください（候補: ${Object.keys(EXPRESSIONS).join(", ")}）`);
if (!sit.allowedExpressions.includes(exprKey))
  die(`「${sit.label}」に表情 ${EXPRESSIONS[exprKey].label} は合いません（可: ${sit.allowedExpressions.join(", ")}）`);

const ng = NG_RULES.find((r) => r.test({ situation: sitKey, time: timeKey, outfit: outfitKey, expression: exprKey }));
if (ng) die(`NG組み合わせです：${ng.reason}`);

// ---- 組み立て ----
const t = { ...TIMES[timeKey], key: timeKey };
const lo = sit.lightingOverride || {};
const lightingType = lo.lightingType || t.lightingType;
const lightingDirection = lo.lightingDirection || t.lightingDirection;
const catchlight = lo.catchlight || t.catchlight;
const colorGrade = t.colorGrade + (lo.colorGradeSuffix || "") + "、SNSに投稿されたような自然な色調";
const sensorQuality = sit.sensorOverride || `${t.sensorNote}、SNSにアップロードされたような自然な画質`;

// identity_face（固定）＋ skin/makeup（演出）＋ hair_scene_adjustment（状態のみ可変）
const hairScene = sit.hairSceneAdjustment
  ? `\n\n  hair_scene_adjustment:\n    ${sit.hairSceneAdjustment}`
  : "";

const negative = NEGATIVE_BASE + (sit.noBokeh ? `、\n${NEGATIVE_NO_BOKEH.trim().replace(/^/, "  ")}` : "");

const yaml = `style_mode:
  ${sit.styleMode(t)}

render_intent:
  ${sit.renderIntent(t)}

composition:
  layout: ${sit.composition.layout}
  pose: ${sit.composition.pose}
  camera_vantage: ${sit.composition.camera_vantage}
  framing: ${sit.composition.framing}

camera:
  lens_behavior:
    ${sit.lensBehavior}
  sensor_quality:
    ${sensorQuality}

lighting:
  type: ${lightingType}
  direction: ${lightingDirection}
  catchlight: ${catchlight}

subject_style:
${IDENTITY_FACE}${hairScene}

${SKIN_MAKEUP}

  expression:
    ${EXPRESSIONS[exprKey].text}

attire:
  ${outfit.text}

background:
  description:
    ${sit.background}

color_grade:
  ${colorGrade}

quality_modifiers:
  ${sit.qualityModifiers}

negative_prompt:
${negative}${motion ? `\n\n${motion.body(seconds)}` : ""}`;

// ---- 禁止語彙セルフチェック（Codexレビュー反映） ----
// ネガティブプロンプト内は除外して、ポジティブ側に禁止語彙が混入していないか検査
const positivePart = yaml.split("negative_prompt:")[0];
const hits = BANNED_VOCAB.filter((v) => positivePart.includes(v.banned));
if (hits.length > 0) {
  console.error("⚠️  禁止語彙がポジティブプロンプトに混入しています：");
  for (const h of hits) console.error(`   「${h.banned}」→ 置き換え候補：「${h.replace}」`);
  process.exit(1);
}

console.log(yaml);
