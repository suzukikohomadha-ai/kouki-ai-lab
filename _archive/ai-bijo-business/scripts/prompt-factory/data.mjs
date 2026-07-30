// =====================================================================
// prompt-factory / data.mjs
// 七瀬あかり プロンプト量産体系（T9・v4構造）— 組み合わせデータ定義
// ベース資産：logs/T3_プロンプトテンプレート_七瀬あかり.md（v3）
// 反映済み：logs/T9_Codexレビュー_プロンプトv3.md（2026-07-16）
//   - identity_face（固定）と演出（可変）の構造分離
//   - 理想化ワードの弱体化（左右対称→自然な左右差、毛穴レス→軽い美肌補正 等）
//   - ネガティブ⇔ポジティブの正面衝突を解消（陶器肌・毛穴レス・涙袋強調を撤去）
//   - ネガティブに一貫性維持ワードを追加
//   - style_mode を「スマホインカメラで撮った自然なセルフィー」系記述に統一
//   - 髪のシチュ上書きは hair_scene_adjustment に分離（髪色・前髪・長さは固定）
// =====================================================================

// ---------------------------------------------------------------
// identity_face：全組み合わせで固定する「本人性」ブロック
// ※ ここを書き換えると顔が変わる。世代交代するときだけ更新すること。
// ---------------------------------------------------------------
export const IDENTITY_FACE = `  identity:
    マスター画像と同じ人物、
    同じ顔立ち、
    同じ髪色と前髪

  look:
    親しみやすい日本人の女の子、
    隣にいそうな自然な可愛らしさ、
    一般人の日常写真のような雰囲気

  face:
    丸みのあるフェイスライン、
    少しふっくらした頬、
    幼さの残る自然な顔立ち、
    自然な左右差のある顔

  eyes:
    ややタレ目、
    丸い目、
    自然な涙袋、
    自然なうるみ目、
    優しい視線

  eyebrows:
    細めで自然な平行眉、
    柔らかいブラウン

  nose:
    小さく丸みのある日本人らしい鼻

  lips:
    小さめ、
    ピンクベージュ、
    軽いグラデーションリップ、
    ふっくらした下唇

  hair:
    ダークブラウン、
    セミロング〜胸上、
    緩いウェーブ、
    シースルーバング、
    顔周りに細い後れ毛
    ※髪色・前髪・長さは全シチュエーションで固定`;

// ---------------------------------------------------------------
// 可変の演出ブロック（肌・メイク）：ナチュラル寄りで固定運用
// （理想化ワード撤去済み：陶器肌／毛穴レス／涙袋しっかり強調 は使わない）
// ---------------------------------------------------------------
export const SKIN_MAKEUP = `  skin:
    明るめの肌、
    自然な血色感、
    スマホの美肌補正が軽くかかった程度のなめらかさ

  makeup:
    ナチュラルメイク、
    ベージュピンクのアイシャドウ、
    自然な涙袋メイク、
    極細ブラウンアイライン、
    ピンクチーク、
    ピンクベージュのグラデーションリップ`;

// ---------------------------------------------------------------
// 共通ネガティブプロンプト
//   v3から：ポジティブと衝突していた前提を解消したうえで維持
//   Codex反映：一貫性維持ワード（別人の顔〜目の形が変わる）を追加
// ---------------------------------------------------------------
export const NEGATIVE_BASE = `  一眼レフ画質、スタジオ撮影、高精細すぎる描写、HDR、8K、超解像、
  過度なシャープネス、CG感、アニメ風、厚化粧、セクシーな表情、
  不自然な涙袋、極端な美肌加工、AIっぽい肌、過剰なボケ、
  プロカメラライティング、ミラーレス画質、高級ポートレート写真、
  不自然な指、不自然な歯、
  別人の顔、顔の輪郭が変わる、髪色が変わる、前髪がなくなる、目の形が変わる`;

// パンフォーカス系シチュエーションで追加するネガティブ
export const NEGATIVE_NO_BOKEH = `  美しい背景ボケ、浅い被写界深度、ポートレートモード`;

