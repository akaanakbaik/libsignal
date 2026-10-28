# Maintenance review — 2026-10-28

Reviewed master at `2d580d881708d1bc62cdcf804c9e11649536f568`.

## CI evidence

- Nightly run [40623255199](https://github.com/akaanakbaik/libsignal/actions/runs/40623255199): Security Audit failed on brace-expansion <=1.1.20 (high severity). Benchmark and Package Health passed. The recent 30-run history shows recurring Nightly failures.
- PR #19 run [40257718355](https://github.com/akaanakbaik/libsignal/actions/runs/40257718355): only Lint failed because ESLint 10 cannot load the legacy .eslintrc configuration. Tests on Node 16/18/20/22, coverage, audit, dependency review, and CodeQL passed.
- PR #14 runs 35005406380 and 35005406383: Pull Request and CI passed for head e2fb6f997781faeef559a8e41fb8f6e8b9a3b53c. These are historical results, not checks of this maintenance branch.

## Pull request recommendations

| PR | Current assessment | Recommendation |
| --- | --- | --- |
| #14 protobufjs 8.8.0 | Mergeable; historical CI passed | Eligible on the inspected head, but superseded by this branch's 8.8.1 update and wire/session regression tests. Prefer this maintenance PR after its own CI passes. |
| #19 ESLint 10.13.0 | Mergeable but CI fails | Do not merge alone. This branch includes the required flat configuration migration. |
| #6 checkout 7 | Conflicts; master already uses v7 | Redundant; close after maintainer review. |
| #4 CodeQL 4 | Conflicts; master already uses v4 | Redundant; close after maintainer review. |
| #3 setup-node 6 | Conflicts; master already uses v7 | Superseded; close after maintainer review. |
| #2 action-gh-release 3 | Conflicts; master already uses v3 | Redundant; close after maintainer review. |
| #1 cache 6 | Conflicts; its Yarn cache steps were removed when workflows switched to npm caching through setup-node | Obsolete; do not restore the old Yarn workflow just to merge it. |

No existing PR was merged or closed during this review.

## Changes and validation

- Upgrade protobufjs to ^8.8.1, ESLint to ^10.13.0, and add explicit @eslint/js and globals development dependencies. Regenerate the lockfile; obsolete vulnerable brace-expansion tooling is removed.
- Replace duplicated legacy ESLint configurations with eslint.config.cjs. Preserve existing rules, including no-console and the old unused-catch-variable behavior.
- Add Node 24 to CI and install runtime dependencies only in compatibility jobs. Runtime support remains >=16; lint development requires Node 20.19+, 22.13+, or 24+.
- Add fixed protobuf wire vectors, malformed-length rejection, persisted-session prekey exchange, bidirectional ratcheting, and replay rejection tests. These three tests pass both on the original protobuf 7 lockfile and the new protobuf 8 lockfile.
- Local validation: clean npm ci, lint (0 errors, 8 pre-existing strict warnings), tests on Node 16/18/20/22/24, coverage, npm audit (0 vulnerabilities), npm pack --dry-run, and git diff --check passed. Node 16's experimental runner reports top-level tests rather than the newer runner's individual test count; Node 18+ reports 39 passing tests.
- Coverage: 75.46% lines, 71.31% branches, 71.54% functions.

The cryptographic source, generated protobuf source, exported API, and package version are unchanged. No npm release was performed. The optional external @kelvdra/baileys integration suite was not run; the new session tests exercise this library directly and do not establish compatibility with every downstream application. GitHub checks of the final PR remain the merge gate.
