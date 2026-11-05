import test from 'node:test';
import assert from 'node:assert/strict';
import { encode } from 'turbo-stream';
import { chatgptData, SOURCE, CLAUDE_SOURCE } from './fixtures.ts';
import { normalizeConversation, parseShareHtml, retrieveShare, boundedText } from '../server/capture.ts';
import { shareSource, validOrcid, importJson } from '../src/shared.ts';
import { renderMarkdown } from '../src/markdown.ts';

test('accepts only supported public-share URLs and removes tracking parameters', () => {
  assert.equal(shareSource(SOURCE + '?tracking=test#fragment').url, SOURCE);
  for (const url of ['http://127.0.0.1/share/00000000', 'https://chatgpt.com.evil.example/share/00000000', 'https://chatgpt.com:4430/share/00000000', 'https://claude.ai/api/organizations/private', 'https://user:pass@chatgpt.com/share/00000000']) assert.throws(() => shareSource(url));
});

test('selects the declared branch, preserves code, and excludes hidden instructions', () => {
  const result = normalizeConversation(chatgptData(), SOURCE);
  assert.equal(result.messages.length, 2); assert.ok(!JSON.stringify(result).includes('WRONG BRANCH'));
  assert.ok(!JSON.stringify(result).includes('Do not include hidden instructions'));
  assert.equal(result.messages[1].content, '```python\nprint(4)\n```');
  const unknown = chatgptData() as any; delete unknown.current_node;
  assert.throws(() => normalizeConversation(unknown, SOURCE), /several branches/);
});

test('decodes the actual ChatGPT turbo-stream protocol without evaluating page scripts', async () => {
  const data = { loaderData: { 'routes/share.$shareId': { sharedConversation: chatgptData() } } };
  const stream = await new Response(encode(data)).text();
  const html = `<html><script>throw new Error('must never run')</script><script>window.__reactRouterContext.streamController.enqueue(${JSON.stringify(stream.slice(0, 80))})</script><script>window.__reactRouterContext.streamController.enqueue(${JSON.stringify(stream.slice(80))})</script></html>`;
  const result = await parseShareHtml(html, SOURCE);
  assert.equal(result.messages.length, 2); assert.equal(result.title, 'Synthetic branch example');
});

test('reads the explicit mobile share transcript, preserves text and code, and labels fallback omissions', async () => {
  const data: any = { isConversationStreaming: false, auth: { secret: 'never archive bootstrap' }, conversation: {
    title: 'Synthetic public text', sharedSource: { id: new URL(SOURCE).pathname.split('/').pop() }, sharedContent: { canonicalPath: new URL(SOURCE).pathname },
    messages: [{ role: 'user', content: 'Show code' }, { role: 'assistant', content: '```r\nmean(c(2, 4))\n```', source: { status: 'complete', dil: { code: 'never execute this', fallbackMarkdown: 'Fallback' } } }],
  } };
  const html = () => `<script id="__WEB_MOBILE_DATA__" type="application/json">${JSON.stringify(data)}</script>`;
  const capture = await parseShareHtml(html(), SOURCE);
  assert.equal(capture.messages.length, 2); assert.equal(capture.messages[1].content, data.conversation.messages[1].content);
  assert.equal(capture.completeness, 'partial'); assert.ok(capture.omissions.some(note => note.includes('missing values')));
  assert.ok(!JSON.stringify(capture).includes('never archive bootstrap')); assert.ok(!JSON.stringify(capture).includes('never execute this'));
  data.conversation.sharedSource.id = 'wrong-share';
  await assert.rejects(() => parseShareHtml(html(), SOURCE), /does not match/);
  data.conversation.sharedSource.id = new URL(SOURCE).pathname.split('/').pop();
  data.isConversationStreaming = true;
  await assert.rejects(() => parseShareHtml(html(), SOURCE), /unfinished/);
  data.isConversationStreaming = false; data.conversation.messages[1].content = '';
  await assert.rejects(() => parseShareHtml(html(), SOURCE), /unfinished/);
});

