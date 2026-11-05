import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { requireTrustedWorkflow, requireExistingProject, deploymentConfig } from '../scripts/ci-deploy.ts';

const deployment = JSON.parse(await readFile(new URL('../deployment.json', import.meta.url), 'utf8'));
function project() {
  return { name: deployment.project, subdomain: deployment.pages_hostname, production_branch: 'main', deployment_configs: Object.fromEntries(Object.entries(deployment.environments).map(([name, target]: [string, any]) => [name, {
    d1_databases: { DB: { id: target.database_id } }, env_vars: {
      PUBLIC_ORIGIN: { value: target.origin }, CAPTURE_RELAY_URL: { value: deployment.capture_relay_url }, CAPTURE_SIGNING_KEY: { type: 'secret_text', value: '' }, CAPTURE_RELAY_SECRET: { type: 'secret_text', value: '' },
    },
  }])) };
}
test('CI deployment refuses local, fork, pull-request, other-branch, and missing-token contexts', () => {
  const valid = { GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'OJWatson/ojwatson.co.uk', GITHUB_REF: 'refs/heads/main', GITHUB_EVENT_NAME: 'push', GITHUB_SHA: 'a'.repeat(40), CLOUDFLARE_API_TOKEN: 'synthetic' };
  assert.doesNotThrow(() => requireTrustedWorkflow(valid));
  for (const change of [{ GITHUB_ACTIONS: undefined }, { GITHUB_REPOSITORY: 'untrusted/fork' }, { GITHUB_REF: 'refs/heads/feature' }, { GITHUB_EVENT_NAME: 'pull_request' }, { CLOUDFLARE_API_TOKEN: undefined }]) assert.throws(() => requireTrustedWorkflow({ ...valid, ...change }));
});
test('CI deployment preserves exact environment bindings and refuses existing configuration mismatches', () => {
  assert.equal(requireExistingProject(project(), deployment, 'production').database_id, deployment.environments.production.database_id);
  for (const change of [
    (p: any) => { p.name = 'other'; },
    (p: any) => { p.deployment_configs.production.d1_databases.DB.id = deployment.environments.preview.database_id; },
    (p: any) => { p.deployment_configs.production.env_vars.PUBLIC_ORIGIN.value = 'https://wrong.example'; },
    (p: any) => { delete p.deployment_configs.production.env_vars.CAPTURE_SIGNING_KEY; },
    (p: any) => { p.deployment_configs.production.env_vars.CAPTURE_RELAY_URL.value = 'https://wrong.example'; },
  ]) { const p = project(); change(p); assert.throws(() => requireExistingProject(p, deployment, 'production')); }
  const toml = deploymentConfig(deployment, deployment.environments.production, '/tmp/airef');
  assert.ok(toml.includes(deployment.environments.production.database_id));
  assert.ok(!toml.includes(deployment.environments.preview.database_id));
  assert.ok(!toml.includes('CAPTURE_SIGNING_KEY')); assert.ok(!toml.includes('CAPTURE_RELAY_SECRET'));
});
