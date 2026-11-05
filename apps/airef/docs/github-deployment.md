# GitHub deployment

AIRef lives in `apps/airef/` in [OJWatson/ojwatson.co.uk](https://github.com/OJWatson/ojwatson.co.uk/tree/main/apps/airef). The Hugo website remains at the repository root with its existing Netlify configuration.

`.github/workflows/airef.yml` runs Node 24, a clean dependency installation, the tests, and the app/helper build for AIRef pull requests. Changes under `apps/airef/` merged into `main` deploy to the existing Cloudflare preview, verify the live client/helper and API access controls, then deploy and check production. A manual run from `main` follows the same route. Pull-request and fork code never receives the deployment secret. Standard GitHub-hosted runners in this public repository are free; no larger or paid runner is configured.

Cloudflare does not let an existing Direct Upload project become a native Git integration. Its documented [GitHub Actions deployment route](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/) preserves the existing `airef` project, hostname, D1 databases, service secrets, custom domain, and archive URLs. Deployments carry the GitHub commit SHA.

## One-time authorization

Create a dedicated Cloudflare API token named `AIRef GitHub deployment`, restricted to the existing personal account, with these Account permissions:

- Cloudflare Pages: Edit, to upload this website and API.
- Account Settings: Read, for Wrangler's account access.
- Billing: Read, to check the Workers subscription before each deployment. This does not permit changing billing or buying services.

Store the token as the repository Actions secret **`AIREF_CLOUDFLARE_API_TOKEN`** at [the repository's Actions secrets page](https://github.com/OJWatson/ojwatson.co.uk/settings/secrets/actions). Do not put it in a file committed to Git, an issue, a PR comment, or chat. The workflow does not use the developer's interactive OAuth credentials. Account/project/database identifiers in `deployment.json` are identifiers, not credentials.

The live subscription API must be readable and fully paginated. An explicit Workers Free subscription or absence of any Workers subscription establishes the default Free tier. Paid and unrecognised Workers subscriptions stop deployment. An API permission failure is not treated as an empty subscription list. The CI route never fabricates a new dashboard-confirmation timestamp.

## Scope and preservation

The CI token needs no D1 write, DNS write, billing write, account write, or API-token-management permission. The deployment script validates the exact existing project, origins, database bindings, capture-service URL and presence of both existing secrets. It never creates a project/database, patches settings, rewrites secrets, runs SQL or schema migrations, or changes DNS/billing. Database migrations remain an explicit operator task before merging any future schema-dependent change. Private backups, invitations, local D1 state, generated builds, provider captures, and credentials are excluded by the app's `.gitignore`.

The capture-only Netlify function's source is versioned here too. Its existing deployment continues to use the explicitly authorised included Pro credits with auto recharge disabled; Cloudflare deployments do not create Netlify builds or change its billing. A future edit to the capture function itself also needs a separate capture-service deployment from this directory, using the documented zero-additional-spend controls in `capture-relay/README.md`.

## Local development

Run the commands in `apps/airef/README.md` from that directory. `scripts/deploy.ts` remains an operator bootstrap/recovery tool, while ordinary releases use the GitHub workflow. The existing main-site Hugo workflow and Netlify configuration are unchanged.
