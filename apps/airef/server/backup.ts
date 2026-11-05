import { z } from 'zod';
import { CaptureSchema, MetadataSchema, MAX_RECORD_BYTES, sha256, type ArchiveRecord } from '../src/shared.ts';
import type { SqlRunner } from '../scripts/sql.ts';
import type { RecordRow } from './types.ts';

const InvitationSchema = z.object({ id: z.string().uuid(), code_hash: z.string().regex(/^[a-f0-9]{64}$/), label: z.string().max(300), created_at: z.string().datetime(), revoked_at: z.string().datetime().nullable() }).strict();
const RowSchema = z.object({
  id: z.string().uuid(), archived_at: z.string().datetime(), title: z.string().max(300), author_name: z.string().max(160), description: z.string().max(4000), provider: z.enum(['chatgpt', 'claude']),
  archive_json: z.string(), sha256: z.string().regex(/^[a-f0-9]{64}$/), bytes: z.number().int().positive().max(MAX_RECORD_BYTES), invitation_id: z.string().uuid(), idempotency_key: z.string().uuid(), request_hash: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.enum(['published', 'withdrawn']), withdrawn_at: z.string().datetime().nullable(), withdrawal_reason: z.string().max(2000).nullable(),
}).strict();
const BackupSchema = z.object({ format: z.literal('airef-backup-v1'), exported_at: z.string().datetime(), invitations: z.array(InvitationSchema), records: z.array(RowSchema) }).strict();
export type Backup = z.infer<typeof BackupSchema>;

export async function validateBackup(value: unknown): Promise<Backup> {
  const backup = BackupSchema.parse(value);
  const invitations = new Set(backup.invitations.map(invite => invite.id));
  if (invitations.size !== backup.invitations.length || new Set(backup.invitations.map(invite => invite.code_hash)).size !== backup.invitations.length) throw new Error('Backup contains duplicate invitation IDs or code hashes.');
  const ids = new Set<string>(), keys = new Set<string>();
  for (const row of backup.records) {
    if (ids.has(row.id) || keys.has(`${row.invitation_id}:${row.idempotency_key}`)) throw new Error('Backup contains duplicate record IDs or publication keys.');
    ids.add(row.id); keys.add(`${row.invitation_id}:${row.idempotency_key}`);
    if (!invitations.has(row.invitation_id)) throw new Error('Backup record refers to a missing invitation.');
    if (row.bytes !== new TextEncoder().encode(row.archive_json).byteLength || await sha256(row.archive_json) !== row.sha256) throw new Error(`Integrity check failed for backup record ${row.id}.`);
    const record: ArchiveRecord = JSON.parse(row.archive_json);
    MetadataSchema.parse(record.metadata);
    CaptureSchema.parse({ schema_version: record.schema_version, source_url: record.source.url, provider: record.source.provider, title: record.metadata.title, captured_at: record.source.captured_at,
      capture_method: record.source.capture_method, importer_version: record.source.importer_version, completeness: record.source.completeness, omissions: record.source.omissions, messages: record.messages });
    if (record.id !== row.id || record.archived_at !== row.archived_at || record.metadata.title !== row.title || record.metadata.author_name !== row.author_name || record.metadata.description !== row.description || record.source.provider !== row.provider) throw new Error(`Metadata mismatch for backup record ${row.id}.`);
    const url = new URL(record.url);
    if (!['https:', 'http:'].includes(url.protocol) || url.pathname !== `/${row.id}`) throw new Error('Invalid archived record URL.');
  }
  return backup;
}

export async function exportBackup(sql: SqlRunner): Promise<Backup> {
  const [boundary] = await sql<{ boundary: number | null }>('SELECT MAX(rowid) AS boundary FROM records');
  const records: RecordRow[] = [];
  let cursor = 0;
  while (boundary?.boundary && cursor < boundary.boundary) {
    const rows = await sql<RecordRow & { row_number: number }>('SELECT rowid AS row_number, * FROM records WHERE rowid > ? AND rowid <= ? ORDER BY rowid LIMIT 1', [cursor, boundary.boundary]);
    if (!rows.length) break;
    for (const { row_number, ...record } of rows) { records.push(record); cursor = row_number; }
  }
  const invitations = await sql<z.infer<typeof InvitationSchema>>('SELECT id, code_hash, label, created_at, revoked_at FROM invitations ORDER BY id');
  return validateBackup({ format: 'airef-backup-v1', exported_at: new Date().toISOString(), invitations, records });
}

export async function restoreBackup(value: unknown, sql: SqlRunner): Promise<{ inserted: number; skipped: number }> {
  const backup = await validateBackup(value); // Validate the whole export before writing anything.
  const pending: Backup['records'] = [];
  for (const invite of backup.invitations) {
    const [existing] = await sql<{ code_hash: string }>('SELECT code_hash FROM invitations WHERE id = ?', [invite.id]);
    if (existing && existing.code_hash !== invite.code_hash) throw new Error('An invitation ID conflicts with the target database. Nothing was restored.');
    const [sameCode] = await sql<{ id: string }>('SELECT id FROM invitations WHERE code_hash = ?', [invite.code_hash]);
    if (sameCode && sameCode.id !== invite.id) throw new Error('An invitation code conflicts with the target database. Nothing was restored.');
  }
  for (const row of backup.records) {
    const [existing] = await sql<RecordRow>('SELECT * FROM records WHERE id = ?', [row.id]);
    if (existing && (existing.archive_json !== row.archive_json || existing.sha256 !== row.sha256)) throw new Error(`Record ${row.id} conflicts with the target database. Nothing was restored.`);
    const [sameKey] = await sql<{ id: string }>('SELECT id FROM records WHERE invitation_id = ? AND idempotency_key = ?', [row.invitation_id, row.idempotency_key]);
    if (sameKey && sameKey.id !== row.id) throw new Error('A publication key conflicts with the target database. Nothing was restored.');
    if (!existing) pending.push(row);
  }
  const [usage] = await sql<{ bytes: number; capacity_bytes: number }>('SELECT bytes, capacity_bytes FROM archive_usage WHERE singleton = 1');
  if (!usage || usage.bytes + pending.reduce((total, row) => total + row.bytes + 4096 + new TextEncoder().encode(row.title + row.author_name + row.description).byteLength, 0) > usage.capacity_bytes) throw new Error('The backup does not fit within this archive’s capacity limit. Nothing was restored.');
  for (const invite of backup.invitations) {
    await sql('INSERT INTO invitations (id, code_hash, label, created_at, revoked_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET revoked_at = COALESCE(invitations.revoked_at, excluded.revoked_at)', Object.values(invite));
  }
  for (const row of pending) {
    const columns = Object.keys(row);
    await sql(`INSERT INTO records (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, Object.values(row));
  }
  // Restoring an old backup can never make a withdrawn record public again.
  for (const row of backup.records.filter(row => row.status === 'withdrawn')) await sql('UPDATE records SET status = ?, withdrawn_at = ?, withdrawal_reason = ? WHERE id = ?', ['withdrawn', row.withdrawn_at, row.withdrawal_reason, row.id]);
  return { inserted: pending.length, skipped: backup.records.length - pending.length };
}
