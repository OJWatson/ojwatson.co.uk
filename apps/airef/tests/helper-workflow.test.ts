import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { createHandoff } from '../extension/handoff.ts';
import { HELPER_ID, ARCHIVE_ORIGIN } from '../extension/bridge-config.ts';
import { capture } from './fixtures.ts';

// This exercises the real website and handoff code with an emulated Chrome
// transport. It is deliberately separate from an installed-extension trial.
test('blocked-link form opens the helper route and receives a validated review draft without publication', async () => {
  const { window } = parseHTML(await readFile(new URL('../index.html', import.meta.url), 'utf8'));
  const document = window.document;
  const location = { href: ARCHIVE_ORIGIN + '/', pathname: '/', search: '', hash: '' };
  const state: Record<string, any> = {}, drafts = new Map<string,string>(), opened: string[] = [];
  const token = 'a'.repeat(64);
  const bridge = createHandoff({
    read: async () => structuredClone(state), write: async (key,value) => { state[key] = value; },
    remove: async keys => { keys.forEach(key => delete state[key]); },
    open: async url => { opened.push(url); return 12; },
    returnTo: async (_id,_origin,url) => { opened.push(url); }, now: Date.now, token: () => token,
  });
  const keys = ['window','document','location','history','sessionStorage','chrome','fetch'];
  const originals = keys.map(key => [key,Object.getOwnPropertyDescriptor(globalThis,key)] as const);
  let serverCalls = 0;
  Object.assign(globalThis, {
    window, document, location,
    history: { replaceState: () => { location.hash = ''; } },
    sessionStorage: { getItem: (key:string) => drafts.get(key) ?? null, setItem: (key:string,value:string) => drafts.set(key,value), removeItem: (key:string) => drafts.delete(key) },
    chrome: { runtime: { lastError: null, sendMessage: (id:string,message:any,callback:(response:any)=>void) => {
      assert.equal(id, HELPER_ID);
      bridge.external(message, ARCHIVE_ORIGIN + '/', 10).then(callback, error => callback({ok:false,error:error.message}));
    } } },
    fetch: async (path:string) => {
      serverCalls++; assert.equal(path,'/api/import');
      if (serverCalls === 1) return Response.json({error:'browser_capture_required',message:'Provider HTTP 403'}, {status:422});
      return new Response('<html><title>Check out this chat</title><p>View chat</p></html>', {headers:{'Content-Type':'text/plain'}});
    },
  });
  window.scrollTo = () => {};
  async function settle(predicate: () => boolean) {
    for (let i=0; i<50; i++) { if (predicate()) return; await new Promise(resolve => setImmediate(resolve)); }
    assert.ok(predicate(), 'UI event did not finish');
  }
  try {
    await import('../src/main.ts');
    (document.getElementById('share-url') as HTMLInputElement).value = capture().source_url;
    (document.getElementById('invite-code') as HTMLInputElement).value = 'synthetic-invitation';
    document.getElementById('capture-form')!.dispatchEvent(new window.Event('submit',{cancelable:true}));
    await settle(() => !document.getElementById('open-with-helper')!.hidden);
    assert.match(document.getElementById('capture-status')!.textContent!, /blocked/);
    document.getElementById('capture-form')!.dispatchEvent(new window.Event('submit',{cancelable:true}));
    await settle(() => !document.getElementById('browser-capture')!.hidden && !document.getElementById('capture-button')!.hasAttribute('disabled'));
    assert.match(document.getElementById('capture-status')!.textContent!, /No readable conversation/);
    assert.ok(document.getElementById('review-stage')!.hidden, 'A metadata preview must not enter review as a capture');
    document.getElementById('open-with-helper')!.click();
    await settle(() => opened.length === 1);
    assert.equal(opened[0],capture().source_url);
    await bridge.review({...capture(),capture_method:'browser_helper'},12);
    assert.equal(opened[1],ARCHIVE_ORIGIN + '/#airef-capture=' + token);
    location.hash = '#airef-capture=' + token;
    window.dispatchEvent(new window.Event('hashchange'));
    await settle(() => !document.getElementById('review-stage')!.hidden);
    assert.equal(location.hash,'');
    assert.equal(document.getElementById('message-count')!.textContent,'2 messages');
    assert.equal((document.getElementById('message-1') as HTMLTextAreaElement).value,capture().messages[1].content);
    assert.ok(!(document.getElementById('publish-confirm') as HTMLInputElement).checked);
    assert.equal(serverCalls,2,'Review must not publish or upload a browser capture');
    assert.ok(!JSON.stringify(state).includes('synthetic-invitation'));
    assert.ok(![...drafts.values()].join('').includes('synthetic-invitation'));
  } finally {
    for (const [key,descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis,key,descriptor); else Reflect.deleteProperty(globalThis,key); }
  }
});
