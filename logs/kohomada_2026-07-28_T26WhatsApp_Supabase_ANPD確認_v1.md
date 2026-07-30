# T26 リスペクトマリン案件：WhatsApp連携・ストレージ仕様・ANPD期限の一次情報確認

- 案件：T11系列（コホマダAI／TSUNAGU × 海外〔ブラジル〕船舶検査会社案件）
- 担当：リサ（Research & Evidence Analyst）
- 作成日：2026-07-28
- ステータス：Draft（人間の最終確認前）

## 結論

3点とも一次情報（公式サイト）または広く一致する複数の専門家情報源により、以下の範囲で裏付けが取れた。ただし公式一次資料への直接アクセスが一部制限され、詳細な料金表・条文原文までは確認できていない部分がある。

1. n8n×WhatsApp：n8n公式ドキュメントに「WhatsApp Business Cloud」公式ノードが存在することを確認。料金・承認プロセスはMeta側の話であり別枠。
2. Supabase：料金・容量は公式サイトで確認。SLA（稼働率保証）はEnterpriseプランのみ明記。Pro/Teamに正式なSLA記載は確認できず。
3. ANPD Resolução nº19/2024：T22の「概算2025-08-23頃」という推論は、複数の法律事務所発信の情報で「2025年8月23日（決議公布日から12か月）」と高い一致度で裏付けられた。ただし決議原文への直接アクセスができず、条文番号は二次情報経由の確認にとどまる。

## 確認済み事実

### 1. WhatsApp Business Platform × n8n
- n8n公式ドキュメント（docs.n8n.io）に「WhatsApp Business Cloud」という名称の公式ノードが存在。対応操作：メッセージ送信／送信して応答待機（承認・自由記述・カスタムフォーム対応）／テンプレート送信／メディアのアップロード・ダウンロード・削除。専用の「WhatsApp Business Cloud credentials」認証設定が必要。
  - 出典：https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.whatsapp （確認日2026-07-28）
  - 出典：https://docs.n8n.io/integrations/builtin/credentials/whatsapp （確認日2026-07-28）
- Meta公式ドキュメントで、WhatsApp Business Platformの料金体系について、2025年7月1日にconversation-based pricingからper-message pricingへ移行したことを確認。旧方式の公式ページは現在「非推奨」表示。料金カテゴリはMarketing／Utility／Authentication／Serviceの4種で、Serviceカテゴリは2024年11月1日から無料化されている旨がMeta公式ページに記載。
  - 出典：https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/conversation-based-pricing （確認日2026-07-28、現行の料金表そのものは本ページでは非表示）
- Meta Business Verificationについては、複数の第三者（BSP・ツールベンダー）解説記事で「Business Settings内Security Centerから申請」「審査は概ね2〜5営業日、書類不備時は最大14日程度」との説明が一致していたが、Meta公式ヘルプセンターの該当ページへの直接一次確認はできていない。

### 2. Supabase 料金・容量・SLA
Supabase公式サイト（supabase.com/pricing）を直接確認（確認日2026-07-28）。

| プラン | 月額 | DBストレージ | ファイルストレージ | SLA |
|---|---|---|---|---|
| Free | $0 | 500MB | 1GB | 記載なし |
| Pro | $25（$10分のコンピュート枠込み） | 8GB込み、以降$0.125/GB | 100GB込み、以降$0.0213/GB | 記載なし |
| Team | $599＋従量 | 8GB込み、以降$0.125/GB | 100GB込み、以降$0.0213/GB | 記載なし（優先サポートはあるがSLA文言は本ページ内では未確認） |
| Enterprise | 個別見積り | 個別 | 個別 | Uptime SLAsが明記 |

South America (São Paulo, `sa-east-1`) リージョン提供は既確認済み（T25出典で対応済み）。

### 3. ANPD Resolução CD/ANPD nº19/2024
- 決議名：Resolução CD/ANPD nº 19, de 23 de agosto de 2024（国際データ移転規則・標準契約条項の内容を承認）
- 複数の独立した法律事務所発信情報（Mayer Brown、Lefosse、ZNA等）が一致して以下を報告：
  - 公布日：2024年8月23日
  - 決議はその公布日をもって施行
  - 標準契約条項を用いて国際データ移転を行う取扱担当者は「決議公布日から起算して12か月以内」に自社の契約書へANPD承認済みの標準契約条項を組み込む義務がある（複数情報源で「第2条ただし書」との言及あり、決議原文での直接確認はできていない）
  - 猶予期間の終了日：2025年8月23日（Mayer Brown記事より）
  - 延長・再猶予に関する情報は検索範囲内では確認できず
- 基準日（2026-07-28）時点で、この猶予期間はすでに約11か月経過している。

## 推測・仮説

- Meta Business Verificationの審査期間（2〜5営業日〜最大14日）は複数の第三者ブログの一致からの推測であり、Meta公式の確定的な数値ではない可能性がある。
- Supabase Teamプランの「優先サポート＋SLA」という記述は集約系ブログからの情報であり、公式ページ本文での明記は本調査で直接確認できていない。
- ANPD決議の「第2条ただし書」という条文番号の特定は、複数の法律専門家サイトの説明の一致からの推測であり、決議原文そのものでの直接確認には至っていない。

## 分析

