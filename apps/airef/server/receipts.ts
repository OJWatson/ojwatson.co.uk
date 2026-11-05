import type { Capture } from '../src/shared.ts';
import { HttpError } from './types.ts';

function base64url(bytes: Uint8Array): string { return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''); }
function unbase64url(value: string): Uint8Array<ArrayBuffer> { return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), char => char.charCodeAt(0)); }
async function key(secret: string) { return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); }

export async function signSource(source: Pick<Capture, 'source_url' | 'provider' | 'captured_at' | 'importer_version' | 'source_payload_sha256'>, secret: string): Promise<string> {
  const payload = base64url(new TextEncoder().encode(JSON.stringify({ kind: 'source_bytes', ...source })));
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), new TextEncoder().encode(payload)));
  return `${payload}.${base64url(signature)}`;
}

export async function verifyCapture(capture: Capture, secret?: string): Promise<{ attestation: 'server_receipt' | 'submitter_declared' }> {
  if (capture.capture_method !== 'server_fetch') return { attestation: 'submitter_declared' };
  if (!secret || !capture.receipt) throw new HttpError(400, 'capture_receipt', 'This server capture has no valid receipt. Retrieve it again or import it as a JSON file.');
  try {
    const [payload, signature, extra] = capture.receipt.split('.');
    if (!payload || !signature || extra || !await crypto.subtle.verify('HMAC', await key(secret), unbase64url(signature), new TextEncoder().encode(payload))) throw new Error();
    const data = JSON.parse(new TextDecoder().decode(unbase64url(payload)));
    for (const field of ['source_url', 'provider', 'captured_at', 'importer_version'] as const) if (data[field] !== capture[field]) throw new Error();
    if (data.kind !== 'source_bytes' || !capture.source_payload_sha256 || data.source_payload_sha256 !== capture.source_payload_sha256) throw new Error();
    return { attestation: 'server_receipt' };
  } catch { throw new HttpError(400, 'capture_receipt', 'The capture receipt does not match its source metadata. Retrieve again or import the file as JSON.'); }
}
