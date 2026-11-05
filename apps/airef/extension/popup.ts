import { captureVisibleChat } from './capture.ts';
const button = document.getElementById('capture') as HTMLButtonElement;
const download = document.getElementById('download') as HTMLButtonElement;
const status = document.getElementById('status')!;
async function run(saveFile: boolean) {
  button.disabled = true; download.disabled = true;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab is available.');
    const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: captureVisibleChat });
    if (!result?.result) throw new Error('No capture was returned.');
    if (saveFile) {
      const blob = new Blob([JSON.stringify(result.result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      try { await chrome.downloads.download({ url, filename: `airef-capture-${new Date().toISOString().slice(0, 10)}.json`, saveAs: true }); }
      finally { URL.revokeObjectURL(url); }
      status.textContent = `Saved ${result.result.messages.length} loaded messages as JSON. Import the file into AIRef to review it.`;
    } else {
      const response = await chrome.runtime.sendMessage({ type: 'airef-review', capture: result.result, tabId: tab.id });
      if (!response?.ok) throw new Error(response?.error || 'Could not open the review screen. You can download JSON instead.');
      status.textContent = `Opened ${result.result.messages.length} loaded messages in AIRef. Nothing has been published.`;
    }
  } catch (error) { status.textContent = (error as Error).message; }
  finally { button.disabled = false; download.disabled = false; }
}
button.addEventListener('click', () => run(false));
download.addEventListener('click', () => run(true));
