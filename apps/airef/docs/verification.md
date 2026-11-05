# AIRef verification

This file records the implementation evidence. Local checks do not establish hosted behavior or independent provider authenticity.

## Hosted ChatGPT capture fix, 4 November 2026, 22:53–22:59 UTC

The user explicitly authorized using existing Netlify Pro credits with no extra spend. Authenticated checks before and after deployment confirmed the intended account remained credit-based Pro with auto recharge disabled. No subscription, billing configuration, paid add-on, member seat, existing site, or DNS record was changed. A separate capture-only project `airef-capture-ojwatson` was created without Git integration. Its bearer secret was imported from a private ignored file, then converted to a function-only secret; its value was not placed in command arguments or chat. Included credits share the existing team's quota, so availability still depends on that quota.

Netlify draft `6aebb7376110727223fcf98d` returned 200 with 598,754 source bytes and two decoded messages for the reported ChatGPT link. Missing authorization returned 404, and a private-chat URL returned 400. The supplied Claude share still returned 422 from automatic retrieval and retains the helper fallback. The stable capture service at `https://airef-capture-ojwatson.netlify.app/.netlify/functions/capture`, deployment `6aebb7b6b47e7076197a33ed`, independently returned 200 with two messages. No archive storage or publication endpoint exists on this service.

The optional relay was then configured in Cloudflare preview only. Preview deployment `a7f0b91c` returned 200 with 734,211 source bytes, two messages, a matching SHA-256 source digest, and a capture receipt through the normal `/api/import` endpoint. Invalid private-chat input returned 400 and missing authorization returned 401. Temporary preview invitations were revoked. The deployment script now preserves the operator-configured relay URL in Wrangler's plain-text bindings while omitting existing redacted secrets from patches.

After that verification, production deployment `ec6f2da7` enabled the same connection. At 22:58 UTC the canonical production import endpoint returned 200 with 598,514 source bytes and two messages titled “Christmas lunch quantities”. The source digest matched independently and a capture receipt was present. Production JavaScript matched the local build byte-for-byte. The actual production page and response passed through the real local frontend module in an emulated DOM, entering review with both messages, the correct title, and publication still unconfirmed. Invitation codes were absent from its saved draft. This is an API plus frontend-integration check, **not an interactive Chrome trial**: browser control still fails before navigation. No transcript was published by this work.

Both returned ChatGPT formats remain explicitly partial, with capture omissions available for review; the mobile fallback can omit interactive table values. The current importable test JSON is privately saved as `data/chatgpt-6aea598b-capture-2026-11-04.json`. The older capture is retained separately. Detailed private evidence is under `outputs/verification/` and `outputs/probes/`.

## Authentication and importer update, 4 November 2026

The user completed the official Netlify CLI approval. Authenticated account inspection succeeded. Its only account reports `type_name: Pro`, `type_slug: credit-pro`, 3,000 included credits, no Pro trial, and `auto_topup_enabled: false`. This contradicts the earlier user assumption that Netlify was Free. No Netlify project was created, deployment made, billing setting changed, or existing site modified. The proposed capture service remains undeployed pending a deployment that meets the agreed Free-account constraint. Netlify's documentation says credit-based projects pause when credits run out with no recharge, but that does not make this account a Free account.

Netlify CLI 27 does not accept the previously documented `--config` option. The optional function's configuration now lives in the repository root `netlify.toml`, pointing only to `capture-relay/public` and `capture-relay/netlify/functions`. Its explicit build command avoids auto-building the Cloudflare website, and Node 24 matches this repository's runtime requirement. The official offline build packaged the function successfully.

The reported ChatGPT link now sometimes returns an HTTP 200 metadata-only page to a generic fetch. Browser navigation headers retrieved a transcript locally, in either the existing React Router format or a newer public mobile JSON format. Importer `airef/0.1.1` requests the document representation and reads the explicit mobile conversation without archiving auth/settings data or executing scripts. It validates the share identity and rejects unfinished or empty transcripts. The mobile representation is always labelled partial; interactive content may contain fallback text with missing table values, and original timestamps/model details can be absent. A metadata-only HTTP 200 page remains a failed import and now displays the helper route in the website.

