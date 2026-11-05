import { readFile, writeFile, mkdir, unlink, stat } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { cfApi } from './sql.ts';
import { requireFreePlan, type FreePlanEvidence } from './deployment-policy.ts';

const target = process.argv[2];
const PROJECT = 'airef';
async function main() {
  if (!['check', 'preview', 'production'].includes(target)) throw new Error('Use check, preview, or production.');
  const evidencePath = process.env.AIREF_FREE_PLAN_EVIDENCE || 'outputs/deployment/free-plan.json';
  let evidence: FreePlanEvidence | undefined;
  try { evidence = JSON.parse(await readFile(evidencePath, 'utf8')); } catch { /* API evidence may be sufficient. */ }
  const account = process.env.CLOUDFLARE_ACCOUNT_ID || evidence?.account_id;
  if (!account || !/^[a-f0-9]{32}$/.test(account)) throw new Error('Set CLOUDFLARE_ACCOUNT_ID for the intended personal account.');
  process.env.CLOUDFLARE_ACCOUNT_ID = account;
  let subscriptions: any[] | null = [];
  try {
    for (let page = 1; ; page++) {
      const response = await cfApi<any[]>(`/accounts/${account}/subscriptions?page=${page}&per_page=50`);
      subscriptions.push(...response.result);
      if (page >= (response.result_info?.total_pages || 1)) break;
    }
  } catch { subscriptions = null; }
  requireFreePlan(account, subscriptions, evidence);
  // Also verifies that a usable deployment credential is available. Never creates a credential.
  await cfApi(`/accounts/${account}`);
  console.log('Confirmed Workers Free account and authenticated account access. No paid services will be provisioned.');
  if (target === 'check') return;
  const production = target === 'production';
  const databaseName = `airef-${production ? 'production' : 'preview'}`;
  const existing = await cfApi<any[]>(`/accounts/${account}/d1/database?name=${databaseName}`);
  let database = existing.result.find(item => item.name === databaseName);
  if (!database) database = (await cfApi<any>(`/accounts/${account}/d1/database`, { method: 'POST', body: JSON.stringify({ name: databaseName }) })).result;
  let project: any;
  for (let page = 1; ; page++) {
    const projects = await cfApi<any[]>(`/accounts/${account}/pages/projects?page=${page}&per_page=10`);
    project = projects.result.find(item => item.name === PROJECT);
    if (project || page >= (projects.result_info?.total_pages || 1)) break;
  }
  if (!project) project = (await cfApi<any>(`/accounts/${account}/pages/projects`, { method: 'POST', body: JSON.stringify({ name: PROJECT, production_branch: 'main' }) })).result;
  if (!/^[a-z0-9-]+\.pages\.dev$/.test(project.subdomain || '')) throw new Error('Cloudflare did not return a valid Pages hostname. Inspect the project before deploying.');
  const origin = production ? 'https://airef.ojwatson.co.uk' : `https://preview.${project.subdomain}`;
  const environment = production ? 'production' : 'preview';
  const config = project.deployment_configs?.[environment] || {};
  if (config.d1_databases?.DB?.id && config.d1_databases.DB.id !== database.uuid) throw new Error('An existing AIRef project points to a different database. Inspect it before making any change.');
  // Secret values returned by GET are redacted. Omit existing secrets from PATCH
  // so the API preserves them instead of replacing them with an empty value.
  const plainVars: Record<string, string> = { PUBLIC_ORIGIN: origin };
  const relayUrl = config.env_vars?.CAPTURE_RELAY_URL?.value;
  if (relayUrl) {
    const endpoint = new URL(relayUrl);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.port || endpoint.search || endpoint.hash || !config.env_vars?.CAPTURE_RELAY_SECRET) throw new Error('The optional capture service is not configured correctly. Nothing was deployed.');
    plainVars.CAPTURE_RELAY_URL = endpoint.toString();
  }
  const envVars: Record<string, { type: string; value: string }> = Object.fromEntries(Object.entries(plainVars).map(([key, value]) => [key, { type: 'plain_text', value }]));
  if (!config.env_vars?.CAPTURE_SIGNING_KEY) envVars.CAPTURE_SIGNING_KEY = { type: 'secret_text', value: randomBytes(32).toString('base64url') };
  // GET includes read-only fields (including legacy usage_model); PATCH only owned configuration.
  await cfApi(`/accounts/${account}/pages/projects/${PROJECT}`, { method: 'PATCH', body: JSON.stringify({ deployment_configs: { [environment]: { env_vars: envVars, d1_databases: { DB: { id: database.uuid } } } } }) });
  const deploymentDirectory = resolve(`outputs/deployment/${environment}`);
  await mkdir(deploymentDirectory, { recursive: true });
  await writeFile(`${deploymentDirectory}/package.json`, JSON.stringify({ name: `airef-${environment}-deployment`, private: true, type: 'module' }));
  // Pages requires a conventionally named config in its working directory.
  // Keep remote bindings isolated from the local development configuration.
  await unlink(`${deploymentDirectory}/functions`).catch(error => { if (error.code !== 'ENOENT') throw error; });
  const configPath = `${deploymentDirectory}/wrangler.toml`;
  const varsToml = Object.entries(plainVars).map(([key, value]) => `${key} = ${JSON.stringify(value)}`).join('\n');
  await writeFile(configPath, `name = "${PROJECT}"\ncompatibility_date = "2026-11-03"\npages_build_output_dir = ${JSON.stringify(resolve('dist'))}\n[vars]\n${varsToml}\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = ${JSON.stringify(databaseName)}\ndatabase_id = ${JSON.stringify(database.uuid)}\nmigrations_dir = ${JSON.stringify(resolve('migrations'))}\n`, { mode: 0o600 });
  await writeFile(`outputs/deployment/${environment}.json`, JSON.stringify({ account_id: account, database_id: database.uuid, project: PROJECT, pages_hostname: project.subdomain, origin, free_plan_checked_at: new Date().toISOString() }, null, 2), { mode: 0o600 });
  function wrangler(args: string[], cwd = process.cwd()) {
    const result = spawnSync(process.execPath, [resolve('node_modules/wrangler/bin/wrangler.js'), ...args], { cwd, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
    if (result.status !== 0) throw new Error('Wrangler did not complete. Existing records have not been deleted. Re-run after resolving its reported error.');
  }
  wrangler(['d1', 'migrations', 'apply', 'DB', '--remote', '--config', configPath]);
  const workerOutput = resolve('dist/_worker.js');
  if ((await stat(workerOutput).catch(() => null))?.isFile()) await unlink(workerOutput);
  wrangler(['pages', 'functions', 'build', resolve('functions'), '--outdir', workerOutput, '--minify']);
  wrangler(['pages', 'deploy', resolve('dist'), '--project-name', PROJECT, '--branch', production ? 'main' : 'preview', '--commit-dirty=true', '--no-bundle'], deploymentDirectory);
  console.log(`Deployed ${environment}. Expected stable origin: ${origin}. Independently verify the live record workflow before using it.`);
}

main().catch(error => { console.error((error as Error).message); process.exitCode = 1; });
