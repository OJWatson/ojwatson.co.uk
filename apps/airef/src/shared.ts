import { z } from 'zod';

export const MAX_RECORD_BYTES = 1_048_576;
export const IMPORTER_VERSION = 'airef/0.1.2';
export const Provider = z.enum(['chatgpt', 'claude']);
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().min(1).max(MAX_RECORD_BYTES).refine(value => Boolean(value.trim()), 'A message must contain readable text.'),
  timestamp: z.string().datetime({ offset: true }).nullable().default(null),
  model: z.string().max(160).nullable().default(null),
}).strict();

export function shareSource(value: string): { url: string; provider: 'chatgpt' | 'claude' } {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('Enter a complete public ChatGPT or Claude share URL.'); }
  const provider = ['chatgpt.com', 'chat.openai.com'].includes(url.hostname) ? 'chatgpt' : url.hostname === 'claude.ai' ? 'claude' : null;
  if (!provider || url.protocol !== 'https:' || url.username || url.password || url.port || !/^\/share\/[a-zA-Z0-9-]{8,80}\/?$/.test(url.pathname)) {
    throw new Error('Use an https://chatgpt.com/share/… or https://claude.ai/share/… public conversation link.');
  }
  url.search = ''; url.hash = ''; url.pathname = url.pathname.replace(/\/$/, '');
  return { url: url.toString(), provider };
}

export const CaptureSchema = z.object({
  schema_version: z.literal('1.0'),
  source_url: z.string().max(500),
  provider: Provider,
  title: z.string().max(300).default(''),
  captured_at: z.string().datetime({ offset: true }).nullable(),
  capture_method: z.enum(['server_fetch', 'browser_helper', 'json_import']),
  importer_version: z.string().max(100),
  completeness: z.enum(['shared_snapshot', 'partial', 'unknown']),
  omissions: z.array(z.string().max(500)).max(100),
  messages: z.array(MessageSchema).min(1).max(2000),
  receipt: z.string().max(3000).optional(),
  source_payload_sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
}).strict().superRefine((data, ctx) => {
  try {
    if (shareSource(data.source_url).provider !== data.provider) ctx.addIssue({ code: 'custom', message: 'Provider does not match source URL.' });
  } catch (error) { ctx.addIssue({ code: 'custom', message: (error as Error).message }); }
});

export const MetadataSchema = z.object({
  title: z.string().trim().min(1).max(300),
  author_name: z.string().trim().min(1).max(160),
  affiliation: z.string().trim().max(300).default(''),
  orcid: z.string().trim().max(40).default('').refine(value => !value || validOrcid(value), 'Enter a valid ORCID iD, or leave it empty.'),
  archiver_name: z.string().trim().max(160).default(''),
  description: z.string().trim().max(4000).default(''),
  license: z.enum(['CC-BY-4.0', 'CC0-1.0', 'All rights reserved']),
}).strict();

export const PublishSchema = z.object({
  idempotency_key: z.string().uuid(),
  capture: CaptureSchema,
  metadata: MetadataSchema,
  reviewed: z.literal(true),
  acknowledge_partial: z.boolean(),
}).strict();

export type Capture = z.infer<typeof CaptureSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type PublishInput = z.infer<typeof PublishSchema>;
export interface ArchiveRecord {
  schema_version: '1.0';
  id: string;
  url: string;
  archived_at: string;
  metadata: Metadata;
  source: {
    url: string;
    provider: Capture['provider'];
    captured_at: string | null;
    capture_method: Capture['capture_method'];
    importer_version: string;
    capture_attestation: 'server_receipt' | 'submitter_declared';
    source_payload_sha256: string | null;
    completeness: Capture['completeness'];
    omissions: string[];
  };
  messages: Message[];
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const object = value as Record<string, unknown>;
  return '{' + Object.keys(object).sort().filter(key => object[key] !== undefined).map(key => JSON.stringify(key) + ':' + canonicalJson(object[key])).join(',') + '}';
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function validOrcid(value: string): boolean {
  const id = value.replace(/^https:\/\/orcid\.org\//, '');
  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(id)) return false;
  const digits = id.replaceAll('-', '');
  let total = 0;
  for (const digit of digits.slice(0, 15)) total = (total + Number(digit)) * 2;
  const result = (12 - total % 11) % 11;
  return digits[15] === (result === 10 ? 'X' : String(result));
}

export function citation(record: ArchiveRecord): string {
  const date = record.archived_at.slice(0, 10);
  return `${record.metadata.author_name} (${date}). ${record.metadata.title} [${record.source.provider === 'chatgpt' ? 'ChatGPT' : 'Claude'} conversation archive]. AIRef. ${record.url}`;
}

export function markdown(record: ArchiveRecord): string {
  return `# ${record.metadata.title}\n\n${citation(record)}\n\n` +
    `Archived: ${record.archived_at}\nSource: ${record.source.url}\nLicense: ${record.metadata.license}\n` +
    `Capture scope: ${record.source.completeness}\n` +
    (record.source.omissions.length ? '\nCapture notes:\n' + record.source.omissions.map(note => `- ${note}`).join('\n') + '\n' : '') +
    '\n---\n\n' + record.messages.map((message, index) => `## ${index + 1}. ${message.role.toUpperCase()}\n\n${message.content}`).join('\n\n---\n\n') + '\n';
}

export function bibtex(record: ArchiveRecord): string {
  const escape = (value: string) => value.replace(/[\\{}%&#_$^~]/g, character => ({ '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '%': '\\%', '&': '\\&', '#': '\\#', '_': '\\_', '$': '\\$', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}' })[character]!);
  return `@misc{airef_${record.id.replaceAll('-', '')},\n  author = {{${escape(record.metadata.author_name)}}},\n  title = {${escape(record.metadata.title)}},\n  year = {${record.archived_at.slice(0, 4)}},\n  howpublished = {AIRef conversation archive},\n  url = {${record.url}},\n  note = {Archived ${record.archived_at.slice(0, 10)}; ${record.source.provider === 'chatgpt' ? 'ChatGPT' : 'Claude'}}\n}\n`;
}

export function importJson(value: unknown): Capture {
  const object = value as Record<string, any>;
  if (object?.schema_version === '1.0' && object.source && object.metadata && Array.isArray(object.messages)) {
    return CaptureSchema.parse({ schema_version: '1.0', source_url: object.source.url, provider: object.source.provider,
      title: object.metadata.title, captured_at: object.source.captured_at, capture_method: 'json_import', importer_version: IMPORTER_VERSION,
      completeness: object.source.completeness, omissions: [...(object.source.omissions || []), 'Imported from an archive file; the source page was not independently retrieved.'], messages: object.messages });
  }
  const capture = CaptureSchema.parse(value);
  const { receipt: _receipt, ...fields } = capture;
  return { ...fields, capture_method: capture.capture_method === 'browser_helper' ? 'browser_helper' : 'json_import' };
}

export function findSensitive(messages: Message[]): { index: number; label: string }[] {
  const findings: { index: number; label: string }[] = [];
  messages.forEach((message, index) => {
    if (/\b(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})\b|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(message.content)) findings.push({ index, label: 'Possible secret or private key' });
    if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(message.content)) findings.push({ index, label: 'Email address' });
  });
  return findings;
}