The actual reported link decoded to two messages in saved examples of both formats and in a fresh local request. The official Netlify local function runtime returned 200 with 596,862 source bytes and two decoded messages; missing authorization returned 404 and a private-chat URL returned 400. These are local runtime/network checks, **not a hosted Netlify or Cloudflare fix**. No conversation was published. Cloudflare's fresh Free-plan confirmation is pending because the current browser control cannot read its dashboard and the existing CLI credential lacks subscription-read access; the deployment gate has not been bypassed. Production remains at its previous deployment.

After these changes, `npm run check` passed all 38 tests, `npm run build` passed, the official Netlify offline build packaged the function, and Wrangler compiled the Pages Worker successfully. A live production check at 10:00 UTC still returned 422 `browser_capture_required` for the reported share. Production deployment `1566ed29` remains active, with one existing archive record; preview has four records. Neither environment has the optional capture relay enabled. These checks made no publication or record changes.

At 22:48 UTC the user explicitly reconfirmed Cloudflare Workers Free. This user confirmation, rather than a new agent dashboard observation, refreshed the account-matched deployment evidence. Preview deployment `6aa83077` completed with the existing preview D1 database and signing key preserved. The reported ChatGPT link still returned provider HTTP 403 / API 422 `browser_capture_required`; a private-chat URL returned 400 and missing authorization returned 401. The temporary preview invitation was revoked. All existing production and preview record IDs, hashes, and statuses matched the predeployment snapshot (one production record and four preview records). The parser/request update therefore **did not fix the Cloudflare-origin block**. A verified private backup of the production record was exported before the trial. No Netlify deployment or production update was made by this trial.

## ChatGPT 403 investigation, 3 November 2026

The reported share URL was tested from a temporary, authenticated Cloudflare Pages diagnostic with no database access. Four request profiles (AIRef user-agent, native fetch headers, browser user-agent, and browser headers plus language) all returned HTTP 403. The response was OpenAI's own `Unable to load site` page, with a VPN-related message and IP `2a06:98c0:3600::103`. Cloudflare [documents that exact fixed client IP for cross-zone Worker subrequests](https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip-in-worker-subrequests). There was no `cf-mitigated: challenge` header or interactive challenge to solve.

A second public ChatGPT conversation, the same page with a trailing slash, and its React Router data request were also blocked. The legacy `chat.openai.com/share/…` URL returned a 308 redirect back to the blocked canonical URL. The identical AIRef request from the local Node runtime returned 200 and a transcript with two messages. These observations establish a Cloudflare-origin retrieval block for the tested routes; they do not establish the provider's exact filtering rule or a permanent policy for every Cloudflare IP.

Cloudflare Browser Run was also tested once through a temporary Free Pages browser binding. Its API returned 200/success, but the rendered HTML was the same OpenAI block page, this time showing IP `104.28.164.245`. Transcript parsing correctly rejected it. A successful browser-service response therefore did not mean a successful conversation capture. No challenge, credential, paid proxy, or paid browser service was used. The Free browser service has a documented hard daily quota; no plan or billing change was made.

All three temporary diagnostic deployments were removed and their URLs verified as 404. The normal preview deployment was restored, including its D1 binding; no browser binding remains. An existing preview record was downloaded and its SHA-256 checked. The production D1 binding and existing production deployment were retained, and no conversations were published by this investigation.

An optional capture-only Node function and archive-side client are prepared under `capture-relay/` and `server/capture-relay.ts`. The compiled handler fetched the actual reported link locally (200, 595,867 bytes, two messages, partial scope). `npm run check` passes all 36 tests, including relay authentication, SSRF/input restrictions, redirects, size limits, the receipt/review contract, and existing archive behavior. `npm run build` passes. Preview deployment `fba20d2e` contains the optional integration **disabled**; neither preview nor production has relay URL or secret variables configured.

At this checkpoint, the next unresolved check was the same function on a separate confirmed-Free Netlify project; local Netlify CLI authentication and plan verification were pending. The user's Cloudflare Free confirmation did not establish Netlify's plan. The subsequent authentication and plan result are recorded above. Automatic capture of the reported link in production was **not fixed** by this investigation. Detailed private probe results are under `outputs/probes/edge-capture/`.

## Browser handoff update, 3 November 2026

