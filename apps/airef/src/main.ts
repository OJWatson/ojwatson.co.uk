import { CaptureSchema, IMPORTER_VERSION, MAX_RECORD_BYTES, MetadataSchema, canonicalJson, findSensitive, importJson, shareSource, type Capture, type Metadata } from './shared.ts';
import { renderMarkdown } from './markdown.ts';
import { parseShareHtml } from '../server/capture.ts';
import { helperMessage } from './helper.ts';

const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => element<HTMLInputElement>(id);
const DRAFT_KEY = 'airef-draft-v1';
let capture: Capture | null = null;
let publicationKey = crypto.randomUUID();
let pendingPayload: string | null = null;
let completedUrl = '';
let blockedSource = '';

async function browserCapture(url: string) {
  blockedSource = url;
  element('browser-capture').hidden = false;
  element<HTMLAnchorElement>('open-share').href = url;
  try {
    await helperMessage({ type: 'airef-ping' });
    element('helper-state').textContent = 'AIRef helper is ready in this browser.';
    element('open-with-helper').hidden = false;
  } catch {
    element('helper-state').textContent = 'Install or update the helper in Chrome, then reload AIRef. If it is already installed, open the shared conversation below and click it there.';
    element('open-with-helper').hidden = true;
  }
}

function status(id: string, message: string, warning = false) { const target = element(id); target.textContent = message; target.hidden = !message; target.classList.toggle('warning', warning); }
function metadata(): Metadata {
  return MetadataSchema.parse({ title: input('record-title').value, author_name: input('author-name').value, affiliation: input('affiliation').value,
    orcid: input('orcid').value, archiver_name: input('archiver-name').value, description: element<HTMLTextAreaElement>('description').value, license: element<HTMLSelectElement>('license').value });
}
function saveDraft() {
  if (!capture) return;
  const fields = ['record-title', 'author-name', 'affiliation', 'orcid', 'archiver-name', 'description', 'license'];
  const values = Object.fromEntries(fields.map(id => [id, (element(id) as HTMLInputElement).value]));
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ capture, publicationKey, values, pendingPayload })); }
  catch { status('review-status', 'This tab cannot save its temporary draft. Keep it open until you publish or download your transcript.', true); }
  const bytes = new TextEncoder().encode(canonicalJson({ capture, values })).byteLength;
  element('draft-size').textContent = `${Math.ceil(bytes / 1024)} KiB draft · 1 MiB record limit`;
}
function changed() {
  if (pendingPayload) { pendingPayload = null; publicationKey = crypto.randomUUID(); status('review-status', 'The draft changed after a publication attempt. Check the previous result before publishing a separate record.', true); }
  input('publish-confirm').checked = false;
  saveDraft();
}
function updateWarnings() {
  if (!capture) return;
  const findings = findSensitive(capture.messages);
  const target = element('sensitive-notice');
  target.hidden = !findings.length;
  target.textContent = findings.length ? `Review suggested: ${findings.map(f => `${f.label} in message ${f.index + 1}`).join('; ')}. This check cannot detect all sensitive information.` : '';
}

