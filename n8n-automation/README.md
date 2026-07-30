# n8n業務自動化エージェント環境

社内業務自動化（ヒアリング→設計→実装→検証→デプロイ→運用改善）を、n8nワークフローとして
一気通貫で担当するClaude Code環境です。品質方針は「開発速度優先」ではなく
**セキュリティ・保守性・拡張性・信頼性を含む高度な最適化重視**です。

このフォルダは `../`（コウキAIラボ）とは独立しています。互いのファイルを触りません。

## クイックスタート

1. `.env.example` を `.env` にコピーし、n8nの接続情報を入力する（`.env` はGit管理外）。
2. 新しい自動化依頼が来たら `n8n-intake` から始める。

```text
/n8n-intake 経理部の請求書処理を自動化したい
/n8n-design 顧客問い合わせの振り分けフローを設計
/n8n-build 承認済み設計書からワークフローを作成
/n8n-review workflows/draft/invoice-processing.json
/n8n-test workflows/validated/invoice-processing.json
/n8n-deploy ステージング環境へ登録
/n8n-optimize 過去30日分の実行結果を分析
```

（実際に作成したSkillは `.claude/skills/n8n-intake` `n8n-design` `n8n-build` `n8n-review`
`n8n-test` `n8n-deploy` `n8n-optimize` の7つです）

## エージェント

`.claude/agents/` に4体。詳細は `CLAUDE.md` の一覧、各エージェントの権限は
`docs/security-policy.md` を参照してください。

- `n8n-automation-lead` … 全体責任者
- `n8n-schema-researcher` … 読み取り専用の仕様調査
- `n8n-workflow-builder` … 実装
- `n8n-quality-auditor` … 読み取り専用の品質監査

## ディレクトリ構成

```
n8n-automation/
├─ CLAUDE.md              … このフォルダ専用の方針（@importでルールを読込）
├─ README.md              … このファイル
├─ .env.example / .gitignore
├─ .claude/
│  ├─ agents/              … 4エージェント
│  ├─ skills/               … 7スキル
│  ├─ rules/                … security / n8n-workflow-json / documentation
│  └─ settings.json         … permissions（allow/ask/deny）、hooksは未実装
├─ templates/               … ヒアリング〜運用手順書の雛形（9種）
├─ workflows/{draft,validated,deployed,archived}/
├─ tests/{fixtures,cases,results}/
├─ scripts/                 … 検証スクリプト（4種、Node.js標準ライブラリのみ）
└─ docs/                    … architecture / security-policy / naming-conventions /
                               troubleshooting、および案件ごとのケース文書（docs/cases/）
```

## 確認済み環境（構築時点）

| 項目 | 値 |
|---|---|
| OS | Windows 11 Pro |
| シェル | Windows PowerShell 5.1 |
| Node.js | v24.18.0 |
| npm | 11.16.0 |
| Git | **未インストール**（`git`コマンドが見つかりません） |
| Docker | 未検出 |
| Claude Codeバージョン | `[未確認]`（`claude --version` がこの環境のPATHから実行できず） |
| n8n環境（Cloud/セルフホスト・バージョン・API接続） | `[ユーザー入力待ち]` |
| テスト環境・本番環境の有無 | `[ユーザー入力待ち]` |

n8n環境の情報が未確定のため、今回はn8nへの接続・登録・有効化・Credential作成は
一切行っていません。ノードの `type` / `typeVersion` は一般的に知られる値を参考に
ドラフトしていますが、`[要インスタンス確認]` として扱ってください。

## セキュリティ

- Credentialの実値・秘密情報はこのリポジトリに含めません（`.env` はGit管理外）。
- 本番に影響する操作（登録・更新・有効化・削除・Credential操作・Git push・本番マージ・
  通知の本送信）は `.claude/settings.json` の `permissions.ask` で毎回確認が必要です。
- Hooksは動作未検証のため今回は無効です。有効化する場合は `docs/troubleshooting.md` /
  `docs/security-policy.md` の検証手順に従ってください。

## デモ案件

`docs/cases/DEMO-001/` に、外部接続なしの安全なデモ（経費申請しきい値チェック）を
1件作成済みです。ワークフロードラフトは `workflows/draft/DEMO-001_threshold-check.json`、
静的検証の実行結果は `tests/results/2026-07-24_DEMO-001_result.md` を参照してください。
n8nへのインポート・実行はしていません。

## 次のアクション（ユーザー対応が必要な項目）

- n8n環境（Cloud or セルフホスト、バージョン、API接続情報）を教えてください
- Gitを使う場合は事前にインストールが必要です（現在未インストール）
- 最初に自動化したい業務を1つ選んでください（`/n8n-intake` から開始します）