Helper 0.2.0 adds direct review in AIRef without a JSON file round trip. The public helper identity is stable. The extension requests active-tab, scripting, downloads, and session storage; it has no provider host permissions or content scripts. The background worker accepts messages only from the production and stable preview archive forms. A 256-bit random token carries no transcript or invitation code; captures are consumed once, expire after 15 minutes, and are bounded to five pending captures. A new review tab preserves existing drafts. JSON download remains available.

The reported ChatGPT link `6aea598b-a0b4-83eb-b5bf-c7caebdfa1ea` returned HTTP 403 to the live `/api/import` request. The API correctly returned `browser_capture_required` and created no record. A local public fetch retrieved 595,831 bytes and decoded two messages, marked partial. The private local capture is saved under `outputs/probes/reported-chatgpt-capture.json`; it has not been published.

`npm run check` passes 30 tests. The new checks exercise the actual website's blocked-link form, helper launch, token consumption, transcript review, and absence of publication through an emulated Chrome transport. They also check rejection of untrusted origins, private share URLs, expired/reused tokens, invalid and oversized captures, bounded abandoned handoffs, and manifest identity/permissions. `npm run build` succeeds, including the separately bundled helper. These checks are not an installed-extension trial.

The user subsequently confirmed the account is still Free. This confirmation is attributed to the user in the deployment evidence; no fresh dashboard observation by the agent is claimed. Preview deployment `e38ee432` and production deployment `1566ed29` completed on 3 November 2026. At 22:27 UTC, the production home page, helper instructions, background bundle, and helper ZIP returned HTTP 200. The downloaded ZIP was byte-identical to the tested build and prepared installation folder (SHA-256 `b72dd180ccc07d5d9dbf65e94d8ba667e6472a251e8cd4df2cb0abb87953633a`). The invitation and validation checks still returned 401 and 400 respectively; the reported ChatGPT link still returned explicit `browser_capture_required` (422). No production records were created. An existing preview record remained publicly available.

Installation and the installed-extension trial remain pending: browser automation explicitly rejected `chrome://extensions/` as a prohibited URL. Ordinary HTTPS browser interactions also continue to fail with a control-layer error, so live UI screenshots and an actual installed-helper trial cannot be claimed. The tested 0.2.0 folder is prepared at `data/chrome-helper`; its files match the live ZIP exactly. The remaining user action is to enable Developer mode on Chrome's extensions page, select Load unpacked, and choose that folder. The helper then needs a user click on the opened public share page to grant active-tab access.

## Local implementation

The automated suite covers invitation and origin enforcement, selected ChatGPT branches, hidden-message exclusion, turbo-stream decoding, Claude structured text, browser-helper DOM capture, blocked/empty source handling, streamed size limits, safe Markdown, record integrity, idempotent/concurrent publication, size/capacity limits, database immutability, withdrawal visibility, and export/restore. The deployment gate rejects paid, unknown, stale, or wrong-account evidence.

On 3 November 2026, `npm run check` passed all 25 tests and `npm run build` completed. Tests use synthetic conversations and an isolated SQLite database. The browser-helper archive is generated from the same function tested in `tests/helper.test.ts`. Checks include restore preflight for invitation-code and publication-key conflicts, current ChatGPT role headings/code blocks, and capacity accounting for multibyte metadata stored alongside the archival JSON.

## Live public-source observations — 3 November 2026

- A public ChatGPT share linked from Simon Willison's public tools colophon (`68f1258a-1a60-8006-876c-aa789992ef6b`) returned HTTP 200 locally. The decoder extracted eight messages from its actual React Router stream. It flagged omitted non-text material. Source HTML stays in ignored `outputs/probes/`; it has not been publicly republished by this task.
- Public Claude page `e344e6c2-b249-4d17-9d9d-044c32626574` returned an HTML application shell. Its own bootstrap referenced the public snapshot endpoint, which returned HTTP 403 when fetched without browser credentials. The browser rendered its public text.
- The user-supplied Claude test link `553259d6-1b95-4a7c-85c4-846bc242a453` also returned HTTP 403 to automatic retrieval, while the public browser view contained two messages. The packaged helper's DOM-reading function captured exactly `test chat` and the assistant reply, excluding toolbar controls and accessibility duplicate labels. The read-only browser sandbox does not expose `TextEncoder`; only that probe's byte-count expression was replaced by string length for these ASCII messages. The actual packaged helper retains its UTF-8 byte limit, exercised in the local DOM tests.

