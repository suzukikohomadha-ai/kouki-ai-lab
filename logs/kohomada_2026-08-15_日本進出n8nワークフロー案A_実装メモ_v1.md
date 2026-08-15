# 案A：日本の規制・行政ニュース多言語ダイジェスト配信 ― 実装メモ（エイト・実装ドラフト）

- 対象事業：株式会社コホマダ（海外展開・日本進出支援 × AI・業務自動化）
- 目的：n8n公式（Creator Hub）への提出候補として設計された案A（メイ設計）を、`n8n-automation/`の
  規約に沿ってワークフローJSONとして実装する
- 担当：エイト（n8n Workflow Implementation Engineer）
- ステータス：**実装ドラフト（Draft）。n8n本番接続・Credential登録・n8n公式への提出は一切行っていない**
- 作成日：2026-08-15
- 起票：`office/state.js` T65（アイ経由の依頼、社長指示「規約の最終確認は後回しにして先に実装だけ進めてほしい」）
- 前提ドキュメント：
  - `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_設計書_v1.md`（メイ）
  - `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_収集元調査_v1.md`（リサ）
  - `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_法務論点整理_v1.md`（リョウ）

---

## 結論

メイの設計書に基づき、案Aのメインワークフロー1件・エラーハンドリング用ワークフロー1件のドラフトJSON、
テストデータ、テストケース、案件ドキュメント一式を実装した。

- **社長のご指示どおり、収集元サイトの利用規約の最終確認は待たず実装を先行させた**。ただし
  `Set: Config`ノードに設定した収集元URLは、リサ・リョウの調査で暫定的にリスクが低いとされた
  経産省・中小企業庁・出入国在留管理庁を含め、いずれの実URLも一切ハードコードしていない
  （すべて`.example`ドメインのプレースホルダー。RFC 2606により実在解決しない予約ドメイン）。
- **ノードの正式`type`・`typeVersion`・パラメータは、今回のセッションでもWebFetchが利用できず、
  一次確認できていない**。過去案件（2026-07-28、T27/T28）で確認済みの一部（Gmail Draft作成、
  Error Triggerの存在）を除き、すべて`[要インスタンス確認]`または`[要公式確認]`のまま実装している。
- **【アイによる追記・2026-08-15】** エイトのセッションではシェル実行ツールが使えず`scripts/*.mjs`が
  未実行だったため、アイ（秘書）のセッションで実際に3スクリプトを実行し検証した。結果は以下のとおり：
  - `check-secrets.mjs`：メインJSONで「メールアドレス（個人情報の可能性）」1件を検出したが、
    内容は`Set: Config`ノードの`digestRecipientEmail`に設定された`placeholder-recipient@example.com`
    （RFC 2606予約ドメイン`.example`）であり、実在の個人情報ではない誤検知と確認した。エラーハンドラー
    JSONは検出0件。
  - `validate-workflow.mjs`：両JSONともエラー0件。警告はいずれもSticky Noteノードが他ノードと
    接続されていない旨（Sticky Noteの仕様上正常な状態であり、問題ではない）。
  - `sanitize-workflow.mjs`：両JSONとも検出なし。
  - **結論：自動検証は完了し、重大な問題は見つからなかった**。ただし実際のn8nインスタンスへの
    インポート検証（構文が有効か、ノードが実在するか）は依然として未実施。
- 実装した2つのJSONは、内部的な整合性（ノード名の一意性、`connections`が参照するノード名がすべて
  `nodes`配列に実在すること）を目視で確認したが、**実際にn8nへインポートして検証したものではない**。

---

## 確認済み事実

1. `n8n-automation/CLAUDE.md`・`.claude/rules/security.md`・`.claude/rules/n8n-workflow-json.md`・
   `.claude/rules/documentation.md`・`docs/naming-conventions.md`・`docs/architecture.md`を確認し、
   本規約に沿って実装した。
