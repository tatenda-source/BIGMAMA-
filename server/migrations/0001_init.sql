-- BIGMAMA$ D1 schema — ciphertext-only storage.
-- The server NEVER sees plaintext. It stores whatever blob the client sends
-- after client-side AES-GCM encryption (see src/lib/crypto.js).

CREATE TABLE IF NOT EXISTS reports (
  case_id        TEXT PRIMARY KEY,
  ciphertext_b64 TEXT NOT NULL,
  iv_b64         TEXT NOT NULL,
  salt_b64       TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'received',
  confirmed_at   INTEGER
);

CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
