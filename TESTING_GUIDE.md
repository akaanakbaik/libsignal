# Testing Guide

## Test Architecture

Tests use Node.js built-in test runner (`node:test`) - no external test frameworks required.

### Test Files

| File | Type | Description |
|------|------|-------------|
| `test/compatibility.test.js` | Compatibility | API surface, crypto, curve, keyhelper, session |
| `test/no-console-log.test.js` | Regression | Ensures no console logging leaks sensitive data |
| `test/benchmark.test.js` | Performance | Encrypt/decrypt/session benchmarks |

## Running Tests

```bash
# Run all tests
npm test

# Run with verbose output
node --test --test-reporter=spec test/*.test.js

# Run specific test
node --test test/compatibility.test.js

# Run with coverage (Node 20+)
node --experimental-test-coverage --test test/*.test.js
```

## Writing Tests

### Basic Test Structure

```javascript
const { describe, it, before } = require('node:test');
const assert = require('node:assert');

describe('Module Name', () => {
  let module;

  before(() => {
    module = require('../path/to/module');
  });

  it('should do something specific', () => {
    const result = module.someFunction();
    assert.equal(result, expectedValue);
  });

  it('should throw on invalid input', () => {
    assert.throws(() => {
      module.someFunction(null);
    }, {
      name: 'TypeError',
      message: /expected/i
    });
  });
});
```

### Async Tests

```javascript
it('should handle async operations', async () => {
  const result = await module.asyncFunction();
  assert.ok(result);
  assert.equal(result.length, 32);
});
```

### Buffer Comparisons

```javascript
it('should produce correct buffer output', () => {
  const result = module.someFunction(input);
  assert.ok(result instanceof Buffer);
  assert.equal(result.length, 32);
  assert.ok(result.equals(expectedBuffer));
});
```

## Test Coverage Requirements

All PRs must maintain or improve test coverage. Minimum coverage areas:

- **Public API**: 100% of exports must be tested
- **Error paths**: All error types must be instantiable
- **Crypto operations**: Encrypt + decrypt round-trip
- **Curve operations**: Key agreement, signing, verification
- **Session lifecycle**: Create, serialize, deserialize, open, close
- **No console leaks**: Every file checked for console.log/info/warn/debug/error

## Regression Testing

The `no-console-log.test.js` test is critical. It scans all source files and ensures no `console.xxx` calls exist. This prevents sensitive data leakage (private keys, session data, etc.).

If you need to add a console call for legitimate debugging during development, **remove it before committing**. The regression test will catch it.

## Manual Testing with Baileys

To test compatibility with `@kelvdra/baileys`:

```bash
# Link the package
cd /path/to/libsignal
npm link

# In your baileys project
npm link @akaanakbaik/libsignal

# Or use a direct dependency in package.json
{
  "dependencies": {
    "@akaanakbaik/libsignal": "file:/path/to/libsignal"
  }
}
```

## Performance Testing

Run benchmarks to detect regressions:

```bash
node --test test/benchmark.test.js
```

Compare results with the baseline. Any significant regression (>10%) should be investigated.
