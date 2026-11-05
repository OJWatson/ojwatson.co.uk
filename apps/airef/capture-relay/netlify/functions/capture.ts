import { timingSafeEqual, createHash } from 'node:crypto';
import { boundedText, retrieveSource } from '../../../server/capture.ts';
import { shareSource } from '../../../src/shared.ts';
import { HttpError } from '../../../server/types.ts';

function reply(body: string, status: number, headers: HeadersInit = {}) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}

// Netlify's web-standard Functions API. No storage, provider login, proxy
// vendor, AI API, browser automation, or publication capability is involved.
export async function handleCapture(request: Request, secret: string | undefined, fetcher: typeof fetch = fetch) {
  if (!secret || secret.length < 32) return reply('Capture service is not configured.', 503);
  const hash = (value: string) => createHash('sha256').update(value).digest();
  if (!timingSafeEqual(hash(request.headers.get('Authorization') || ''), hash(`Bearer ${secret}`))) return reply('Not found.', 404);
  if (request.method !== 'POST') return reply('Use POST.', 405, { Allow: 'POST' });
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply('Send JSON.', 415);
  let source: ReturnType<typeof shareSource>;
  try {
    const input = JSON.parse(await boundedText(new Response(request.body), 2000));
    if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 1 || typeof input.url !== 'string') throw new Error('Invalid request.');
    source = shareSource(input.url);
  } catch { return reply('Send one supported public share URL.', 400); }
  try {
    const capture = await retrieveSource(source.url, fetcher);
    return reply(capture.text, 200, { 'X-AIRef-Source': capture.source_url });
  } catch (error) {
    // Never log source text, credentials, or URLs in exceptions.
    return reply('The public share page could not be retrieved.', error instanceof HttpError && error.status === 413 ? 413 : 422);
  }
}

export default async (request: Request) => handleCapture(request, process.env.AIREF_RELAY_SECRET);
