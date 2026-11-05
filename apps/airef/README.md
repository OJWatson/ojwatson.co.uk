# AIRef

An invitation-only, text-and-code archive of public ChatGPT and Claude conversations. A researcher retrieves or imports a shared conversation, reviews it, adds citation details, and publishes an immutable JSON record at `https://airef.ojwatson.co.uk/<uuid>`.

**No DOI registration, paid hosting, object storage, external AI API, proxy subscription, or always-on server is required.** The deployment scripts refuse an unconfirmed or paid Workers account.

Live archive: **https://airef.ojwatson.co.uk/**. Synthetic verification records use the separate [preview](https://preview.airef-8ej.pages.dev/). The owner invitation is stored privately in ignored `data/owner-invitation.txt` on the operator's checkout.

Source home: [`apps/airef/` in OJWatson/ojwatson.co.uk](https://github.com/OJWatson/ojwatson.co.uk/tree/main/apps/airef). Ordinary releases use the repository's **AIRef** GitHub Actions workflow: check/build, deploy preview, verify preview, then deploy and verify production. See [GitHub deployment and one-time authorization](docs/github-deployment.md). The Hugo website at the repository root keeps its existing Netlify configuration.

Current capture setup (4 November 2026): the website and storage use Cloudflare Free. A separate authenticated Netlify function retrieves ChatGPT pages when Cloudflare is blocked. The operator explicitly authorized its use of existing included Pro credits with auto recharge disabled; no new subscription, paid add-on, or additional payment was enabled. This uses the existing team's shared quota. The reported ChatGPT link now imports in production; automatic Claude retrieval remains blocked and needs the helper fallback. See [verification](docs/verification.md).

## Run locally

Requires Node.js 24 or newer. No Cloudflare login is needed for local development.

```bash
npm ci
npm run setup:local
npm run build
npm run preview
```

Open `http://127.0.0.1:8788/`. The local-only invitation is `local-preview-only`. Local D1 state stays under `.wrangler/`; its signing key is in ignored `.dev.vars`. The development invitation is not part of the database migration and is rejected by remote backup restoration.

`npm run dev` serves the frontend with hot reload and proxies its API calls to the separate local Pages server on port 8788. Rebuild before using the full Pages preview or checking generated downloads.

```bash
npm run check
npm run build
```

These are local checks, not hosted CI. See [verification](docs/verification.md) for the actual provider and browser checks.

## Capture and review

- Automatic import accepts only HTTPS public `/share/…` URLs on `chatgpt.com`, legacy `chat.openai.com`, or `claude.ai`. It refuses redirects, credentials in URLs, private chat paths, and arbitrary hosts.
- The Free hosted function fetches at most 4 MiB of public source bytes, with a 15-second network deadline, and signs a receipt for their digest and retrieval metadata. It never forwards provider cookies or credentials.
- The browser decodes the public page's structured transcript. This deliberately keeps expensive decoding outside Cloudflare's 10 ms Free CPU allowance. Provider scripts are never evaluated.
- ChatGPT supports public React Router/turbo-stream data, older embedded conversation JSON, selected mapping branches, linear conversations, and the explicit public mobile transcript. Mobile text captures are labelled partial, including warnings when interactive content has missing fallback values. Claude supports structured public snapshot JSON when accessible. A provider's public-viewer endpoint is used only when its own returned share HTML references it; there is no private-account API integration.
- A 403, login shell, missing conversation, changed format, or ambiguous branch never becomes an empty successful archive. The UI offers the browser helper.
- The helper is a small Manifest V3 extension, packaged at `dist/airef-browser-helper.zip`, with active-tab, scripting, download, and session-storage permissions. Version 0.2.0 opens captures directly in a new AIRef review tab through a one-use, 15-minute token. Only the official production and preview archive forms can consume captures. Transcripts and invitation codes are never put in handoff URLs; invitation codes are never read by the helper. It requests no provider host permissions or background content scripts. Install instructions are at `/helper/`; its DOM-reading source is at `/helper/source`. It reads only a public shared page after a user click. Browser captures are explicitly marked as having unverified completeness.
- An [optional capture service](capture-relay/README.md) can fetch outside Cloudflare's blocked outbound network. It is disabled unless explicitly configured and independently tested from its hosted network. Use a confirmed Free account, or existing included credits with explicit operator authorization and disabled auto recharge; no additional spend is permitted.
- AIRef's JSON importer accepts the documented capture format or an existing AIRef archival JSON. Generic account exports, HAR files, API logs, files, images, and generated artifacts are outside v1.

The [capture interchange format](docs/capture-format.md) can also support an optional ChatGPT export plugin. A model-assisted export must disclose unverified accuracy/completeness and enter the same user review; there is no implemented or published ChatGPT plugin yet.

Review supports per-message editing, redacting a selection, deleting messages, safe Markdown preview, and basic secret/email warnings. Pattern checks are not a privacy guarantee. Messages removed during review make the capture explicitly partial. Names, affiliations, and ORCID iDs remain user-provided; ORCID format/check digits are checked, not identity-verified.

Temporary drafts live in the current tab's session storage. Invitation codes are not saved there. A server-side draft store, login system, search index, and public submission form are intentionally absent. Only an explicit, confirmed publication writes a permanent record.

## Record format and interfaces

`src/shared.ts` defines the versioned `Capture`, `Metadata`, `PublishInput`, and `ArchiveRecord` contracts. Message text and code are preserved; unavailable timestamps and model labels are `null`. Do not infer hidden prompts or exact model checkpoints.

An archive has a server-generated UUID, stable URL, UTC archive time, user-supplied metadata, source/capture details and omissions, and approved messages. Object keys are serialized deterministically. The resulting UTF-8 JSON bytes are stored once, with their SHA-256 digest stored separately to avoid a self-referential hash.

| Interface | Access | Behavior |
| --- | --- | --- |
| `POST /api/import` | Bearer invitation | `{ "url": "https://…/share/…" }`; returns inert source text and `X-AIRef-*` receipt headers |
| `POST /api/publish` | Bearer invitation | Validated `PublishInput`; returns UUID, URL, digest, archive timestamp |
| `GET /<uuid>` | Public | Record metadata, citation, and transcript viewer |
| `GET /<uuid>/conversation.json` | Public | Exact immutable bytes; `X-Content-SHA256` matches the body |
| `GET /<uuid>/transcript.md` | Public | Human-readable transcript |
| `GET /<uuid>/citation.bib` | Public | BibTeX citation of the archive |
| `GET /<uuid>/manifest.sha256` | Public | Hash for `conversation.json` |

The publication UUID and timestamp are server-controlled. Each logical publication uses a persisted idempotency key scoped to its invitation. Identical retries return the existing record; reuse of a key with different content returns 409. Concurrent duplicates cannot create two records.

Published transcript columns cannot be updated or deleted, including through ordinary SQL. Recaptures create new UUIDs. Withdrawal changes visibility/status only: the public citation page remains, and transcript downloads return 410. There is no public administrative API. No indefinite browser or CDN caching is enabled, so withdrawn content must be revalidated.

Hashes establish integrity of stored bytes. A signed retrieval receipt establishes that this service fetched particular source bytes at a recorded time; it does not authenticate the provider's output or independently verify the browser's transcript extraction and review. A browser/import timestamp is supplied by the importer. The archive timestamp is always generated by the server.

## Operate the archive

All administration supports `--local`. Remote operations require an existing Cloudflare credential, `CLOUDFLARE_ACCOUNT_ID`, and `AIREF_DATABASE_ID`. Use the separate preview or production database ID recorded by deployment.

```bash
npm run invite -- --local --label "Pilot researcher"
npm run revoke -- --local --id <invitation-uuid>
npm run withdraw -- --local --id <record-uuid> --reason "Public withdrawal reason"
npm run backup -- --local --out data/archive-backup.json
npm run restore -- --local --file data/archive-backup.json
```

Invitation creation displays the random code once; only its hash is stored. Distribute codes privately. Revocation leaves published records intact. Each invitation has an hourly limit of 30 import/publication operations, with idempotent publication retries exempted. Unknown codes do not create database state.

Backups are private, including withdrawn content and invitation hashes. They are written with restrictive file permissions beneath the ignored `data/` directory by default. Every record is independently hash-checked before an export is written and before any restore starts. Restore preserves bytes, UUIDs, timestamps, and withdrawal state; it is resumable and never overwrites different content or reactivates a withdrawn record. Copy verified backups to a separate existing storage location before live migrations. Free provider point-in-time recovery is not a substitute for an independent export.

## Deploy without spending

1. Authenticate the official Wrangler CLI in your own terminal (`npx wrangler login --use-keyring --scopes account:read user:read d1:write pages:write`), or supply an existing scoped `CLOUDFLARE_API_TOKEN` privately. Do not paste tokens into chat, source files, or Pages. Use only the intended personal account.
2. Set `CLOUDFLARE_ACCOUNT_ID`. `npm run deployment:check` must confirm Workers Free and authenticated account access. It checks all subscription pages. When Free is implicit or Billing Read is unavailable, it requires a fresh, account-matched dashboard observation in `outputs/deployment/free-plan.json` (or `AIREF_FREE_PLAN_EVIDENCE`). Its shape is documented in `scripts/deployment-policy.ts`; observations expire after 30 minutes. This is a deployment gate, never permission to enable billing.
3. Run `npm run check && npm run build`, then `npm run deploy:preview`. It creates only a Pages project and a D1 database, configures a secret capture-signing key, applies migrations preserving frozen records, and deploys branch `preview`. The preview alias uses the actual Pages hostname assigned by Cloudflare, recorded in `outputs/deployment/preview.json`. An existing conflicting project/database is not silently rebound.
4. Issue a preview invitation using its database ID. Test a synthetic publication, direct downloads, independent hashes, and backup/restore. Provider availability can differ between local fetches and the Cloudflare edge: verify both, and retain the helper fallback.
5. Run `npm run deploy:production` only after preview verification. It uses a separate production D1 database and the canonical origin `https://airef.ojwatson.co.uk`. Never restore synthetic preview records into production.
6. In the Pages project, associate the custom domain `airef.ojwatson.co.uk`. In the existing DNS provider, add only `CNAME airef` pointing to the `pages_hostname` returned by Cloudflare and recorded in `outputs/deployment/production.json`. Do not move the parent nameservers or change the main website's records. Wait for active HTTPS and verify the live workflow. Create a production invitation separately.

The API credential is never embedded in the built app. Deployment does not create R2, queues, AI services, billing subscriptions, or payment methods. If authentication, plan evidence, capacity, or permissions are missing, it stops rather than upgrades. Existing unrelated projects and data must remain untouched.

## Capacity and preservation

The pilot limit is 1 MiB of final archival JSON per record. A database trigger atomically stops intake at 350,000,000 accounted bytes, including duplicated citation metadata in UTF-8 and a conservative 4096-byte reserve per record for row/index overhead, below the Free per-database ceiling. No published record is deleted to recover capacity. Read/write and request quotas are shared with other resources in the account and may temporarily limit availability. No free service provides unlimited or guaranteed perpetual availability.

The custom domain and UUIDs make migration possible: restore exports on another host, preserve the URL paths, and point the existing subdomain at it. Maintaining the domain, backups, and the hosting account remains the operator's responsibility.
