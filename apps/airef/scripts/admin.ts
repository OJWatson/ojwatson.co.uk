import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { sha256 } from '../src/shared.ts';
import { exportBackup, restoreBackup } from '../server/backup.ts';
import { sqlRunner } from './sql.ts';

const [operation, ...args] = process.argv.slice(2);
const local = args.includes('--local') || operation === 'setup-local';
const option = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const sql = sqlRunner(local);

try {
  if (operation === 'setup-local') {
    const migration = spawnSync(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'), 'd1', 'migrations', 'apply', 'DB', '--local'], { stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
    if (migration.status !== 0) throw new Error('Local migrations failed.');
    try { await readFile('.dev.vars'); } catch { await writeFile('.dev.vars', `CAPTURE_SIGNING_KEY="${randomBytes(32).toString('base64url')}"\n`, { mode: 0o600 }); }
    await sql('INSERT OR IGNORE INTO invitations (id, code_hash, label, created_at) VALUES (?, ?, ?, ?)', ['00000000-0000-4000-8000-000000000001', await sha256('local-preview-only'), 'Local synthetic preview only', new Date().toISOString()]);
    console.log('Local database ready. Development invitation: local-preview-only\nThis invitation is seeded only into the local database. Never restore it into production.');
  } else if (operation === 'invite') {
    const label = option('--label');
    if (!label || label.length > 300) throw new Error('Supply --label with a short researcher or group label.');
    const code = 'airef_' + randomBytes(24).toString('base64url');
    const id = crypto.randomUUID();
    await sql('INSERT INTO invitations (id, code_hash, label, created_at) VALUES (?, ?, ?, ?)', [id, await sha256(code), label, new Date().toISOString()]);
    console.log(`Invitation ID: ${id}\nCode (shown once; distribute privately): ${code}`);
  } else if (operation === 'revoke') {
    const id = option('--id'); if (!id || !/^[a-f0-9-]{36}$/.test(id)) throw new Error('Supply --id with the invitation UUID.');
    const rows = await sql('UPDATE invitations SET revoked_at = ? WHERE id = ? RETURNING id', [new Date().toISOString(), id]);
    if (!rows.length) throw new Error('Invitation not found.');
    console.log('Invitation revoked. Published records were preserved.');
  } else if (operation === 'withdraw') {
    const id = option('--id'), reason = option('--reason');
    if (!id || !/^[a-f0-9-]{36}$/.test(id) || !reason || reason.length > 2000) throw new Error('Supply --id and a public --reason of at most 2000 characters.');
    const rows = await sql('UPDATE records SET status = ?, withdrawn_at = ?, withdrawal_reason = ? WHERE id = ? RETURNING id', ['withdrawn', new Date().toISOString(), reason, id]);
    if (!rows.length) throw new Error('Record not found.');
    console.log('Record withdrawn. Its citation page remains; its immutable transcript was preserved privately.');
  } else if (operation === 'backup') {
    const file = option('--out') || `data/backup-${new Date().toISOString().replaceAll(':', '-')}.json`;
    const backup = await exportBackup(sql);
    await mkdir(resolve(file, '..'), { recursive: true });
    await writeFile(file, JSON.stringify(backup), { mode: 0o600, flag: 'wx' });
    console.log(`Verified ${backup.records.length} records and wrote ${resolve(file)}. Keep this private: it includes withdrawn content and invitation hashes.`);
  } else if (operation === 'restore') {
    const file = option('--file'); if (!file) throw new Error('Supply --file with a verified AIRef backup.');
    const backup = JSON.parse(await readFile(file, 'utf8'));
    if (!local && backup.invitations?.some((invite: any) => invite.id === '00000000-0000-4000-8000-000000000001')) throw new Error('Refusing to restore the local-development invitation into a remote database.');
    console.log(JSON.stringify(await restoreBackup(backup, sql)));
  } else throw new Error('Use setup-local, invite, revoke, withdraw, backup, or restore. Administration defaults to remote; add --local for isolated development.');
} catch (error) { console.error((error as Error).message); process.exitCode = 1; }
