# AIRef

The AI conversation archive at [airef.ojwatson.co.uk](https://airef.ojwatson.co.uk/) lives in [`apps/airef/`](../apps/airef/README.md).

It has its own TypeScript package, tests, database migrations, browser helper, Cloudflare configuration, and deployment workflow. The academic Hugo website at this repository's root keeps its existing build command, pinned Hugo version, and publishing directory. A Netlify ignore command skips main-site builds when only AIRef files change, avoiding unrelated production-deploy credit usage. AIRef's static assets belong under `apps/airef/public/`, separately from Hugo's generated root `public/` directory.

AIRef changes under `apps/airef/` run the **AIRef** workflow. Pull requests run tests and builds without deployment credentials. Main-branch releases deploy through GitHub Actions to the existing Cloudflare preview, verify it, and then deploy production. [Deployment setup](../apps/airef/docs/github-deployment.md) describes the dedicated Actions secret and the controls that preserve the existing D1 databases, secrets, domain, and archive records. No private captures, invitation codes, backups, or credentials belong in this public repository.

The capture-only Netlify function's source is included with AIRef, while its existing service remains separately deployed. Its usage currently comes from the operator's explicitly authorised existing Pro credits with auto recharge disabled. Moving the code into this repository does not change a hosting plan or enable paid services.
