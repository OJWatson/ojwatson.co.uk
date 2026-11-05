// Everything is inside this function because Chrome serializes it for executeScript.
// It reads the visible shared-page DOM; it does not access application state or cookies.
export function captureVisibleChat() {
  const url = new URL(location.href);
  const provider = ['chatgpt.com', 'chat.openai.com'].includes(url.hostname) ? 'chatgpt' : url.hostname === 'claude.ai' ? 'claude' : null;
  if (!provider || url.protocol !== 'https:' || !/^\/share\/[a-zA-Z0-9-]{8,80}\/?$/.test(url.pathname)) throw new Error('Open a public ChatGPT or Claude /share/… page first.');
  url.search = ''; url.hash = '';
  const scope = document.querySelector('[data-testid="chat-column-body"]') || document.querySelector('main') || document.body;
  let nodes: Element[] = [];
  if (provider === 'chatgpt') {
    nodes = [...new Set([...scope.querySelectorAll('[data-message-author-role], [data-conversation-role]')].map(node => node.hasAttribute('data-message-author-role') ? node : node.parentElement).filter(node => node !== null))];
  }
  else nodes = [...scope.querySelectorAll('[data-testid="user-message"], [data-testid="assistant-message"]')];
  nodes = nodes.filter(node => !nodes.some(other => other !== node && other.contains(node)));
  if (!nodes.length) throw new Error('No message containers were found. Wait for the shared conversation to load; its interface may also have changed.');
  function markdown(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof Element)) return '';
    if (node.matches('button, [role="toolbar"], .sr-only, [aria-hidden="true"], script, style, svg, [data-markdown-copy="exclude"], [data-testid="user-message-actions"], [data-testid="message-actions"]')) return '';
    if (/^H[1-6]$/.test(node.tagName) && /^(?:You said:|Claude responded:)/.test(node.textContent || '')) return '';
    if (node.tagName === 'PRE' || node.hasAttribute('data-code-block')) {
      const content = node.querySelector('code')?.textContent ?? node.textContent ?? '';
      const longest = Math.max(2, ...[...content.matchAll(/`+/g)].map(match => match[0].length));
      const fence = '`'.repeat(longest + 1);
      const language = node.querySelector('code')?.className.match(/language-([\w+-]+)/)?.[1] || '';
      return `\n\n${fence}${language}\n${content}\n${fence}\n\n`;
    }
    if (node.tagName === 'IMG') return '\n[Image omitted]\n';
    if (node.tagName === 'BR') return '\n';
    const content = [...node.childNodes].map(markdown).join('');
    if (node.tagName === 'CODE') { const fence = '`'.repeat(Math.max(1, ...[...content.matchAll(/`+/g)].map(match => match[0].length + 1))); return `${fence}${content}${fence}`; }
    if (/^H[1-6]$/.test(node.tagName)) return `\n\n${'#'.repeat(Number(node.tagName[1]))} ${content}\n\n`;
    if (node.tagName === 'LI') return `\n- ${content.trim()}\n`;
    if (['P', 'DIV', 'UL', 'OL', 'BLOCKQUOTE', 'TABLE', 'TR'].includes(node.tagName)) return `\n${content}\n`;
    if (node.tagName === 'STRONG' || node.tagName === 'B') return `**${content}**`;
    if (node.tagName === 'EM' || node.tagName === 'I') return `*${content}*`;
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (/^https?:\/\//.test(href)) return `[${content}](${href})`;
    }
    return content;
  }
  const messages = nodes.map(node => {
    const role = provider === 'chatgpt' ? node.getAttribute('data-message-author-role') || node.querySelector('[data-conversation-role]')?.getAttribute('data-conversation-role') : node.getAttribute('data-testid') === 'user-message' ? 'user' : 'assistant';
    const contentNode = provider === 'chatgpt' ? node.querySelector('.markdown, [data-markdown-text-style="assistant-message"], .whitespace-pre-wrap') || node : node;
    return { role, content: markdown(contentNode).trim(), timestamp: null, model: null };
  }).filter(message => ['user', 'assistant', 'tool'].includes(message.role || '') && message.content);
  if (!messages.length) throw new Error('The loaded messages contain no readable text.');
  const capture = {
    schema_version: '1.0', source_url: url.toString(), provider, title: document.title.replace(/^(?:ChatGPT|Claude)\s*[-–—:]?\s*/, '').slice(0, 300),
    captured_at: new Date().toISOString(), capture_method: 'browser_helper', importer_version: 'airef-browser/0.2.0', completeness: 'unknown',
    omissions: ['Browser-assisted capture of loaded message text and code only. Earlier, collapsed, or unloaded messages may be missing.', 'Attached files, generated artifacts, images, tool interfaces, and hidden instructions are not preserved.', 'Message timestamps and exact model identifiers are unavailable from this capture.'], messages,
  };
  if (new TextEncoder().encode(JSON.stringify(capture)).byteLength > 1048576) throw new Error('The loaded transcript exceeds the 1 MiB pilot limit.');
  return capture;
}
