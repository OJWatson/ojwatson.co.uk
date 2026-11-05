import { boundedText, retrieveSource } from './capture.ts';
import { shareSource } from '../src/shared.ts';
import { HttpError } from './types.ts';

export interface CaptureRelayConfig { CAPTURE_RELAY_URL?: string; CAPTURE_RELAY_SECRET?: string }

// Optional and disabled by default. Only an operator-configured HTTPS endpoint
// receives the public share URL. Invitation codes and browser cookies stay here.
export async function retrieveWithRelay(value: string, config: CaptureRelayConfig, fetcher: typeof fetch = fetch) {
  let source: ReturnType<typeof shareSource>;
  try { source = shareSource(value); }
  catch (error) { throw new HttpError(400, 'source_url', (error as Error).message); }
  try { return await retrieveSource(source.url, fetcher); }
  catch (error) {
    if (!(error instanceof HttpError) || error.code !== 'browser_capture_required' || !config.CAPTURE_RELAY_URL) throw error;
  }
  const endpoint = new URL(config.CAPTURE_RELAY_URL!);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.port || endpoint.search || endpoint.hash || !config.CAPTURE_RELAY_SECRET || config.CAPTURE_RELAY_SECRET.length < 32) {
    throw new HttpError(503, 'configuration', 'The optional capture service is not configured correctly. Use the browser helper.');
  }
  const response = await fetcher(endpoint.toString(), {
    method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.CAPTURE_RELAY_SECRET}` },
    body: JSON.stringify({ url: source.url }),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(422, 'browser_capture_required', 'Automatic capture is unavailable for this link. Open the shared page with the browser helper; no record has been created.');
  }
  if (!response.headers.get('Content-Type')?.startsWith('text/plain') || response.headers.get('X-AIRef-Source') !== source.url) {
    await response.body?.cancel();
    throw new HttpError(422, 'browser_capture_required', 'The capture service returned an unexpected response. Use the browser helper; no record has been created.');
  }
  const text = await boundedText(response);
  return { text, source_url: source.url, provider: source.provider, captured_at: new Date().toISOString() };
}
