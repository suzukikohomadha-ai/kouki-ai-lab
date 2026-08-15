# AUTO-KHM-001：日本の規制・行政ニュース 多言語ダイジェスト配信（案A・n8n公式Creator Hub提出候補）

- 対象：株式会社コホマダ（AI・DX/業務自動化事業）
- 目的：n8n公式（Creator Hub）のワークフローテンプレートライブラリへ提出する候補として、
  案Aの実装ドラフトを作成する
- ステータス：**Draft（実装ドラフト）。n8n本番接続・Credential登録・n8n公式への提出は一切行っていない**
- 担当：エイト（実装）／委任元：メイ（設計）・リサ（収集元調査）・リョウ（法務論点整理）
- 実装日：2026-08-15
- 起票：`office/state.js` T65（アイ経由の依頼）

## 前提ドキュメント（社内・時系列）

1. `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_設計書_v1.md`（メイ）
2. `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_収集元調査_v1.md`（リサ）
3. `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_法務論点整理_v1.md`（リョウ）
4. `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_実装メモ_v1.md`（エイト・本実装の要約）

## このケースの範囲

- ワークフロードラフト（メイン）：`../../../workflows/draft/AUTO-KHM-001_japan-reg-news-digest.json`
- ワークフロードラフト（エラーハンドラー）：`../../../workflows/draft/AUTO-KHM-001_japan-reg-news-digest-error.json`
- テストデータ：`../../../tests/fixtures/AUTO-KHM-001_cases.json`
- テストケース：`../../../tests/cases/AUTO-KHM-001_test-cases.md`
- 設計詳細：`workflow-design.md`（本フォルダ）

## 重要な注記（ハルシネーション防止・必読）

- ノードの正式`type`・`typeVersion`・パラメータキー名は、**このセッションでもWebFetchが
  `EGRESS_BLOCKED`のため一次確認できていません**。過去案件（2026-07-28、T27/T28）で確認済みの
  一部ノード（Gmail Draft作成＝resource=draft/operation=create、Error Trigger等）を除き、
  すべて`[要インスタンス確認]`または`[要公式確認]`です。
- 収集元サイトの実URLは一切ハードコードしていません。`Set: Config`ノードには`.example`ドメイン
  （RFC 2606により実在解決しない予約ドメイン）のプレースホルダーのみを設定しています。
  リサ・リョウの調査で「比較的リスクが低そう」と暫定評価された経産省・中小企業庁・
  出入国在留管理庁も、**RSS URL・利用規約ともに原文の一次確認が済んでいない**ため、
  本ドラフトでは意図的にサンプル値として埋めていません。
- AI/LLM連携・翻訳連携は、専用ノードの有無が未確認のため、HTTP Requestノードで
  プレースホルダーエンドポイント（`.example`ドメイン）を呼び出す実装にしています。
  DeepL等の専用ノードを使う場合は、`n8n-schema-researcher`による一次確認後に再設計が必要です。
- `scripts/validate-workflow.mjs` ・`scripts/sanitize-workflow.mjs` ・`scripts/check-secrets.mjs`は
  **本タスクを実施したセッションでシェル実行ツールが利用できなかったため、実行できていません**。
  目視によるレビューは行いましたが、自動検証の代替にはなりません。次にこのケースに着手する際は
  必ずこれらのスクリプトを実行してください。

## 人間承認が必須な事項

`.claude/rules/approval-policy.md`・本プロジェクトの`.claude/rules/approval-policy.md`（コウキAIラボ側）に
準拠し、以下は社長の承認なしに実行していません。

- n8n本番接続・Credential登録・ワークフローの有効化
- 実際に組み込む収集元サイトの選定・利用規約の最終確認
- AI/LLM・翻訳等の外部APIキーの取得・登録
- n8n公式（`creators.n8n.io`）への実際の提出操作
- テンプレートの英語タイトル・説明文・Sticky Note文言の最終確認
- ダイジェスト配信の実運用開始