// ---------------------------------------------------------------
// 軸1：時間帯（lighting と color_grade を上書きする）
// ---------------------------------------------------------------
export const TIMES = {
  morning: {
    label: "朝",
    lightingType: "朝の自然光",
    lightingDirection: "窓・正面からの柔らかい朝日",
    catchlight: "自然な朝の光のキャッチライト",
    colorGrade: "朝の柔らかい光、スマホカメラの自動補正、コントラスト控えめ",
    sensorNote: "朝の自然光、JPEG圧縮、SNSアップロード画質、少し甘いピント",
  },
  noon: {
    label: "昼",
    lightingType: "昼の明るい自然光・室内照明",
    lightingDirection: "横からの自然光＋室内照明",
    catchlight: "小さく自然なキャッチライト",
    colorGrade: "自然な色味、スマホカメラの自動補正、背景や髪に少し圧縮感が残る",
    sensorNote: "明るい環境、JPEG圧縮、SNS投稿後に数回圧縮された画質、軽いデジタルノイズ",
  },
  evening: {
    label: "夕方",
    lightingType: "夕方の斜めからの暖色光",
    lightingDirection: "窓・屋外からのオレンジがかった夕日",
    catchlight: "暖色の柔らかいキャッチライト",
    colorGrade: "夕方のオレンジがかった色調、影が長め、スマホ写真の自然な色味",
    sensorNote: "夕方の低い光量、JPEG圧縮、軽いノイズ、スマホ特有のフラットな描写",
  },
  night: {
    label: "夜",
    lightingType: "夜の弱い室内照明・環境光",
    lightingDirection: "前方または横からの弱い光のみ",
    catchlight: "小さく自然なキャッチライト",
    colorGrade: "低照度スマホ写真、少し色あせた色味、コントラスト控えめ、シャドウ強め",
    sensorNote: "暗所撮影による軽いノイズ、JPEG圧縮、スマホ特有の解像感、わずかなディテール潰れ",
  },
};

// ---------------------------------------------------------------
// 軸2：衣装（tags でシチュエーションとの適合を判定する）
//   tags: indoor_relax（部屋着）/ sleep（寝間着）/ out_casual（外出カジュアル）
//         office（オフィスカジュアル）/ event_yukata（浴衣）/ ootd（コーデ映え）
// ---------------------------------------------------------------
export const OUTFITS = {
  hoodie:       { label: "オーバーサイズのパーカー",                 text: "オーバーサイズのパーカー",                          tags: ["indoor_relax"] },
  black_tee:    { label: "黒のオーバーサイズTシャツ",               text: "黒のオーバーサイズTシャツ",                         tags: ["indoor_relax", "sleep"] },
  pajama:       { label: "パジャマ",                                 text: "淡い色のパジャマ",                                   tags: ["sleep"] },
  blouse_cardigan: { label: "白ブラウス＋ベージュカーディガン",      text: "白いブラウスにベージュのカーディガン",               tags: ["office", "out_casual"] },
  white_onepiece:  { label: "白のワンピース",                        text: "白のワンピース",                                     tags: ["out_casual", "ootd"] },
  denim_skirt:  { label: "デニムジャケット＋スカート",               text: "デニムジャケットにスカート",                         tags: ["out_casual", "ootd"] },
  knit:         { label: "ゆったりしたニット",                       text: "ゆったりしたクリーム色のニット",                     tags: ["indoor_relax", "out_casual", "ootd"] },
  square_top:   { label: "黒のスクエアネックトップス",               text: "ブラックのスクエアネックトップス",                   tags: ["indoor_relax", "out_casual"] },
  yukata:       { label: "花柄の浴衣",                               text: "花柄の浴衣、帯",                                     tags: ["event_yukata"] },
};

// ---------------------------------------------------------------
// 軸3：表情（subject_style.expression に入る・すべて健全な範囲）
// ---------------------------------------------------------------
export const EXPRESSIONS = {
  soft_smile:   { label: "柔らかい微笑み",   text: "柔らかい笑顔、少し照れた表情" },
  sleepy:       { label: "眠そう",           text: "少し眠そうで柔らかい表情、控えめな微笑み、あどけない雰囲気" },
  shy:          { label: "照れ",             text: "はにかんだ笑顔、少し目を伏せた照れた表情" },
  happy:        { label: "楽しそう",         text: "楽しそうな笑顔、少し上気した表情" },
  pout:         { label: "拗ね（あざと）",   text: "少し拗ねたような表情、口を軽く尖らせる、甘えたような可愛らしい表情" },
  gaze:         { label: "じっと目線",       text: "カメラをじっと見つめる優しい目線、控えめな微笑み" },
  amae:         { label: "甘え",             text: "少し眠そうで甘えたような表情、控えめな微笑み、あどけない雰囲気" },
};

