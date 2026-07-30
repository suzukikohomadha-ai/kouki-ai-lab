// office/app/views/command-center.js
import { BUSINESSES, REQUEST_TEMPLATES, RISK_LEVELS } from "../constants.js";
import { esc } from "../utils.js";
import { emptyState } from "../components/empty-state.js";
import { registerView } from "../router.js";

// ルールベースの推奨エージェント表（CLAUDE.md 層A §A-4 のルーティング表と同じ組み合わせを、
// このUIのためにハードコードしたもの。実際のAI選定ロジックとは接続していない＝モック）。
const ROUTING = {
  "market-research": { agents: ["リサ", "レン", "サトル", "ミナ", "アオイ"], parallel: true, deliverable: "調査レポート" },
  "overseas-expansion": { agents: ["リサ", "レン", "ミナ", "リョウ", "アオイ"], parallel: false, deliverable: "海外展開提案書" },
  "new-business": { agents: ["リサ", "レン", "サトル", "ミナ", "アオイ"], parallel: true, deliverable: "新規事業分析レポート" },
  "sales-material": { agents: ["レン", "サトル", "カエデ", "ミナ", "アオイ"], parallel: false, deliverable: "営業資料" },
  "line-design": { agents: ["サトル", "カエデ", "リサ", "アオイ"], parallel: false, deliverable: "公式LINE設計書" },
  "flyer": { agents: ["サトル", "カエデ", "アオイ"], parallel: false, deliverable: "チラシ制作指示書" },
  "lp-web": { agents: ["サトル", "カエデ", "ノヴァ", "アオイ"], parallel: false, deliverable: "LP/Webサイト構成案" },
  "threejs-site": { agents: ["カエデ", "ノヴァ", "アオイ"], parallel: false, deliverable: "Three.jsサイト設計書" },
  "n8n-automation": { agents: ["メイ", "エイト", "リサ", "アオイ"], parallel: false, deliverable: "自動化要件定義書／n8nワークフロー" },
  "subsidy-research": { agents: ["リサ", "ミナ", "アオイ"], parallel: true, deliverable: "補助金調査資料" },
  "financial-analysis": { agents: ["リサ", "ミナ", "アオイ"], parallel: true, deliverable: "収支分析資料" },
  "contract-review": { agents: ["リサ", "リョウ", "アオイ"], parallel: false, deliverable: "契約書レビュー結果" },
  "fp-report": { agents: ["リサ", "ミナ", "アオイ"], parallel: true, deliverable: "FP資料" },
};

function formHtml(state) {
  return (
    '<form class="op-card" data-ccform>' +
      '<div class="op-card__head"><div class="op-card__title">依頼フォーム</div></div>' +
      '<div class="op-chiprow" style="margin-bottom:14px">' +
        REQUEST_TEMPLATES.map((t) => `<button type="button" class="op-chip" data-template="${t.id}">${esc(t.label)}</button>`).join("") +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' +
        '<div class="op-form-grid">' +
          '<div class="op-form-row"><label>対象事業</label><select name="business">' +
            BUSINESSES.filter((b) => b.id !== "all").map((b) => `<option value="${b.id}">${esc(b.label)}</option>`).join("") +
          '</select></div>' +
          '<div class="op-form-row"><label>優先度</label><select name="priority"><option>高</option><option selected>中</option><option>低</option></select></div>' +
        '</div>' +
        '<div class="op-form-row"><label>依頼タイトル</label><input type="text" name="title" placeholder="例：KINOTOの公式LINE構築案がほしい"></div>' +
        '<div class="op-form-row"><label>目的</label><textarea name="purpose" placeholder="この依頼で達成したいこと"></textarea></div>' +
        '<div class="op-form-row"><label>背景</label><textarea name="background" placeholder="経緯・前提条件"></textarea></div>' +
        '<div class="op-form-row"><label>希望成果物</label><input type="text" name="wanted" placeholder="例：リッチメニュー構成案"></div>' +
        '<div class="op-form-grid">' +
          '<div class="op-form-row"><label>期限</label><input type="date" name="due"></div>' +
          '<div class="op-form-row"><label>リスクレベル</label><select name="risk">' +
            RISK_LEVELS.map((r) => `<option value="${r.id}">${esc(r.label)}</option>`).join("") +
          '</select></div>' +
        '</div>' +
        '<div class="op-form-grid">' +
          '<div class="op-checkrow"><input type="checkbox" name="external" id="cc-external"><label for="cc-external">外部公開を伴う</label></div>' +
          '<div class="op-checkrow"><input type="checkbox" name="prod" id="cc-prod"><label for="cc-prod">本番操作を伴う</label></div>' +
          '<div class="op-checkrow"><input type="checkbox" name="pii" id="cc-pii"><label for="cc-pii">個人情報を含む</label></div>' +
        '</div>' +
        '<div class="op-form-row"><label>参考URL</label><input type="text" name="url" placeholder="任意"></div>' +
        '<div class="op-form-row"><label>関連案件</label><input type="text" name="related" placeholder="案件IDなど（任意）"></div>' +
        '<div class="op-form-row"><label>添付ファイル</label><input type="file" disabled><span class="op-hint">添付の実処理は未接続です（UIのみ）</span></div>' +
        '<div class="op-form-row"><label>使用する事業コンテキスト</label><select name="context">' +
          '<option value="kohomada-business-context">kohomada-business-context</option>' +
          '<option value="kinoto-business-context">kinoto-business-context</option>' +
          '<option value="fp-business-context">fp-business-context</option>' +
        '</select></div>' +
        '<button class="op-btn op-btn--primary" type="submit">推奨エージェントを見る</button>' +
      '</div>' +
    '</form>'
  );
}

