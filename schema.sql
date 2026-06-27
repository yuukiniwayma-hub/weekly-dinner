-- 1週間の献立アプリ D1 スキーマ
CREATE TABLE IF NOT EXISTS weekly_dinner (
  id          TEXT PRIMARY KEY,
  recipes     TEXT NOT NULL DEFAULT '[]',
  assignments TEXT NOT NULL DEFAULT '{}',
  updated_at  TEXT NOT NULL DEFAULT ''
);

-- 単一行（id='default'）にアプリ全体のデータを保持する
INSERT OR IGNORE INTO weekly_dinner (id, recipes, assignments, updated_at)
VALUES ('default', '[]', '{}', '');