// ---------------------------------------------------------------
// 軸4：シチュエーション（v3 の8種を骨格化・v4語彙で再記述）
//   styleMode は関数（時間帯を受けて「自然なセルフィー」系の文で返す）
//   hairSceneAdjustment：髪色・前髪・長さは変えず、状態だけを可変にする
// ---------------------------------------------------------------
export const SITUATIONS = {
  room: {
    label: "部屋で自撮り（日常系）",
    styleMode: (t) => `スマートフォンのインカメラで撮った自然な${t.label}のセルフィー`,
    renderIntent: (t) => `${t.label}の自室でのスマホ自撮り、SNSの日常投稿風`,
    composition: {
      layout: "人物1人、顔中心",
      pose: "スマートフォンを持った自然なセルフィー",
      camera_vantage: "インカメラ視点",
      framing: "顔から胸上までのアップ",
    },
    lensBehavior: "スマートフォンのフロントカメラ、24〜26mm相当の広角、近距離で少し顔が大きく写る",
    background: "自室、生活感のある室内、背景は少し散らかっている、背景のディテールは控えめ",
    qualityModifiers: "普通のスマホ自撮り、軽い美肌補正、近距離で少し顔が大きく写る、SNSに投稿された日常写真",
    allowedTimes: ["morning", "noon", "evening", "night"],
    allowedOutfitTags: ["indoor_relax", "ootd"],
    allowedExpressions: ["soft_smile", "sleepy", "shy", "pout", "gaze"],
    noBokeh: false,
  },
  cafe: {
    label: "カフェ自撮り",
    styleMode: () => "スマートフォンのインカメラで撮った自然なカフェでのセルフィー",
    renderIntent: () => "友達に送るような、カフェ席での自然なスマホ自撮り",
    composition: {
      layout: "人物1人、顔中心",
      pose: "ラテカップを持ちながらの自然なセルフィー",
      camera_vantage: "やや上からのインカメラ視点",
      framing: "顔から上半身まで",
    },
    lensBehavior: "スマートフォンのフロントカメラ、広角24mm相当、パンフォーカス気味、被写界深度が深い",
    background: "おしゃれなカフェ、木のテーブル、暖色の照明、背景のディテールがはっきり見える、ボケが少ない",
    lightingOverride: { lightingType: "カフェの暖かい室内照明", colorGradeSuffix: "、カフェ照明で少し暖色、肌は軽く明るいが背景や髪に少し圧縮感が残る" },
    qualityModifiers: "普通のスマホ自撮り、カフェでの日常写真、軽い美肌補正、背景にボケがない、SNSに投稿された日常写真",
    allowedTimes: ["morning", "noon", "evening"],
    allowedOutfitTags: ["out_casual", "office", "ootd"],
    allowedExpressions: ["soft_smile", "shy", "happy", "gaze"],
    noBokeh: true,
  },
  morning_bed: {
    label: "おはよう自撮り（ファンサ）",
    styleMode: () => "スマートフォンのインカメラで撮った寝起きの自然なセルフィー",
    renderIntent: () => "朝起きたてのスマホ自撮り、X朝投稿風",
    composition: {
      layout: "人物1人、顔中心",
      pose: "ベッドに横になりながらスマホを持った自撮り",
      camera_vantage: "やや上からのインカメラ視点",
      framing: "顔から胸上までのアップ",
    },
    lensBehavior: "スマートフォンのフロントカメラ、広角24mm相当",
    background: "朝のベッド、白いシーツ、枕、カーテンから漏れる朝日、生活感のある寝室",
    hairSceneAdjustment: "少し寝癖がつき、顔に毛束がかかる（髪色・前髪・長さは変えない）",
    qualityModifiers: "普通のスマホ自撮り、寝起きの日常写真、軽い美肌補正、少し甘いピント、SNSに投稿された日常写真",
    allowedTimes: ["morning"],
    allowedOutfitTags: ["sleep", "indoor_relax"],
    allowedExpressions: ["sleepy", "amae", "soft_smile"],
    noBokeh: false,
  },
  office: {
    label: "オフィスカジュアル（OOTD・お出かけ）",
    styleMode: () => "スマートフォンのインカメラで撮った屋外での自然なセルフィー",
    renderIntent: (t) => `${t.key === "evening" ? "帰り道" : "出かける途中"}のスマホ自撮り、X日常投稿風`,
    composition: {
      layout: "人物1人",
      pose: "スマートフォンを持った自然なセルフィー、少し斜めのアングル",
      camera_vantage: "やや上からのインカメラ視点",
      framing: "顔から上半身まで",
    },
    lensBehavior: "スマートフォンのフロントカメラ、広角24mm相当、パンフォーカス気味、被写界深度が深い",
    background: "オフィスビル前、都会の街並み、行き交う人の気配、背景のディテールがはっきり見える、ボケが少ない",
    qualityModifiers: "普通のスマホ自撮り、屋外の日常写真、軽い美肌補正、背景にボケがない、SNSに投稿された日常写真",
    allowedTimes: ["morning", "evening"],
    allowedOutfitTags: ["office"],
    allowedExpressions: ["soft_smile", "shy", "gaze"],
    noBokeh: true,
  },
  ootd_mirror: {
    label: "選んで系・全身ミラー自撮り（OOTD）",
    styleMode: () => "スマートフォンで鏡越しに撮った自然な全身セルフィー",
    renderIntent: () => "全身ミラー自撮り、Instagram OOTD投稿風",
    composition: {
      layout: "人物1人、全身",
      pose: "鏡の前でスマホを持った全身自撮り",
      camera_vantage: "鏡越しのスマホ撮影",
      framing: "全身ショット",
    },
    lensBehavior: "スマートフォンのリアカメラ、鏡越し撮影、パンフォーカス気味、被写界深度が深い",
    background: "自宅の姿見、部屋の生活感、背景は少し散らかっている、ボケが少ない",
    lightingOverride: { lightingType: "明るい室内照明", lightingDirection: "正面からの均一な光", catchlight: "小さめ" },
    qualityModifiers: "普通のスマホ自撮り、全身コーデ、ミラーセルフィー、背景にボケがない、SNSに投稿された日常写真",
    allowedTimes: ["noon", "evening", "night"],
    allowedOutfitTags: ["ootd", "out_casual", "office"],
    allowedExpressions: ["soft_smile", "happy", "gaze"],
    noBokeh: true,
  },
  goodnight: {
    label: "おやすみ投稿（ファンサ）",
    styleMode: () => "スマートフォンのインカメラで撮った自然な夜のセルフィー",
    renderIntent: () => "寝る前のスマホ自撮り、Xおやすみ投稿風",
    composition: {
      layout: "人物1人、顔中心",
      pose: "ベッドに横になり枕を抱えながらの自撮り",
      camera_vantage: "インカメラ視点",
      framing: "顔から胸上までのアップ",
    },
    lensBehavior: "スマートフォンのフロントカメラ、24mm相当",
    background: "暗い寝室、ベッド、枕、ベッドサイドランプの暖かい光、背景は暗くディテールが潰れている",
    lightingOverride: { lightingType: "ベッドサイドランプの弱い光", lightingDirection: "横からの弱い暖色光", catchlight: "小さく暖色のキャッチライト", colorGradeSuffix: "、暖色寄り" },
    qualityModifiers: "普通のスマホ自撮り、少し暗い室内、軽い美肌補正、近距離で少し顔が大きく写る、SNSに投稿された日常写真",
    allowedTimes: ["night"],
    allowedOutfitTags: ["sleep", "indoor_relax"],
    allowedExpressions: ["sleepy", "amae", "soft_smile"],
    noBokeh: false,
  },
  festival: {
    label: "夏祭り・浴衣（季節イベント）",
    styleMode: () => "スマートフォンのインカメラで撮った夏祭りでの自然なセルフィー",
    renderIntent: () => "夏祭りでのスマホ自撮り、X夏投稿風",
    composition: {
      layout: "人物1人",
      pose: "スマートフォンを持った自然なセルフィー、わたあめを持つ",
      camera_vantage: "やや上からのインカメラ視点",
      framing: "顔から上半身まで",
    },
    lensBehavior: "スマートフォンのフロントカメラ、広角24mm相当",
    background: "夏祭りの屋台、提灯、人混み（ぼかし）、夜の雰囲気",
    lightingOverride: { lightingType: "夏祭りの提灯・屋台の光", lightingDirection: "正面〜斜めからの暖色光", catchlight: "提灯の暖かいキャッチライト", colorGradeSuffix: "、提灯のオレンジ" },
    hairSceneAdjustment: "浴衣に合わせたアップスタイル or ハーフアップ、後れ毛（髪色・前髪は変えない）",
    qualityModifiers: "普通のスマホ自撮り、夏祭りの日常写真、浴衣、軽い美肌補正、SNSに投稿された日常写真",
    allowedTimes: ["evening", "night"],
    allowedOutfitTags: ["event_yukata"],
    allowedExpressions: ["happy", "soft_smile", "shy"],
    noBokeh: false,
  },
  closeup: {
    label: "目線訴求・クローズアップ（ファンサ）",
    styleMode: () => "スマートフォンのインカメラで撮った近距離の自然なセルフィー",
    renderIntent: () => "カメラをじっと見つめるスマホ自撮り、TikTok・SNS投稿風",
    composition: {
      layout: "人物1人、顔中心",
      pose: "片手でスマートフォンを持ち、もう片方の指先が少し頬に触れている自然な近距離セルフィー",
      camera_vantage: "やや上から見下ろすインカメラ視点",
      framing: "顔から胸上までのアップ",
    },
    lensBehavior: "スマートフォンのフロントカメラ、広角24mm相当",
    sensorOverride: "TikTok動画の一時停止のような画質、SNS投稿後に数回圧縮されたJPEG品質、軽いデジタルノイズ、少し甘いピント、スマホ動画から切り抜いたような自然な粗さ",
    background: "一般的な日本のマンションの室内、ドア、ベッド、エアコン、生活感のある背景、背景は少しボケる",
    lightingOverride: { lightingType: "室内照明", lightingDirection: "正面からの柔らかい室内光", colorGradeSuffix: "、TikTokフィルター風、軽い白飛び、ピンク寄りの色味" },
    qualityModifiers: "インカメラの近距離セルフィー、インカメラで少し小顔に見える角度、TikTok動画の一時停止のような画質、軽い白飛び、少し甘いピント、自然な涙袋、スマホアプリの軽い補正",
    allowedTimes: ["noon", "evening", "night"],
    allowedOutfitTags: ["indoor_relax"],
    allowedExpressions: ["pout", "gaze", "amae", "soft_smile"],
    noBokeh: false,
  },
};

