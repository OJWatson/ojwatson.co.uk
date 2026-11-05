import MarkdownIt from 'markdown-it';

const renderer = new MarkdownIt({ html: false, linkify: false, breaks: true });
renderer.renderer.rules.image = (tokens, index) => `<span class="omission">[Image omitted: ${renderer.utils.escapeHtml(tokens[index].content || 'image')}]</span>`;
const originalLink = renderer.renderer.rules.link_open;
renderer.renderer.rules.link_open = (tokens, index, options, env, self) => {
  tokens[index].attrSet('rel', 'noopener noreferrer');
  tokens[index].attrSet('target', '_blank');
  return originalLink ? originalLink(tokens, index, options, env, self) : self.renderToken(tokens, index, options);
};
export function renderMarkdown(value: string): string { return renderer.render(value); }
