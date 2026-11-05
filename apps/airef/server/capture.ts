import { decode } from 'turbo-stream';
import { CaptureSchema, IMPORTER_VERSION, shareSource, type Capture, type Message } from '../src/shared.ts';
import { HttpError } from './types.ts';

const MAX_SOURCE_BYTES = 4 * 1024 * 1024;
type ObjectValue = Record<string, any>;

export async function boundedText(response: Response, limit = MAX_SOURCE_BYTES): Promise<string> {
  const declared = Number(response.headers.get('content-length'));
  if (declared > limit) { await response.body?.cancel(); throw new HttpError(413, 'too_large', 'The source is too large. Use the browser helper to capture a smaller snapshot.'); }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, result = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new HttpError(413, 'too_large', 'The source exceeds the capture size limit.'); }
    result += decoder.decode(value, { stream: true });
  }
  return result + decoder.decode();
}

async function publicFetch(url: string, fetcher: typeof fetch): Promise<Response> {
  // ChatGPT may serve a metadata-only link preview to generic HTTP clients.
  // Request its public document representation; never send provider credentials.
  const headers: Record<string, string> = new URL(url).hostname === 'chatgpt.com' ? {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  } : { Accept: 'text/html,application/json', 'User-Agent': 'AIRef/0.1 public-share-archiver' };
  const response = await fetcher(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
    headers,
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(422, 'browser_capture_required', `The provider returned HTTP ${response.status}. Open the shared page and use the browser helper; no record has been created.`);
  }
  const type = response.headers.get('content-type') || '';
  if (!/text\/html|application\/json/.test(type)) { await response.body?.cancel(); throw new HttpError(422, 'browser_capture_required', 'The provider did not return a supported conversation page.'); }
  return response;
}

export async function retrieveShare(value: string, fetcher: typeof fetch = fetch): Promise<Capture> {
  const source = shareSource(value);
  const response = await publicFetch(source.url, fetcher);
  const body = await boundedText(response);
  try { return await parseShareHtml(body, source.url); }
  catch (error) {
    // Claude's own public-share HTML currently preloads this unauthenticated viewer endpoint.
    // Only try it when it is actually referenced in the returned page. Never forward cookies.
    if (source.provider === 'claude' && body.includes('/api/chat_snapshots/')) {
      const id = new URL(source.url).pathname.split('/').pop();
      const viewer = `https://claude.ai/api/chat_snapshots/${id}?rendering_mode=messages&render_all_tools=true&renders_source_card=true&renders_tally_table_bars=true`;
      const data = JSON.parse(await boundedText(await publicFetch(viewer, fetcher)));
      return normalizeConversation(data, source.url);
    }
    throw error;
  }
}

export async function retrieveSource(value: string, fetcher: typeof fetch = fetch): Promise<{ text: string; source_url: string; provider: Capture['provider']; captured_at: string }> {
  let source: ReturnType<typeof shareSource>;
  try { source = shareSource(value); } catch (error) { throw new HttpError(400, 'source_url', (error as Error).message); }
  let text = await boundedText(await publicFetch(source.url, fetcher));
  if (source.provider === 'claude' && text.includes('/api/chat_snapshots/') && !text.includes('"chat_messages"')) {
    const id = new URL(source.url).pathname.split('/').pop();
    const endpoint = `https://claude.ai/api/chat_snapshots/${id}?rendering_mode=messages&render_all_tools=true&renders_source_card=true&renders_tally_table_bars=true`;
    text = await boundedText(await publicFetch(endpoint, fetcher));
  }
  return { text, source_url: source.url, provider: source.provider, captured_at: new Date().toISOString() };
}

