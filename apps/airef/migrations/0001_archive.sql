PRAGMA foreign_keys = ON;

CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE archive_usage (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  bytes INTEGER NOT NULL DEFAULT 0 CHECK (bytes >= 0),
  capacity_bytes INTEGER NOT NULL DEFAULT 350000000
);
INSERT INTO archive_usage (singleton) VALUES (1);

CREATE TABLE records (
  id TEXT PRIMARY KEY,
  archived_at TEXT NOT NULL,
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  description TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('chatgpt', 'claude')),
  archive_json TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes > 0 AND bytes <= 1048576),
  invitation_id TEXT NOT NULL REFERENCES invitations(id),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'withdrawn')),
  withdrawn_at TEXT,
  withdrawal_reason TEXT,
  UNIQUE (invitation_id, idempotency_key)
);

CREATE TRIGGER records_capacity BEFORE INSERT ON records
BEGIN
  SELECT CASE WHEN (SELECT bytes + NEW.bytes + 4096 > capacity_bytes FROM archive_usage WHERE singleton = 1)
    THEN RAISE(ABORT, 'archive_capacity_reached') END;
END;

CREATE TRIGGER records_accounting AFTER INSERT ON records
BEGIN
  UPDATE archive_usage SET bytes = bytes + NEW.bytes + 4096 WHERE singleton = 1;
END;

CREATE TRIGGER records_immutable BEFORE UPDATE OF id, archived_at, title, author_name, description,
  provider, archive_json, sha256, bytes, invitation_id, idempotency_key, request_hash ON records
BEGIN
  SELECT RAISE(ABORT, 'published_record_is_immutable');
END;

CREATE TRIGGER records_no_delete BEFORE DELETE ON records
BEGIN
  SELECT RAISE(ABORT, 'published_records_must_not_be_deleted');
END;

CREATE TABLE request_limits (
  invitation_id TEXT NOT NULL REFERENCES invitations(id),
  window TEXT NOT NULL,
  requests INTEGER NOT NULL,
  PRIMARY KEY (invitation_id, window)
);