2. `n8n-automation/workflows/draft/DEMO-001_threshold-check.json`が既存ドラフトの参考実装として存在し、
   ノードの`id`/`name`/`type`/`typeVersion`/`position`/`notes`/`parameters`の構造、`connections`の
   フォーマット（`{node, type, index}`の配列）を確認した。本実装もこの構造に合わせた。
3. 過去案件ログ（`logs/kohomada_2026-07-28_T27n8nワークフロー設計書_v1.md`・
   `logs/kohomada_2026-07-28_T28n8nデモワークフローJSON_v1.md`）に、2026-07-28時点でn8n公式ドキュメントを
   一次確認して得られた以下の知見が記録されていることを確認し、本実装でも踏襲した（ただし今回のセッションでの
   再確認はしていないため`[要再確認]`）：
   - Gmailノードで`resource: "draft"`, `operation: "create"`を指定すると、送信せず下書きとして
     保存できる。
   - Error Triggerノードは`n8n-nodes-base.errorTrigger`という`type`文字列で存在し、対象ワークフローの
     Settings→Error Workflowで指定すると失敗時に自動起動する仕組みが公式に存在する。
4. `office/state.js`（T65、エイトへの委任、status: doing）を確認した。
5. `n8n-automation/docs/naming-conventions.md`に部署略称の一覧が未整備だったため、本案件のために
   `KHM = 株式会社コホマダ`の略称を追記し、管理ID`AUTO-KHM-001`を採番した（`docs/naming-conventions.md`
   を編集）。
6. このセッションで利用可能なツールにシェル実行（Bash等のコマンド実行）ツールが含まれていないことを、
   ツール一覧の確認により把握した。そのため`scripts/*.mjs`の実行はできなかった。

---

## 推測・仮説（本セッションでは検証不能、または一般的な理解に基づく仮定）

すべて`[要インスタンス確認]`または`[要公式確認]`として実装内にも明記済み。主なもの：

1. `[要公式確認]` RSS Feed Read・Merge・Filter・Google Sheets・Slack・Notion・Schedule Triggerの
   正式`type`文字列・`typeVersion`・パラメータキー名。特にRSS Feed Read・Notionは今回のセッションで
   一度も一次確認できておらず、確度が低い。
2. `[要インスタンス確認]` n8nのCodeノードにおける`$input.all()`・`$('ノード名').first()`/`.all()`構文が
   一般に知られる書き方どおりに動作するという前提。
3. `[要インスタンス確認]` Ifノードは入力アイテムが0件の場合、条件評価自体が発生せず両分岐とも
   実行されない可能性があるという、n8nでよく知られる注意点。この対策として「Code: Check New Article
   Count」ノードを挟み、入力0件でも必ず1件の「件数」アイテムに変換してからIfノードへ渡す設計にした。
   ただしこの対策自体の有効性も実インスタンスでは未検証。
4. `[未確認]` 採用予定のAI/LLMプロバイダのAPIレスポンス形式（OpenAI互換のchat completion形式と仮定）。
   プロバイダが未確定のため、`HTTP Request`ノードのURL・認証方式もプレースホルダーとした。

---

## 分析

### 1. 実装した成果物

| ファイル | 内容 |
|---|---|
| `n8n-automation/workflows/draft/AUTO-KHM-001_japan-reg-news-digest.json` | メインワークフロー（全40ノード：Sticky Note 6、実処理ノード34） |
| `n8n-automation/workflows/draft/AUTO-KHM-001_japan-reg-news-digest-error.json` | エラーハンドリング用の別ワークフロー（Error Trigger→整形→Slack通知） |
| `n8n-automation/tests/fixtures/AUTO-KHM-001_cases.json` | ダミーの設定値・RSSモック出力・既読ログモック・AI応答モック・境界値/異常系ケース |
| `n8n-automation/tests/cases/AUTO-KHM-001_test-cases.md` | テストケース一覧（正常系/境界値/異常系/冪等性/二重実行防止） |
| `n8n-automation/docs/cases/AUTO-KHM-001/README.md` | 案件サマリー・注意点 |
| `n8n-automation/docs/cases/AUTO-KHM-001/workflow-design.md` | `templates/workflow-design.md`様式の設計書（ノード構成表・Credentialマッピング表・技術観点チェック） |
| `n8n-automation/docs/naming-conventions.md` | 部署略称`KHM`を追記（編集） |