export async function parseShareHtml(html: string, url: string): Promise<Capture> {
  const source = shareSource(url);
  const candidates: unknown[] = [];
  if (html.trimStart().startsWith('{')) {
    try { candidates.push(JSON.parse(html)); } catch { /* Try HTML encodings below. */ }
  }
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  for (const [, attributes, contents] of scripts) {
    if (source.provider === 'chatgpt' && /\bid=["']__WEB_MOBILE_DATA__["']/.test(attributes)) {
      let data: any;
      try { data = JSON.parse(contents); } catch { continue; }
      const conversation = data?.conversation;
      const expected = new URL(source.url);
      if (conversation?.sharedSource?.id !== expected.pathname.split('/').pop() || conversation?.sharedContent?.canonicalPath !== expected.pathname) {
        throw new HttpError(422, 'source_mismatch', 'The returned transcript does not match the requested public share. No record has been created.');
      }
      if (data.isConversationStreaming || !Array.isArray(conversation.messages) || !conversation.messages.length || conversation.messages.some((message: any) =>
        !message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || !message.content.trim() ||
        message.isStreaming || (message.source?.status && message.source.status !== 'complete'))) {
        throw new HttpError(422, 'incomplete_source', 'The provider returned an unfinished or unsupported transcript. Use the browser helper; no record has been created.');
      }
      // Read only the explicit transcript, not auth/settings bootstrap or executable DIL.
      const capture = normalizeConversation({ title: conversation.title, linear_conversation: conversation.messages.map((message: any) => ({
        author: { role: message.role }, content: message.content,
      })) }, source.url);
      capture.completeness = 'partial';
      capture.omissions.push('Captured the provider’s public text representation. Interactive content, attachments, original message timestamps, and model details may be absent.');
      if (conversation.messages.some((message: any) => message.source?.dil)) capture.omissions.push('The provider supplied fallback text for interactive content. Interactive tables or controls may have missing values; their code was not executed or reconstructed.');
      return CaptureSchema.parse(capture);
    }
    // Authentication/feature-flag bootstrap data is unrelated to the shared transcript.
    // Do not parse it: apart from privacy, walking it needlessly exhausts Free CPU budgets.
    if (/application\/json|__NEXT_DATA__/i.test(attributes) && !/client-bootstrap/i.test(attributes) && /"(?:linear_conversation|chat_messages|sharedConversation|mapping)"\s*:/.test(contents)) {
      try { candidates.push(JSON.parse(contents)); } catch { /* Unsupported script data is not executed. */ }
    }
  }
  const chunks: string[] = [];
  for (const match of html.matchAll(/streamController\.enqueue\(\s*("(?:\\[\s\S]|[^"\\])*")\s*\)/g)) {
    try { chunks.push(JSON.parse(match[1])); } catch { /* Reject malformed encodings below. */ }
  }
  if (chunks.length) {
    try {
      const bytes = new TextEncoder().encode(chunks.join(''));
      const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); controller.close(); } });
      const decoded = await decode(stream, { plugins: [(_type, ...values) => ({ value: values.length === 1 ? values[0] : values })] });
      // Observe deferred-stream failures without executing any page JavaScript.
      await decoded.done;
      candidates.push(decoded.value);
    } catch { /* A malformed or changed stream must not become an empty successful capture. */ }
  }
  const flightChunks: string[] = [];
  for (const match of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)\s*;?/g)) {
    try { const row = JSON.parse(match[1]); if (typeof row[1] === 'string') flightChunks.push(row[1]); } catch { /* Unsupported RSC chunk. */ }
  }
  for (const line of flightChunks.join('').split('\n')) {
    const value = line.replace(/^[0-9a-f]+:/i, '');
    if (/^[\[{]/.test(value)) try { candidates.push(JSON.parse(value)); } catch { /* Not a JSON data row. */ }
  }
  let meaningfulError: Error | undefined;
  for (const candidate of candidates) {
    try { return normalizeConversation(candidate, source.url); }
    catch (error) { if (error instanceof HttpError && error.code !== 'no_conversation') meaningfulError = error; }
  }
  if (meaningfulError) throw meaningfulError;
  throw new HttpError(422, 'browser_capture_required', 'No readable conversation was found in this page. It may need a browser, be unavailable, or use a changed format. Use the browser helper; no record has been created.');
}

function findConversation(root: unknown, provider: Capture['provider']): ObjectValue {
  const queue: unknown[] = [root];
  const seen = new Set<object>();
  for (let cursor = 0; cursor < queue.length && cursor < 100000; cursor++) {
    const value = queue[cursor];
    if (!value || typeof value !== 'object' || seen.has(value) || value instanceof Promise) continue;
    seen.add(value);
    const object = value as ObjectValue;
    if (provider === 'chatgpt' && (Array.isArray(object.linear_conversation) || (object.mapping && Object.values(object.mapping).some((node: any) => node?.message?.author?.role)))) return object;
    if (provider === 'claude' && Array.isArray(object.chat_messages)) return object;
    // Prefer explicitly named conversation containers over unrelated application bootstrap data.
    for (const field of ['sharedConversation', 'conversation', 'chat_snapshot', 'snapshot']) if (object[field]) queue.splice(cursor + 1, 0, object[field]);
    for (const [field, child] of Object.entries(object)) if (!['__proto__', 'constructor', 'prototype'].includes(field)) queue.push(child);
  }
  throw new HttpError(422, 'no_conversation', 'No supported conversation data was found.');
}

function isoDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const date = typeof value === 'number' ? new Date(value < 1e12 ? value * 1000 : value) : new Date(String(value));
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

export function normalizeConversation(root: unknown, url: string): Capture {
  const source = shareSource(url);
  const conversation = findConversation(root, source.provider);
  const omissions = new Set<string>(['Text and code only. Attached files, generated artifacts, and hidden provider instructions are outside this archive.']);
  let partial = false;
  const omit = (note: string) => { omissions.add(note); partial = true; };
  let nodes: ObjectValue[];
  if (source.provider === 'claude') nodes = conversation.chat_messages;
  else if (Array.isArray(conversation.linear_conversation)) nodes = conversation.linear_conversation;
  else {
    const mapping = conversation.mapping as Record<string, ObjectValue>;
    const leaves = Object.entries(mapping).filter(([, node]) => !node.children?.length);
    let current = conversation.current_node || (leaves.length === 1 ? leaves[0][0] : null);
    if (!current) throw new HttpError(422, 'ambiguous_branch', 'The shared data has several branches and no selected branch. Capture the visible branch with the browser helper.');
    nodes = []; const seen = new Set<string>();
    while (current) {
      if (seen.has(current) || !mapping[current]) throw new HttpError(422, 'broken_branch', 'The conversation branch is incomplete or malformed. Use the browser helper.');
      seen.add(current); nodes.unshift(mapping[current]); current = mapping[current].parent;
    }
  }
  if (nodes.length > 2500) throw new HttpError(413, 'too_many_messages', 'This conversation is too long for the text-only pilot.');
  const messages: Message[] = [];
  for (const node of nodes) {
    const message = source.provider === 'chatgpt' ? node.message || node : node;
    if (!message) continue;
    const rawRole = source.provider === 'chatgpt' ? message.author?.role : message.sender || message.role;
    if (message.metadata?.is_visually_hidden_from_conversation || message.channel === 'analysis' || message.channel === 'commentary' || rawRole === 'system' || rawRole === 'developer') continue;
    const role = rawRole === 'human' ? 'user' : rawRole;
    if (!['user', 'assistant', 'tool'].includes(role)) { if (rawRole) omit(`A message with unsupported role ${String(rawRole).slice(0, 40)} was omitted.`); continue; }
    const blocks: string[] = [];
    if (source.provider === 'chatgpt') {
      const content = message.content;
      if (typeof content === 'string') blocks.push(content);
      else if (Array.isArray(content?.parts)) {
        for (const part of content.parts) {
          if (typeof part === 'string') blocks.push(part);
          else if (part?.content_type === 'text' && typeof part.text === 'string') blocks.push(part.text);
          else omit('Non-text message content was omitted.');
        }
      } else if (typeof content?.text === 'string') blocks.push(content.content_type === 'code' ? `\`\`\`${content.language || ''}\n${content.text}\n\`\`\`` : content.text);
      else if (content) omit('Unsupported message content was omitted.');
      if (message.metadata?.attachments?.length) omit('One or more attached files were omitted.');
    } else {
      if (Array.isArray(message.content) && message.content.length) {
        for (const block of message.content) {
          if (block.type === 'text' && typeof block.text === 'string') blocks.push(block.text);
          else omit('Claude tool, thinking, or non-text content was omitted.');
        }
      } else if (typeof message.text === 'string') blocks.push(message.text);
      if (message.attachments?.length || message.files?.length) omit('One or more attached files were omitted.');
    }
    const text = blocks.join('\n\n');
    if (!text.trim()) continue;
    messages.push({ role, content: text, timestamp: isoDate(message.create_time ?? message.created_at), model: typeof message.metadata?.model_slug === 'string' ? message.metadata.model_slug : typeof message.model === 'string' ? message.model : null });
  }
  if (!messages.length) throw new HttpError(422, 'empty_conversation', 'The source contains no readable text messages. No record has been created.');
  return CaptureSchema.parse({ schema_version: '1.0', source_url: source.url, provider: source.provider,
    title: String(conversation.title || conversation.name || '').slice(0, 300), captured_at: new Date().toISOString(),
    capture_method: 'server_fetch', importer_version: IMPORTER_VERSION, completeness: partial ? 'partial' : 'shared_snapshot', omissions: [...omissions], messages });
}
