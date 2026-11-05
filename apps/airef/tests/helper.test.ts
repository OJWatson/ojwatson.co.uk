import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { captureVisibleChat } from '../extension/capture.ts';
import { CaptureSchema } from '../src/shared.ts';

test('browser helper captures loaded Claude text and fenced code without controls or hidden labels', () => {
  const { window } = parseHTML('<html><head><title>Claude - Synthetic example</title></head><body><div data-testid="chat-column-body"><div data-testid="user-message"><p>Print a number.</p><button>Copy</button></div><div data-testid="assistant-message"><h3 class="sr-only">Claude responded: Duplicate label</h3><p>Here is the code.</p><pre><code class="language-python">print(4)\n</code></pre><div role="toolbar">Read aloud</div><img src="private.png"></div></div></body></html>');
  const originals = Object.fromEntries(['document', 'Node', 'Element', 'location'].map(key => [key, (globalThis as any)[key]]));
  Object.assign(globalThis, { document: window.document, Node: window.Node, Element: window.Element, location: { href: 'https://claude.ai/share/00000000-0000-4000-8000-000000000000' } });
  try {
    const result = CaptureSchema.parse(captureVisibleChat());
    assert.equal(result.messages.length, 2); assert.equal(result.completeness, 'unknown');
    assert.ok(result.messages[1].content.includes('```python\nprint(4)'));
    assert.ok(!JSON.stringify(result).includes('Duplicate label')); assert.ok(!JSON.stringify(result).includes('Read aloud')); assert.ok(!JSON.stringify(result).includes('private.png'));
  } finally { Object.assign(globalThis, originals); }
});

test('browser helper refuses private chats and empty share shells', () => {
  const { window } = parseHTML('<html><head><title>Claude</title></head><body>Sign in</body></html>');
  const originals = Object.fromEntries(['document', 'Node', 'Element', 'location'].map(key => [key, (globalThis as any)[key]]));
  Object.assign(globalThis, { document: window.document, Node: window.Node, Element: window.Element, location: { href: 'https://claude.ai/chat/private-id' } });
  try {
    assert.throws(captureVisibleChat, /public/);
    (globalThis as any).location.href = 'https://claude.ai/share/00000000-0000-4000-8000-000000000000';
    assert.throws(captureVisibleChat, /No message containers/);
  } finally { Object.assign(globalThis, originals); }
});

test('browser helper reads current ChatGPT role headings and code blocks, excluding sidebar and controls', () => {
  const { window } = parseHTML('<html><head><title>ChatGPT - Public example</title></head><body><aside><div data-message-author-role="user">Private sidebar content</div></aside><main><div><h4 class="sr-only" data-conversation-role="user">You said:You</h4><div>Print a number.</div></div><div><h4 class="sr-only" data-conversation-role="assistant">ChatGPT said:ChatGPT</h4><div data-markdown-text-style="assistant-message"><p>Here is the code.</p><div data-code-block="true"><div data-markdown-copy="exclude">Python<button>Copy</button></div><div data-code-block-source="true"><code><span>print(4)\n</span></code></div></div></div></div></main></body></html>');
  const originals = Object.fromEntries(['document', 'Node', 'Element', 'location'].map(key => [key, (globalThis as any)[key]]));
  Object.assign(globalThis, { document: window.document, Node: window.Node, Element: window.Element, location: { href: 'https://chatgpt.com/share/00000000-0000-4000-8000-000000000000' } });
  try {
    const result = CaptureSchema.parse(captureVisibleChat());
    assert.deepEqual(result.messages.map(message => message.role), ['user','assistant']);
    assert.ok(result.messages[1].content.includes('```\nprint(4)\n'));
    assert.ok(!JSON.stringify(result).includes('Private sidebar')); assert.ok(!JSON.stringify(result).includes('ChatGPT said')); assert.ok(!JSON.stringify(result).includes('Copy')); assert.ok(!JSON.stringify(result).includes('Python'));
  } finally { Object.assign(globalThis, originals); }
});
