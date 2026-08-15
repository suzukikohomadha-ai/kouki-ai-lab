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

## 確認済み環境（2026-08-10更新）

| 項目 | 値 |
|---|---|
| OS | Windows 11 Pro |
| シェル | Windows PowerShell 5.1 / Git Bash |
| Node.js | v24.18.0 |
| npm | 11.16.0 |
| Git | 利用可能（git version 2.55.0.windows.3、`AICompany/`直下がリポジトリルート） |
| Docker | 未検出 |
| Claude Codeバージョン | `[未確認]` |
| n8n環境 | **セルフホスト・接続済み**（接続情報は`.env`、Git管理外）。`PUB-001`を実際に登録・
  Credential割当・有効化し、本番Webhookでの動作確認まで完了（`tests/results/2026-08-10_PUB-001_result.md`） |
| テスト環境・本番環境の有無 | 上記セルフホストインスタンス1つ（テスト/本番の分離は`[ユーザー入力待ち]`） |

n8nインスタンスへの接続自体は確立済みですが、`n8nワークフローの新規登録・更新・有効化・
Credentialの作成・更新`は毎回ユーザー承認が必要な操作です（`CLAUDE.md`・`.claude/rules/security.md`）。
`AUTO-*`系のノード`type`/`typeVersion`のうち、まだ実インスタンスで動作確認していないものは
引き続き`[要インスタンス確認]`として扱ってください（現状は`workflows/README.md`の一覧を参照）。

## セキュリティ

- Credentialの実値・秘密情報はこのリポジトリに含めません（`.env` はGit管理外）。
- 本番に影響する操作（登録・更新・有効化・削除・Credential操作・Git push・本番マージ・
  通知の本送信）は `.claude/settings.json` の `permissions.ask` で毎回確認が必要です。
- Hooksは動作未検証のため今回は無効です。有効化する場合は `docs/troubleshooting.md` /
  `docs/security-policy.md` の検証手順に従ってください。

## 現在のワークフロー一覧

`AUTO-CNT-001/002`（コンテンツ下書き自動化）・`AUTO-COM-001/002`（共通基盤）・`DEMO-001`（デモ）・
`PUB-001`（n8n Creator Hub提出候補）の6件を作成済みです。それぞれの状態・監査判定・残タスクは
**`workflows/README.md`** に一覧化しています（このREADMEでは詳細を重複させません）。

T100系列プロジェクト（`AUTO-CNT-*` `AUTO-COM-*`）の設計〜実装の経緯は `../logs/` に多数の記録が
ありますが、まず読むべき1件は `../logs/common_2026-08-10_n8n自動化_進捗まとめ・整理_v1.md` です
（そこから各詳細ログへ辿れます）。

## 次のアクション（ユーザー対応が必要な項目）

- `workflows/README.md`の「本番投入前に必要なこと」列にある各条件（Credential割当・監査未実施分の
  監査依頼等）への対応
- `PUB-001`のn8n Creator Hubへの実際の提出（ログインが必要なため鈴木さんご自身の作業）
- テスト環境と本番環境を分ける予定があるかどうか（現状は1つのセルフホストインスタンスのみ）
