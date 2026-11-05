import { z } from 'zod';
import { IMPORTER_VERSION, MAX_RECORD_BYTES, PublishSchema, canonicalJson, sha256, markdown, bibtex, type ArchiveRecord } from '../src/shared.ts';
import { boundedText } from './capture.ts';
import { retrieveWithRelay } from './capture-relay.ts';
import { signSource, verifyCapture } from './receipts.ts';
import { HttpError, type Env, type RecordRow } from './types.ts';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
export const securityHeaders: Record<string, string> = {
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
export function safeResponse(body: BodyInit | null, status = 200, headers: HeadersInit = {}): Response {
  return new Response(body, { status, headers: { ...securityHeaders, 'Cache-Control': 'no-store', ...headers } });
}
function json(value: unknown, status = 200): Response { return safeResponse(JSON.stringify(value), status, { 'Content-Type': 'application/json; charset=utf-8' }); }
export function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!); }

async function body(request: Request, max = MAX_RECORD_BYTES * 2): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'content_type', 'Send application/json.');
  try { return JSON.parse(await boundedText(new Response(request.body, { headers: request.headers }), max)); }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'invalid_json', 'The request is not valid JSON.'); }
}

function requireSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'origin', 'Submit from this AIRef website.');
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new HttpError(403, 'origin', 'Cross-site submissions are not accepted.');
}

async function invitation(request: Request, env: Env): Promise<{ id: string }> {
  const code = request.headers.get('authorization')?.match(/^Bearer (\S{12,200})$/)?.[1];
  if (!code) throw new HttpError(401, 'invitation', 'Enter your invitation code.');
  const invite = await env.DB.prepare('SELECT id FROM invitations WHERE code_hash = ? AND revoked_at IS NULL').bind(await sha256(code)).first<{ id: string }>();
  if (!invite) throw new HttpError(401, 'invitation', 'This invitation code is invalid or has been revoked.');
  return invite;
}

async function rateLimit(id: string, env: Env): Promise<void> {
  const window = new Date().toISOString().slice(0, 13);
  const count = await env.DB.prepare('INSERT INTO request_limits (invitation_id, window, requests) VALUES (?, ?, 1) ON CONFLICT(invitation_id, window) DO UPDATE SET requests = requests + 1 RETURNING requests').bind(id, window).first<{ requests: number }>();
  if ((count?.requests || 0) > 30) throw new HttpError(429, 'rate_limit', 'This invitation has reached its hourly submission limit. Try again next hour.');
  await env.DB.prepare('DELETE FROM request_limits WHERE invitation_id = ? AND window < ?').bind(id, window).run();
}

function publicationResult(row: Pick<RecordRow, 'id' | 'sha256' | 'archived_at'>, origin: string) {
  return { id: row.id, url: `${origin}/${row.id}`, sha256: row.sha256, archived_at: row.archived_at };
}

