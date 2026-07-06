# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [6.0.1] - 2026-07-06

### Added
- Regression test suite ensuring no console.log/info/warn/debug/error leaks sensitive data
- Full compatibility test suite validating all public API surfaces
- `.npmignore` for clean npm package publication
- `.editorconfig`, `.gitattributes`, `.prettierrc` for code quality consistency
- Comprehensive GitHub Actions workflows:
  - `ci.yml`: Multi-Node-version test matrix, linting, CodeQL, and security audit
  - `release.yml`: Automated release workflow with npm publish
  - `pr.yml`: Pull request validation and semantic title checking
  - `nightly.yml`: Scheduled security audits, dependency review, and benchmarking
- Community health files:
  - `CONTRIBUTING.md` with zero-breaking-change policy
  - `SECURITY.md` with responsible disclosure process
  - `ISSUE_TEMPLATE/bug_report.md` and `feature_request.md`
  - `PULL_REQUEST_TEMPLATE.md`
  - `CODEOWNERS`, `SUPPORT.md`, `ROADMAP.md`
  - `CODE_OF_CONDUCT.md` (updated reference)
- Developer documentation:
  - `ARCHITECTURE.md`, `API_REFERENCE.md`, `DESIGN.md`, `INTERNALS.md`
  - `DEVELOPMENT_GUIDE.md`, `TESTING_GUIDE.md`, `RELEASE_GUIDE.md`
  - `SECURITY_ARCHITECTURE.md`, `AGENTS.md`
- Dependabot configuration for automated dependency updates

### Changed
- **Security**: Removed all `console.log/info/warn/error` calls that leaked sensitive session data:
  - `session_record.js`: Removed session object logging from `closeSession`, `openSession`, `removeOldSessions`, migrations
  - `session_cipher.js`: Removed stack trace logging from `decryptWithSessions` and closed session warnings
  - `session_builder.js`: Removed session bundle warnings
  - `curve.js`: Removed public key format warning
  - `queue_job.js`: Removed unhandled bucket type warning
- **Package**: Updated `package.json`:
  - Renamed to `@kelvdra/libsignal`
  - Added `files` field to include `index.js`
  - Added `engines.node >= 16.0.0`
  - Added test scripts using Node.js built-in test runner
  - Added `publishConfig.access: public`
  - Removed unused devDependencies (yarn, release-it, conventional-changelog-cli)

### Fixed
- No behavioral changes - all existing functionality is preserved identically

### Removed
- All temporary build artifacts, log files, debug scripts, and `.so` files

### Security
- Zero leakage of private keys, ephemeral keys, root keys, pending pre-keys, registration IDs, or session records to stdout/stderr
- No console output in production code paths

---

## [6.0.0] - Original WhiskeySockets/libsignal-node

The original release from [WhiskeySockets/libsignal-node](https://github.com/WhiskeySockets/libsignal-node).

[6.0.1]: https://github.com/kelvdra/libsignal/compare/v6.0.0...v6.0.1
[6.0.0]: https://github.com/WhiskeySockets/libsignal-node/releases/tag/v6.0.0
