import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createHandoff, HANDOFF_TTL } from '../extension/handoff.ts';
import { ARCHIVE_ORIGIN, ARCHIVE_ORIGINS, HELPER_ID } from '../extension/bridge-config.ts';

const source = 'https://chatgpt.com/share/6aea598b-a0b4-83eb-b5bf-c7caebdfa1ea';
const capture = { schema_version: '1.0', source_url: source, provider: 'chatgpt', title: 'Synthetic example', captured_at: null, capture_method: 'browser_helper', importer_version: 'airef-browser/0.2.0', completeness: 'unknown', omissions: ['Loaded messages only.'], messages: [{ role: 'user', content: 'Synthetic test text.', timestamp: null, model: null }] };
function setup() {
  const state: Record<string, any> = {};
  const opened: string[] = [];
  let now = 1_000_000, token = 0, nextTab = 123;
  const bridge = createHandoff({
    read: async () => structuredClone(state),
    write: async (key, value) => { state[key] = structuredClone(value); },
    remove: async keys => { for (const key of keys) delete state[key]; },
    open: async url => { opened.push(url); return nextTab++; },
    returnTo: async (_id, _origin, url) => { opened.push(url); },
    now: () => now,
    token: () => (++token).toString(16).padStart(64,'0'),
  });
  return { bridge, state, opened, advance: () => { now += HANDOFF_TTL + 1; } };
}
test('browser handoff keeps text out of URLs, returns to initiating archive, and consumes once', async () => {
  const { bridge, opened } = setup();
  const origin = ARCHIVE_ORIGINS[1];
  await bridge.external({ type: 'airef-open-share', url: source }, origin + '/', 42);
  await bridge.review(capture, 123);
  assert.equal(opened[0], source);
  assert.match(opened[1], new RegExp('^' + origin.replaceAll('.', '\\.') + '/#airef-capture=[a-f0-9]{64}$'));
  assert.ok(!opened[1].includes('Synthetic'));
  const token = opened[1].split('=')[1];
  await assert.rejects(bridge.external({ type: 'airef-consume-capture', token }, ARCHIVE_ORIGIN + '/'), /expired/);
  const result = await bridge.external({ type: 'airef-consume-capture', token }, origin + '/');
  assert.deepEqual(result.capture, capture);
  await assert.rejects(bridge.external({ type: 'airef-consume-capture', token }, origin + '/'), /expired/);
});
test('handoff rejects untrusted origins, private sources, invalid captures, and expired tokens', async () => {
  const { bridge, opened, state, advance } = setup();
  for (const url of ['https://evil.example/', 'https://airef.ojwatson.co.uk.evil.example/', 'http://airef.ojwatson.co.uk/', ARCHIVE_ORIGIN + '/record']) {
    await assert.rejects(bridge.external({ type: 'airef-open-share', url: source }, url));
  }
  await assert.rejects(bridge.external({ type: 'airef-open-share', url: 'https://chatgpt.com/c/private' }, ARCHIVE_ORIGIN + '/'));
  await assert.rejects(bridge.review({ ...capture, capture_method: 'server_fetch' }, 3));
  await assert.rejects(bridge.review({ ...capture, messages: [{ role: 'user', content: 'é'.repeat(530000) }] }, 3));
  assert.equal(opened.length, 0);
  await bridge.review(capture, 3);
  const token = opened[0].split('=')[1]; advance();
  await assert.rejects(bridge.external({ type: 'airef-consume-capture', token }, ARCHIVE_ORIGIN + '/'), /expired/);
  assert.equal(Object.keys(state).length, 0);
});
test('session queue bounds abandoned captures and pending tabs', async () => {
  const { bridge, state, opened } = setup();
  for (let i=0; i<7; i++) await bridge.review(capture, 3);
  assert.equal(Object.keys(state).filter(key => key.startsWith('capture:')).length, 5);
  await assert.rejects(bridge.external({ type: 'airef-consume-capture', token: opened[0].split('=')[1] }, ARCHIVE_ORIGIN + '/'), /expired/);
  for (let i=0; i<25; i++) await bridge.external({type:'airef-open-share',url:source},ARCHIVE_ORIGIN + '/');
  assert.equal(Object.keys(state).filter(key => key.startsWith('pending:')).length,20);
});
test('packaged helper has stable public identity and no provider host permissions', async () => {
  const manifest = JSON.parse(await readFile(new URL('../extension/manifest.json', import.meta.url), 'utf8'));
  const id = createHash('sha256').update(Buffer.from(manifest.key,'base64')).digest('hex').slice(0,32).replace(/[0-9a-f]/g, c => String.fromCharCode(97+parseInt(c,16)));
  assert.equal(id, HELPER_ID);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  assert.deepEqual(manifest.externally_connectable.matches, ARCHIVE_ORIGINS.map(origin => origin + '/*'));
  assert.deepEqual(manifest.permissions, ['activeTab','scripting','downloads','storage']);
});