function renderEditors() {
  if (!capture) return;
  const container = element('message-editors'); container.replaceChildren();
  element('message-count').textContent = `${capture.messages.length} messages`;
  capture.messages.forEach((message, index) => {
    const article = document.createElement('article'); article.className = `message-editor ${message.role}`;
    const heading = document.createElement('div'); heading.className = 'message-heading';
    const label = document.createElement('label'); label.htmlFor = `message-${index}`; label.textContent = `${String(index + 1).padStart(2, '0')} / ${message.role.toUpperCase()}`;
    const remove = document.createElement('button'); remove.className = 'text-button'; remove.type = 'button'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove message ${index + 1}`);
    remove.addEventListener('click', () => { capture!.messages.splice(index, 1); capture!.completeness = 'partial'; if (!capture!.omissions.includes('Messages were removed during review.')) capture!.omissions.push('Messages were removed during review.'); changed(); showScope(); renderEditors(); });
    heading.append(label, remove);
    const textarea = document.createElement('textarea'); textarea.id = `message-${index}`; textarea.value = message.content; textarea.rows = Math.min(16, Math.max(4, message.content.split('\n').length + 1)); textarea.spellcheck = false;
    textarea.addEventListener('input', () => { message.content = textarea.value; changed(); updateWarnings(); });
    const actions = document.createElement('div'); actions.className = 'editor-actions';
    const redact = document.createElement('button'); redact.type = 'button'; redact.className = 'text-button'; redact.textContent = 'Redact selection';
    redact.addEventListener('click', () => { if (textarea.selectionStart === textarea.selectionEnd) { textarea.focus(); return; } textarea.setRangeText('[REDACTED]', textarea.selectionStart, textarea.selectionEnd, 'end'); message.content = textarea.value; changed(); updateWarnings(); textarea.focus(); });
    const preview = document.createElement('button'); preview.type = 'button'; preview.className = 'text-button'; preview.textContent = 'Preview formatting';
    const rendered = document.createElement('div'); rendered.className = 'markdown preview-message'; rendered.hidden = true;
    preview.addEventListener('click', () => { rendered.hidden = !rendered.hidden; if (!rendered.hidden) rendered.innerHTML = renderMarkdown(message.content); preview.textContent = rendered.hidden ? 'Preview formatting' : 'Hide preview'; });
    actions.append(redact, preview); article.append(heading, textarea, actions, rendered); container.append(article);
  });
  updateWarnings();
}

function showScope() {
  if (!capture) return;
  const summary = element('capture-summary'); summary.replaceChildren();
  for (const text of [capture.provider === 'chatgpt' ? 'ChatGPT' : 'Claude', `${capture.messages.length} text messages`, capture.completeness === 'shared_snapshot' ? 'Shared snapshot' : 'Partial / unverified capture']) {
    const span = document.createElement('span'); span.textContent = text; summary.append(span);
  }
  element('capture-notes').replaceChildren();
  const title = document.createElement('strong'); title.textContent = 'Capture scope'; element('capture-notes').append(title);
  const list = document.createElement('ul');
  for (const note of capture.omissions) { const item = document.createElement('li'); item.textContent = note; list.append(item); }
  if (capture.capture_method !== 'server_fetch') { const item = document.createElement('li'); item.textContent = 'Source details are supplied by the importer. AIRef has not independently retrieved this transcript.'; list.append(item); }
  element('capture-notes').append(list);
  element('partial-label').hidden = capture.completeness === 'shared_snapshot';
}

function review(value: Capture) {
  capture = value; pendingPayload = null; publicationKey = crypto.randomUUID();
  element('capture-stage').hidden = true; element('review-stage').hidden = false; element('how-it-works').hidden = true;
  input('record-title').value = value.title;
  input('review-invite').value = input('invite-code').value;
  showScope(); renderEditors(); saveDraft(); window.scrollTo({ top: 0 }); input('record-title').focus();
}

async function api(path: string, payload: unknown): Promise<any> {
  const code = input(path === '/api/publish' ? 'review-invite' : 'invite-code').value.trim();
  if (!code) throw new Error('Enter your invitation code in the capture form first.');
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${code}` }, body: typeof payload === 'string' ? payload : JSON.stringify(payload), signal: AbortSignal.timeout(30000) });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.message || 'The request could not finish. Keep your draft and retry.');
  return data;
}

