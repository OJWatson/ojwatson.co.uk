import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export type SqlRunner = <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>;

let cachedToken: string | undefined;
export async function cloudflareToken(): Promise<string> {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  if (cachedToken) return cachedToken;
  // Use the official credential interface, including OS-keyring storage. Never print its output.
  const result = spawnSync(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'), 'auth', 'token', '--json'], { encoding: 'utf8', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  if (result.status === 0) try {
    const value = JSON.parse(result.stdout);
    if (['oauth', 'api_token'].includes(value.type) && typeof value.token === 'string') { cachedToken = value.token; return value.token; }
  } catch { /* Missing or unsupported credentials fail closed below. */ }
  throw new Error('Cloudflare CLI authentication is missing. Run npx wrangler login in your terminal, or provide CLOUDFLARE_API_TOKEN privately. Do not paste a token into chat.');
}

export async function cfApi<T = any>(path: string, init: RequestInit = {}): Promise<{ result: T; result_info?: { total_pages?: number; page?: number } }> {
  const token = await cloudflareToken();
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers }, signal: AbortSignal.timeout(30000),
  });
  const data = await response.json() as any;
  if (!response.ok || !data.success) throw new Error(`Cloudflare API ${init.method || 'GET'} ${path.split('?')[0]} failed (HTTP ${response.status}, codes ${(data.errors || []).map((item: any) => item.code).join(', ') || 'unknown'}). No token or request data was logged.`);
  return data;
}

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') { if (!Number.isFinite(value)) throw new Error('Invalid SQL number.'); return String(value); }
  return "'" + String(value).replaceAll("'", "''") + "'";
}

export function sqlRunner(local: boolean): SqlRunner {
  if (!local) {
    const account = process.env.CLOUDFLARE_ACCOUNT_ID, database = process.env.AIREF_DATABASE_ID;
    if (!account || !database) throw new Error('Remote administration needs CLOUDFLARE_ACCOUNT_ID and AIREF_DATABASE_ID. Use --local for isolated development.');
    return async <T>(sql: string, params: unknown[] = []) => {
      const data = await cfApi<{ results: T[]; success: boolean }[]>(`/accounts/${account}/d1/database/${database}/query`, { method: 'POST', body: JSON.stringify({ sql, params }) });
      if (data.result.some(item => !item.success)) throw new Error('The remote SQL operation failed.');
      return data.result.flatMap(item => item.results || []);
    };
  }
  return async <T>(sql: string, params: unknown[] = []) => {
    // Substitution is used only for local Wrangler's SQL-file interface, never a shell.
    let index = 0;
    const statement = sql.replace(/\?/g, () => sqlLiteral(params[index++]));
    if (index !== params.length) throw new Error('SQL parameter count mismatch.');
    const directory = await mkdtemp(join(tmpdir(), 'airef-sql-'));
    const path = join(directory, 'query.sql');
    try {
      await writeFile(path, statement, { mode: 0o600 });
      const result = spawnSync(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'), 'd1', 'execute', 'DB', '--local', '--file', path, '--json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
      if (result.status !== 0) throw new Error('Local database operation failed. Its SQL and data were not logged.');
      const data = JSON.parse(result.stdout) as { results: T[]; success: boolean }[];
      return data.flatMap(item => item.results || []);
    } finally { await rm(directory, { recursive: true, force: true }); }
  };
}
