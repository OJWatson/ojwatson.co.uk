import test from 'node:test';
import assert from 'node:assert/strict';
import { handleCapture } from '../capture-relay/netlify/functions/capture.ts';
import { retrieveWithRelay } from '../server/capture-relay.ts';
import { SOURCE } from './fixtures.ts';

const secret = 'synthetic-relay-secret-with-at-least-32-characters';
const endpoint = 'https://airef-capture.example/.netlify/functions/capture';
const headers = { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };
test('optional capture relay rejects unauthorized, private, malformed, and oversized requests before fetching', async () => {
  let calls = 0; const fetcher: typeof fetch = async () => { calls++; throw Error('Unexpected fetch'); };
  for (const [request, expected] of [
    [new Request(endpoint,{method:'POST',body:'{}'}),404],
    [new Request(endpoint,{method:'POST',headers,body:JSON.stringify({url:'http://127.0.0.1/private'})}),400],
    [new Request(endpoint,{method:'POST',headers,body:JSON.stringify({url:SOURCE,cookies:'not-accepted'})}),400],
    [new Request(endpoint,{method:'POST',headers,body:'x'.repeat(2001)}),400],
  ] as const) assert.equal((await handleCapture(request,secret,fetcher)).status,expected);
  assert.equal(calls,0);
});
test('relay returns inert bounded text with canonical provenance and never forwards its own credentials to a provider', async () => {
  const response = await handleCapture(new Request(endpoint,{method:'POST',headers,body:JSON.stringify({url:SOURCE+'?tracking=removed'})}),secret,async (url,init) => {
    assert.equal(String(url),SOURCE); assert.equal(init?.redirect,'manual');
    assert.equal(new Headers(init?.headers).has('Authorization'),false); assert.equal(new Headers(init?.headers).has('Cookie'),false);
    return new Response('<script>Untrusted text stays inert</script>',{headers:{'Content-Type':'text/html'}});
  });
  assert.equal(response.status,200);assert.equal(response.headers.get('X-AIRef-Source'),SOURCE);
  assert.match(response.headers.get('Content-Type')!,/^text\/plain/);assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(await response.text(),'<script>Untrusted text stays inert</script>');
});
test('relay refuses provider redirects and streamed oversize responses', async () => {
  for (const upstream of [new Response('',{status:302,headers:{Location:'https://evil.example'}}),new Response('',{headers:{'Content-Type':'text/html','Content-Length':String(5*1024*1024)}})]) {
    const result=await handleCapture(new Request(endpoint,{method:'POST',headers,body:JSON.stringify({url:SOURCE})}),secret,async()=>upstream);
    assert.ok([413,422].includes(result.status));
  }
});
test('archive uses an optional relay only after direct retrieval is blocked and sends no invitation or cookies', async () => {
  let calls=0;
  const result=await retrieveWithRelay(SOURCE,{CAPTURE_RELAY_URL:endpoint,CAPTURE_RELAY_SECRET:secret},async(url,init)=>{
    calls++;
    if(calls===1){assert.equal(String(url),SOURCE);return new Response('Denied',{status:403});}
    assert.equal(String(url),endpoint);assert.equal(init?.method,'POST');assert.equal(init?.redirect,'manual');
    assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer '+secret);
    assert.equal(new Headers(init?.headers).has('Cookie'),false);assert.deepEqual(JSON.parse(String(init?.body)),{url:SOURCE});
    return new Response('Exact source bytes',{headers:{'Content-Type':'text/plain','X-AIRef-Source':SOURCE}});
  });
  assert.equal(calls,2);assert.equal(result.text,'Exact source bytes');assert.equal(result.source_url,SOURCE);
});
test('relay stays disabled by default and cannot replace a redirect or mismatched-source response with a successful capture', async () => {
  let calls=0;
  await assert.rejects(retrieveWithRelay(SOURCE,{},async()=>{calls++;return new Response('',{status:403});}),/HTTP 403/);
  assert.equal(calls,1);
  for(const upstream of [new Response('',{status:302,headers:{Location:'https://evil.example'}}),new Response('wrong',{headers:{'Content-Type':'text/plain','X-AIRef-Source':SOURCE.replace('00000000','11111111')}})]) {
    let count=0;
    await assert.rejects(retrieveWithRelay(SOURCE,{CAPTURE_RELAY_URL:endpoint,CAPTURE_RELAY_SECRET:secret},async()=>++count===1?new Response('',{status:403}):upstream));
  }
});
