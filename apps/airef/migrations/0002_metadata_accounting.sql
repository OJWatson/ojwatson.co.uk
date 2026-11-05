-- Account for metadata stored alongside the archival JSON, including UTF-8 text.
-- Existing JSON and identifiers remain frozen; only the storage counter changes.
DROP TRIGGER records_capacity;
DROP TRIGGER records_accounting;

UPDATE archive_usage SET bytes = (
  SELECT COALESCE(SUM(bytes + 4096 + length(CAST(title AS BLOB))
    + length(CAST(author_name AS BLOB)) + length(CAST(description AS BLOB))), 0)
  FROM records
) WHERE singleton = 1;

CREATE TRIGGER records_capacity BEFORE INSERT ON records
BEGIN
  SELECT CASE WHEN (SELECT bytes + NEW.bytes + 4096
    + length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.author_name AS BLOB))
    + length(CAST(NEW.description AS BLOB)) > capacity_bytes
    FROM archive_usage WHERE singleton = 1)
    THEN RAISE(ABORT, 'archive_capacity_reached') END;
END;

CREATE TRIGGER records_accounting AFTER INSERT ON records
BEGIN
  UPDATE archive_usage SET bytes = bytes + NEW.bytes + 4096
    + length(CAST(NEW.title AS BLOB)) + length(CAST(NEW.author_name AS BLOB))
    + length(CAST(NEW.description AS BLOB)) WHERE singleton = 1;
END;
