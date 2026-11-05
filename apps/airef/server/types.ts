export interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta?: Record<string, unknown> }>;
  run(): Promise<{ success: boolean; meta?: { changes?: number } }>;
}
export interface Database { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<unknown[]> }
export interface Env { DB: Database; PUBLIC_ORIGIN: string; CAPTURE_SIGNING_KEY?: string; CAPTURE_RELAY_URL?: string; CAPTURE_RELAY_SECRET?: string }
export class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}
export interface RecordRow {
  id: string; archived_at: string; title: string; author_name: string; description: string;
  provider: string; archive_json: string; sha256: string; bytes: number; invitation_id: string;
  idempotency_key: string; request_hash: string; status: 'published' | 'withdrawn'; withdrawn_at: string | null; withdrawal_reason: string | null;
}