The supplied Claude capture was imported through the actual local file chooser, reviewed, and published **only into isolated local D1** with the development invitation. Its local UUID is `1278b497-ae07-4582-91e3-2574cdd73c93`. The public reader rendered both messages, citation metadata, scope warnings, and download links, and independently checked the JSON digest in the browser. A verified local backup was exported to ignored `data/local-verification-backup.json`.

The final helper (version 0.1.1) was additionally checked against both actual public browser views. The ChatGPT example uses newer `data-conversation-role` headings and `data-code-block` containers. The reader captured eight messages (56,406 characters); all twelve loaded code blocks appeared verbatim in the captured messages. The Claude example still returned exactly the two expected messages. For these final DOM probes, the sandbox's unavailable `TextEncoder` was replaced only in the size calculation with an equivalent Unicode code-point byte counter. The packaged extension uses native `TextEncoder`. Neither real conversation was republished to the hosted archive by these checks.

## Free-plan design

The signed-in Cloudflare Workers plans dashboard showed **Free / $0 / Current plan** for the existing personal account. No plan was changed. The local Wrangler CLI initially had no authentication.

A local CPU probe showed that decoding a large hydrated ChatGPT page on the server could exceed the Free request CPU allowance. The deployed API therefore retrieves inert bounded source bytes and signs their digest; decoding and transcript formatting run in the browser. Local timings are not a measurement of Cloudflare edge CPU or live availability.

## Hosted verification — 3 November 2026

| Component | Verified result |
| --- | --- |
| Production | `https://airef.ojwatson.co.uk/`, HTTP 200 over validated HTTPS; Cloudflare custom-domain status active |
| Preview | `https://preview.airef-8ej.pages.dev/`, separate D1 database, synthetic records only |
| DNS | One new CNAME, `airef → airef-8ej.pages.dev`, TTL 300, in the existing Netlify zone; existing root and other records retained |
| Publication | API and actual browser form both created frozen preview records; identical retries retained UUIDs; changed requests returned 409 |
| Size | 1,041,046-byte JSON published and downloaded; a record exceeding 1 MiB returned 413 |
| Integrity | Downloaded JSON independently hashed; JSON, Markdown, BibTeX and manifest downloads returned 200 without invitation credentials |
| Safety | A submitted script stayed literal text; the public browser viewer contained zero executable transcript scripts and zero JavaScript links |
| Withdrawal | Citation page and all four transcript/download formats returned 410; frozen bytes retained privately |
| Recovery | Four preview records exported from live D1 and restored to an isolated SQLite database with identical UUIDs, bytes, hashes and withdrawal state |
| Provider retrieval | Both representative sources returned provider HTTP 403 from Cloudflare; API returned explicit browser-helper-required errors, without creating records |
| Production isolation | Preview UUID absent (404), publication without invitation refused (401), owner code accepted, invalid publication refused (400); production contains zero test records |
| Helper download | Live ZIP contains manifest version 0.1.1 |
| Responsive UI | Desktop and 390 px mobile homepage inspected; no horizontal overflow |

Wrangler authorization was granted by the user. Its credential is encrypted with the key held in the OS keyring. No payment method, plan upgrade, paid AI API, R2 resource or paid proxy was created for AIRef. The Free gate remains part of every deployment. Pages Functions are precompiled using Wrangler's supported output-directory mode before upload; remote configuration is isolated from local development. Existing redacted secrets are omitted from configuration patches so they are retained.

Private invitations and portable verified backups are under ignored `data/`; deployment metadata and detailed check results are under ignored `outputs/`. The storage-accounting migration preserves all frozen records and includes duplicated UTF-8 citation metadata in the capacity counter.

## Verification limits

These are local and live manual checks, not hosted CI. Extension installation/Chrome Web Store distribution is not part of the automated suite. The exact DOM reader and JSON import/publication workflow were exercised, but an installed extension's permission prompt and native download UI still need a user trial. A ChatGPT export plugin is only a proposed additional importer; its interchange contract is documented in `docs/capture-format.md`.