function previewHtml(templateId, form) {
  const r = ROUTING[templateId];
  if (!r) {
    return emptyState({ ic: "🧭", title: "依頼テンプレートを選ぶと候補が表示されます", desc: "上のチップから依頼の種類を選ぶか、フォームを送信してください。" });
  }
  return (
    '<div class="op-card">' +
      '<div class="op-card__head"><div class="op-card__title">推奨エージェント（ルールベース候補・モック）</div></div>' +
      '<div class="op-hint" style="margin-bottom:10px">実際のAI選定ロジックとは未接続です。CLAUDE.md層Aのルーティング表と同じ組み合わせをUI上で再現した候補表示です。</div>' +
      r.agents.map((name, i) => (
        '<div class="op-cc-agent-row">' +
          `<div class="op-cc-agent-row__order">${i + 1}</div>` +
          `<div style="flex:1">${esc(name)}</div>` +
        '</div>'
      )).join("") +
      `<div class="op-cc-steplabel" style="margin-top:8px">実行順序：${r.parallel ? "並列" : "順次"}</div>` +
      `<div class="op-cc-steplabel">想定成果物：${esc(r.deliverable)}</div>` +
      '<div class="op-cc-steplabel">承認ポイント：外部公開・本番操作・個人情報を含む場合は必ず社長承認</div>' +
      '<div class="op-cc-steplabel">未確認情報：事業コンテキストの詳細（KINOTO/FPの一部項目は[要ヒアリング]）</div>' +
      '<div class="op-cc-steplabel">リスク：' + (form && form.risk ? esc(form.risk) : "未選択") + '</div>' +
    '</div>'
  );
}

function render(container) {
  let selectedTemplate = null;
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>AI指令センター</h1><span class="op-view-sub">依頼内容から推奨エージェントの候補を確認できます</span></div>' +
      '<div class="op-cc-layout">' +
        '<div class="op-cc-form">' + formHtml() + '</div>' +
        '<div class="op-cc-preview" data-preview>' + previewHtml(null) + '</div>' +
      '</div>' +
    '</div>'
  );

  const form = container.querySelector("[data-ccform]");
  const preview = container.querySelector("[data-preview]");

  container.querySelectorAll("[data-template]").forEach((chip) => {
    chip.addEventListener("click", () => {
      selectedTemplate = chip.getAttribute("data-template");
      form.querySelector('[name="title"]').value = chip.textContent + "の依頼";
      preview.innerHTML = previewHtml(selectedTemplate, {});
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    preview.innerHTML = previewHtml(selectedTemplate, { risk: fd.get("risk") });
  });
}

registerView("command-center", { render });
