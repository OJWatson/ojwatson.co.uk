import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { testDatabase } from './database.ts';
import { publication } from './fixtures.ts';
import { handleRequest } from '../server/app.ts';
import { sha256, type ArchiveRecord } from '../src/shared.ts';
import { signSource } from '../server/receipts.ts';
import { exportBackup, restoreBackup } from '../server/backup.ts';

const ORIGIN = 'https://airef.example';
const CODE = 'test-invitation-with-high-entropy';
async function setup() {
  const database = testDatabase();
  const invitationId = crypto.randomUUID();
  database.sqlite.prepare('INSERT INTO invitations (id, code_hash, label, created_at) VALUES (?, ?, ?, ?)').run(invitationId, await sha256(CODE), 'Test researcher', new Date().toISOString());
  return { ...database, invitationId, env: { DB: database.db, PUBLIC_ORIGIN: ORIGIN, CAPTURE_SIGNING_KEY: 'unit-test-secret-not-for-production' } };
}
function request(path: string, payload?: unknown, code = CODE, origin = ORIGIN) {
  return new Request(`${ORIGIN}${path}`, payload === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${code}`, Origin: origin }, body: JSON.stringify(payload) });
}

test('publishes exact frozen bytes, exposes public downloads, and independently verifies SHA-256', async () => {
  const { env, sqlite } = await setup();
  const response = await handleRequest(request('/api/publish', publication()), env);
  assert.equal(response?.status, 201);
  const saved = await response!.json() as any;
  const download = await handleRequest(request(`/${saved.id}/conversation.json`), env);
  const bytes = await download!.text();
  assert.equal(createHash('sha256').update(bytes).digest('hex'), saved.sha256);
  assert.equal(download?.headers.get('X-Content-SHA256'), saved.sha256);
  const record: ArchiveRecord = JSON.parse(bytes);
  assert.equal(record.url, `${ORIGIN}/${saved.id}`);
  assert.equal(record.source.capture_attestation, 'submitter_declared');
  assert.equal(record.metadata.author_name, 'Example Researcher');
  assert.ok(!bytes.includes(CODE));
  assert.ok(!bytes.includes('idempotency_key'));
  assert.match(record.archived_at, /^\d{4}-\d{2}-\d{2}T/);
  for (const file of ['transcript.md', 'citation.bib', 'manifest.sha256']) assert.equal((await handleRequest(request(`/${saved.id}/${file}`), env))?.status, 200);
  assert.throws(() => sqlite.prepare('UPDATE records SET archive_json = ? WHERE id = ?').run('changed', saved.id), /immutable/);
  assert.throws(() => sqlite.prepare('DELETE FROM records WHERE id = ?').run(saved.id), /must_not_be_deleted/);
});

test('retries and simultaneous duplicate submissions create one record; changed payload conflicts', async () => {
  const { env, sqlite } = await setup(); const input = publication();
  const replies = await Promise.all([handleRequest(request('/api/publish', input), env), handleRequest(request('/api/publish', input), env)]);
  assert.deepEqual(replies.map(r => r?.status).sort(), [200, 201]);
  const records = await Promise.all(replies.map(r => r!.json())) as any[];
  assert.equal(records[0].id, records[1].id);
  assert.equal((sqlite.prepare('SELECT COUNT(*) AS n FROM records').get() as any).n, 1);
  input.metadata.title = 'Changed after the first publication';
  assert.equal((await handleRequest(request('/api/publish', input), env))?.status, 409);
});

test('missing and revoked invitations cannot publish; cross-origin requests are refused', async () => {
  const { env, sqlite, invitationId } = await setup();
  assert.equal((await handleRequest(request('/api/publish', publication(), ''), env))?.status, 401);
  assert.equal((await handleRequest(request('/api/publish', publication(), CODE, 'https://attacker.example'), env))?.status, 403);
  sqlite.prepare('UPDATE invitations SET revoked_at = ? WHERE id = ?').run(new Date().toISOString(), invitationId);
  assert.equal((await handleRequest(request('/api/publish', publication()), env))?.status, 401);
});

test('review, partial acknowledgement, source receipt, and size checks prevent invalid publications', async () => {
  const { env, sqlite } = await setup();
  const input = publication();
  assert.equal((await handleRequest(request('/api/publish', { ...input, reviewed: false }), env))?.status, 400);
  input.capture.completeness = 'partial';
  assert.equal((await handleRequest(request('/api/publish', input), env))?.status, 400);
  input.acknowledge_partial = true; input.capture.capture_method = 'server_fetch';
  assert.equal((await handleRequest(request('/api/publish', input), env))?.status, 400);
  input.capture.capture_method = 'json_import'; input.capture.messages[0].content = 'x'.repeat(1_048_576);
  assert.equal((await handleRequest(request('/api/publish', input), env))?.status, 413);
  assert.equal((sqlite.prepare('SELECT COUNT(*) AS n FROM records').get() as any).n, 0);
});

test('source receipts bind retrieval details while allowing user review; metadata tampering fails', async () => {
  const { env } = await setup(); const input = publication();
  input.capture.capture_method = 'server_fetch'; input.capture.source_payload_sha256 = await sha256('source bytes');
  input.capture.receipt = await signSource({ source_url: input.capture.source_url, provider: input.capture.provider, captured_at: input.capture.captured_at, importer_version: input.capture.importer_version, source_payload_sha256: input.capture.source_payload_sha256 }, env.CAPTURE_SIGNING_KEY);
  input.capture.messages[0].content = 'A reviewed, redacted prompt.';
  const saved = await (await handleRequest(request('/api/publish', input), env))!.json() as any;
  assert.ok(saved.id);
  const record = await (await handleRequest(request(`/${saved.id}/conversation.json`), env))!.json() as ArchiveRecord;
  assert.equal(record.source.capture_attestation, 'server_receipt'); assert.equal(record.source.source_payload_sha256, input.capture.source_payload_sha256);
  input.idempotency_key = crypto.randomUUID(); input.capture.source_url = input.capture.source_url.replace(/0$/, '1');
  assert.equal((await handleRequest(request('/api/publish', input), env))?.status, 400);
});

test('capacity is enforced atomically without changing existing records', async () => {
  const { env, sqlite } = await setup();
  assert.equal((await handleRequest(request('/api/publish', publication()), env))?.status, 201);
  const before = sqlite.prepare('SELECT archive_json FROM records').get();
  sqlite.exec('UPDATE archive_usage SET capacity_bytes = bytes + 1');
  assert.equal((await handleRequest(request('/api/publish', publication()), env))?.status, 507);
  assert.deepEqual(sqlite.prepare('SELECT archive_json FROM records').get(), before);
  assert.equal((sqlite.prepare('SELECT COUNT(*) AS n FROM records').get() as any).n, 1);
});

test('withdrawal leaves an escaped citation page and denies every transcript download', async () => {
  const { env, sqlite } = await setup(); const input = publication(); input.metadata.title = '<script>alert(1)</script>';
  const saved = await (await handleRequest(request('/api/publish', input), env))!.json() as any;
  sqlite.prepare('UPDATE records SET status = ?, withdrawn_at = ?, withdrawal_reason = ? WHERE id = ?').run('withdrawn', new Date().toISOString(), '<img src=x onerror=alert(1)>', saved.id);
  const page = await handleRequest(request(`/${saved.id}`), env); const html = await page!.text();
  assert.equal(page?.status, 410); assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<img src=x'));
  for (const file of ['conversation.json', 'transcript.md', 'citation.bib', 'manifest.sha256']) assert.equal((await handleRequest(request(`/${saved.id}/${file}`), env))?.status, 410);
  assert.equal((sqlite.prepare('SELECT sha256 FROM records WHERE id = ?').get(saved.id) as any).sha256, saved.sha256);
});

test('capacity reserve includes duplicated multibyte citation metadata', async () => {
  const { env, sqlite } = await setup(); const input = publication();
  input.metadata.title = '界'.repeat(300); input.metadata.author_name = '界'.repeat(160); input.metadata.description = '界'.repeat(4000);
  sqlite.exec('UPDATE archive_usage SET capacity_bytes = 26000');
  assert.equal((await handleRequest(request('/api/publish', input), env))?.status, 507);
  assert.equal((sqlite.prepare('SELECT COUNT(*) AS n FROM records').get() as any).n, 0);
});

test('backup and resumable restore preserve IDs, bytes, hashes, and withdrawals', async () => {
  const original = await setup(); const second = testDatabase();
  const saved = await (await handleRequest(request('/api/publish', publication()), original.env))!.json() as any;
  original.sqlite.prepare('UPDATE records SET status = ?, withdrawn_at = ?, withdrawal_reason = ? WHERE id = ?').run('withdrawn', new Date().toISOString(), 'Test withdrawal', saved.id);
  const backup = await exportBackup(original.sql);
  assert.deepEqual(await restoreBackup(backup, second.sql), { inserted: 1, skipped: 0 });
  assert.deepEqual(await restoreBackup(backup, second.sql), { inserted: 0, skipped: 1 });
  assert.deepEqual(second.sqlite.prepare('SELECT * FROM records').all(), original.sqlite.prepare('SELECT * FROM records').all());
  const tampered = structuredClone(backup); tampered.records[0].archive_json += ' ';
  await assert.rejects(() => restoreBackup(tampered, testDatabase().sql), /Integrity check/);
});

test('backup preflight refuses conflicting or oversized restores before writing', async () => {
  const original = await setup(); await handleRequest(request('/api/publish', publication()), original.env);
  const backup = await exportBackup(original.sql); const target = testDatabase();
  target.sqlite.exec('UPDATE archive_usage SET capacity_bytes = 1');
  await assert.rejects(() => restoreBackup(backup, target.sql), /capacity limit/);
  assert.equal((target.sqlite.prepare('SELECT COUNT(*) AS n FROM invitations').get() as any).n, 0);
});

test('restore preflight detects invitation-code and publication-key collisions before writes', async () => {
  const original = await setup();
  await handleRequest(request('/api/publish', publication()), original.env);
  const backup = await exportBackup(original.sql);
  const otherInvitation = await setup();
  await assert.rejects(() => restoreBackup(backup, otherInvitation.sql), /invitation code conflicts/);
  assert.equal((otherInvitation.sqlite.prepare('SELECT COUNT(*) AS n FROM records').get() as any).n, 0);
  const changedId = structuredClone(backup), row = changedId.records[0];
  const record = JSON.parse(row.archive_json); row.id = crypto.randomUUID(); record.id = row.id; record.url = `${ORIGIN}/${row.id}`;
  row.archive_json = JSON.stringify(record); row.sha256 = await sha256(row.archive_json); row.bytes = new TextEncoder().encode(row.archive_json).byteLength;
  await assert.rejects(() => restoreBackup(changedId, original.sql), /publication key conflicts/);
  assert.equal((original.sqlite.prepare('SELECT COUNT(*) AS n FROM records').get() as any).n, 1);
  const duplicate = structuredClone(backup); duplicate.invitations.push(duplicate.invitations[0]);
  await assert.rejects(() => restoreBackup(duplicate, testDatabase().sql), /duplicate invitation/);
});
