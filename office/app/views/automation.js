// office/app/views/automation.js
// P1・n8n連携は未接続のためサンプル表示。Credentialの値は一切表示しない。
import { MOCK_AUTOMATION_MEI, MOCK_AUTOMATION_EITO, MOCK_ENABLED } from "../mock-data.js";
import { esc } from "../utils.js";
import { emptyState } from "../components/empty-state.js";
import { mockBadge } from "../components/status-badge.js";
import { registerView } from "../router.js";

function meiCard(m) {
  return (
    '<div class="op-card">' +
      `<div class="op-card__head"><div class="op-card__title" style="flex:1">${esc(m.process)}</div>${mockBadge()}</div>` +
      '<dl class="op-approval__grid">' +
        `<dt>課題</dt><dd>${esc(m.issue)}</dd>` +
        `<dt>ボトルネック</dt><dd>${esc(m.bottleneck)}</dd>` +
        `<dt>自動化候補</dt><dd>${esc(m.candidate)}</dd>` +
        `<dt>優先順位</dt><dd>${esc(m.priority)}</dd>` +
        `<dt>ツール候補</dt><dd>${esc(m.toolCandidate)}</dd>` +
        `<dt>費用対効果</dt><dd>${esc(m.roi)}</dd>` +
      '</dl>' +
    '</div>'
  );
}

function eitoCard(w) {
  const envCls = { dev: "dev", test: "test", prod: "prod", archive: "archive" }[w.env] || "dev";
  return (
    '<div class="op-card">' +
      `<div class="op-card__head"><div class="op-card__title" style="flex:1">${esc(w.name)}</div>` +
      `<span class="op-badge op-env-badge--${envCls}">${esc(w.env)}</span>${mockBadge()}</div>` +
      '<dl class="op-approval__grid">' +
        `<dt>対象業務</dt><dd>${esc(w.process)}</dd>` +
        `<dt>開発状態</dt><dd>${esc(w.devStatus)}</dd>` +
        `<dt>ノード数</dt><dd>${w.nodeCount}</dd>` +
        `<dt>使用API</dt><dd>${(w.apis || []).map(esc).join("、")}</dd>` +
        `<dt>Credential参照名</dt><dd>${esc(w.credentialRef)}</dd>` +
        `<dt>最終実行</dt><dd>${w.lastRun ? esc(w.lastRun) : "未実行"}</dd>` +
        `<dt>成功率</dt><dd>${w.successRate != null ? w.successRate + "%" : "データなし"}</dd>` +
        `<dt>テスト状態</dt><dd>${esc(w.testStatus)}</dd>` +
        `<dt>本番状態</dt><dd>${esc(w.prodStatus)}</dd>` +
      '</dl>' +
      '<div class="op-hint">n8n本体への実接続は未接続です。</div>' +
    '</div>'
  );
}

function render(container) {
  const meiRows = MOCK_ENABLED ? MOCK_AUTOMATION_MEI : [];
  const eitoRows = MOCK_ENABLED ? MOCK_AUTOMATION_EITO : [];
  container.innerHTML = (
    '<div class="op-view">' +
      '<div class="op-view-head"><h1>自動化</h1><span class="op-view-sub">メイ（設計）とエイト（n8n実装）の担当を分けて表示・P1サンプル</span></div>' +
      '<section><h2 style="font-size:13px;color:var(--op-text-3)">メイ：業務自動化の要件定義</h2>' +
        (meiRows.length ? '<div class="op-grid">' + meiRows.map(meiCard).join("") + '</div>' : emptyState({ ic: "🧭", title: "自動化候補はまだありません" })) +
      '</section>' +
      '<section><h2 style="font-size:13px;color:var(--op-text-3)">エイト：n8nワークフロー</h2>' +
        (eitoRows.length ? '<div class="op-grid">' + eitoRows.map(eitoCard).join("") + '</div>' : emptyState({ ic: "🔗", title: "ワークフローはまだありません" })) +
      '</section>' +
    '</div>'
  );
}

registerView("automation", { render });
