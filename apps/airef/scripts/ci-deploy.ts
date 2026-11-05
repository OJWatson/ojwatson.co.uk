import { readFile, writeFile, mkdir, stat, unlink, appendFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cfApi } from './sql.ts';
import { requireFreePlan } from './deployment-policy.ts';

interface Target { branch: string; origin: string; database_name: string; database_id: string }
interface Deployment { account_id: string; project: string; pages_hostname: string; compatibility_date: string; capture_relay_url: string; environments: Record<string, Target> }

export function requireTrustedWorkflow(env: NodeJS.ProcessEnv): void {
  if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REPOSITORY !== 'OJWatson/ojwatson.co.uk' || env.GITHUB_REF !== 'refs/heads/main' || !['push', 'workflow_dispatch'].includes(env.GITHUB_EVENT_NAME || '') || !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA || '')) {
    throw new Error('Deployment is restricted to the trusted main-branch GitHub workflow.');
  }
  if (!env.CLOUDFLARE_API_TOKEN) throw new Error('Add the AIREF_CLOUDFLARE_API_TOKEN Actions secret. No Cloudflare change was made.');
}

export function requireExistingProject(project: any, deployment: Deployment, environment: string): Target {
  const target = deployment.environments[environment];
  if (!target || !['preview', 'production'].includes(environment)) throw new Error('Use preview or production.');
  if (project?.name !== deployment.project || project?.subdomain !== deployment.pages_hostname || project?.production_branch !== deployment.environments.production.branch) throw new Error('The existing Pages project does not match the checked-in deployment configuration.');
  const config = project.deployment_configs?.[environment];
  if (!config || config.d1_databases?.DB?.id !== target.database_id || Object.keys(config.d1_databases).length !== 1) throw new Error('The existing D1 binding does not match. CI will not create or rebind databases.');
  if (config.env_vars?.PUBLIC_ORIGIN?.value !== target.origin || config.env_vars?.CAPTURE_RELAY_URL?.value !== deployment.capture_relay_url) throw new Error('The existing origin or capture-service URL does not match. Inspect configuration before deploying.');
  for (const key of ['CAPTURE_SIGNING_KEY', 'CAPTURE_RELAY_SECRET']) if (config.env_vars?.[key]?.type !== 'secret_text') throw new Error(`The existing ${key} secret is missing. CI does not generate or replace service secrets.`);
  return target;
}

export function deploymentConfig(deployment: Deployment, target: Target, appDirectory: string): string {
  return `name = ${JSON.stringify(deployment.project)}\ncompatibility_date = ${JSON.stringify(deployment.compatibility_date)}\npages_build_output_dir = ${JSON.stringify(resolve(appDirectory, 'dist'))}\n[vars]\nPUBLIC_ORIGIN = ${JSON.stringify(target.origin)}\nCAPTURE_RELAY_URL = ${JSON.stringify(deployment.capture_relay_url)}\n[[d1_databases]]\nbinding = "DB"\ndatabase_name = ${JSON.stringify(target.database_name)}\ndatabase_id = ${JSON.stringify(target.database_id)}\n`;
}

async function main() {
  requireTrustedWorkflow(process.env);
  const environment = process.argv[2];
  const appDirectory = process.cwd();
  const deployment: Deployment = JSON.parse(await readFile(resolve(appDirectory, 'deployment.json'), 'utf8'));
  process.env.CLOUDFLARE_ACCOUNT_ID = deployment.account_id;
  // Billing Read is required: unreadable subscriptions cannot be replaced with
  // an invented dashboard timestamp in unattended deployments.
  const subscriptions: any[] = [];
  for (let page = 1; ; page++) {
    const response = await cfApi<any[]>(`/accounts/${deployment.account_id}/subscriptions?page=${page}&per_page=50`);
    if (!Array.isArray(response.result)) throw new Error('Subscription verification returned an unexpected response.');
    subscriptions.push(...response.result);
    if (response.result_info?.total_pages ? page >= response.result_info.total_pages : response.result.length < 50) break;
    if (page >= 100) throw new Error('Subscription pagination did not finish.');
  }
  requireFreePlan(deployment.account_id, subscriptions);
  const projectPath = `/accounts/${deployment.account_id}/pages/projects/${deployment.project}`;
  const project = (await cfApi(projectPath)).result;
  const target = requireExistingProject(project, deployment, environment);
  const directory = resolve(appDirectory, 'outputs/ci', environment);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  await writeFile(resolve(directory, 'wrangler.toml'), deploymentConfig(deployment, target, appDirectory));
  function wrangler(args: string[], cwd = appDirectory) {
    const result = spawnSync(process.execPath, [resolve(appDirectory, 'node_modules/wrangler/bin/wrangler.js'), ...args], { cwd, stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
    if (result.status !== 0) throw new Error('Cloudflare deployment did not complete. Inspect the workflow logs before retrying.');
  }
  const worker = resolve(appDirectory, 'dist/_worker.js');
  if ((await stat(worker).catch(() => null))?.isFile()) await unlink(worker);
  wrangler(['pages', 'functions', 'build', resolve(appDirectory, 'functions'), '--outdir', worker, '--minify']);
  // Only deploy code to the existing project. No project/DB creation, schema
  // migration, configuration PATCH, secret write, DNS, or billing mutation.
  wrangler(['pages', 'deploy', resolve(appDirectory, 'dist'), '--project-name', deployment.project, '--branch', target.branch, '--commit-hash', process.env.GITHUB_SHA!, '--commit-dirty=false', '--no-bundle'], directory);
  requireExistingProject((await cfApi(projectPath)).result, deployment, environment);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `\nAIRef ${environment}: ${target.origin}\n\nCommit: \`${process.env.GITHUB_SHA}\`\n`);
  console.log(`Deployed ${environment} from GitHub. Existing database and secret bindings verified.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error((error as Error).message); process.exitCode = 1; });
