import type { Capture, PublishInput } from '../src/shared.ts';

export const SOURCE = 'https://chatgpt.com/share/00000000-0000-4000-8000-000000000000';
export const CLAUDE_SOURCE = 'https://claude.ai/share/00000000-0000-4000-8000-000000000000';
export function capture(): Capture {
  return { schema_version: '1.0', source_url: SOURCE, provider: 'chatgpt', title: 'Synthetic reproducibility example', captured_at: '2026-11-03T12:00:00.000Z', capture_method: 'json_import', importer_version: 'fixture/1.0', completeness: 'shared_snapshot', omissions: ['Synthetic test conversation, not a provider-authenticated record.'], messages: [
    { role: 'user', content: 'Show a reproducible calculation for the mean of 2, 4, and 6.', timestamp: null, model: null },
    { role: 'assistant', content: 'The mean is **4**.\n\n```python\nvalues = [2, 4, 6]\nprint(sum(values) / len(values))\n```', timestamp: null, model: null },
  ] };
}
export function publication(): PublishInput {
  return { idempotency_key: crypto.randomUUID(), capture: capture(), metadata: { title: 'A reproducible mean calculation', author_name: 'Example Researcher', affiliation: '', orcid: '', archiver_name: '', description: 'Synthetic data for testing AIRef.', license: 'CC-BY-4.0' }, reviewed: true, acknowledge_partial: false };
}
export function chatgptData() {
  return { title: 'Synthetic branch example', current_node: 'a', mapping: {
    s: { parent: null, children: ['u'], message: { author: { role: 'system' }, content: { parts: ['Do not include hidden instructions'] } } },
    u: { parent: 's', children: ['a', 'alternative'], message: { author: { role: 'user' }, content: { parts: ['Print a number'] }, create_time: 1793707200 } },
    a: { parent: 'u', children: [], message: { author: { role: 'assistant' }, content: { parts: ['```python\nprint(4)\n```'] }, metadata: { model_slug: 'displayed-model-label' } } },
    alternative: { parent: 'u', children: [], message: { author: { role: 'assistant' }, content: { parts: ['WRONG BRANCH'] } } },
  } };
}
