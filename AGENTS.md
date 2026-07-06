# AI/Agent Guide

## Overview

This document helps AI coding assistants (CodeBuff, Cursor, Copilot, etc.) understand this repository's structure, constraints, and development patterns.

## Critical Constraints

### NEVER Change These Files
- `index.js` - Entry point exports (must remain identical)
- `index.d.ts` - TypeScript definitions
- `src/crypto.js` - Cryptographic primitives
- `src/curve.js` - Curve25519/Ed25519 operations
- `src/protobufs.js` - Protocol buffer exports
- `src/WhisperTextProtocol.js` - Generated protobuf code
- `src/errors.js` - Error types
- `src/chain_type.js` - Chain type constants
- `src/base_key_type.js` - Base key type constants

### NEVER Change These Behaviors
- Signal Protocol implementation
- Cryptographic algorithms (AES, HMAC, HKDF, X25519, Ed25519)
- Session serialization/deserialization format
- Message wire format
- Session record structure
- Class/method signatures
- Error types and messages

### ALLOWED Changes
- Documentation improvements
- Test additions
- Code quality (ESLint, Prettier config)
- GitHub Actions workflows
- Community files (templates, guides)
- README and documentation
- Removing debug logging
- Adding comments to clarify intent

## Repository Map

### Entry Points
```
index.js         → Public API (re-exports from src/)
index.d.ts      → TypeScript type declarations
```

### Source Code
```
src/
├── crypto.js       → AES, HMAC, HKDF, SHA-512
├── curve.js        → X25519 key agreement, Ed25519 signatures
├── keyhelper.js    → Key generation (identity, pre-keys, signed pre-keys)
├── protocol_address.js → Device addressing
├── session_builder.js  → X3DH session establishment
├── session_cipher.js   → Double Ratchet encrypt/decrypt
├── session_record.js   → Session state persistence
├── protobufs.js        → Protobuf message wrapper
├── WhisperTextProtocol.js → Generated protobuf code
├── errors.js           → Error classes
├── queue_job.js        → Async job queue
├── numeric_fingerprint.js → Fingerprint generation
├── chain_type.js       → SENDING/RECEIVING constants
├── base_key_type.js    → OURS/THEIRS constants
├── crypto.d.ts         → Crypto type defs
└── curve.d.ts          → Curve type defs
```

### Tests
```
test/
├── compatibility.test.js  → API compatibility tests
├── no-console-log.test.js → Console leak regression
└── benchmark.test.js      → Performance benchmarks
```

### Configuration
```
.editorconfig     → Editor settings
.eslintrc.json    → ESLint rules (no-console: error)
.gitattributes    → Line endings
.gitignore        → Git ignore patterns
.npmignore        → npm publish ignore patterns
.prettierrc       → Code formatting
package.json      → Package manifest
```

### CI/CD
```
.github/
├── workflows/
│   ├── ci.yml        → Main CI (lint, test, security, coverage)
│   ├── release.yml   → npm publish
│   ├── pr.yml        → PR validation
│   └── nightly.yml   → Scheduled security audit
├── dependabot.yml    → Dependency updates
├── CODEOWNERS        → Code ownership
├── PULL_REQUEST_TEMPLATE.md
└── ISSUE_TEMPLATE/
    ├── bug_report.md
    ├── feature_request.md
    └── config.yml
```

## Important Code Patterns

### Module Structure
All modules use CommonJS:
```javascript
'use strict';
// ... code ...
module.exports = { ... };
```

### Error Handling
Custom errors extend `SignalError`:
```javascript
class SessionError extends SignalError {
    constructor(message) {
        super(message);
        this.name = 'SessionError';
    }
}
```

### Async Patterns
- Session operations use async/await
- Queue system serializes operations per device
- All storage operations are async (Promise-based)

### Buffer vs Uint8Array
- Internal code uses `Buffer` throughout
- Type definitions use `Uint8Array` for flexibility
- Assertion functions validate Buffer type at boundaries

## Zero Breaking Change Policy

This is the most important rule. **Any change that breaks compatibility with `@kelvdra/baileys` or `WhiskeySockets/Baileys` is unacceptable.**

Before making any code change, ask:
1. Does this change any exported symbol?
2. Does this change any function signature?
3. Does this change any return value?
4. Does this change any error type?
5. Does this change serialization format?
6. Does this change cryptographic behavior?
7. Does this change how Baileys calls this package?

If the answer to ANY of these is "yes", **DO NOT make the change**.

## Security Requirements

### Console Logging
**Zero console.log/info/warn/debug/error calls are allowed in source code.** This includes:
- Printing session objects
- Printing keys or key material
- Printing registration IDs
- Printing error stack traces
- Printing debug information

The regression test `test/no-console-log.test.js` scans all source files for console calls and will fail if any are found.

## Documentation Index

- [README.md](README.md) - Main documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture overview
- [API_REFERENCE.md](API_REFERENCE.md) - Complete API reference
- [DESIGN.md](DESIGN.md) - Design decisions
- [INTERNALS.md](INTERNALS.md) - Internal implementation details
- [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Security analysis
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Development setup
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Testing guide
- [RELEASE_GUIDE.md](RELEASE_GUIDE.md) - Release process
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contributing guidelines
- [SECURITY.md](SECURITY.md) - Security policy
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [LAPORAN.md](LAPORAN.md) - Master audit report
