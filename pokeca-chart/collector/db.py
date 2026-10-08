"""SQLite の表定義（引き継ぎ資料 5.1）。価格履歴は上書きせず1日1行ずつ追記する。"""
import sqlite3

SCHEMA = """
CREATE TABLE IF NOT EXISTS box (
  code TEXT PRIMARY KEY,          -- 正規化したシリーズコード（例: m6a）
  name TEXT, series TEXT, release_date TEXT
);
CREATE TABLE IF NOT EXISTS card (
  id INTEGER PRIMARY KEY,
  box_code TEXT REFERENCES box(code),
  number TEXT,                    -- 型番（例: 134/103）
  name TEXT, rarity TEXT,
  UNIQUE (box_code, number, rarity, name)
);
CREATE TABLE IF NOT EXISTS shop (
  id TEXT PRIMARY KEY,            -- yuyutei など。サイトには出さない
  url TEXT, enabled INTEGER DEFAULT 1, note TEXT
);
CREATE TABLE IF NOT EXISTS shop_item (
  shop_id TEXT REFERENCES shop(id),
  shop_key TEXT,                  -- 店側の商品ID・表記
  card_id INTEGER REFERENCES card(id),
  PRIMARY KEY (shop_id, shop_key)
);
CREATE TABLE IF NOT EXISTS price (
  card_id INTEGER REFERENCES card(id),
  shop_id TEXT REFERENCES shop(id),
  day TEXT,                       -- YYYY-MM-DD
  price INTEGER,                  -- 表示価格
  struck_price INTEGER,           -- 取り消し線の価格（遊々亭）
  boosted INTEGER DEFAULT 0,
  soldout INTEGER DEFAULT 0,      -- ドラゴンスター。意味が分かるまで平均に入れない
  PRIMARY KEY (card_id, shop_id, day)
);
CREATE TABLE IF NOT EXISTS daily (
  card_id INTEGER REFERENCES card(id),
  day TEXT,
  avg_price INTEGER, shop_count INTEGER,
  state TEXT,                     -- normal / stale / insufficient
  asof_day TEXT,                  -- stale のとき最後に2店以上そろった日
  PRIMARY KEY (card_id, day)
);
"""


def connect(path="pokeca.db"):
    con = sqlite3.connect(path)
    con.executescript(SCHEMA)
    return con