### 2. メインワークフローの構成（メイの設計書との対応）

メイの設計書のテキスト図（Schedule Trigger→Config→RSS×N→Merge→Filter→重複排除→If→AI要約→翻訳→
整形→配信→ログ更新）に沿って実装した。ただし以下3点で、設計書のテキスト図から実装上の判断により
具体化・変更している。

1. **RSSソース数を3つの固定スロットとして実装**（設計書は「×N」という抽象的な表現）。
   ユーザーが増減する場合はRSS Feed Read/Set(Label)/Mergeノードのセットを追加・削除する運用とした
   （Sticky Noteに明記）。動的ループでの実装（Split Out等）も検討したが、n8nのSplit In Batches
   ループでの結果集約方法が今回一次確認できず不確実性が高いため、より単純で挙動が予測しやすい
   「固定スロット＋Merge」方式を採用した。
2. **DeepL等の専用翻訳ノードを使わず、AI要約と翻訳を1回のLLM呼び出しにまとめた**。これはメイの
   設計書6節が既に代替案として提示していたもので、DeepL等の正式仕様が未確認という不確実性を
   実装段階でさらに増やさないための判断。
3. **Slack/Gmail/Notionの3並列配信ブランチを、既読ログ更新の前にMergeノード2段で同期させる設計を
   追加した**（設計書のテキスト図には無い実装上の工夫）。3ブランチを個別に既読ログ更新ノードへ
   直結すると、ログ更新が最大3回重複実行されてしまう問題を実装中に発見したため、
   `.claude/rules/n8n-workflow-json.md`が求める「冪等性・二重実行防止」の観点から対策を追加した。

また、Ifノードが入力0件だと分岐が発生しない可能性があるという一般的な注意点への対策として、
「Code: Check New Article Count」ノードを追加し、必ず1件の「件数アイテム」に変換してから
新着0件判定を行う設計にした（詳細は「推測・仮説」3参照）。

### 3. 著作権・法務対応（リサ・リョウの指摘の反映）

- `Set: Config`ノードの収集元URLはすべてプレースホルダー（`.example`ドメイン）。経産省・中小企業庁・
  出入国在留管理庁を含め、いずれの実URLも入れていない（リサの調査・リョウの論点整理のとおり、
  RSS URL・利用規約とも原文の一次確認が未了のため）。
- リョウの論点整理「推奨案4」（免責文言に『編集・加工を行った主体』を明示する一文を追加）を反映し、
  `Set: Config`の`editedBySubjectLabel`フィールドと、`Code: Assemble Digest`が生成する免責文言に
  「executed by: {editedBySubjectLabel}」という一文を組み込んだ。
- Sticky Note（Copyright & Compliance）に、収集元の利用規約確認・全文複製禁止・出典保持は
  すべてユーザー（テンプレート利用者）の責任である旨を明記した。

### 4. スクリプト実行について（重要な制約）

`n8n-automation/scripts/validate-workflow.mjs`・`sanitize-workflow.mjs`・`check-secrets.mjs`は
Node.js実行が前提のスクリプトだが、**本タスクを実施したこのセッションにはシェル実行（コマンド実行）
ツールが提供されておらず、実際に実行できなかった**。これは実装者側の判断でスキップしたのではなく、
利用可能なツール一覧を確認した上での制約である。

代わりに、`Grep`（正規表現検索）ツールで、上記スクリプトの主要な検出ロジックを手動でなぞる
目視レビューを行った。結果は以下のとおりだが、**これは実際のスクリプト実行の代替にはならない**。

