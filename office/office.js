// 🏢 オフィス描画（DOM版・MURAデザイン）
// Phaser版（game.js）の置き換え。index.html の AIOffice API（rebuild / applyState / applyHealth）
// と window.__startMeeting をそのまま提供する。
// 部屋は2つ：「オフィス」（社員）と「社長室」（社長＋秘書アイ＋決裁トレイ）。▶ドアでスライド移動。
(function () {
  // index.html の OWNER_PALETTE と同じ並び（社員の名札・タスクリストの担当チップが同色になる）
  var PALETTE = ["#23b3a3", "#e87fb0", "#5aa95b", "#e0913a", "#5b8def", "#c0a93f"];
  var HAIR = ["#7A5C42", "#E0C089", "#3E3A34", "#8B7BC9", "#A45C49", "#4E6E58", "#B5743E", "#6B5BA0", "#2E2A26", "#C98A3A"];
  var CLOTH = ["#7FB5D6", "#E8A7BC", "#6BBF8A", "#F2A65A", "#9FA8D6", "#C9B26B", "#D98E8E", "#7FB571", "#8FB0D6", "#E0A0C0"];
  var SKIN = ["#F2D2B6", "#E8B68F", "#D9A57E", "#F6DEC6", "#C68A63", "#EBC4A0", "#F0C9A8", "#D29B72", "#F4D8C0", "#BE835C"];
  var ACC = ["ac-glasses", "ac-clip", "", "ac-hat", "ac-bow", "", "ac-glasses", "ac-headset", "", "ac-clip"];
  var AI_COLOR = "#8a7ff0";

  var root = null;
  var curRoom = 0;
  var lastState = window.__lastState || null;
  var lastHealth = window.__lastHealth || null;
  var meetTimer = null;
  var walkers = {};   // 社員index → 散歩中のキャラ要素
  var idlePlan = {};  // 社員index → 待機中の過ごし方（sit/look/patrol/wander）。一度決めたら固定
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
    });
  }
  function trunc(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; }
  function C() {
    // company.js が未生成・読み込み失敗でも、company.template.js 由来の既定名簿(__DEFAULT_COMPANY)に落とす。
    var c = window.COMPANY || window.__DEFAULT_COMPANY || { name: "あなたのAI会社", ceo: { name: "あなた" }, employees: [] };
    // company.js はあるが社員が空（セットアップ途中など）の場合も、既定の社員名簿で補完して「誰もいない」を防ぐ。
    if ((!c.employees || !c.employees.length) && window.__DEFAULT_COMPANY && (window.__DEFAULT_COMPANY.employees || []).length) {
      c = Object.assign({}, c, { employees: window.__DEFAULT_COMPANY.employees });
    }
    return c;
  }
  function fmtYen(v) { v = Number(v) || 0; return v >= 10000 ? (Math.round(v / 1000) / 10) + "万円" : v.toLocaleString() + "円"; }
  function q(sel) { return root ? root.querySelector(sel) : null; }
  function qa(sel) { return root ? Array.prototype.slice.call(root.querySelectorAll(sel)) : []; }

  function charHtml(hair, cloth, delay, scale, face, skin, hs, ac) {
    var fv = face ? (" fv" + face) : "";
    var hsc = hs ? (" hs" + hs) : "";
    var skinStyle = skin ? (";background:" + skin) : "";
    var acEl = ac ? '<i class="of-ac ' + ac + '"></i>' : "";
    return '<div class="of-chr" style="animation-delay:' + (delay || 0) + 's' +
      (scale ? ';transform-origin:bottom center;scale:' + scale : '') + '">' +
      '<div class="of-hd' + fv + hsc + '" style="' + (skin ? 'background:' + skin : '') + '">' +
      '<i class="of-hh" style="background:' + hair + '"></i>' +
      '<i class="of-ey l"></i><i class="of-ey r"></i><i class="of-mo"></i>' + acEl + '</div>' +
      '<div class="of-bd" style="background:' + cloth + '"></div>' +
      '<div class="of-lg"><i></i><i></i></div></div>';
  }

  function unitHtml(e, i) {
    // 社員データ側（company.js）に hair/cloth/skin/face/hairStyle/acc の明示指定があれば優先する。
    // 未指定の社員（既存メンバー）は従来どおり i の巡回で自動決定するため見た目は変わらない。
    var hair = e.hair || HAIR[i % HAIR.length];
    var cloth = e.cloth || CLOTH[i % CLOTH.length];
    var skin = e.skin || SKIN[i % SKIN.length];
    var face = e.face || ((i % 10) + 1);
    var hairStyle = e.hairStyle || ((i % 5) + 1);
    var acc = e.acc != null ? e.acc : ACC[i % ACC.length];
    return '<div class="of-unit" data-act="talk:' + i + '" data-unit="' + i + '" title="クリックで' + esc(e.name) + 'の詳細">' +
      '<span class="of-np" style="background:' + PALETTE[i % PALETTE.length] + '">' + esc(e.emoji || "🙂") + ' ' + esc(e.name) + '</span>' +
      '<span class="of-sweat" data-sweat hidden>💦</span>' +
      '<span class="of-zzz" data-zzz hidden>Zzz…</span>' +
      charHtml(hair, cloth, i * 0.9, null, face, skin, hairStyle, acc) +
      '<div class="of-dk"><i class="of-pc"><span class="pc-mon"><span class="pc-scr"></span></span><span class="pc-tower"></span></i></div>' +
      '<span class="of-role">' + esc(e.role || "") + '</span>' +
      '<span class="of-chip" data-chip hidden><span class="tline"><b></b><span class="txt"></span></span><i class="bar"><u></u></i></span>' +
      '</div>';
  }

  function build() {
    root = document.getElementById("game");
    if (!root) return;
    walkers = {};
    idlePlan = {};
    var c = C();
    var emps = (c.employees || []).slice(0, 24);

    var desks = emps.map(unitHtml).join("");
    // 「社員を雇う」ボタンは常に最後の空き枠に置く（2列グリッドなので人数が増えても自動で行が増える）
    desks += '<button class="of-hire" data-act="hire"><i>＋</i>社員を雇う</button>';

    // 上部HUDは撤去（売上は壁の売上ボード、会社の動き＝ティッカーは壁のボード下に移設）
    var hud = "";

    // 部屋切り替えタブは撤去（オフィスを広く使う）。移動はオフィス内の▶/◀ボタンで行う。
    var tabs = "";

    var roomWs =
      '<section class="of-room of-ws">' +
        // 壁の高さは固定せず、中のダッシュボード（.of-wallpanel）の実際の高さに追従させる。
        // 以前は壁(.of-wall)と壁のダッシュボード(.of-wallpanel)が別要素（絶対配置の重ね合わせ）で、
        // 狭い画面でダッシュボードが折り返して背が高くなると、壁の高さを超えて下の床（社員）に
        // めり込んでいた。壁の中にダッシュボードを入れて通常フローにすることで、その事故を構造的に防ぐ。
        '<div class="of-wall">' +
        // 壁のダッシュボード：左に[タスク｜売上]＋その下にティッカー、右に今日の予定。常に壁の幅内に収める
        '<div class="of-wallpanel">' +
          // 左カラム：タスク・売上の行＋下にティッカー
          '<div class="of-wallmain">' +
            '<div class="of-dashrow">' +
              // 左カラム：タスクボード＋その下に「納品成果物を確認する」ボタン
              '<div class="of-dashcol">' +
                '<button class="of-board of-taskboard" data-act="tasks" title="クリックでタスクリスト">' +
                  '<b>📋 タスクボード</b>' +
                  '<div class="of-cols">' +
                    '<span class="of-col"><b data-c="todo">0</b><label>これから</label></span>' +
                    '<span class="of-col"><b data-c="doing">0</b><label>作業中</label></span>' +
                    '<span class="of-col rev"><b data-c="review">0</b><label>確認待ち</label></span>' +
                    '<span class="of-col"><b data-c="done">0</b><label>完了</label></span>' +
                  '</div>' +
                  '<span class="of-bhint" data-bhint hidden>🖐 社長の確認待ちがあります</span>' +
                '</button>' +
                '<div class="of-dashtools">' +
                  '<button class="of-deliv-btn" data-act="cabinet" title="全社の納品成果物">' +
                    '<span>📦 納品成果物を確認する</span>' +
                    '<i class="of-deliv-bdg" data-cabbdg hidden></i>' +
                  '</button>' +
                  '<div class="of-tool-row">' +
                    '<button class="of-tool-ic" data-act="routines" title="ルーティン業務（note・Instagram・X等）"><span>🔁</span><span class="of-tool-cap">ルーティン</span></button>' +
                    '<button class="of-tool-ic" data-act="hub" title="事業開発ハブ（Notion）"><span>🚀</span><span class="of-tool-cap">事業開発</span></button>' +
                    '<button class="of-tool-ic" data-act="app:mail" title="メール"><span>📧</span><i class="of-dot" data-dot="gmail"></i><span class="of-tool-cap">メール</span></button>' +
                    '<button class="of-tool-ic" data-act="app:news" title="事業関連ニュース"><span>📰</span><span class="of-tool-cap">ニュース</span></button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              // 為替ボード（米ドル・ユーロ・英ポンドを左から横並びで常時表示）
              '<div class="of-board of-fxboard" data-fxboard>' +
                '<div class="of-cal-head"><b>💱 為替（対円）</b><span class="of-cal-note" data-fx-note></span></div>' +
                '<div class="of-fx-row" data-fx-list><div class="of-cal-empty">読み込み中…</div></div>' +
                '<button class="of-cal-toggle" data-act="app:forex">その他の通貨を見る ▶</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // 右カラム：今日の予定（入り切らない予定はトグルで開く）
          '<div class="of-board of-calboard" data-calboard>' +
            '<div class="of-cal-head"><b>📅 今日の予定</b><span class="of-cal-note" data-cal-note></span></div>' +
            '<div class="of-cal-list" data-cal-list><div class="of-cal-empty">読み込み中…</div></div>' +
            '<button class="of-cal-toggle" data-cal-toggle hidden>▼ もっと見る</button>' +
          '</div>' +
        '</div>' +
        '</div>' + // .of-wall 閉じ
        '<div class="of-floor">' +
          '<div class="of-desks">' + desks + '</div>' +
          // 秘書アイの言葉・会社の動きは床(.of-floor)の中に入れる（部屋(.of-room)基準ではなく床基準でbottom配置）。
          // 部屋を丸ごと外側から絶対配置すると、壁の高さ変化で部屋が縦スクロールするようになったとき、
          // これらがスクロールに追従せず「部屋の決まった位置」に浮いたままになり、社員と重なって見えていた。
          // 床の中に入れることで、床がどれだけ伸びても常に床の下端付近＝社員のそばに留まる。
          '<div class="of-dlg of-dlg-office">' +
            '<span class="of-tag" style="background:' + AI_COLOR + ';color:#FFFDF5">' + esc((C().secretary || {}).name || "アイ") + '</span>' +
            '<p data-dlgai>社長、いまの状況をご案内しますね。</p>' +
          '</div>' +
          // 会社の動き（ティッカー）：秘書の吹き出しの隣（下部）に配置
          '<button class="of-tick of-tick-floor" data-act="activity" title="クリックで会社の動きの履歴">' +
            '<span class="of-tag of-tick-tag">📣 会社の動き</span>' +
            '<span class="of-tick-row"><span class="of-now" data-clock>--:--</span>' +
            '<span class="of-tx" data-ticker>ようこそ！ここに会社の動きが流れます</span></span>' +
          '</button>' +
        '</div>' +
        '<div class="of-walk" data-walk="0"></div>' +
      '</section>';

    var ceo = c.ceo || {};
    // 会社名からモノグラム（頭文字）を作る：Awesome Works → AW
    var cn = c.name || "Company";
    var mono = ((cn.match(/[A-Z]/g) || []).slice(0, 2).join("")) || cn.slice(0, 2).toUpperCase();
    var roomBoss =
      '<section class="of-room of-boss">' +
        '<div class="of-partition" aria-hidden="true">' +
          '<span class="of-pseg top"><span class="of-plate">社長室</span></span>' +
          '<span class="of-pseg bot"></span>' +
          '<span class="of-doorsill"></span>' +
        '</div>' +
        '<div class="of-wall"></div>' +
        // 会社の紋章（社長室の壁に掲げる）
        '<div class="of-crest" aria-hidden="true">' +
          '<div class="of-crest-badge"><span class="of-crest-crown">👑</span><span class="of-crest-mono">' + esc(mono) + '</span></div>' +
          '<span class="of-crest-name">' + esc(cn) + '</span>' +
        '</div>' +
        '<span class="of-clockw" style="right:14px"><i class="ck-hand ck-hour" data-ckh></i><i class="ck-hand ck-min" data-ckm></i></span>' +
        // 地球儀（インテリア）：時計の下、壁際に接地した本棚の上に設置。クリックで世界情勢モニターの説明パネルを開く
        '<button class="of-globe" data-act="globe" title="地球儀（世界情勢モニターを開く）">' +
          '<span class="of-globe-ball"><span class="of-globe-shine"></span>' +
            '<span class="of-globe-line eq"></span><span class="of-globe-line mer"></span></span>' +
          '<span class="of-globe-stand"></span>' +
          '<span class="of-globe-cab">' +
            '<span class="of-globe-books">' +
              '<i style="height:70%;background:#6BBF8A"></i><i style="height:55%;background:#7FB5D6"></i>' +
              '<i style="height:82%;background:#E8C170"></i><i style="height:60%;background:#D98E8E"></i>' +
              '<i style="height:74%;background:#9FA8D6"></i>' +
            '</span>' +
          '</span>' +
        '</button>' +
        '<div class="of-floor of-floor-boss">' +
          // 社長本体＋机のエリアをタップ → 社長がやるべきタスク（確認待ち）を表示。件数は頭上のバッジに
          '<div class="of-ceo" data-act="approvals" title="社長のタスク（確認待ち）を見る">' +
            '<i class="of-bdg of-ceo-bdg" data-traybdg hidden></i>' +
            '<span class="of-np" style="background:' + AI_COLOR + '">' + esc(ceo.name || "あなた") + '</span>' +
            charHtml("#4A4238", "#8F86C9", 0.4, null, 8, "#E8B68F", 1, "ac-glasses") +
            '<div class="of-dk"><i class="of-pc"><span class="pc-mon"><span class="pc-scr"></span></span><span class="pc-tower"></span></i></div>' +
            '<span class="of-role">' + esc(ceo.title || "代表取締役 CEO") + '</span>' +
          '</div>' +
          '<div class="of-secdesk">' +
            '<div class="of-ai face-l" data-act="guide" title="クリックで秘書の案内">' +
              '<span class="of-np" style="background:' + AI_COLOR + '">' + esc(((C().secretary || {}).emoji || "🤖") + " " + ((C().secretary || {}).name || "アイ")) + '</span>' +
              '<div class="of-deskpair">' +
                '<div class="of-dk of-dk-v"><i class="of-laptop"><span class="lp-scr"></span><span class="lp-base"></span></i></div>' +
                charHtml("#5C5470", "#9FA8D6", 1.6, null, 9, "#F4D8C0", 4, "ac-bow") +
              '</div>' +
              '<span class="of-role">秘書｜社長のタスク管理</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // 社長室の下側：本棚（資料棚）
        '<button class="of-bshelf" data-act="links" title="資料棚を開く">' +
          '<div class="of-books">' +
            '<i style="height:88%;background:#6BBF8A"></i><i style="height:72%;background:#7FB5D6"></i>' +
            '<i style="height:95%;background:#F2A65A"></i><i style="height:80%;background:#D98E8E"></i>' +
            '<i style="height:90%;background:#9FA8D6"></i><i style="height:68%;background:#E8C170"></i>' +
            '<i style="height:84%;background:#6BBF8A"></i><i style="height:76%;background:#C9A876"></i>' +
            '<i style="height:92%;background:#7FB5D6"></i><i style="height:70%;background:#D98E8E"></i>' +
          '</div>' +
          '<span class="of-bshelf-label">📚 資料棚</span>' +
        '</button>' +
        // 応接セット：右下に対面のチャコールソファ2脚＋白天板テーブル（金属フレーム＋下棚）
        '<div class="of-reception" aria-hidden="true">' +
          '<div class="of-csofa down">' +
            '<span class="cs-back"></span>' +
            '<span class="cs-arm cs-l"></span><span class="cs-arm cs-r"></span>' +
            '<span class="cs-seat"></span>' +
            '<span class="cs-leg cs-l"></span><span class="cs-leg cs-r"></span>' +
          '</div>' +
          '<div class="of-ctable">' +
            '<span class="ct-leg ct-l"></span><span class="ct-leg ct-r"></span>' +
            '<span class="ct-shelf"></span><span class="ct-top"></span>' +
          '</div>' +
          '<div class="of-csofa up">' +
            '<span class="cs-back"></span>' +
            '<span class="cs-arm cs-l"></span><span class="cs-arm cs-r"></span>' +
            '<span class="cs-seat"></span>' +
            '<span class="cs-leg cs-l"></span><span class="cs-leg cs-r"></span>' +
          '</div>' +
        '</div>' +
        '<div class="of-walk" data-walk="1"></div>' +
      '</section>';

    root.innerHTML = hud + tabs +
      '<div class="of-vp" data-vp><div class="of-trk" data-trk>' + roomWs + roomBoss + '</div>' +
      '<div class="of-light"></div>' +
      // 左のクイックメニュー（普段は折りたたみ。FABタップで3機能を開く）
      '<div class="of-quickmenu" data-quickmenu>' +
        '<button class="of-qm-fab" data-act="quicktoggle" aria-label="クイックメニュー" title="クイックメニュー">' +
          '<span class="of-qm-bars">☰</span><span class="of-qm-x">✕</span>' +
          '<span class="of-qm-tx">クイックメニュー</span>' +
        '</button>' +
        '<div class="of-qm-list">' +
          '<button class="of-qm-btn" data-act="tasks"><span class="of-qm-ic">📋</span><span>社長タスクを確認</span></button>' +
          '<button class="of-qm-btn" data-act="workstatus"><span class="of-qm-ic">👥</span><span>稼働状況を確認</span></button>' +
          '<button class="of-qm-btn" data-act="business"><span class="of-qm-ic">🎯</span><span>営業活動を確認</span></button>' +
          '<button class="of-qm-btn" data-act="links"><span class="of-qm-ic">📚</span><span>資料棚を確認</span></button>' +
          '<button class="of-qm-btn" data-act="routines"><span class="of-qm-ic">🔁</span><span>ルーティン業務を確認</span></button>' +
          '<button class="of-qm-btn" data-act="hub"><span class="of-qm-ic">🚀</span><span>事業開発ハブを確認</span></button>' +
          '<button class="of-qm-btn" data-act="settings"><span class="of-qm-ic">⚙️</span><span>基本設定を確認</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="of-navwrap right" data-navwrap>' +
        '<button class="of-nav" data-act="go:1" data-nav aria-label="部屋を移動" title="社長室へ">' +
          '<span class="of-nav-ar" data-navar>▶</span>' +
          '<span class="of-nav-tx" data-navtx>社長室</span>' +
        '</button>' +
      '</div></div>';

    go(curRoom, true);
    tickClock();
    computeBlocked();
    setTimeout(computeBlocked, 450); // フォント読込後のレイアウト確定後にもう一度
    // 壁ダッシュボード（.of-wall）は中身の高さに追従する可変高さのため、為替・予定などの
    // データが読み込み完了して表示が伸び縮みしたときも、床の開始位置がずれる。
    // ResizeObserverで壁の実サイズ変化を監視し、そのたびに歩行グリッド・社員位置を引き直す
    // （window resizeだけでは、データ読み込みによる高さ変化を検知できないため）。
    if (window.ResizeObserver && !window.__ofWallRO) {
      window.__ofWallRO = new ResizeObserver(function () { scheduleBlocked(); });
    }
    if (window.__ofWallRO) {
      qa(".of-wall").forEach(function (el) { window.__ofWallRO.observe(el); });
    }
    if (lastState) applyState(lastState);
    if (lastHealth) applyHealth(lastHealth);
    if (window.fillCalBoard) window.fillCalBoard(); // 今日の予定ウィジェットを満たす
    if (window.fillFxBoard) window.fillFxBoard(); // 為替ウィジェット（主要3通貨）を満たす
  }

  // ===== 部屋移動 =====
  // トラック（.of-trk）が表示枠（.of-vp）よりどれだけ幅広いか＝はみ出し量ぶんだけ左へ寄せると、
  // 2部屋目（社長室）がちょうど表示枠の右端に揃う。この量はCSSの部屋幅比率（デスクトップ＝社長室が
  // オフィスの1/2幅／スマホ＝styles内のメディアクエリで同幅に変更）にそのまま追従するため、
  // 画面幅ごとに違う比率をJS側で数値のまま持たなくてよい（%のマジックナンバーをやめ、実測pxで揃える）。
  function applyRoomTransform(instant) {
    var trk = q("[data-trk]");
    var vp = q("[data-vp]");
    if (!trk) return;
    if (instant) trk.style.transition = "none";
    if (curRoom && vp) {
      var overflowPx = trk.getBoundingClientRect().width - vp.getBoundingClientRect().width;
      trk.style.transform = "translateX(-" + Math.max(0, overflowPx) + "px)";
    } else {
      trk.style.transform = "translateX(0)";
    }
    if (instant) setTimeout(function () { trk.style.transition = ""; }, 30);
  }
  // 画面回転・ウィンドウ幅変更で部屋幅比率（メディアクエリ）が切り替わったときも揃え直す
  window.addEventListener("resize", function () { applyRoomTransform(true); placeQuickMenuForViewport(); });

  // クイックメニューの置き場所：デスクトップでは of-vp（非スクロールの外枠）基準で浮かせ、
  // 中に見えている壁の高さを実測して「壁のすぐ下」に来るよう毎回位置を計算し直している
  // （updateQuickMenuPos）。これは壁が短いデスクトップでは機能するが、壁を縦積みにした
  // スマホでは壁が非常に背高になり、中身（壁＋床）だけが独自にスクロールする一方で
  // クイックメニューは外枠に固定されたままになるため、スクロール位置によって社員や
  // タスク吹き出しと重なって見えてしまう（実機で確認）。
  // 同じ問題は以前アイの吹き出し・会社の動きでも起きており、床(.of-floor)の中の通常の
  // コンテンツにすることで解決している（build()内のコメント参照）。クイックメニューにも
  // 同じ解決策を適用し、スマホでは表示中の部屋の床の先頭へ実際にDOM移動させ、
  // スクロールに追従する通常のコンテンツにする。デスクトップでは元の浮遊表示のまま。
  function placeQuickMenuForViewport() {
    var qm = q("[data-quickmenu]");
    if (!qm) return;
    var mobile = window.innerWidth <= 480;
    if (!mobile) {
      var vp = q("[data-vp]");
      var navwrap = q("[data-navwrap]");
      if (vp && qm.parentNode !== vp) vp.insertBefore(qm, navwrap);
      qm.classList.remove("of-quickmenu-inflow");
      return;
    }
    // 社長室では非表示（.hidden-room）にするため、置き場所もオフィスの床のみでよい
    if (curRoom) return;
    var floorEl = q(".of-room.of-ws .of-floor");
    if (floorEl && qm.parentNode !== floorEl) floorEl.insertBefore(qm, floorEl.firstChild);
    qm.classList.add("of-quickmenu-inflow");
  }

  function go(n, instant) {
    curRoom = n ? 1 : 0;
    // クイックメニューはオフィスのみで表示。社長室には決裁トレイ・資料棚など専用の導線が
    // 別にあるため、クイックメニューは出さない（ご要望により削除）。
    var qm = q("[data-quickmenu]");
    if (qm) {
      qm.classList.toggle("hidden-room", curRoom === 1);
      qm.classList.remove("open");
    }
    applyRoomTransform(instant);
    qa("[data-tab]").forEach(function (t) {
      t.classList.toggle("on", +t.getAttribute("data-tab") === curRoom);
    });
    // 移動ボタン＋ラベル：オフィスでは右端に▶「社長室へ移動する」、社長室では左端に◀「オフィスへ移動する」
    var wrap = q("[data-navwrap]");
    var nav = q("[data-nav]");
    var ar = q("[data-navar]");
    var tx = q("[data-navtx]");
    var act = "go:" + (curRoom ? 0 : 1);
    if (wrap) wrap.className = "of-navwrap " + (curRoom ? "left" : "right");
    if (nav) { nav.setAttribute("data-act", act); nav.title = curRoom ? "オフィスへ" : "社長室へ"; }
    if (ar) ar.textContent = curRoom ? "◀" : "▶";
    if (tx) tx.textContent = curRoom ? "オフィス" : "社長室";
    placeQuickMenuForViewport();
  }

  // ===== クリック（イベント委譲） =====
  document.addEventListener("click", function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest("[data-act]") : null;
    if (!el || !root || !root.contains(el)) return;
    var p = (el.getAttribute("data-act") || "").split(":");
    if (p[0] === "go") { go(+p[1]); return; }
    // クイックメニューの開閉（パネルが開いていても操作可）
    if (p[0] === "quicktoggle") { var qm = q("[data-quickmenu]"); if (qm) qm.classList.toggle("open"); return; }
    if (window.__talkOpen) return;
    // クイックメニューのボタンを押したらメニューは畳む
    if (el.closest && el.closest(".of-qm-btn")) { var qmc = q("[data-quickmenu]"); if (qmc) qmc.classList.remove("open"); }
    switch (p[0]) {
      case "activity": if (window.openActivity) window.openActivity(); break;
      case "app": if (window.openApp) window.openApp(p[1]); break;
      case "integrations": if (window.openIntegrations) window.openIntegrations(); break;
      case "business": if (window.openBusiness) window.openBusiness(); break;
      case "workstatus": if (window.openWorkStatus) window.openWorkStatus(); break;
      case "setup": if (window.openSetupStatus) window.openSetupStatus(); break;
      case "settings": if (window.openSetup) window.openSetup(); break;
      case "tasks": if (window.openTasks) window.openTasks(); break;
      case "approvals": if (window.openApprovals) window.openApprovals(); break;
      case "proposals": if (window.openProposals) window.openProposals(); break;
      case "proposal-one": if (window.openProposalOne) window.openProposalOne(+p[1]); break;
      case "proposal-emp": if (window.openEmployeeProposals) window.openEmployeeProposals(+p[1]); break;
      case "cabinet": if (window.openCabinet) window.openCabinet(); break;
      case "links": if (window.openLinks) window.openLinks(); break;
      case "routines": if (window.openRoutines) window.openRoutines(); break;
      case "hub": if (window.openNotionHub) window.openNotionHub(); break;
      case "hire": if (window.openHire) window.openHire(); break;
      case "guide": if (window.openGuide) window.openGuide(); break;
      case "globe": if (window.openGlobe) window.openGlobe(); break;
      case "talk":
        var e = (C().employees || [])[+p[1]];
        if (e && window.openTalk) window.openTalk(e);
        break;
    }
  });

  // ===== 社員の自律移動：ポケモンNPC方式の3層構造 =====
  // ① 常駐の移動タイプ（wander / patrol / look / stay）
  // ② グリッドベースの1マス移動＋衝突判定＋許可範囲（考えて歩かない。サイコロ＋判定だけ）
  // ③ イベント時のスクリプト上書き（ミーティング招集 → 終わったら自律移動に復帰）
  var GRID_DESKTOP = {
    0: { x0: 4, y0: 8, cols: 12, rows: 8, tw: 4.2, th: 6.6 },   // オフィスの歩行グリッド（単位:%・細かめ）
    1: { x0: 10, y0: 12, cols: 10, rows: 8, tw: 4.8, th: 6.2 }, // 社長室
  };
  // スマホ幅用：歩行マスの当たり判定は固定px（約66×94px、キャラ＋名札ぶん）なのに対し、
  // マス自体は部屋の%指定のため、部屋が狭いほどマスが実寸で詰まり、隣り合う社員の名札や
  // タスク吹き出しが重なって見えてしまう（実機で確認）。列数（横）は減らして1マスの横幅を
  // 広げるが、行数（縦）は減らさない。floorの実測高さは社員数（＝床の縦の長さ）で決まり
  // 上限が無いため、行数を減らすと1マスの縦幅（th）が実測pxで際限なく巨大化し、歩き回る
  // 社員同士が数百px単位で離れて配置される事故になった（実機で確認・行数4→8に戻して解消）。
  // 当たり判定は横幅約66px（コメント参照）。隣接マス（差1）は配置禁止なので、実際に
  // 2人が同時に存在しうる最小間隔は「2マスぶんの実測px」になる。cols:6（1マス約31px）
  // だと2マスでも63px弱にしかならず、当たり判定の66pxを下回って見た目には重なって
  // しまっていた（実機で確認）。横の総幅(x0〜x0+cols*tw)は変えず、列数だけさらに絞り、
  // 2マスぶんが確実に66pxを超えるようにする。
  var GRID_MOBILE = {
    0: { x0: 4, y0: 8, cols: 4, rows: 8, tw: 12.6, th: 6.6 },
    1: { x0: 10, y0: 12, cols: 4, rows: 8, tw: 12.0, th: 6.2 },
  };
  var GRID = {};
  Object.defineProperty(GRID, "0", { get: function () { return (window.innerWidth <= 480 ? GRID_MOBILE : GRID_DESKTOP)[0]; } });
  Object.defineProperty(GRID, "1", { get: function () { return (window.innerWidth <= 480 ? GRID_MOBILE : GRID_DESKTOP)[1]; } });
  // 社員indexごとの移動タイプ（リサ:歩行 コトハ:歩行 サトル:その場で回転 ハック:巡回 ミク:歩行 …）
  var MOVE_TYPES = ["wander", "wander", "look", "patrol", "wander", "look"];
  var PATROL_ROUTE = [{ d: 2, n: 3 }, { d: 1, n: 2 }, { d: 0, n: 3 }, { d: 3, n: 2 }]; // 右3→下2→左3→上2
  var DIRS = [{ dx: -1, dy: 0, k: "l" }, { dx: 0, dy: 1, k: "d" }, { dx: 1, dy: 0, k: "r" }, { dx: 0, dy: -1, k: "u" }];
  var WANDER_RANGE = 3; // 許可範囲：アンカーから±3マス（店員が店から出ていかないやつ）
  var scriptMode = false;
  // 待機中の過ごし方：歩く人は全員「上下左右ランダム」に動く（巡回ルート・その場回転は廃止）。たまに着席
  var IDLE_PLANS = ["wander", "wander", "wander", "wander", "wander", "sit"];
  function pickIdlePlan() { return IDLE_PLANS[Math.floor(Math.random() * IDLE_PLANS.length)]; }

  // 歩行可否判定：①グリッド内か ②家具マスでないか ③他の社員と体がぶつからないか
  var blocked = { 0: {}, 1: {} };
  function tileFree(room, x, y, self) {
    var g = GRID[room];
    if (!g || x < 0 || y < 0 || x >= g.cols || y >= g.rows) return false;
    if (blocked[room][x + ":" + y]) return false;
    var ok = true;
    Object.keys(walkers).forEach(function (j) {
      var n = walkers[j];
      if (n && n !== self && n.room === room && Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 2) ok = false;
    });
    return ok;
  }

  // 物理処理：家具（机・ボード・棚・ソファ・観葉植物・会話ウィンドウ等）の実座標から
  // 「歩けないマス」を計算する。人のあたり判定は キャラ＋名札ぶんの矩形（約66×94px）
  function rectsOverlap(a, b) { return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t; }
  function computeBlocked() {
    if (!root) return;
    [0, 1].forEach(function (room) {
      var layer = q('[data-walk="' + room + '"]');
      var sec = layer && layer.closest ? layer.closest(".of-room") : null;
      var g = GRID[room];
      if (!layer || !sec || !g) return;
      var lr = layer.getBoundingClientRect();
      if (!lr.width) return;
      // 床判定：実際の床（of-floor）の内側＝歩ける範囲。ここからグリッドを作り直す
      // → 壁（上の木目部分）や床外には絶対にマスを作らないので、壁を歩けなくなる
      var floorEl = sec.querySelector(room === 1 ? ".of-floor-boss" : ".of-floor");
      if (floorEl) {
        var fr = floorEl.getBoundingClientRect();
        var cs = window.getComputedStyle(floorEl);
        var pl = parseFloat(cs.paddingLeft) || 0, pr = parseFloat(cs.paddingRight) || 0;
        var pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
        var L = fr.left + pl, R = fr.right - pr, T = fr.top + pt, B = fr.bottom - pb;
        if (R > L && B > T && lr.width && lr.height) {
          g.x0 = (L - lr.left) / lr.width * 100;
          g.y0 = (T - lr.top) / lr.height * 100;
          g.tw = (R - L) / lr.width * 100 / g.cols;
          g.th = (B - T) / lr.height * 100 / g.rows;
        }
      }
      var obs = [];
      Array.prototype.forEach.call(
        sec.querySelectorAll(".of-unit,.of-side,.of-hire,.of-plant,.of-sofa,.of-ceo,.of-secdesk,.of-tray-pos,.of-bshelf,.of-wallshelf,.of-dlg,.of-tick-floor,.of-reception"),
        function (el) {
          var r = el.getBoundingClientRect();
          if (!r.width) return;
          // 社員ユニットは「机＋人の芯」だけを障害物に（名札・役職・余白は通行可にして通路を作る）
          if (el.classList.contains("of-unit") || el.classList.contains("of-ceo")) {
            obs.push({ l: r.left + r.width * 0.24, t: r.top + r.height * 0.30,
              r: r.right - r.width * 0.24, b: r.bottom - r.height * 0.30 });
          } else {
            obs.push({ l: r.left + 4, t: r.top + 4, r: r.right - 4, b: r.bottom - 4 });
          }
        });
      var set = {};
      for (var x = 0; x < g.cols; x++) {
        for (var y = 0; y < g.rows; y++) {
          var L = lr.left + (g.x0 + x * g.tw) / 100 * lr.width;
          var T = lr.top + (g.y0 + y * g.th) / 100 * lr.height;
          var foot = { l: L + 4, t: T + 12, r: L + 44, b: T + 64 }; // キャラの体の芯ぶん（名札は通行可）
          for (var o = 0; o < obs.length; o++) {
            if (rectsOverlap(foot, obs[o])) { set[x + ":" + y] = 1; break; }
          }
        }
      }
      blocked[room] = set;
    });
    // すでに家具マスに立ってしまっている社員は、近くの空きマスへ退避
    Object.keys(walkers).forEach(function (i) {
      var n = walkers[i];
      if (!n) return;
      if (blocked[n.room][n.x + ":" + n.y]) {
        var spot = nearestFree(n.room, n.x, n.y, n);
        if (spot) { n.x = spot.x; n.y = spot.y; n.ax = spot.x; n.ay = spot.y; }
      }
      // タイル(x,y)自体は変わらなくても、壁の高さ変化等でグリッド自体（g.x0/g.y0/tw/th）が
      // 動いていることがあるため、画面上の位置は毎回引き直す（動かないと壁に埋まって見える）。
      npcPlace(n, true);
    });
    updateQuickMenuPos();
  }

  // クイックメニュー（左上のFAB）の縦位置：オフィス室の壁は中身の量で高さが変わるため、
  // 固定pxで置くと壁ダッシュボードが2段に折り返したときに埋もれてしまう。
  // 実際の壁の高さ（社長室側の固定240pxも含めて大きい方）に合わせて毎回置き直す。
  function updateQuickMenuPos() {
    var qm = q("[data-quickmenu]");
    if (!qm) return;
    // スマホ幅では壁ダッシュボード（タスク／為替／予定）を縦積みにしているため壁の実測高さが
    // 非常に大きくなることがあり、素直に追従させると画面下の方（社員フロアや秘書の吹き出し・
    // ティッカーのあたり）までクイックメニューが押し出されて重なってしまう。狭い画面では
    // 壁の高さを追いかけるのをやめ、CSS側の固定位置（縦中央・左端）に任せる。
    if (window.innerWidth <= 480) { qm.style.top = ""; return; }
    var wallEl = q(".of-room.of-ws .of-wall");
    var h = wallEl ? wallEl.getBoundingClientRect().height : 240;
    qm.style.top = (Math.max(h, 240) + 12) + "px";
  }
  function nearestFree(room, cx, cy, self) {
    var g = GRID[room];
    for (var r = 1; r < Math.max(g.cols, g.rows); r++) {
      for (var x = cx - r; x <= cx + r; x++) {
        for (var y = cy - r; y <= cy + r; y++) {
          if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== r) continue;
          if (tileFree(room, x, y, self)) return { x: x, y: y };
        }
      }
    }
    return null;
  }
  var __blockTimer = null;
  function scheduleBlocked() {
    if (__blockTimer) clearTimeout(__blockTimer);
    __blockTimer = setTimeout(computeBlocked, 180);
  }
  window.addEventListener("resize", scheduleBlocked);
  function npcPlace(n, instant) {
    var g = GRID[n.room];
    if (instant) n.el.style.transition = "none";
    n.el.style.left = (g.x0 + n.x * g.tw) + "%";
    n.el.style.top = (g.y0 + n.y * g.th) + "%";
    if (instant) setTimeout(function () { n.el.style.transition = ""; }, 30);
  }
  function npcFace(n, k) {
    n.el.className = "of-walker face-" + k;
  }
  function randFreeTile(room, self) {
    var g = GRID[room];
    var cands = [];
    for (var x = 0; x < g.cols; x++) {
      for (var y = 0; y < g.rows; y++) {
        if (tileFree(room, x, y, self)) cands.push({ x: x, y: y });
      }
    }
    if (!cands.length) return null;
    return cands[Math.floor(Math.random() * cands.length)];
  }
  // 社長室の戸口側（左下）の空きマスを優先して返す＝社長まわりに集まらせない
  function bossEntryTile(self) {
    var g = GRID[1];
    var cands = [];
    for (var x = 0; x < Math.ceil(g.cols / 2); x++) {
      for (var y = Math.ceil(g.rows / 2); y < g.rows; y++) {
        if (tileFree(1, x, y, self)) cands.push({ x: x, y: y });
      }
    }
    if (cands.length) return cands[Math.floor(Math.random() * cands.length)];
    return randFreeTile(1, self);
  }
  // ドアワープ（オフィス ⇄ 社長室）。アンカーも移すので、移った先でまた±3マス歩き回る
  function npcWarp(n) {
    var to = n.room === 0 ? 1 : 0;
    var layer = q('[data-walk="' + to + '"]');
    // 社長室に入るときは戸口側（左下）に出す＝社長・秘書から離す
    var spot = to === 1 ? bossEntryTile(n) : randFreeTile(to, n);
    if (!layer || !spot) return;
    n.el.style.opacity = "0";
    setTimeout(function () {
      layer.appendChild(n.el);
      n.room = to; n.x = spot.x; n.y = spot.y; n.ax = spot.x; n.ay = spot.y;
      npcPlace(n, true);
      n.el.style.opacity = "1";
    }, 260);
  }

  function ensureWalker(i, e, type) {
    if (REDUCED || walkers[i]) return;
    var room = 0; // 社員はオフィス内だけを歩き回る（ワープ＝部屋移動はしない）
    var layer = q('[data-walk="0"]');
    if (!layer) return;
    var spot = randFreeTile(room, null);
    if (!spot) return; // 空きマスが無ければ無理に出さない
    var el = document.createElement("div");
    el.className = "of-walker face-d";
    el.setAttribute("data-act", "talk:" + i);
    el.title = "クリックで" + (e.name || "") + "の詳細";
    el.innerHTML = charHtml(e.hair || HAIR[i % HAIR.length], e.cloth || CLOTH[i % CLOTH.length], (i % 4) * 0.7) +
      '<span class="of-np" style="background:' + PALETTE[i % PALETTE.length] + '">' +
      esc(e.emoji || "🙂") + " " + esc(e.name) + "</span>";
    layer.appendChild(el);
    var n = {
      el: el, room: room, x: spot.x, y: spot.y, ax: spot.x, ay: spot.y,
      type: type || "wander",
      route: PATROL_ROUTE, ri: 0, step: 0,
      wait: Date.now() + 600 + Math.random() * 2600, // ランダム待機（止まったり動いたり）
    };
    walkers[i] = n;
    npcPlace(n, true);
  }
  function removeWalker(i) {
    var n = walkers[i];
    if (n && n.el && n.el.parentNode) n.el.parentNode.removeChild(n.el);
    delete walkers[i];
  }

  // ② のメインループ：待つ→方向を選ぶ→判定→1マス動く（NGなら向きだけ変えて待機に戻る）
  setInterval(function () {
    if (!root || REDUCED || scriptMode) return;
    var now = Date.now();
    Object.keys(walkers).forEach(function (i) {
      var n = walkers[i];
      if (!n || now < n.wait) return;

      if (n.type === "look") { // その場で回転：位置は動かず向きだけランダムに変える
        npcFace(n, DIRS[Math.floor(Math.random() * 4)].k);
        n.wait = now + 1500 + Math.random() * 2500;
        return;
      }
      var mv;
      if (n.type === "patrol") {
        mv = DIRS[n.route[n.ri].d];
      } else { // wander：オフィス内を四方向ランダムに歩く（ワープはしない）
        mv = DIRS[Math.floor(Math.random() * 4)];
      }
      npcFace(n, mv.k);
      var nx = n.x + mv.dx, ny = n.y + mv.dy;
      var ok = tileFree(n.room, nx, ny, n);
      if (n.type === "wander" && (Math.abs(nx - n.ax) > WANDER_RANGE || Math.abs(ny - n.ay) > WANDER_RANGE)) ok = false;
      if (ok) {
        n.x = nx; n.y = ny;
        npcPlace(n);
        // 歩いてる間だけ足踏みアニメ（ちょこちょこ）。1歩ぶん経ったら止める
        n.el.classList.add("is-walking");
        clearTimeout(n.stepT);
        n.stepT = setTimeout(function () { n.el.classList.remove("is-walking"); }, 260);
        if (n.type === "patrol") {
          n.step++;
          if (n.step >= n.route[n.ri].n) { n.ri = (n.ri + 1) % n.route.length; n.step = 0; }
          n.wait = now + 700;
        } else {
          n.wait = now + 1000 + Math.random() * 3000;
        }
      } else {
        // 進めない：向きだけ変わって待機（巡回は詰まったら次のコマンドへ）
        if (n.type === "patrol") { n.ri = (n.ri + 1) % n.route.length; n.step = 0; }
        n.wait = now + 800 + Math.random() * 1600;
      }
    });
  }, 300);

  // ===== 現実時刻と同期（時計＋環境光） =====
  function tickClock() {
    if (!root) return;
    var d = new Date();
    var hh = ("0" + d.getHours()).slice(-2), mm = ("0" + d.getMinutes()).slice(-2);
    qa("[data-clock]").forEach(function (el) { el.textContent = hh + ":" + mm; });
    // 壁のアナログ時計：針を現在時刻に合わせて回す
    var h = d.getHours(), m = d.getMinutes();
    var hourAngle = ((h % 12) + m / 60) * 30;
    var minAngle = m * 6;
    qa("[data-ckh]").forEach(function (el) { el.style.transform = "rotate(" + hourAngle + "deg)"; });
    qa("[data-ckm]").forEach(function (el) { el.style.transform = "rotate(" + minAngle + "deg)"; });
    var mode = (h >= 5 && h < 10) ? "morning" : (h < 16) ? "noon" : (h < 19) ? "evening" : "night";
    var vp = q("[data-vp]");
    if (vp) vp.className = "of-vp time-" + mode;
    if (window.tickFxClock) window.tickFxClock(); // 為替ウィジェットの表示時刻もリアルタイムで進める
  }
  setInterval(tickClock, 20000);

  // ===== 為替ウィジェットのレート再取得 =====
  // ECB発表値は平日1回のみ更新のため、1分間隔ではなく1時間間隔で十分（画面を開きっぱなしでも
  // 日付が変わった/新しい値が発表されたタイミングを取りこぼさない程度の頻度）。表示時刻自体は
  // 上のtickClockが毎20秒進めるので、レートの値がなかなか変わらなくても時刻は常に「いま」を指す。
  setInterval(function () { if (window.fillFxBoard) window.fillFxBoard(); }, 60 * 60 * 1000);

  // ===== state.js → 画面 =====
  function tagColor(who) {
    if (!who) return "#4D9968";
    if (who === "アイ" || who === ((C().secretary || {}).name || "アイ")) return AI_COLOR;
    var emps = C().employees || [];
    for (var i = 0; i < emps.length; i++) {
      if (emps[i] && emps[i].name === who) return PALETTE[i % PALETTE.length];
    }
    return "#4D9968";
  }
  function setBadge(sel, n) {
    qa(sel).forEach(function (el) {
      el.hidden = !n;
      el.textContent = n > 9 ? "9+" : String(n);
    });
  }

  function applyState(s) {
    lastState = s;
    if (!s || !root) return;

    // 掲示板（最新の動き1件）
    var a = (s.activity || [])[0];
    var tx = q("[data-ticker]");
    if (tx) tx.textContent = a ? ((a.who ? a.who + "：" : "") + a.text) : "ようこそ！ここに会社の動きが流れます";

    // 開業準備の看板
    var setup = s.setup || {}, steps = setup.steps || [];
    var sdone = steps.filter(function (x) { return x.done; }).length;
    var prep = q("[data-prep]");
    if (prep) {
      if (!steps.length) prep.hidden = true;
      else if (setup.completed && sdone >= steps.length) {
        prep.hidden = false; prep.textContent = "✅ 営業中"; prep.classList.add("open");
      } else {
        prep.hidden = false;
        prep.textContent = "🚧 開業準備 " + sdone + "/" + steps.length;
        prep.classList.toggle("open", !!setup.completed);
        if (setup.completed) prep.textContent = "✅ 営業中（連携 " + sdone + "/" + steps.length + "）";
      }
    }

    // 売上ボード（HUD＋社長室の両方）
    var b = s.business || {};
    var goal = Number(b.goalAmount) || 0, cur = Number(b.current) || 0;
    var pct = goal > 0 ? Math.min(Math.round(cur / goal * 100), 100) : 0;
    qa("[data-sales]").forEach(function (el) {
      el.textContent = goal ? (fmtYen(cur) + " / " + fmtYen(goal)) : "目標を決めよう";
    });
    qa("[data-salesbar]").forEach(function (el) {
      el.style.width = pct + "%";
      el.style.minWidth = cur > 0 ? "6px" : "0";
    });
    // 営業ファネル（応募/返信/受注）を壁の売上ボードに反映
    (b.pipeline || []).forEach(function (p) {
      if (!p || !p.label) return;
      var fel = q('[data-funnel="' + p.label + '"]');
      if (fel) fel.textContent = (p.count || 0);
    });

    // タスクボードの数字
    var counts = { todo: 0, doing: 0, review: 0, done: 0 };
    (s.tasks || []).forEach(function (t) { if (t && counts[t.status] != null) counts[t.status]++; });
    ["todo", "doing", "review", "done"].forEach(function (k) {
      var el = q('[data-c="' + k + '"]');
      if (el) el.textContent = counts[k];
    });
    var bh = q("[data-bhint]");
    if (bh) bh.hidden = !counts.review;

    // 社員：状態バッジ＋担当タスクチップ＋進捗＋成果物数（誰が・何を・どこまで）
    (C().employees || []).forEach(function (e, i) {
      var unit = q('[data-unit="' + i + '"]');
      if (!unit || !e) return;
      var live = {};
      (s.employees || []).forEach(function (le) { if (le && le.name === e.name) live = le; });
      var tk = null;
      (s.tasks || []).forEach(function (t) { if (t && t.id && live.taskId && t.id === live.taskId) tk = t; });

      var st = live.status || "idle";
      var stt = unit.querySelector("[data-stt]");
      if (stt) {
        stt.textContent = st === "working" ? "💻 作業中" : st === "meeting" ? "🗣 会議中" : "☕ 待機中";
        stt.className = "of-stt is-" + st;
      }
      // この社員からの提案（state.proposals の from が一致するもの）の通し番号
      var myProps = [];
      (s.proposals || []).forEach(function (pp, gi) { if (pp && pp.from === e.name) myProps.push(gi); });
      // 作業中＝デスクでカタカタ（💦）。待機中＝自由行動（座る or 歩き回る）。提案があっても歩く
      var sweat = unit.querySelector("[data-sweat]");
      var zzz = unit.querySelector("[data-zzz]");
      if (st === "working" || st === "meeting") {
        removeWalker(i);
        unit.classList.add("is-working");
        unit.classList.remove("is-idle", "is-away");
        if (sweat) sweat.hidden = st !== "working";
        if (zzz) zzz.hidden = true;
      } else {
        var plan = idlePlan[i] || (idlePlan[i] = pickIdlePlan());
        if (plan === "sit") {
          removeWalker(i);
          unit.classList.add("is-idle");
          unit.classList.remove("is-working", "is-away");
          if (sweat) sweat.hidden = true;
          if (zzz) zzz.hidden = false;
        } else {
          ensureWalker(i, e, plan);
          if (walkers[i]) {                 // 立ち上がって歩く → 席は空に（人を二重に出さない）
            unit.classList.add("is-away");
            unit.classList.remove("is-working", "is-idle");
          } else {                          // REDUCED等で歩けない → 席に座って休憩にフォールバック
            unit.classList.add("is-idle");
            unit.classList.remove("is-working", "is-away");
            if (zzz) zzz.hidden = false;
          }
          if (sweat) sweat.hidden = true;
        }
      }
      // 💬 提案の吹き出し：今いる本人（歩行中=walker / 着席=unit）の「顔の横」に出す。タップで一覧ポップ
      var walkerEl = walkers[i] && walkers[i].el;
      var activeChr = (walkerEl || unit).querySelector(".of-chr");
      // もう片方や提案ゼロに残った吹き出しを掃除（取り残し・重複を防ぐ）
      [unit, walkerEl].forEach(function (host) {
        if (!host) return;
        var chr = host.querySelector(".of-chr");
        var b = chr && chr.querySelector("[data-propbub]");
        if (b && (chr !== activeChr || !myProps.length)) b.remove();
      });
      if (myProps.length && activeChr) {
        var bub = activeChr.querySelector("[data-propbub]");
        if (!bub) {
          bub = document.createElement("div");
          bub.className = "of-propbub";
          bub.setAttribute("data-propbub", "");
          activeChr.appendChild(bub);
        }
        bub.setAttribute("data-act", "proposal-emp:" + i);
        bub.title = (e.name || "社員") + "の提案を見る（" + myProps.length + "件）";
        var newHtml = '<span class="of-propbub-ic">💬</span>' +
          '<i class="of-propbub-count">' + myProps.length + '</i>' +
          '<span class="of-propbub-tail"></span>';
        if (bub.innerHTML !== newHtml) bub.innerHTML = newHtml; // 件数が変わった時だけ更新（チラつき防止）
        unit.classList.add("has-prop");
      } else {
        unit.classList.remove("has-prop");
      }
      var chip = unit.querySelector("[data-chip]");
      if (chip) {
        if (tk) {
          chip.hidden = false;
          chip.querySelector("b").textContent = tk.id || "";
          chip.querySelector(".txt").textContent = trunc(tk.title, 12);
          var pr = Math.max(0, Math.min(100, Number(tk.progress) || 0));
          chip.querySelector("u").style.width = pr + "%";
          chip.title = (tk.id || "") + " " + (tk.title || "") + "（" + pr + "%）";
        } else {
          chip.hidden = true;
        }
      }
      var nd = 0;
      (s.tasks || []).forEach(function (t) { if (t && t.owner === e.name) nd += (t.deliverables || []).length; });
      var fb = unit.querySelector("[data-fb]");
      if (fb) { fb.hidden = !nd; fb.textContent = "📄 " + (nd > 9 ? "9+" : nd); }
    });

    // バッジ：社長の確認待ち件数（社長キャラ上）・納品BOX。提案は社員の頭上の💬吹き出しで表示
    setBadge("[data-traybdg]", counts.review);
    var dels = (s.tasks || []).reduce(function (n, t) { return n + ((t.deliverables || []).length); }, 0) +
      (s.employees || []).reduce(function (n, e) { return n + ((e.deliverables || []).length); }, 0);
    setBadge("[data-cabbdg]", dels);

    // 秘書アイ：頭上ヒント＋社長室の会話ウィンドウ（次の一手）
    if (window.computeNextAction) {
      var na = window.computeNextAction(s);
      var hint = q("[data-aihint]");
      if (hint) { hint.textContent = "💡 次は：" + trunc(na.label, 16); hint.title = na.label; }
      var dai = q("[data-dlgai]");
      if (dai) dai.textContent = "社長、次は「" + na.label + "」がおすすめです。" + (na.why || "");
    }

    // オフィスの会話ウィンドウ（最新の動き）
    if (!meetTimer) {
      var wd = q("[data-dlgws]"), wtag = q("[data-dlgwstag]");
      if (wd && a) {
        wd.textContent = a.text || "";
        if (wtag) {
          wtag.textContent = a.who || "社内";
          wtag.style.background = tagColor(a.who);
          wtag.style.color = "#FFFDF5";
        }
      }
    }

    // レイアウトが変わった可能性があるので、歩行不可マスを再計算（物理処理）
    scheduleBlocked();
  }

  // ===== /health → アプリの連携ランプ =====
  function applyHealth(h) {
    lastHealth = h;
    if (!root) return;
    var set = function (k, on) {
      var el = q('[data-dot="' + k + '"]');
      if (el) el.classList.toggle("on", !!on);
    };
    set("gmail", h && h.google);
    set("calendar", h && h.google);
    set("line", h && h.line);
  }

  // ===== ③ ミーティング演出（command: meeting）＝スクリプトによる上書き =====
  // 自律移動を一時停止し、ホワイトボード前へ1マスずつ歩かせて整列 → 終わったら自律移動に復帰
  window.__startMeeting = function () {
    var ws = q(".of-ws");
    if (!ws || meetTimer || scriptMode) return;
    scriptMode = true;
    var wd = q("[data-dlgws]"), wtag = q("[data-dlgwstag]");
    if (wd) wd.textContent = "全員集合！作戦会議中です…🪑";
    if (wtag) { wtag.textContent = (C().secretary || {}).name || "アイ"; wtag.style.background = AI_COLOR; }

    // 集合地点：ホワイトボード寄りの「歩けるマス」から人数ぶん確保（家具マスは選ばない）
    var g0 = GRID[0];
    var spots = [];
    for (var sx = 0; sx < g0.cols; sx++) {
      for (var sy = 0; sy < g0.rows; sy++) {
        if (!blocked[0][sx + ":" + sy]) {
          spots.push({ x: sx, y: sy, d: Math.abs(sx - (g0.cols - 3)) + Math.abs(sy - 2) * 2 });
        }
      }
    }
    spots.sort(function (a, b) { return a.d - b.d; });
    var slot = 0;
    Object.keys(walkers).forEach(function (i) {
      var n = walkers[i];
      if (!n) return;
      if (n.room !== 0) { // 社長室にいる社員はドアをくぐって戻ってくる
        var layer = q('[data-walk="0"]');
        if (layer) {
          n.el.style.opacity = "0";
          (function (nn) {
            setTimeout(function () {
              layer.appendChild(nn.el);
              nn.room = 0; nn.x = 0; nn.y = g0.rows - 1;
              npcPlace(nn, true);
              nn.el.style.opacity = "1";
            }, 280);
          })(n);
        }
      }
      var sp = spots[Math.min(slot, spots.length - 1)] || { x: 1, y: 2 };
      n.tx = sp.x; n.ty = sp.y;
      slot++;
    });

    // applymovement：目標マスへ1マスずつ（X優先→Y）。到着したら上を向く
    var mover = setInterval(function () {
      var moving = false;
      Object.keys(walkers).forEach(function (i) {
        var n = walkers[i];
        if (!n || n.room !== 0 || n.tx == null) return;
        var dx = n.tx - n.x, dy = n.ty - n.y;
        if (dx === 0 && dy === 0) { npcFace(n, "u"); return; }
        moving = true;
        if (dx !== 0) { n.x += dx > 0 ? 1 : -1; npcFace(n, dx > 0 ? "r" : "l"); }
        else { n.y += dy > 0 ? 1 : -1; npcFace(n, dy > 0 ? "d" : "u"); }
        npcPlace(n);
      });
      if (!moving) clearInterval(mover);
    }, 420);

    ws.classList.add("of-meet");
    meetTimer = setTimeout(function () {
      clearInterval(mover);
      ws.classList.remove("of-meet");
      // 自律移動へ復帰：いまいる場所を新しいアンカーにして、また歩き出す
      Object.keys(walkers).forEach(function (i) {
        var n = walkers[i];
        if (!n) return;
        n.tx = null; n.ty = null; n.ax = n.x; n.ay = n.y;
        n.wait = Date.now() + 800 + Math.random() * 2500;
      });
      scriptMode = false;
      meetTimer = null;
      if (lastState) applyState(lastState);
    }, 6500);
  };

  // ===== 公開API（index.html から呼ばれる） =====
  window.AIOffice = {
    rebuild: function (company) {
      if (company) window.COMPANY = company;
      build();
    },
    applyState: function (s) {
      window.__lastState = s;
      applyState(s);
    },
    applyHealth: function (h) {
      window.__lastHealth = h;
      applyHealth(h);
    },
  };

  build();
})();
