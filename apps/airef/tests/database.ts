import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import type { Database, Statement } from '../server/types.ts';
import type { SqlRunner } from '../scripts/sql.ts';

export function testDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  const migrations = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(migrations).filter(file => file.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(file, migrations), 'utf8'));
  function prepare(sql: string): Statement {
    let values: any[] = [];
    return {
      bind(...params: any[]) { values = params; return this; },
      async first<T>(column?: string) { const row = sqlite.prepare(sql).get(...values) as any; return (row ? column ? row[column] : row : null) as T | null; },
      async all<T>() { return { results: sqlite.prepare(sql).all(...values) as T[], success: true }; },
      async run() { const result = sqlite.prepare(sql).run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
    };
  }
  const db: Database = { prepare, async batch(statements) { sqlite.exec('BEGIN'); try { const result = []; for (const statement of statements) result.push(await statement.run()); sqlite.exec('COMMIT'); return result; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } };
  const sql: SqlRunner = async <T>(query: string, values: any[] = []) => sqlite.prepare(query).all(...values) as T[];
  return { db, sqlite, sql };
}