- `check-secrets.mjs`が検出する「本番URLらしき文字列」（`.com`/`.net`/`.jp`/`.io`/`.co`で終わる
  ドメイン、`example.com`/`localhost`/`127.0.0.1`を除く）に該当する文字列は、メインワークフロー・
  エラーワークフローいずれにも見つからなかった（`https://`で始まる文字列は計4件、すべて
  `.example`ドメインでこのパターンには一致しない）。
- メールアドレスパターン（`check-secrets.mjs`は`@example.com`のようなプレースホルダーも
  区別なく検出する設計）には、`placeholder-recipient@example.com`が1件該当する見込み。これは
  実在の個人情報ではなく、意図的なプレースホルダーである（ツール自身のコメントにあるとおり
  「誤検知を前提としたツール」であり、この検出は想定内）。
- APIキー・トークンらしき文字列（`sk-`/`AKIA`/`Bearer`/`xox`等のプレフィックス、32文字以上の
  16進数文字列）、秘密鍵ヘッダーには一致する文字列が見つからなかった。Credentialはすべて
  `PLACEHOLDER_...`という明示的なプレースホルダー文字列にしている。
- `sanitize-workflow.mjs`が検出する`pinData`/`staticData`トップレベルキーは、いずれのJSONにも
  含めていない。

**次にこの案件に着手する際は、シェル実行が可能な環境で必ず実際に3つのスクリプトを実行し、
このメモの目視レビュー結果を正式な検証結果で置き換える必要がある。**

---

## リスク・注意点

1. ノードの`type`・`typeVersion`・パラメータの大部分が未確認のまま実装しているため、実際に
   n8nへインポートした際に、ノードが認識されない・パラメータエラーになる等の手戻りが
   高い確率で発生する。特にRSS Feed Read・Notion・Mergeの多入力仕様は確度が低い。
2. `validate-workflow.mjs`等の自動検証を実行できていないため、目視で見逃したノード名重複・
   接続不整合・シークレット混入が残っている可能性はゼロではない（目視レビューでは検出しなかった）。
3. AI/LLMプロバイダが未確定のため、`HTTP Request`ノードのレスポンス解析（`Code: Parse AI Response`）は
   OpenAI互換形式を仮定したプレースホルダー実装であり、実際のプロバイダ確定後に修正が必要。
4. Merge/If/Codeノードを組み合わせた同期・件数チェックの設計（3節参照）は、実装者の合理的な
   判断に基づくが、実インスタンスでの動作は未検証。特に「Mergeノードが両方の入力を待ってから
   実行される」という前提が崩れると、既読ログの二重更新が再発する可能性がある。
5. 収集元サイトの実URL・利用規約は依然として未確定（社長のご指示どおり今回は対応せず）。
   このドラフトは「収集元が未確定でも実装だけは進められる」ことを示すものであり、実際に
   本番投入・提出する前には、リサ・リョウの調査の完了と社長・必要に応じ弁護士の最終確認が必須。
6. n8n公式Creator Hubの提出規約（IP表明保証条項の有無）は依然未確認（リョウの論点整理で
   指摘された論点）。実装が完了しても、提出可否の判断材料としては不十分。

---

## 推奨案

1. 実装完了後の次のステップとして、`aoi-quality-auditor`による監査（`.claude/rules/
   external-publication-policy.md`：外部公開前チェック）に回す前に、まず**シェル実行が可能な
   環境で`validate-workflow.mjs`・`sanitize-workflow.mjs`・`check-secrets.mjs`を実際に実行**し、
   このメモの目視レビューを正式な検証結果で置き換えることを推奨する。
2. 並行して、`n8n-schema-researcher`（または実インスタンスへのアクセスが得られた際に改めて）
   により、特に確度の低いノード（RSS Feed Read／Notion／Merge多入力／Schedule Trigger／
   Google Sheets）の`type`・`typeVersion`・パラメータを一次確認することを推奨する。
