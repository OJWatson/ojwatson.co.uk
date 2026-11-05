import { createHandoff } from './handoff.ts';

const bridge = createHandoff({
  read: () => chrome.storage.session.get(null),
  write: (key, value) => chrome.storage.session.set({ [key]: value }),
  remove: keys => chrome.storage.session.remove(keys),
  open: async url => (await chrome.tabs.create({ url })).id!,
  // Protect existing drafts and keep invitation codes out of extension storage.
  returnTo: async (_tabId, _origin, url) => { await chrome.tabs.create({ url }); },
  now: Date.now,
  token: () => Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join(''),
});

let queue = Promise.resolve();
function respond(work: () => Promise<unknown>, sendResponse: (response: unknown) => void) {
  queue = queue.then(async () => {
    try { sendResponse(await work()); }
    catch (error) { sendResponse({ ok: false, error: error instanceof Error ? error.message : 'The helper could not finish.' }); }
  });
}
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if ((sender.frameId !== undefined && sender.frameId !== 0) || !sender.url) { sendResponse({ ok: false, error: 'Open the AIRef form in a browser tab.' }); return; }
  respond(() => bridge.external(message, sender.url!, sender.tab?.id), sendResponse);
  return true;
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Only our popup can submit a capture; provider pages have no content script.
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL('popup.html') || message?.type !== 'airef-review' || !Number.isInteger(message.tabId)) return;
  respond(() => bridge.review(message.capture, message.tabId), sendResponse);
  return true;
});