async function publish(request: Request, env: Env): Promise<Response> {
  const invite = await invitation(request, env);
  const input = PublishSchema.parse(await body(request));
  const requestHash = await sha256(canonicalJson(input));
  const existing = await env.DB.prepare('SELECT id, sha256, archived_at, request_hash FROM records WHERE invitation_id = ? AND idempotency_key = ?').bind(invite.id, input.idempotency_key).first<RecordRow>();
  if (existing) {
    if (existing.request_hash !== requestHash) throw new HttpError(409, 'publication_conflict', 'This publication attempt already saved different content. Open the existing record before starting a new publication.');
    return json(publicationResult(existing, env.PUBLIC_ORIGIN));
  }
  await rateLimit(invite.id, env);
  if (input.capture.completeness !== 'shared_snapshot' && !input.acknowledge_partial) throw new HttpError(400, 'incomplete_capture', 'Review and acknowledge the capture limitations before publishing.');
  const verified = await verifyCapture(input.capture, env.CAPTURE_SIGNING_KEY);
  const record: ArchiveRecord = {
    schema_version: '1.0', id: crypto.randomUUID(), url: '', archived_at: new Date().toISOString(), metadata: input.metadata,
    source: { url: input.capture.source_url, provider: input.capture.provider, captured_at: input.capture.captured_at,
      capture_method: input.capture.capture_method, importer_version: input.capture.importer_version, capture_attestation: verified.attestation,
      source_payload_sha256: input.capture.source_payload_sha256 || null, completeness: input.capture.completeness, omissions: input.capture.omissions }, messages: input.capture.messages,
  };
  record.url = `${env.PUBLIC_ORIGIN}/${record.id}`;
  const archiveJson = canonicalJson(record);
  const bytes = new TextEncoder().encode(archiveJson).byteLength;
  if (bytes > MAX_RECORD_BYTES) throw new HttpError(413, 'too_large', 'The reviewed record exceeds the 1 MiB archive limit. Remove messages or shorten the transcript.');
  const digest = await sha256(archiveJson);
  try {
    await env.DB.prepare('INSERT INTO records (id, archived_at, title, author_name, description, provider, archive_json, sha256, bytes, invitation_id, idempotency_key, request_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(record.id, record.archived_at, record.metadata.title, record.metadata.author_name, record.metadata.description, record.source.provider, archiveJson, digest, bytes, invite.id, input.idempotency_key, requestHash).run();
  } catch (error) {
    const message = String(error);
    if (/archive_capacity_reached|SQLITE_FULL|database.*(?:full|size limit)/i.test(message)) throw new HttpError(507, 'capacity', 'The archive is full and is not accepting new records. Existing records are preserved.');
    if (/UNIQUE/.test(message)) {
      const raced = await env.DB.prepare('SELECT id, sha256, archived_at, request_hash FROM records WHERE invitation_id = ? AND idempotency_key = ?').bind(invite.id, input.idempotency_key).first<RecordRow>();
      if (raced?.request_hash === requestHash) return json(publicationResult(raced, env.PUBLIC_ORIGIN));
      throw new HttpError(409, 'publication_conflict', 'This attempt has already been published with different content.');
    }
    throw error;
  }
  return json(publicationResult({ id: record.id, sha256: digest, archived_at: record.archived_at }, env.PUBLIC_ORIGIN), 201);
}

function landing(row: Omit<RecordRow, 'archive_json'>, origin: string): string {
  const title = escapeHtml(row.title);
  const description = escapeHtml(row.description || 'A frozen AI conversation archive.');
  const url = `${origin}/${row.id}`;
  const withdrawn = row.status === 'withdrawn';
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · AIRef</title><meta name="description" content="${description}"><meta name="citation_title" content="${title}"><meta name="citation_author" content="${escapeHtml(row.author_name)}"><meta name="citation_publication_date" content="${row.archived_at.slice(0, 10)}"><meta name="citation_public_url" content="${escapeHtml(url)}"><link rel="canonical" href="${escapeHtml(url)}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${escapeHtml(url)}"><link rel="stylesheet" href="/style.css"><script type="module" src="/record.js"></script></head><body><header class="site-header"><a class="wordmark" href="/">AIRef<span class="wordmark-dot">.</span></a><span class="header-note">Conversations, preserved.</span></header><main class="record-layout"><a class="back-link" href="/">← Archive a conversation</a><div class="eyebrow">${withdrawn ? 'WITHDRAWN RECORD' : 'FROZEN CONVERSATION'}</div><h1 class="record-title">${title}</h1><p class="record-byline">${escapeHtml(row.author_name)} <span>· Archived ${row.archived_at.slice(0, 10)}</span></p>${withdrawn ? `<section class="notice warning"><h2>This record has been withdrawn</h2><p>${escapeHtml(row.withdrawal_reason || 'Withdrawn by the archive administrator.')}</p><p>The identifier and citation remain available. Transcript downloads have been removed from public access.</p><code>${escapeHtml(url)}</code></section>` : '<div id="record-content" aria-live="polite"><p class="loading">Loading the frozen transcript…</p></div>'}<noscript><p>Enable JavaScript to read the transcript, or <a href="${row.id}/conversation.json">download the JSON record</a>.</p></noscript></main><footer class="site-footer"><span>AIRef · A reference that stays with the conversation.</span><a href="/about.html">About this archive</a></footer></body></html>`;
}

async function publicRecord(request: Request, env: Env, id: string, format?: string): Promise<Response> {
  const fields = format ? '*' : 'id, archived_at, title, author_name, description, provider, sha256, status, withdrawn_at, withdrawal_reason';
  const row = await env.DB.prepare(`SELECT ${fields} FROM records WHERE id = ?`).bind(id).first<RecordRow>();
  if (!row) throw new HttpError(404, 'not_found', 'This archive record does not exist.');
  if (!format) return safeResponse(landing(row, env.PUBLIC_ORIGIN), row.status === 'withdrawn' ? 410 : 200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  if (row.status === 'withdrawn') throw new HttpError(410, 'withdrawn', 'This record has been withdrawn. Its citation page remains available.');
  const headers: Record<string, string> = { 'X-AIRef-JSON-SHA256': row.sha256, 'Cache-Control': 'no-cache', 'ETag': `"${row.sha256}-${format}"` };
  if (format === 'conversation.json') headers['X-Content-SHA256'] = row.sha256;
  if (request.headers.get('if-none-match') === headers.ETag) return safeResponse(null, 304, headers);
  let content: string, type: string;
  if (format === 'conversation.json') { content = row.archive_json; type = 'application/json'; }
  else if (format === 'manifest.sha256') { content = `${row.sha256}  conversation.json\n`; type = 'text/plain'; }
  else {
    const record: ArchiveRecord = JSON.parse(row.archive_json);
    content = format === 'transcript.md' ? markdown(record) : bibtex(record);
    type = format === 'transcript.md' ? 'text/markdown' : 'application/x-bibtex';
  }
  return safeResponse(content, 200, { ...headers, 'Content-Type': `${type}; charset=utf-8`, 'Content-Disposition': `attachment; filename="${format}"` });
}

export async function handleRequest(request: Request, env: Env, fetcher: typeof fetch = fetch): Promise<Response | null> {
  const path = new URL(request.url).pathname.replace(/\/$/, '') || '/';
  try {
    if (request.method === 'POST') {
      requireSameOrigin(request);
      if (path === '/api/import') {
        const invite = await invitation(request, env);
        await rateLimit(invite.id, env);
        const input = z.object({ url: z.string().max(500) }).strict().parse(await body(request, 2000));
        if (!env.CAPTURE_SIGNING_KEY) throw new HttpError(503, 'configuration', 'Server capture is not configured. You can import a browser-helper JSON file instead.');
        const retrieved = await retrieveWithRelay(input.url, env, fetcher);
        const source = { source_url: retrieved.source_url, provider: retrieved.provider, captured_at: retrieved.captured_at, importer_version: IMPORTER_VERSION, source_payload_sha256: await sha256(retrieved.text) };
        const receipt = await signSource(source, env.CAPTURE_SIGNING_KEY);
        return safeResponse(retrieved.text, 200, { 'Content-Type': 'text/plain; charset=utf-8', 'X-AIRef-Source': source.source_url, 'X-AIRef-Captured-At': source.captured_at, 'X-AIRef-Source-SHA256': source.source_payload_sha256, 'X-AIRef-Receipt': receipt });
      }
      if (path === '/api/publish') return await publish(request, env);
      return json({ error: 'not_found', message: 'Unknown endpoint.' }, 404);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'method', message: 'Method not allowed.' }, 405);
    const match = path.match(new RegExp(`^/(${UUID})(?:/(conversation\\.json|transcript\\.md|citation\\.bib|manifest\\.sha256))?$`, 'i'));
    if (match) {
      const response = await publicRecord(request, env, match[1].toLowerCase(), match[2]);
      return request.method === 'HEAD' ? new Response(null, response) : response;
    }
    if (path.startsWith('/api/')) return json({ error: 'not_found', message: 'Unknown endpoint.' }, 404);
    return null;
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.code, message: error.message }, error.status);
    if (error instanceof z.ZodError) return json({ error: 'validation', message: error.issues.map(issue => `${issue.path.join('.') || 'Request'}: ${issue.message}`).slice(0, 5).join(' ') }, 400);
    if (error instanceof TypeError && /URL|share/i.test(error.message)) return json({ error: 'source_url', message: error.message }, 400);
    // Do not log source content, invitation codes, or SQL errors containing bound data.
    return json({ error: 'unavailable', message: 'The operation could not finish. Keep your draft and retry. A repeated publication request will not create a second record.' }, 503);
  }
}
