import { HELPER_ID } from '../extension/bridge-config.ts';

export function helperMessage(message: unknown): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) { reject(new Error('Install the AIRef helper in Chrome, then reload this page.')); return; }
    const timer = setTimeout(() => reject(new Error('The browser helper did not respond. Reload this page after installing it.')), 10000);
    chrome.runtime.sendMessage(HELPER_ID, message, response => {
      clearTimeout(timer);
      const error = chrome.runtime.lastError;
      if (error || !response) reject(new Error('Install or enable the AIRef helper, then reload this page.'));
      else if (!response.ok) reject(new Error(response.error || 'The helper could not finish.'));
      else resolve(response);
    });
  });
}
