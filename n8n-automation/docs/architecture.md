# アーキテクチャ・標準作業フロー

## エージェント構成

```
n8n-automation-lead（全体責任者・委任・承認管理）
  ├─ n8n-schema-researcher（読み取り専用・仕様調査）
  ├─ n8n-workflow-builder（実装）
  └─ n8n-quality-auditor（読み取り専用・監査）
```

lead が要件を整理し、researcher / builder / auditor に委任する。
複数の調査・実装が並行できる場合は同時に起動する。

## Skillsとフェーズの対応

| Phase | 内容 | Skill |
|---|---|---|
| 0 | 環境確認 | （`n8n-automation-lead` が初回に実施） |
| 1 | 業務分析 | `n8n-intake` |
| 2 | 要件定義 | `n8n-design` |
| 3 | 設計（2案以上比較） | `n8n-design` |
| 4 | 実装 | `n8n-build` |
| 5 | 静的検証 | `n8n-review` |
| 6 | テスト | `n8n-test` |
| 7 | ステージング | `n8n-test` |
| 8 | 本番移行（要承認） | `n8n-deploy` |
| 9 | 運用 | `n8n-optimize`（監視は運用手順書に基づき人/仕組みで実施） |
| 10 | 最適化 | `n8n-optimize` |

## ワークフローJSONのライフサイクル

```
workflows/draft/       … n8n-build で作成した実装中のもの
workflows/validated/   … n8n-review を通過したもの
workflows/deployed/    … 本番登録済み（デプロイ日時・担当者を記録。実データを含む
                          エクスポートは .gitignore で除外）
workflows/archived/    … 廃止・置き換え済みのもの
```

## Phase 0：環境確認（毎回の作業開始時に）

- OS・シェル
- Claude Codeのバージョン
- Node.js / npm のバージョン
- Gitリポジトリの有無
- 既存の `.claude` 設定・`CLAUDE.md`
- 既存のn8n関連ファイル
- n8n Cloud／セルフホストの別、バージョン、API接続可否
- Dockerの有無
- テスト環境・本番環境の有無

既存ファイルがある場合は内容を確認せずに上書きしない。差分を確認してから編集する。

## Phase 3：設計比較の観点

開発工数／月額費用／保守性／拡張性／安定性／セキュリティ／ベンダーロックイン／
障害時の影響／必要スキル。最低2案（推奨案・低コスト案、必要に応じて高信頼性案）。

## Phase 6：テストで含めるべきケース

正常系／異常系／境界値／空データ／欠損データ／重複データ／大量データ／
APIタイムアウト／認証エラー／レート制限／外部サービス障害／部分失敗／再実行／
手動復旧／ロールバック。

## Phase 10：最適化の観点

不要ノード削減／API呼出回数削減／バッチサイズ調整／キャッシュ／重複排除／並列処理／
サブワークフロー化／ログ量削減／実行データ保存期間／LLMモデルの見直し／
プロンプト改善／フォールバック／SLA改善。
