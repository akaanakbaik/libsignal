# Development Guide

## Prerequisites

- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0

## Setup

```bash
# Clone the repository
git clone https://github.com/kelvdra/libsignal.git
cd libsignal

# Install dependencies
npm install

# Verify setup
node -e "require('./index.js')"
```

## Project Structure

```
libsignal/
├── index.js              # Entry point - re-exports all public modules
├── index.d.ts            # TypeScript type definitions
├── package.json          # Package configuration
├── src/                  # Source code
│   ├── crypto.js         # Cryptographic primitives
│   ├── curve.js          # Curve25519/Ed25519 operations
│   ├── keyhelper.js      # Key generation helpers
│   ├── protocol_address.js  # Device addressing
│   ├── session_builder.js   # Session establishment
│   ├── session_cipher.js    # Message encryption/decryption
│   ├── session_record.js    # Session state management
│   ├── protobufs.js         # Protocol buffer message types
│   ├── WhisperTextProtocol.js  # Generated protobuf bindings
│   ├── errors.js             # Error types
│   ├── queue_job.js          # Async job queue
│   ├── numeric_fingerprint.js # Fingerprint generation
│   ├── chain_type.js         # Chain type constants
│   ├── base_key_type.js      # Base key type constants
│   ├── crypto.d.ts           # Crypto type defs
│   └── curve.d.ts            # Curve type defs
├── test/                 # Tests
│   ├── compatibility.test.js  # API compatibility tests
│   ├── no-console-log.test.js # Regression tests for logging
│   └── benchmark.test.js      # Performance benchmarks
├── docs/                 # Documentation
├── protos/               # Protocol buffer definitions
└── .github/              # GitHub configuration
    ├── workflows/        # CI/CD pipelines
    ├── ISSUE_TEMPLATE/   # Issue templates
    └── CODEOWNERS        # Code ownership
```

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/my-feature
```

### 2. Make Changes

**Important Rules:**
- **Never change** `index.js` or `index.d.ts` exports
- **Never change** cryptographic algorithms
- **Never change** serialization formats
- **Never add** console.log/info/warn/debug/error to source code

### 3. Run Tests
```bash
npm test                          # All tests
node --test test/compatibility.test.js  # API tests only
node --test test/no-console-log.test.js # Regression tests
```

### 4. Check Code Quality
```bash
npx eslint src/
npx prettier --check "src/**/*.js" "index.js"
```

### 5. Commit
Use [Conventional Commits](https://www.conventionalcommits.org/):
```bash
git commit -m "fix: correct session closing logic"
git commit -m "feat: add new key helper function"
git commit -m "docs: update API reference"
git commit -m "test: add coverage for edge cases"
```

### 6. Submit PR
Push your branch and open a Pull Request following the [PR template](.github/PULL_REQUEST_TEMPLATE.md).

## Testing Guidelines

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for detailed testing instructions.

## Common Tasks

### Adding a Test
```javascript
const { describe, it } = require('node:test');
const assert = require('node:assert');

describe('My Feature', () => {
  it('should work correctly', () => {
    // Test implementation
  });
});
```

### Manual Testing with Baileys
```javascript
const libsignal = require('@kelvdra/libsignal');
// Use the same API as you would with the original libsignal
```

### Checking for Console Leaks
```bash
node --test test/no-console-log.test.js
```

## Troubleshooting

### "Cannot find module"
```bash
npm install
```

### Tests failing
1. Check Node.js version: `node --version` (must be >= 16)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check for local changes: `git status`

### ESLint errors
```bash
npx eslint --fix src/
```

### Prettier errors
```bash
npx prettier --write "src/**/*.js"
```
