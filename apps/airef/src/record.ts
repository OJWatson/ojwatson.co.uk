import { citation, sha256, type ArchiveRecord } from './shared.ts';
import { renderMarkdown } from './markdown.ts';

const container = document.getElementById('record-content');
if (container) void load();

function text(tag: string, value: string, className = '') { const element = document.createElement(tag); element.textContent = value; element.className = className; return element; }
async function load() {
  const target = container!;
  try {
    const path = window.location.pathname.replace(/\/$/, '');
    const response = await fetch(`${path}/conversation.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(response.status === 410 ? 'This record has been withdrawn. Reload to view its citation page.' : 'The transcript could not be loaded. Please retry.');
    const raw = await response.text();
    const digest = response.headers.get('X-Content-SHA256');
    if (!digest || await sha256(raw) !== digest) throw new Error('The transcript failed its integrity check. Do not rely on this download; contact the archive administrator.');
    const record: ArchiveRecord = JSON.parse(raw);
    target.replaceChildren();
    const actions = document.createElement('nav'); actions.className = 'record-actions'; actions.setAttribute('aria-label', 'Record downloads');
    for (const [label, file] of [['JSON', 'conversation.json'], ['Markdown', 'transcript.md'], ['BibTeX', 'citation.bib'], ['SHA-256', 'manifest.sha256']]) {
      const link = document.createElement('a'); link.textContent = `↓ ${label}`; link.href = `${path}/${file}`; link.className = 'button secondary small'; actions.append(link);
    }
    const print = document.createElement('button'); print.textContent = 'Print / PDF'; print.className = 'button subtle small'; print.addEventListener('click', () => window.print()); actions.append(print); target.append(actions);
    if (record.metadata.description) target.append(text('p', record.metadata.description, 'record-description'));
    const citeBox = document.createElement('section'); citeBox.className = 'citation-box'; citeBox.append(text('div', 'CITE THIS RECORD', 'eyebrow'), text('p', citation(record)));
    const copy = document.createElement('button'); copy.className = 'text-button'; copy.textContent = 'Copy citation'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(citation(record)); copy.textContent = 'Citation copied'; } catch { copy.textContent = 'Select and copy the citation above'; } }); citeBox.append(copy); target.append(citeBox);
    const details = document.createElement('details'); details.className = 'provenance'; details.open = true;
    details.append(text('summary', 'About this snapshot'));
    const grid = document.createElement('dl'); grid.className = 'metadata-grid';
    const rows = [['Archived (UTC)', record.archived_at], ['Source', record.source.url], ['Provider', record.source.provider === 'chatgpt' ? 'ChatGPT' : 'Claude'], ['Archived by', record.metadata.archiver_name || record.metadata.author_name], ['Attribution', 'Names, affiliation, and ORCID are user-provided; identity has not been verified.'], ['Affiliation', record.metadata.affiliation || 'Not supplied'], ['ORCID', record.metadata.orcid || 'Not supplied'], ['Capture method', record.source.capture_method.replaceAll('_', ' ')], ['Capture time', record.source.captured_at || 'Not available'], ['Source receipt', record.source.capture_attestation === 'server_receipt' ? 'AIRef retrieved source bytes. Transcript extraction and review take place in the browser; this is not provider authentication.' : 'Importer-supplied; not independently retrieved by AIRef.'], ['Capture scope', record.source.completeness.replaceAll('_', ' ')], ['Importer', record.source.importer_version], ['Reuse permissions', record.metadata.license], ['SHA-256 of source bytes', record.source.source_payload_sha256 || 'Not available'], ['SHA-256 of JSON', digest]];
    for (const [label, value] of rows) { grid.append(text('dt', label), text('dd', value)); }
    details.append(grid);
    const notes = document.createElement('ul'); for (const note of record.source.omissions) notes.append(text('li', note)); details.append(notes); target.append(details);
    if (record.source.completeness !== 'shared_snapshot') target.append(text('p', 'This is a partial or unverified capture. Read the capture scope and omissions above before citing it.', 'notice warning'));
    const transcript = document.createElement('section'); transcript.className = 'frozen-transcript'; transcript.append(text('h2', 'The conversation'));
    record.messages.forEach((message, index) => {
      const article = document.createElement('article'); article.id = `message-${index + 1}`; article.className = `frozen-message ${message.role}`;
      const heading = document.createElement('div'); heading.className = 'message-heading'; const anchor = document.createElement('a'); anchor.href = `#message-${index + 1}`; anchor.textContent = `${String(index + 1).padStart(2, '0')} / ${message.role.toUpperCase()}`; heading.append(anchor);
      if (message.timestamp) heading.append(text('time', message.timestamp)); if (message.model) heading.append(text('span', message.model));
      const content = document.createElement('div'); content.className = 'markdown'; content.innerHTML = renderMarkdown(message.content); article.append(heading, content); transcript.append(article);
    });
    target.append(transcript);
  } catch (error) { target.replaceChildren(text('p', (error as Error).message, 'notice warning')); }
}