test('recognizes Claude text blocks and marks omitted tools or attachments as partial', () => {
  const data = { name: 'Synthetic Claude conversation', chat_messages: [
    { sender: 'human', text: 'A prompt', content: [{ type: 'text', text: 'A prompt' }], attachments: [{ name: 'missing.pdf' }] },
    { sender: 'assistant', content: [{ type: 'text', text: '```r\nmean(c(2, 4, 6))\n```' }, { type: 'tool_use', name: 'artifact', input: 'never execute this' }] },
  ] };
  const result = normalizeConversation(data, CLAUDE_SOURCE);
  assert.equal(result.messages.length, 2); assert.equal(result.messages[0].content, 'A prompt');
  assert.equal(result.completeness, 'partial'); assert.ok(!JSON.stringify(result).includes('never execute this'));
});

test('blocked pages, login shells, malformed streams, and empty chats are not successful captures', async () => {
  await assert.rejects(() => parseShareHtml('<html><title>Check out this chat</title><a href="' + SOURCE + '">View chat</a></html>', SOURCE), /No readable conversation/);
  await assert.rejects(() => parseShareHtml('<html><h1>Sign in</h1></html>', SOURCE), /No readable conversation/);
  await assert.rejects(() => parseShareHtml('<script>window.__reactRouterContext.streamController.enqueue("not json")</script>', SOURCE), /No readable conversation/);
  await assert.rejects(() => retrieveShare(SOURCE, async () => new Response('blocked', { status: 403 }) as any), /HTTP 403/);
  let calls = 0;
  await assert.rejects(() => retrieveShare(SOURCE, async () => { calls++; return new Response('', { status: 302, headers: { Location: 'http://127.0.0.1' } }); }), /HTTP 302/);
  assert.equal(calls, 1);
});

test('ChatGPT requests the public document without cookies and Claude snapshot requests retain JSON support', async () => {
  const capture = await retrieveShare(SOURCE, async (url, init) => {
    assert.equal(String(url), SOURCE);
    const headers = new Headers(init?.headers);
    assert.match(headers.get('Accept')!, /text\/html/);
    assert.equal(headers.get('Sec-Fetch-Mode'), 'navigate');
    assert.equal(headers.get('Sec-Fetch-Dest'), 'document');
    assert.equal(headers.has('Authorization'), false);
    assert.equal(headers.has('Cookie'), false);
    assert.equal(init?.redirect, 'manual');
    return new Response(JSON.stringify(chatgptData()), { headers: { 'Content-Type': 'application/json' } });
  });
  assert.equal(capture.messages.length, 2);
  let calls = 0;
  const claude = await retrieveShare(CLAUDE_SOURCE, async (url, init) => {
    calls++;
    const headers = new Headers(init?.headers);
    assert.equal(headers.has('Sec-Fetch-Mode'), false);
    assert.match(headers.get('Accept')!, /application\/json/);
    if (calls === 1) return new Response('<html>/api/chat_snapshots/</html>', { headers: { 'Content-Type': 'text/html' } });
    assert.match(String(url), /^https:\/\/claude.ai\/api\/chat_snapshots\//);
    return new Response(JSON.stringify({ chat_messages: [{ sender: 'human', text: 'Public Claude message' }] }), { headers: { 'Content-Type': 'application/json' } });
  });
  assert.equal(calls, 2); assert.equal(claude.messages.length, 1);
});

test('oversized sources are stopped during streaming', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(20))); }, cancel() { cancelled = true; } });
  await assert.rejects(() => boundedText(new Response(stream), 10), /size limit/);
  assert.equal(cancelled, true);
});

test('Markdown never executes HTML, JavaScript URLs, SVG, or remote images', () => {
  const rendered = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert(1))\n\n![secret](https://tracker.example/x)\n\n```html\n<svg onload=alert(1)>\n```');
  assert.ok(!rendered.includes('<script>')); assert.ok(!rendered.includes('<img')); assert.ok(!rendered.includes('href="javascript:'));
  assert.ok(rendered.includes('Image omitted')); assert.ok(rendered.includes('&lt;svg'));
});

test('ORCID check digits are checked and imported JSON cannot claim a server receipt', async () => {
  assert.equal(validOrcid('0000-0002-1825-0097'), true); assert.equal(validOrcid('0000-0002-1825-0098'), false);
  const capture = normalizeConversation(chatgptData(), SOURCE); capture.receipt = 'untrusted';
  assert.equal(importJson(capture).capture_method, 'json_import'); assert.equal(importJson(capture).receipt, undefined);
});