- WhatsApp連携：n8nに公式ノードがあること自体は技術的な連携可否の裏付けとして十分。実際の運用コストは「Meta公式料金＋BSPのマークアップ」の二層構造になる可能性が高く、TSUNAGU側が直接Meta APIを叩くのかBSP経由（Twilio等）で使うのかで承認要件・コストが変わる。
- Supabase：Pro（$25/月）で当面のストレージ量（100GB）は要件次第で十分な可能性があるが、SLAは基本プランでは明記されておらず、契約上の可用性保証が必要な場合はEnterprise相談が前提になる。T21で未確認の「データ容量」が判明しないと妥当なプランは判断できない。
- ANPD猶予期間：T22の「概算2025-08-23頃」という推論は、独立した複数の法律専門家情報で「2025年8月23日」として高い一致度で裏付けられた。これにより「経過済みの可能性がある」という仮説の不確実性はかなり下がったと評価できる（法的当てはめはリョウの担当領域）。

## リスク・注意点

- ANPDの猶予期間終了（2025-08-23）が高い確度で裏付けられたことで、現時点（2026-07-28）で標準契約条項未整備のまま越境移転を伴う契約・システムを稼働させることは、コンプライアンス上のリスクが顕在化している可能性がある（法的当てはめはリョウの担当）。
- Meta Business Verificationの審査期間中、通知・承認フローの本番稼働が遅延する可能性がある。
- WhatsApp公式APIの料金は「メッセージカテゴリ×受信者国」で変動するため、正確な料金表は本調査では一次情報から確定できなかった。
- Supabase Pro/TeamにSLA明記がないため、契約上の可用性保証が必要な場合は前提が崩れる可能性。

## 推奨案

1. WhatsApp連携は「Meta直接 or BSP経由」の方式をまず決定した上で、エイトに実装コスト・料金試算を依頼する。
2. Supabaseは当面Proプランを候補としつつ、T21のデータ容量確認結果が出た時点で容量超過コスト・Team/Enterprise移行要否を再試算する。
3. ANPD猶予期間終了（2025-08-23、確認済み事実）を前提に、リョウへ「越境移転の標準契約条項整備状況」の緊急度評価を至急依頼する。

## 代替案

- WhatsApp通知が必須要件でない場合、Phase1では通知チャネルをメール中心にし、WhatsApp連携はPhase2以降に先送りして承認・料金確定の時間的猶予を確保する。
- Supabaseに正式なSLAが必要な場合、他のBaaS（規約上SLAを明記するプロバイダ）も比較対象に加える。

## 出典

- n8n公式ドキュメント「WhatsApp Business Cloud」：https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.whatsapp （確認日2026-07-28）
- n8n公式ドキュメント「WhatsApp Business Cloud credentials」：https://docs.n8n.io/integrations/builtin/credentials/whatsapp （確認日2026-07-28）
- Meta for Developers「Conversation-based pricing (Deprecated)」：https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/conversation-based-pricing （確認日2026-07-28）
- Supabase公式「Pricing」：https://supabase.com/pricing （確認日2026-07-28）
- Mayer Brown「Fim do Período de Graça da Resolução CD/ANPD nº. 19/2024」（確認日2026-07-28）
- Lefosse「Prazo para adoção das cláusulas-padrão da ANPD」（確認日2026-07-28）
- ZNA「Prazo para adequação às cláusulas-padrão contratuais da ANPD termina em 23 de agosto de 2025」（確認日2026-07-28）
- ANPD公式サイト（ニュース掲載ページ、直接fetchは401で失敗、検索結果スニペット経由）
- ANPD公式（決議掲載ページ、直接fetch結果に公布日の齟齬あり、要再確認）

## 未確認事項

- WhatsApp Business Platformの現行の正確な料金表（国別・カテゴリ別単価）はMeta公式の現行ページへの直接アクセスができておらず未確認。
- Meta Business Verificationの正式な審査基準・所要日数は一次情報での確認ができておらず、第三者記事の集約情報にとどまる。
- Supabase Team/Proプランに「SLA」が契約上明記されているか、公式ページ本文の完全な文言では確認できず（Enterpriseのみ明記を確認）。
- **ANPD Resolução nº19/2024の公布日について、複数の法律専門家情報は「2024年8月23日」で一致しているが、1回のfetch結果でのみ「2024年8月26日」という異なる日付が出た。決議原文への直接アクセスができず、この齟齬を一次情報で解消できていない。条文番号（第2条ただし書）も二次情報経由であり、原文での確認が必要。**
- ANPD決議に対するその後の延長措置・追加ガイダンスの有無は、検索範囲では見当たらなかったが「存在しない」と断定はできない。

## 次に必要なアクション

1. **[要追加調査]** ANPD Resolução nº19/2024の決議原文（DOU掲載紙面PDF、または`in.gov.br`の該当ページ）を人間が直接開き、公布日（23日か26日か）と第2条ただし書の正確な文言を確認する。法的な当てはめ・最終確認はリョウが担当。
2. Meta公式ヘルプセンターに、ログイン可能なMeta Business Managerアカウントから直接アクセスして正式な料金表・審査要件を確認する（本調査はログイン不要な公開ページの範囲にとどまる）。
3. WhatsApp連携をMeta直接 or BSP経由のどちらで実装するかをエイト・社長と確定した上で、選定した方式に応じた正確な料金試算を再度依頼する。
4. Supabase Team/Enterpriseへの問い合わせフォームから、SLA・稼働率保証の契約条件を直接確認する。
