# Roadmap

## Current Status: v1.0.0

This is a modernized fork of WhiskeySockets/libsignal-node, focused on security, maintainability, and production readiness.

## Completed

- [x] **Security Audit**: Removed all debug logging that leaked sensitive data
- [x] **API Compatibility**: Verified 100% compatibility with original libsignal
- [x] **CI/CD**: GitHub Actions workflows for CI, PR, Release, and Nightly
- [x] **Documentation**: Comprehensive docs (API, architecture, security, development)
- [x] **Testing**: Unit tests, compatibility tests, regression tests
- [x] **Package Quality**: npm publish ready with proper configuration
- [x] **Code Quality**: ESLint, Prettier, EditorConfig
- [x] **Security**: SECURITY.md, CodeQL, Dependabot, npm audit

## Short-term (Q3 2026)

- [ ] **TypeScript Conversion**: Add TS types to internal code (non-breaking)
- [ ] **ESM Support**: Dual CJS/ESM build (non-breaking)
- [ ] **Integration Testing**: End-to-end tests with Baileys
- [ ] **Performance Optimization**: Benchmark and optimize hot paths (non-breaking)
- [ ] **Fuzz Testing**: Add fuzz testing for message handling

## Medium-term (Q4 2026)

- [ ] **Session Encryption**: Optional encryption for stored sessions
- [ ] **Metrics**: Add optional performance metrics (disabled by default)
- [ ] **Documentation Site**: Hosted API docs (GitHub Pages)
- [ ] **Examples**: More usage examples in documentation
- [ ] **Community**: Set up discussion forum, community channels

## Long-term (2027)

- [ ] **Deno Support**: Compatibility with Deno runtime
- [ ] **Browser Support**: Compatibility with browser environments (Webpack/Rollup)
- [ ] **Security Audit**: Third-party security audit
- [ ] **Protocol Extension**: Additional Signal Protocol features (if needed by Baileys)

## Non-Goals

- ❌ Replacing the official `@signalapp/libsignal-client`
- ❌ Adding new cryptographic protocols
- ❌ Changing the public API in any way
- ❌ Introducing breaking changes for any reason
- ❌ Supporting legacy Node.js versions (< 16)

## How to Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Feedback

Roadmap is subject to change based on community needs and @kelvdra/baileys requirements.
