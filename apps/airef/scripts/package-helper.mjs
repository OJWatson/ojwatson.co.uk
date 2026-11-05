import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { zipSync, strToU8 } from 'fflate';
import { captureVisibleChat } from '../extension/capture.ts';

await mkdir('dist/helper', { recursive: true });
const files = {};
for (const name of ['manifest.json', 'popup.html', 'popup.css']) {
  await copyFile(`extension/${name}`, `dist/helper/${name}`);
  files[name] = new Uint8Array(await readFile(`dist/helper/${name}`));
}
files['popup.js'] = new Uint8Array(await readFile('dist/helper/popup.js'));
files['background.js'] = new Uint8Array(await readFile('dist/helper/background.js'));
for (const name of await readdir('dist/helper/assets').catch(() => [])) {
  files[`assets/${name}`] = new Uint8Array(await readFile(`dist/helper/assets/${name}`));
}
await writeFile('dist/helper/capture-source.txt', captureVisibleChat.toString());
files['capture-source.txt'] = strToU8(captureVisibleChat.toString());
const source = captureVisibleChat.toString().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
await writeFile('dist/helper/source.html', `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Capture helper source · AIRef</title><link rel="stylesheet" href="/style.css"></head><body><main class="article-layout"><h1>Capture helper source</h1><p>This is the exact DOM-reading function packaged in the helper. It does not execute provider scripts or read account credentials.</p><pre id="capture-source">${source}</pre><a href="/helper/">Return to helper instructions</a></main></body></html>`);
files['README.txt'] = strToU8('AIRef capture helper 0.2.0\n\nUnzip this folder, open chrome://extensions, enable Developer mode, choose Load unpacked, and select this folder.\nUse only on public ChatGPT or Claude /share/ pages. Expand earlier messages, click the helper, then Capture and review in AIRef. A new AIRef tab opens with a private draft. Nothing is published until you review and confirm. Download JSON is also available.\nCaptures are held temporarily in extension session memory. Handoffs expire after 15 minutes, can be consumed once, and are restricted to the official AIRef production and preview origins. No provider credentials or cookies are read.\n');
await writeFile('dist/airef-browser-helper.zip', zipSync(files));
console.log('Browser helper packaged: dist/airef-browser-helper.zip');