3. 収集元サイトの利用規約最終確認（リサ・リョウの積み残しタスク）は、実装と並行して進めても、
   本ドラフトの構造には影響しない（実URLはユーザー設定のプレースホルダーのため）。ただし
   n8n公式への実際の提出前には必須。

## 代替案

- RSSソース数を固定3スロットではなく、Split Out+ループによる可変数対応にする案（今回は
  ループでの結果集約の不確実性を理由に見送ったが、n8nのループ挙動が一次確認できれば
  より汎用的な実装に切り替えられる）。
- AI要約と翻訳を分離し、DeepL等の専用ノードを使う案（今回はDeepLの仕様未確認のため見送ったが、
  仕様確認後に翻訳品質向上のため切り替える余地がある）。
- Notion出力を今回のドラフトから完全に削除し、Slack＋Gmailの2チャネルのみに絞る案（Notionノードは
  今回最も確度が低いため、審査提出時のリスクをさらに下げたい場合はスコープから外す選択肢もある）。

---

## 出典

- `n8n-automation/CLAUDE.md`・`.claude/rules/security.md`・`.claude/rules/n8n-workflow-json.md`・
  `.claude/rules/documentation.md`・`docs/naming-conventions.md`・`docs/architecture.md`（本セッションで確認）
- `n8n-automation/workflows/draft/DEMO-001_threshold-check.json`・関連する`docs/cases/DEMO-001/`一式（参考実装）
- `logs/kohomada_2026-07-28_T27n8nワークフロー設計書_v1.md`・`logs/kohomada_2026-07-28_T28n8nデモワークフローJSON_v1.md`
  （Gmail Draft操作・Error Trigger存在の一次確認済み知見。確認日2026-07-28、今回未再確認）
- `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_設計書_v1.md`（メイ）
- `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_収集元調査_v1.md`（リサ）
- `logs/kohomada_2026-08-15_日本進出n8nワークフロー案A_法務論点整理_v1.md`（リョウ）
- `office/state.js`（T65の起票内容、確認日2026-08-15）

---

## 未確認事項

- メインワークフロー・エラーワークフローに含まれるほぼすべてのノードの正式`type`・`typeVersion`・
  パラメータキー名（Gmail Draft作成・Error Trigger存在を除く）
- `scripts/validate-workflow.mjs`・`sanitize-workflow.mjs`・`check-secrets.mjs`の実際の実行結果
  （本セッションではシェル実行ツールが利用できず未実施）
- n8nへの実インポート・実行結果（`[実行環境なしのため未テスト]`）
- 採用予定のAI/LLMプロバイダ・翻訳品質・実際のAPIレスポンス形式
- 収集元サイトの実URL・利用規約（リサ・リョウの調査の続き）
- n8n公式Creator Hubの提出規約（IP表明保証条項の有無、リョウの論点整理で指摘）
- Sticky Noteの実際の記載要件・文字数制限等（n8n公式の審査基準自体が未確認）

## 次に必要なアクション

1. **シェル実行が可能な環境で、`validate-workflow.mjs`・`sanitize-workflow.mjs`・
   `check-secrets.mjs`を実際に実行**し、結果を本メモ・`tests/cases/AUTO-KHM-001_test-cases.md`に
   追記する（社長または次にこの案件を引き継ぐ担当者への依頼事項）。
2. `n8n-schema-researcher`による、特に確度の低いノード（RSS Feed Read／Notion／Merge多入力／
   Schedule Trigger／Google Sheets）の一次確認。
3. 実インスタンスが用意でき次第、ダミーデータでのインポート・手動実行検証（`workflows/validated/`
   への昇格判断）。
4. リサ・リョウによる収集元サイトの利用規約・n8n公式Creator Hub提出規約の一次確認の継続。
5. 上記1〜4が完了した段階で、`aoi-quality-auditor`による監査（外部公開前チェック）を経てから
   社長の最終確認・n8n公式への提出操作を行う（本タスクでは一切未実施）。

**本メモは実装ドラフトの記録であり、n8n本番接続・Credential登録・n8n公式への提出は一切行っていません。**
