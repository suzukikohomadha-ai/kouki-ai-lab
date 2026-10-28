/**
 * 「KIVO TALK」紹介記事 ヒアリングシート（v5）を Google フォームとして作成する Apps Script
 *
 * 使い方：
 *   1. https://script.google.com/ を開き「新しいプロジェクト」
 *   2. 最初からある中身をすべて消して、このファイルの中身を貼り付ける
 *   3. 下の DEADLINE（回答期限）と CONTACT（返送先・問い合わせ先）を書き換える
 *   4. 上の関数名が「createKivoHearingForm」になっていることを確認して「実行」
 *   5. 初回だけ権限の確認が出るので、ご自身のGoogleアカウントで許可する
 *   6. 実行ログに表示される「編集用URL」「回答用URL」を確認する
 *
 * このスクリプトはフォームと回答集計用スプレッドシートを作るだけです。
 * 先方への送付（回答用URLの共有）は社長ご自身で行ってください。
 */

const DEADLINE = '〔◯月◯日〕';            // 例：'2026年11月10日（火）'
const CONTACT  = '〔担当者名・メールアドレス〕'; // 例：'株式会社コホマダ 鈴木（xxx@example.com）'

function createKivoHearingForm() {
  const form = FormApp.create('「KIVO TALK」紹介記事 ヒアリングシート（株式会社コホマダ）');

  form.setDescription([
    '株式会社KIVO ご担当者様',
    '',
    '弊社公式noteでの「KIVO TALK」紹介記事の作成にあたり、内容を正確にするため、以下についてお教えください。',
    '',
    '【ご記入のお願い】',
    '・「★」の付いた項目は特に必要な項目です（必須）。その他は分かる範囲で構いません。',
    '・未定・不明・非公開の項目は「未定」「不明」「非公開」とご記入ください（補足があれば併記可）。',
    '・回答いただけるものの記事に載せてほしくない情報は、該当部分に「※非掲載」とお書き添えください（回答の一部でも可）。※非掲載の情報は記事には記載せず、内容の確認にのみ使用します。',
    '・記事の構成・表現は弊社が独自に作成いたします。',
    '・ご回答期限：' + DEADLINE,
    '・お問い合わせ先：' + CONTACT,
  ].join('\n'));

  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);   // 送信後も回答を修正できる
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);
  form.setConfirmationMessage('ご回答ありがとうございました。内容を確認のうえ、必要に応じて改めてご連絡いたします。\n株式会社コホマダ');

  const para = (title, help, required) => {
    const item = form.addParagraphTextItem().setTitle(title).setRequired(!!required);
    if (help) item.setHelpText(help);
    return item;
  };
  const section = (title, help) => {
    const pb = form.addPageBreakItem().setTitle(title);
    if (help) pb.setHelpText(help);
  };

  // ご回答者
  form.addSectionHeaderItem().setTitle('ご回答者');
  form.addTextItem().setTitle('ご担当者名').setRequired(true);
  form.addTextItem().setTitle('ご連絡先（メールアドレス等）').setRequired(true);
  form.addDateItem().setTitle('ご記入日').setRequired(true);

  // 1. 会社・サービスについて
  section('1. 会社・サービスについて');
  para('★1-1 記事に記載する正式な社名・代表者名の表記', '', true);
  para('1-2 公表しているミッション・ビジョン');
  para('1-3 KIVO TALKを立ち上げた背景');
  para('★1-4 主な利用者として想定しているクリエイター像・ユーザー像', '', true);
  para('★1-5 iOS版の正式なリリース日', 'App Storeでは6月17日、プレスリリースでは6月23日と表記されています。', true);

  // 2. 機能について
  section('2. 機能について');
  para('★2-1 スクリーンショット・画面録画の制限の範囲と限界', '例：別の端末での撮影への対応など', true);
  para('2-2 ドロップ（単品販売）の仕様で、公式サイトの記載から変更・補足があれば');
  para('2-3 ゲストモード（招待なしでの閲覧）でできること・できないこと');
  para('2-4 パスキー認証を採用した理由（公表済みのものがあれば）');

  // 3. 料金・収益について
  section('3. 料金・収益について');
  para('★3-1 サブスクリプションプランの特典（ベーシックプランとの違い）', '', true);
  para('3-2 出金時の振込手数料の金額・最低出金額・振込までの日数', '最低出金額は現在2,000円、振込までは「通常3営業日以内」と認識しています。');
  para('3-3 ランク（Standard／Bronze／Silver／Gold）ごとの違い', '露出以外の特典などがあればお教えください。');

  // 4. 招待制度について
  section('4. 招待制度について');
  form.addMultipleChoiceItem()
    .setTitle('★4-1 友達招待1,000ボーナスポイントの付与対象')
    .setChoiceValues(['招待した側のみ', '招待された側のみ', '双方'])
    .showOtherOption(true)
    .setRequired(true);
  para('★4-2 キャンペーンの終了予定日・付与の上限・ボーナスポイントの有効期限', 'ボーナスポイントの有効期限は現在180日と認識しています。', true);
  para('4-3 ボーナスポイントの使い道', '購入ポイントと同じように使えるか／Gem化・換金の対象か');
  para('★4-4 招待リンクの利用人数', 'ベーシックプランは1名のみ、サブスクリプションプランは複数名という理解でよいか、お教えください。', true);
  para('★4-5 noteなど外部サイトへの招待リンク掲載に関する規約・ガイドライン上の定めの有無とその所在（URL等）、招待リンクの有効期限', '', true);

  // 5. コンテンツ基準・安全性について
  section('5. コンテンツ基準・安全性について');
  para('★5-1 「R18指定」で想定している内容と、利用規約第19条（禁止行為）の露骨な性的描写等を禁止する規定との関係', '', true);
  para('5-2 R18指定コンテンツの表示方法（ゾーニング等）・公開予定のガイドライン（あれば）');
  para('5-3 投稿の審査・通報対応の体制');
  para('5-4 トラブル（返金・権利侵害など）の相談窓口と対応方針');

  // 6. その他（任意）
  section('6. その他（任意）');
  para('6-1 記事用に提供いただける公式画像と、その使用条件', '画像そのものは、別途メール等でお送りいただけますと幸いです。');
  para('6-2 公表可能な今後の機能追加・リリース予定');
  para('6-3 記事で紹介可能な利用事例（掲載許可済みのもの）');

  // 回答集計用スプレッドシート
  const ss = SpreadsheetApp.create('「KIVO TALK」ヒアリングシート（回答）');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log('編集用URL：' + form.getEditUrl());
  Logger.log('回答用URL（先方に共有するURL）：' + form.getPublishedUrl());
  Logger.log('回答の集計先スプレッドシート：' + ss.getUrl());
}
