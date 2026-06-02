/** DDL run once on database open. Safe to re-run (IF NOT EXISTS). */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS dictionary_entry (
  lemma            TEXT NOT NULL,
  pos              TEXT NOT NULL,
  definitions      TEXT NOT NULL,  -- JSON string[]
  examples         TEXT,           -- JSON string[], nullable
  frequency_rank   INTEGER,
  PRIMARY KEY (lemma, pos)
);

CREATE TABLE IF NOT EXISTS user_word_state (
  lemma      TEXT    NOT NULL,
  pos        TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'NEW',
  first_seen INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lemma, pos)
);

CREATE TABLE IF NOT EXISTS text_doc (
  id                 TEXT    PRIMARY KEY,
  title              TEXT    NOT NULL,
  source_type        TEXT    NOT NULL,  -- 'paste' | 'file'
  content            TEXT    NOT NULL,
  created_at         INTEGER NOT NULL,
  last_read_position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS token_cache (
  text_id             TEXT NOT NULL,
  page_offset         INTEGER NOT NULL,
  serialized_analysis TEXT NOT NULL,
  PRIMARY KEY (text_id, page_offset),
  FOREIGN KEY (text_id) REFERENCES text_doc(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_card (
  lemma            TEXT    NOT NULL,
  pos              TEXT    NOT NULL,
  example_sentence TEXT    NOT NULL,
  stability        REAL    NOT NULL DEFAULT 0,
  difficulty       REAL    NOT NULL DEFAULT 0,
  due_date         INTEGER NOT NULL,
  reps             INTEGER NOT NULL DEFAULT 0,
  lapses           INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lemma, pos)
);

CREATE TABLE IF NOT EXISTS review_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_lemma  TEXT    NOT NULL,
  card_pos    TEXT    NOT NULL,
  rating      INTEGER NOT NULL,
  reviewed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_word_state_status ON user_word_state(status);
CREATE INDEX IF NOT EXISTS idx_review_card_due_date   ON review_card(due_date);
`;
