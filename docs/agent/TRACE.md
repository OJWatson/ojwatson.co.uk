# TRACE

This file maps task IDs to commits for idempotency.

Format:
- <TASK_ID> -> <COMMIT_SHA> : <summary>

- M1.4 -> 8b3dbf06ed0c404d69baf2f283412b86e5d2ddb0 : publications/talks metadata consistency (draft placeholder + author ids)
- M2.0 -> f0c98ace0ccd97553e588e0ff642495aac73d6f0 : enable Hugo minify by default and reduce imaging quality for smaller assets
- CI.FIX.M1 -> e497a6d9783156d46f6460fb32e304608f5cb498 : align Netlify build command with acceptance (gc+minify)
- M3.END -> 44f40abf569a866cb722947b628ca1473f5becfb : milestone M3 gate passed (hugo --gc --minify)

- M4.2 -> 209b43af29a6721ce55651efbd0fc09a73a64b0a : preserve /training/ route + guardrails in regression script
- M4.END -> 7a88df2459ffc0ce557b2b1bf317ecd7aec36540 : milestone M4 gate passed (hugo --gc --minify)
- CI.FIX.M4 -> e13e21bf1952f0064482ebd9959da443d9173c9e : verify CI/regression remains green at M4 boundary

