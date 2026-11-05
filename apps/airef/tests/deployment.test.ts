import test from 'node:test';
import assert from 'node:assert/strict';
import { requireFreePlan, type FreePlanEvidence } from '../scripts/deployment-policy.ts';

test('deployment gate accepts explicit Free and refuses paid, unknown, stale, and wrong-account evidence', () => {
  const account = 'a'.repeat(32);
  assert.doesNotThrow(() => requireFreePlan(account, [{ rate_plan: { id: 'workers_free', public_name: 'Workers Free' } }]));
  assert.throws(() => requireFreePlan(account, [{ rate_plan: { id: 'workers_paid', public_name: 'Workers Paid' } }]));
  assert.throws(() => requireFreePlan(account, null));
  assert.doesNotThrow(() => requireFreePlan(account, []));
  assert.doesNotThrow(() => requireFreePlan(account, [{ rate_plan: { id: 'unrelated_product', public_name: 'Other product' } }]));
  const evidence: FreePlanEvidence = { account_id: account, plan: 'free', checked_at: new Date().toISOString(), source_url: `https://dash.cloudflare.com/${account}/workers/plans`, observation: 'Free, $0, Current plan' };
  assert.doesNotThrow(() => requireFreePlan(account, null, evidence));
  assert.throws(() => requireFreePlan(account, null, { ...evidence, checked_at: '2020-01-01T00:00:00Z' }));
  assert.throws(() => requireFreePlan('b'.repeat(32), null, evidence));
  assert.throws(() => requireFreePlan(account, [{ rate_plan: { id: 'workers_paid' } }], evidence));
  assert.throws(() => requireFreePlan(account, [{ rate_plan: { id: 'workers_unknown' } }], evidence));
});
