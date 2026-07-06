# Contributing to @kelvdra/libsignal

First off, thank you for considering contributing to this project! We welcome contributions from everyone.

## Code of Conduct

This project adheres to the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Important Principles

This package implements the **Signal Protocol** - a cryptographic protocol for end-to-end encryption.

### Zero Breaking Change Policy

**DO NOT** make changes that would:

- Alter the public API (`index.js`, `index.d.ts`)
- Change cryptographic algorithms or behavior
- Modify serialization/deserialization formats
- Change session record structure
- Alter message format
- Break compatibility with `@kelvdra/baileys` or `WhiskeySockets/Baileys`

### Allowed Changes

- Bug fixes that maintain backward compatibility
- Test improvements and coverage increases
- Documentation improvements
- Code quality and readability improvements
- Security fixes
- Dependency updates

### Prohibited Changes

- Any change that would require modifying Baileys to work with this package
- Changes to crypto primitives (AES, HMAC, HKDF, Curve25519, Ed25519)
- Changes to session serialization format
- Changes to the `index.js` exports
- Adding new external dependencies without review

## How to Contribute

### 1. Reporting Bugs

Open a [Bug Report](https://github.com/akaanakbaik/libsignal/issues/new?template=bug_report.md).

### 2. Suggesting Enhancements

Open a [Feature Request](https://github.com/akaanakbaik/libsignal/issues/new?template=feature_request.md).

### 3. Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit using conventional commits: `git commit -m "feat: add ..."`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

### Pull Request Requirements

- All tests must pass
- No new console.log/info/warn/debug/error in source code
- API must remain backward compatible
- Code must follow project style (ESLint + Prettier)
- Documentation must be updated if needed
- CHANGELOG.md must be updated

## Development Setup

```bash
git clone https://github.com/akaanakbaik/libsignal.git
cd libsignal
npm install
npm test
```

## Testing

```bash
# Run all tests
npm test

# Run specific test
node --test test/compatibility.test.js

# Run with coverage
node --experimental-test-coverage --test test/*.test.js
```

## Release Process

Releases are managed by maintainers via GitHub Actions workflow.
See [RELEASE_GUIDE.md](RELEASE_GUIDE.md) for details.

## Questions?

Open a [Discussion](https://github.com/akaanakbaik/libsignal/discussions) or check the [Documentation](https://github.com/akaanakbaik/libsignal#readme).
