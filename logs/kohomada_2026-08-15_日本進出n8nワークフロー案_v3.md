# 日本進出テーマ n8nワークフロー案（n8n公式提出前のアイデア出し）v3

- 対象事業：株式会社コホマダ（海外展開・日本進出支援 × AI・業務自動化）
- ステータス：**アイデア出し段階のドラフト（Draft）**。実装・提出は行っていない
- 作成：アイ　作成日：2026-08-15
- v2からの変更点：**社長のご指示で「提出済みワークフロー」を検索し、既存の公開テンプレートを参考事例として追加した**

---

## 0. 確認方法についての重要な注記

`creators.n8n.io`・`docs.n8n.io`・`n8n.io`本体は、いずれもこのセッションでは`EGRESS_BLOCKED`（組織ポリシーによる遮断）で、WebFetchによる原文の直接確認ができない。今回はWebSearch（検索エンジン経由の要約・スニペット）のみで調査した。**個別ページを直接開いて読んだわけではない**ため、以下はすべて「検索結果に現れたタイトル・要約」に基づく参考情報であり、evidence-policyの「一次情報確認」の水準には届いていない。実際にリンクを開ける環境で、社長に内容の一致を確認いただくことを推奨する。

---

## 1. 既存の公開テンプレート（参考事例）

### 1-1. 規制・コンプライアンス監視系（案Aの直接的な先例）

| タイトル | URL | 特徴（検索結果からの要約） |
|---|---|---|
| Automate regulatory compliance monitoring with ScrapeGraphAI and email alerts | https://n8n.io/workflows/6567-automate-regulatory-compliance-monitoring-with-scrapegraphai-and-email-alerts/ | 政府の規制変更を毎日スクレイピングし、AIで影響度・リスクを分析してメール通知 |
| Multi-Jurisdiction Smart Contract Compliance Monitor with Automated Alerts | https://n8n.io/workflows/6075-multi-jurisdiction-smart-contract-compliance-monitor-with-automated-alerts/ | 複数法域の規制変更を追跡し、契約への影響をAIで分析 |
| Intelligent AI digest for security, privacy, and compliance feeds | https://n8n.io/workflows/4678-intelligent-ai-digest-for-security-privacy-and-compliance-feeds/ | RSSフィードから過去24時間分のみ抽出し、カテゴリ分類＋AI要約してHTMLダイジェストをメール送信 |

**→ 「規制・コンプライアンス監視＋AI要約＋通知」というジャンル自体は、n8n公式ギャラリーに複数の先例があるカテゴリだと分かる。案A（日本の規制・行政ニュースのモニタリング＆多言語ダイジェスト）は、ジャンルとしては既に受け入れられている型に近い。**

### 1-2. 多言語ダイジェスト（案Aの「多言語」要素の直接的な先例）

| タイトル | URL | 特徴 |
|---|---|---|
| Daily news digest & weekly trends with AI filtering, Slack & Google Sheets | https://n8n.io/workflows/10977-daily-news-digest-and-weekly-trends-with-ai-filtering-slack-and-google-sheets/ | NewsAPIで記事取得→AIで低品質記事を除外→上位3件を英語で要約→**DeepLで日本語に翻訳（オプション）**→英語版・日本語版の両方をSlackに投稿 |

**→ これは「英語→日本語」の翻訳ダイジェストという、案Aと非常に近い構成の先例。DeepLノードの利用、Slackへの多言語投稿という具体的な実装パターンが既に存在することが分かった。**

### 1-3. 複数ツール統合の通知・トラッカー系（案B’・案C’の先例）

| タイトル | URL | 特徴 |
|---|---|---|
| AI meeting summary & action item tracker with Notion, Slack, and Gmail | https://n8n.io/workflows/10286-ai-meeting-summary-and-action-item-tracker-with-notion-slack-and-gmail/ | Notionに議事録・タスクカードを登録、Slackに要約投稿、担当者にGmailで個別通知。3ツール統合 |
| Automate employee onboarding with Slack, Jira, and Google Workspace integration | https://n8n.io/workflows/3860-automate-employee-onboarding-with-slack-jira-and-google-workspace-integration/ | オンボーディングの進捗をSlack・Jira・Google Workspaceで連携。3ツール統合の進捗管理系 |
| Automate Google Meet notes with GPT-4.1-mini, Notion, Slack & Gmail distribution | https://n8n.io/workflows/9849-automate-google-meet-notes-with-gpt-41-mini-notion-slack-and-gmail-distribution/ | AI・Notion・Slack・Gmailの4ツール統合 |