element<HTMLFormElement>('capture-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = element<HTMLButtonElement>('capture-button'); button.disabled = true; button.textContent = 'Retrieving shared snapshot…'; status('capture-status', 'Reading the public conversation. Nothing will be published automatically.');
  element('browser-capture').hidden = true;
  try {
    const source = shareSource(input('share-url').value);
    const response = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${input('invite-code').value.trim()}` }, body: JSON.stringify({ url: source.url }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      const error = await response.json().catch(() => null) as any;
      if (error?.error === 'browser_capture_required') {
        status('capture-status', 'The provider blocked AIRef’s automatic retrieval. Nothing has been captured or published. Continue with the browser helper below.', true);
        await browserCapture(source.url); return;
      }
      throw new Error(error?.message || 'The source could not be retrieved. Keep your draft and retry later.');
    }
    let capture: Capture;
    try { capture = await parseShareHtml(await response.text(), source.url); }
    catch (error) {
      status('capture-status', `${(error as Error).message} Continue with the browser helper below.`, true);
      await browserCapture(source.url); return;
    }
    capture.captured_at = response.headers.get('X-AIRef-Captured-At'); capture.source_payload_sha256 = response.headers.get('X-AIRef-Source-SHA256') || undefined; capture.receipt = response.headers.get('X-AIRef-Receipt') || undefined;
    review(CaptureSchema.parse(capture));
  }
  catch (error) { status('capture-status', `${(error as Error).message} You can also import a JSON capture below.`, true); }
  finally { button.disabled = false; button.innerHTML = 'Capture conversation <span aria-hidden="true">→</span>'; }
});

element('open-with-helper').addEventListener('click', async () => {
  const button = element<HTMLButtonElement>('open-with-helper'); button.disabled = true;
  try {
    await helperMessage({ type: 'airef-open-share', url: blockedSource });
    element('helper-state').textContent = 'The shared conversation is open. Click the AIRef helper there to capture it and return for review.';
  } catch (error) { element('helper-state').textContent = (error as Error).message; }
  finally { button.disabled = false; }
});

input('json-file').addEventListener('change', async () => {
  const file = input('json-file').files?.[0];
  if (!file) return;
  try {
    if (file.size > MAX_RECORD_BYTES * 2) throw new Error('This JSON file is too large for the pilot.');
    const value = importJson(JSON.parse(await file.text()));
    review(value);
  } catch (error) { status('capture-status', `Could not import this file: ${(error as Error).message}`, true); }
  input('json-file').value = '';
});

for (const id of ['record-title', 'author-name', 'affiliation', 'orcid', 'archiver-name', 'description', 'license']) element(id).addEventListener('input', changed);

element<HTMLFormElement>('publish-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!capture) return;
  const button = element<HTMLButtonElement>('publish-button');
  try {
    const approved = CaptureSchema.parse(capture);
    if (!approved.messages.length) throw new Error('Keep at least one message in the record.');
    if (approved.completeness !== 'shared_snapshot' && !input('partial-confirm').checked) throw new Error('Acknowledge the capture limitations before publishing.');
    if (!input('publish-confirm').checked) throw new Error('Review and confirm publication first.');
    if (!input('review-invite').value.trim()) throw new Error('Enter your invitation code in The reference panel.');
    const payload = pendingPayload || JSON.stringify({ idempotency_key: publicationKey, capture: approved, metadata: metadata(), reviewed: true, acknowledge_partial: input('partial-confirm').checked });
    pendingPayload = payload; saveDraft(); element('review-stage').inert = true; button.disabled = true; button.textContent = 'Publishing your frozen record…'; status('review-status', 'Saving the approved snapshot. Keep this tab open.');
    const result = await api('/api/publish', payload);
    sessionStorage.removeItem(DRAFT_KEY); capture = null; pendingPayload = null; completedUrl = result.url;
    for (const id of ['capture-stage', 'review-stage', 'how-it-works']) element(id).hidden = true;
    element('success-stage').hidden = false;
    const link = element<HTMLAnchorElement>('success-url'); link.href = result.url; link.textContent = result.url;
    element<HTMLAnchorElement>('open-record').href = result.url; element('success-message').textContent = `Archived ${new Date(result.archived_at).toLocaleString()} · SHA-256 integrity manifest included`;
    window.scrollTo({ top: 0 }); link.focus();
  } catch (error) { status('review-status', (error as Error).message, true); }
  finally { element('review-stage').inert = false; button.disabled = false; button.innerHTML = 'Publish frozen record <span aria-hidden="true">↗</span>'; }
});

element('copy-url').addEventListener('click', async () => { try { await navigator.clipboard.writeText(completedUrl); element('copy-url').textContent = 'Link copied'; } catch { element('success-message').textContent = 'Select and copy the record URL above.'; } });
element('start-over').addEventListener('click', () => {
  if (!window.confirm('Discard this temporary draft and start again?')) return;
  sessionStorage.removeItem(DRAFT_KEY); window.location.reload();
});

const initialHandoff = window.location.hash.startsWith('#airef-capture=');
try {
  const stored = sessionStorage.getItem(DRAFT_KEY);
  if (stored && !initialHandoff) {
    const draft = JSON.parse(stored); review(CaptureSchema.parse(draft.capture)); publicationKey = draft.publicationKey || crypto.randomUUID(); pendingPayload = draft.pendingPayload || null;
    for (const [id, value] of Object.entries(draft.values || {})) if (document.getElementById(id)) (element(id) as HTMLInputElement).value = String(value);
    saveDraft(); status('review-status', 'Your temporary draft was restored. Re-enter your invitation code before publishing.');
  }
} catch { /* A stale or disabled browser store must not prevent a fresh capture. */ }

async function receiveCapture() {
  const match = /^#airef-capture=([a-f0-9]{64})$/.exec(window.location.hash);
  if (!match) return;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  status('capture-status', 'Opening your browser capture. Nothing has been published.');
  try {
    const response = await helperMessage({ type: 'airef-consume-capture', token: match[1] });
    const value = importJson(response.capture);
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_RECORD_BYTES) throw new Error('This capture exceeds the 1 MiB limit.');
    review(value);
    status('review-status', 'Your browser capture is ready to review. Add citation details and your invitation code before publishing.');
  } catch (error) { status('capture-status', (error as Error).message, true); }
}
window.addEventListener('hashchange', receiveCapture);
void receiveCapture();

// A harmless import-version marker makes built clients distinguishable in troubleshooting.
document.documentElement.dataset.importer = IMPORTER_VERSION;
