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

- M5.0 -> a64e01b0ae9f21ec1356023b9d40df65e09b4019 : add News menu entry for /post/ and rename Posts section title to News
- M5.1 -> 6d2aad0312280b232e21fb8a52d47a76268b8659 : add initial News posts (site refresh, team, teaching, projects pointers)
- CI.FIX.M5 -> (working-tree) : revalidated CI-equivalent checks (`hugo --gc --minify` + regression script)
- M6.0 -> (working-tree) : add research programme project entries (JI-RISE, surrogates, resistance, vaccines)
- M6.1 -> (working-tree) : update Projects filters/tags while preserving existing software project tags
- M6.2 -> (working-tree) : cross-link Research and Projects pages and verify no URL regressions
- M6.END -> (working-tree) : milestone M6 gate passed (local acceptance checks)
- CI.FIX.M6 -> (working-tree) : CI-equivalent checks green at M6 boundary
- M7.0 -> (working-tree) : full linkcheck + Hugo build QA sweep completed
- M7.1 -> (working-tree) : mobile/navigation sanity pass completed; no CSS regressions found
- M7.END -> (working-tree) : milestone M7 gate passed (local acceptance checks)
- CI.FIX.M7 -> (working-tree) : CI-equivalent checks green at M7 boundary
