import { CaptureSchema, MAX_RECORD_BYTES, shareSource } from '../src/shared.ts';
import { ARCHIVE_ORIGIN, ARCHIVE_ORIGINS } from './bridge-config.ts';

export const HANDOFF_TTL = 15 * 60 * 1000;
type Entry = { expires: number; created: number; origin: string; capture?: unknown; tabId?: number };
interface BridgeIO {
  read(): Promise<Record<string, Entry>>;
  write(key: string, value: Entry): Promise<void>;
  remove(keys: string[]): Promise<void>;
  open(url: string): Promise<number>;
  returnTo(tabId: number | undefined, origin: string, url: string): Promise<void>;
  now(): number;
  token(): string;
}

// The caller serializes operations so consume is one-use even for concurrent requests.
export function createHandoff(io: BridgeIO) {
  async function entries() {
    const all = await io.read();
    const expired = Object.keys(all).filter(key => all[key].expires <= io.now());
    if (expired.length) await io.remove(expired);
    for (const key of expired) delete all[key];
    return all;
  }
  async function put(key: string, value: Entry, prefix: string, limit: number) {
    const all = await entries();
    const existing = Object.keys(all).filter(k => k.startsWith(prefix)).sort((a,b) => all[a].created - all[b].created);
    const evict = existing.slice(0, Math.max(0, existing.length - limit + 1));
    if (evict.length) await io.remove(evict);
    await io.write(key, value);
  }
  return {
    async external(message: any, senderUrl: string, tabId?: number) {
      const sender = new URL(senderUrl);
      if (!ARCHIVE_ORIGINS.includes(sender.origin) || sender.pathname !== '/') throw new Error('Only the AIRef archive form can use this helper.');
      if (message?.type === 'airef-ping') return { ok: true, version: '0.2.0' };
      if (message?.type === 'airef-open-share') {
        const source = shareSource(String(message.url || ''));
        const sourceTab = await io.open(source.url);
        await put(`pending:${sourceTab}`, { origin: sender.origin, tabId, created: io.now(), expires: io.now() + HANDOFF_TTL }, 'pending:', 20);
        return { ok: true };
      }
      if (message?.type === 'airef-consume-capture' && typeof message.token === 'string' && /^[a-f0-9]{64}$/.test(message.token)) {
        const key = `capture:${message.token}`;
        const entry = (await entries())[key];
        if (!entry?.capture || entry.origin !== sender.origin) throw new Error('This capture has expired or was already opened. Capture the share page again.');
        await io.remove([key]);
        return { ok: true, capture: entry.capture };
      }
      throw new Error('Unsupported helper request.');
    },
    async review(value: unknown, sourceTab: number) {
      const capture = CaptureSchema.parse(value);
      if (capture.capture_method !== 'browser_helper' || new TextEncoder().encode(JSON.stringify(capture)).byteLength > MAX_RECORD_BYTES) throw new Error('This capture is too large or invalid.');
      const pendingKey = `pending:${sourceTab}`;
      const pending = (await entries())[pendingKey];
      const origin = pending?.origin || ARCHIVE_ORIGIN;
      const token = io.token();
      await put(`capture:${token}`, { origin, capture, created: io.now(), expires: io.now() + HANDOFF_TTL }, 'capture:', 5);
      await io.returnTo(pending?.tabId, origin, `${origin}/#airef-capture=${token}`);
      await io.remove([pendingKey]);
      return { ok: true };
    },
  };
}