**→ 案B’（法人設立進捗トラッカー）・案C’（商談リード多言語フォロー）は、いずれも「進捗管理＋複数チャネル通知」という、この先例群と同じ型に当てはまる。3〜4ツール程度の統合が実際に多数採用されていることが分かり、v2で懸念していた「5+ツールでないと通らない」という基準は、少なくとも必須条件ではなさそうだと推測できる（`[推測]`。あくまで採用例が存在する＝許容範囲内という傍証であり、公式な最低数の規定は依然として見つかっていない）。**

---

## 2. 審査基準についての追加確認事項

- Sticky Note（説明用の付箋ノード）について、`docs.n8n.io/workflows/components/sticky-notes/`という公式ドキュメントページの存在をあらためて検索で確認した。「特にテンプレートワークフローでは、他のユーザーが理解できるようSticky Noteを積極的に使うことが推奨される」という趣旨の記載が検索結果に現れた（`[未確認・二次情報]`、原文未読）。v1・v2で触れた「Sticky Note＝対象者/概要・手順」という構成の推奨と整合する。
- 「5個以上のツール統合が必須」という数値基準は、今回もnote.com（個人ブログ、Japan's No.1 Creator名義）以外の情報源では確認できなかった。docs.n8n.io・GitHub CONTRIBUTING.md等、複数の関連しそうなページを検索したが、公式な数値基準は見当たらない。**「多くの採用テンプレートが3〜5ツール程度を統合している」という実例ベースの傾向はあるが、公式ルールとして明文化されているかは不明のまま。**
- 「日本」「Japan」に特化したテーマのテンプレートは、今回の検索でも見つからなかった（既存カテゴリは検索していない全件をカバーしたわけではない）。差別化要素にはなり得る。

---

## 3. 案の再評価（v2からの更新）

| 案 | 先例の有無 | 評価の変化 |
|---|---|---|
| 案A（規制ニュース多言語ダイジェスト） | **あり**（1-1・1-2の6件が直接の先例） | v2では「技術的裏付け弱い」としていたが、**ジャンル自体の先例が最も豊富**と判明。優先度を引き上げるべきと考える |
| 案C’（商談リード多言語フォロー下書き） | あり（1-3、ただし「下書きのみ・送信は人間」という設計そのものの先例は未確認） | 引き続き有力。Human-in-the-loop要素は先例では確認できていないため、差別化点として活かせる可能性 |
| 案B’（法人設立進捗トラッカー） | あり（1-3のオンボーディング系が近い） | 引き続き有力 |
| 案D・E | 直接の先例は未検索 | 変更なし |

**暫定の優先順位（アイの見立て）**：
1. **案A**（規制・行政ニュース多言語ダイジェスト）：ジャンルの先例が最も多く、DeepL翻訳という具体的な実装先例まである。著作権・利用規約の論点は残るが、対象サイトをRSS提供元やJETRO・官公庁の公式発表等、規約が明確なソースに絞ることでリスクを下げられる
2. **案C’**（商談リード多言語フォロー下書き）：Human-in-the-loopの差別化余地
3. **案B’**（法人設立進捗トラッカー）：業務課題としての適合度は高いが差別化はやや弱い

これも検索結果ベースの暫定評価であり、実際にリンクを開いて中身を確認したものではない。

---

## 4. 引き続き未確認の事項

- 提出フォームの必須項目・審査フロー・所要期間（`creators.n8n.io`原文は今回も未読）
- Credentialの扱いルール
- ライセンス・著作権・二次利用規約
- 「5+ツール」等の数値基準が公式ルールとして存在するか

## 5. 出典（すべてWebSearchのスニペット・要約経由。原文未読）

- 上記1節の表内の各URL（確認日2026-08-15）
- `https://docs.n8n.io/workflows/components/sticky-notes/`（確認日2026-08-15、原文未読）
- v1・v2・リサ調査レポートの出典（変更なし）

---

## 6. 次に必要なアクション

1. 上記1節のURLを、社長ご自身のブラウザで実際に開いていただき、内容（タイトルの付け方・説明文の構成・実際のノード数）が本レポートの要約と一致するか確認いただく（external-publication-policyの「タイトルだけでなくリンク先の中身まで確認する」原則に沿うため）
2. 一致が確認できれば、案Aを最優先候補として、メイ・エイトによる詳細設計に進める
3. 提出窓口・審査フローの原文確認（`creators.n8n.io`）は、引き続き別環境または社長ご自身での確認が必要
4. アオイの監査 → 社長承認 → 社長自身の提出

**本ドキュメントは提出物ではなく、社内検討用のドラフトです。実際の投稿・提出は行っていません。**
