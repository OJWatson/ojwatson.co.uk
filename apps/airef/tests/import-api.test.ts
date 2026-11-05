import test from 'node:test';
import assert from 'node:assert/strict';
import { testDatabase } from './database.ts';
import { chatgptData, SOURCE, publication } from './fixtures.ts';
import { handleRequest } from '../server/app.ts';
import { parseShareHtml } from '../server/capture.ts';
import { sha256 } from '../src/shared.ts';
import { handleCapture } from '../capture-relay/netlify/functions/capture.ts';

test('the hosted import returns bounded inert bytes and a receipt; browser parsing feeds publication', async () => {
  const { db, sqlite } = testDatabase(); const code = 'import-test-invitation-code'; const origin = 'https://airef.example';
  sqlite.prepare('INSERT INTO invitations (id, code_hash, label, created_at) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), await sha256(code), 'Test', new Date().toISOString());
  const env = { DB: db, PUBLIC_ORIGIN: origin, CAPTURE_SIGNING_KEY: 'test-secret' };
  const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { conversation: chatgptData() } })}</script></html>`;
  const importer = await handleRequest(new Request(origin + '/api/import', { method: 'POST', headers: { Authorization: `Bearer ${code}`, 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ url: SOURCE }) }), env, async () => new Response(html, { headers: { 'Content-Type': 'text/html' } }));
  assert.equal(importer?.status, 200); assert.match(importer!.headers.get('content-type')!, /^text\/plain/);
  const bytes = await importer!.text(); assert.equal(bytes, html);
  assert.equal(await sha256(bytes), importer?.headers.get('X-AIRef-Source-SHA256'));
  const capture = await parseShareHtml(bytes, SOURCE);
  capture.captured_at = importer!.headers.get('X-AIRef-Captured-At'); capture.receipt = importer!.headers.get('X-AIRef-Receipt')!; capture.source_payload_sha256 = importer!.headers.get('X-AIRef-Source-SHA256')!;
  const input = publication(); input.capture = capture;
  const published = await handleRequest(new Request(origin + '/api/publish', { method: 'POST', headers: { Authorization: `Bearer ${code}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input) }), env);
  assert.equal(published?.status, 201);
  const row = sqlite.prepare('SELECT archive_json FROM records').get() as any;
  assert.equal(JSON.parse(row.archive_json).source.capture_attestation, 'server_receipt');
});

test('hosted import validates URLs before network access and never follows a redirect', async () => {
  const { db, sqlite } = testDatabase(); const code = 'import-test-invitation-code'; const origin = 'https://airef.example';
  sqlite.prepare('INSERT INTO invitations (id, code_hash, label, created_at) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), await sha256(code), 'Test', new Date().toISOString());
  const env = { DB: db, PUBLIC_ORIGIN: origin, CAPTURE_SIGNING_KEY: 'test-secret' }; let calls = 0;
  const importer = await handleRequest(new Request(origin + '/api/import', { method: 'POST', headers: { Authorization: `Bearer ${code}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'http://127.0.0.1/private' }) }), env, async () => { calls++; return new Response(''); });
  assert.equal(importer?.status, 400); assert.equal(calls, 0);
});

test('a blocked direct import can use the authenticated capture service without changing the receipt or review contract', async () => {
  const { db, sqlite } = testDatabase(); const code = 'import-test-invitation-code', origin = 'https://airef.example';
  sqlite.prepare('INSERT INTO invitations (id, code_hash, label, created_at) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), await sha256(code), 'Test', new Date().toISOString());
  const secret='relay-test-secret-with-more-than-32-characters';
  const env={DB:db,PUBLIC_ORIGIN:origin,CAPTURE_SIGNING_KEY:'test-secret',CAPTURE_RELAY_URL:'https://capture.example/.netlify/functions/capture',CAPTURE_RELAY_SECRET:secret};
  const html=`<script type="application/json">${JSON.stringify({conversation:chatgptData()})}</script>`;
  let calls=0;
  const response=await handleRequest(new Request(origin+'/api/import',{method:'POST',headers:{Authorization:'Bearer '+code,'Content-Type':'application/json'},body:JSON.stringify({url:SOURCE})}),env,async(url,init)=>{
    calls++;
    if(calls===1) return new Response('Blocked',{status:403});
    assert.equal(String(url),env.CAPTURE_RELAY_URL);
    assert.ok(!JSON.stringify(init).includes(code));
    return handleCapture(new Request(url,init),secret,async()=>new Response(html,{headers:{'Content-Type':'text/html'}}));
  });
  assert.equal(response?.status,200);assert.equal(calls,2);
  const text=await response!.text();assert.equal(text,html);
  const parsed=await parseShareHtml(text,SOURCE);assert.equal(parsed.messages.length,2);
  parsed.captured_at=response!.headers.get('X-AIRef-Captured-At');parsed.receipt=response!.headers.get('X-AIRef-Receipt')!;parsed.source_payload_sha256=response!.headers.get('X-AIRef-Source-SHA256')!;
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM records').get()!.n,0);
  const input=publication();input.capture=parsed;
  const published=await handleRequest(new Request(origin+'/api/publish',{method:'POST',headers:{Authorization:'Bearer '+code,'Content-Type':'application/json'},body:JSON.stringify(input)}),env);
  assert.equal(published?.status,201);
});