// ---------------------------------------------------------------
// 使用禁止語彙 → 置き換え語彙（Codexレビュー反映・生成時に検査する）
//   data内の記述にもこの語彙は使わないこと（lint的にチェック可能な形で保持）
// ---------------------------------------------------------------
export const BANNED_VOCAB = [
  { banned: "超かわいい",           replace: "親しみやすい自然な可愛らしさ" },
  { banned: "左右対称",             replace: "自然な左右差のある顔" },
  { banned: "超小顔",               replace: "インカメラで少し小顔に見える角度" },
  { banned: "毛穴レス",             replace: "スマホの美肌補正が軽くかかった程度のなめらかさ" },
  { banned: "陶器肌",               replace: "明るめの肌、自然な血色感" },
  { banned: "涙袋をしっかり強調",   replace: "自然な涙袋メイク" },
  { banned: "涙袋強調",             replace: "自然な涙袋" },
  { banned: "raw_photoreal_high_fidelity", replace: "スマートフォンのインカメラで撮った自然なセルフィー" },
  { banned: "日本人アイドル風",     replace: "親しみやすい日本人の女の子" },
  { banned: "黒目が大きい",         replace: "自然なうるみ目" },
  { banned: "瞳の縦幅が大きい",     replace: "丸い目" },
  { banned: "顔の余白が少ない",     replace: "（削除・指定しない）" },
  { banned: "中顔面が短い",         replace: "（削除・指定しない）" },
  { banned: "中顔面短め",           replace: "（削除・指定しない）" },
];

// ---------------------------------------------------------------
// 明示NGペア（タグ適合だけでは弾けない組み合わせ）
// ---------------------------------------------------------------
export const NG_RULES = [
  {
    test: ({ situation, expression }) => situation === "morning_bed" && expression === "happy",
    reason: "寝起きシチュに全開の笑顔は不自然（AI感が出る）。sleepy / amae を使う",
  },
  {
    test: ({ time, expression }) => (time === "morning" || time === "noon") && expression === "amae",
    reason: "「甘え」表情は夜のファンサ限定。昼帯に混ぜるとキャラの世界観がブレる",
  },
];
