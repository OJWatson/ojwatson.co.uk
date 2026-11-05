export interface FreePlanEvidence { account_id: string; plan: 'free'; checked_at: string; source_url: string; observation: string }

export function requireFreePlan(account: string, subscriptions: any[] | null, evidence?: FreePlanEvidence, now = Date.now()): void {
  const workers = subscriptions?.filter(item => /workers/i.test(JSON.stringify({ id: item.rate_plan?.id, name: item.rate_plan?.public_name, product: item.product?.name, component: item.component_values }))) || [];
  if (workers.some(item => /paid|standard|enterprise|unbound/i.test(`${item.rate_plan?.id} ${item.rate_plan?.public_name}`))) throw new Error('This account has a paid or unknown Workers subscription. AIRef must use a confirmed Free account. Nothing was deployed.');
  if (workers.length && workers.every(item => /free/i.test(`${item.rate_plan?.id} ${item.rate_plan?.public_name}`))) return;
  // A successful, complete subscription read with no Workers subscription means
  // the default Free tier. An unreadable API (null) is not an empty account.
  if (subscriptions !== null && workers.length === 0) return;
  if (workers.length) throw new Error('The Workers subscription is not an identifiable Free plan. Nothing was deployed.');
  // Some Free accounts have no Workers subscription row, and OAuth tokens may lack Billing Read.
  // Accept a fresh, explicit dashboard observation made by the operator in that case.
  const age = evidence ? now - Date.parse(evidence.checked_at) : Infinity;
  if (!evidence || evidence.account_id !== account || evidence.plan !== 'free' || age < 0 || age > 30 * 60 * 1000 ||
    evidence.source_url !== `https://dash.cloudflare.com/${account}/workers/plans` || !/current plan/i.test(evidence.observation)) {
    throw new Error('Workers Free status could not be confirmed. Supply a fresh account-matched dashboard observation in AIREF_FREE_PLAN_EVIDENCE; do not upgrade or enable billing.');
  }
}
