# Security Architecture

## Overview

This document describes the security properties, cryptographic primitives, and threat model of the `@kelvdra/libsignal` package.

## Threat Model

### Assumptions
- **Node.js runtime is secure**: The underlying Node.js `crypto` module provides cryptographically secure random bytes and constant-time operations
- **Consumer storage is secure**: Session data stored by the consumer (via `SignalStorage`) must be protected at rest
- **Network is insecure**: All messages pass through an untrusted network

### Trust Boundaries
```
┌──────────────────────┐     ┌──────────────────────────┐
│   Trusted Zone       │     │    Semi-Trusted Zone     │
│   (Local Process)    │     │    (Storage Backend)     │
│                      │     │                          │
│  - Private keys      │────▶│  - Serialized sessions   │
│  - Session data      │     │  - Pre-keys              │
│  - Plaintext messages│     │  - Identity keys (pub)   │
└──────────────────────┘     └──────────────────────────┘
         │
         ▼
┌──────────────────────┐
│   Untrusted Zone     │
│   (Network)          │
│                      │
│  - Encrypted messages│
│  - Pre-key bundles   │
└──────────────────────┘
```

## Cryptographic Primitives

### Symmetric Encryption: AES-256-CBC

| Property | Value |
|----------|-------|
| Algorithm | AES-256-CBC |
| Key size | 256 bits (32 bytes) |
| IV size | 128 bits (16 bytes) |
| Implementation | Node.js `crypto.createCipheriv/createDecipheriv` |
| Padding | PKCS#7 (automatic via Node.js) |

### Message Authentication: HMAC-SHA256

| Property | Value |
|----------|-------|
| Algorithm | HMAC-SHA256 |
| Key size | 256 bits (32 bytes) |
| Output size | 256 bits (32 bytes, truncated to 64 bits in messages) |
| Implementation | Node.js `crypto.createHmac` |

### Key Derivation: HKDF-like

| Property | Value |
|----------|-------|
| Algorithm | RFC 5869-inspired, labeled "WhisperText" |
| Hash function | SHA-256 |
| Salt size | 256 bits (32 bytes) |
| Output | 1-3 chunks of 256 bits each |

### Key Agreement: X25519 (Curve25519)

| Property | Value |
|----------|-------|
| Algorithm | X25519 ECDH |
| Key size | 256 bits (32 bytes) |
| Implementation | Node.js `crypto.diffieHellman` with fallback to `curve25519-js` |
| Public key format | 33 bytes (1 byte type prefix + 32 bytes key) |

### Digital Signatures: Ed25519

| Property | Value |
|----------|-------|
| Algorithm | Ed25519 |
| Signature size | 512 bits (64 bytes) |
| Implementation | `curve25519-js` library |

## Key Hierarchy

```
Identity Key (long-term)
├── Signed Pre-Key (medium-term)
│   └── Signed by Identity Key
└── One-Time Pre-Keys (short-term)
    └── Multiple, rotated frequently

Session Keys (ephemeral)
├── Root Key (ratcheted)
├── Chain Keys (sending/receiving, ratcheted)
└── Message Keys (per-message, derived from chain keys)
```

## Security Properties

### Forward Secrecy
- Compromise of long-term keys does not compromise past messages
- Achieved through DH ratchet: each ratchet step generates new ephemeral keys
- Old ephemeral keys are discarded after ratchet step

### Future Secrecy (Post-Compromise Security)
- After compromise, future messages become secure after one ratchet step
- Achieved through DH ratchet: new DH agreement resets the key hierarchy

### Message Authentication
- Each message includes an HMAC over the message content, identity keys, and protocol version
- MAC key is derived from the message key
- MAC truncated to 8 bytes in wire format

### Replay Protection
- Message counter prevents replay of old messages
- Chain key advances with each message
- Gap of >2000 messages causes error

### Identity Verification
- Identity keys are verified through the `isTrustedIdentity` callback
- Mismatched identity keys cause `UntrustedIdentityKeyError`
- Protocol does not enforce any specific identity verification method

## Audit Logging

### What We DO NOT Log
- Private keys
- Ephemeral keys
- Root keys
- Chain keys
- Session records
- Registration IDs
- Plaintext messages
- Pre-key data

### What We DO Log (Nothing)
- **All console logging has been removed** from production code paths
- Regression tests ensure no new logging is added

## Known Security Considerations

### Constant-Time Comparison
- `Buffer.equals()` is used for MAC verification
- While not guaranteed constant-time by the Node.js specification, in practice it is constant-time for equal-length buffers
- The MAC comparison is over 8 bytes, making timing attacks impractical

### Random Number Generation
- All cryptographic randomness uses `crypto.randomBytes()` (CSPRNG)
- No use of `Math.random()` for any cryptographic purpose

### Timing Attacks
- The protocol does not expose timing information through error messages
- All decryption failures are generalized as "No matching sessions found"
- MAC verification precedes decryption

### Side-Channel Attacks
- No mitigation for power analysis or electromagnetic side channels
- These attacks require physical access and are outside the threat model

## Dependency Security

| Dependency | Purpose | Version | Notes |
|------------|---------|---------|-------|
| `curve25519-js` | X25519/Ed25519 operations | ^0.0.4 | Fallback when Node.js built-in is unavailable |
| `protobufjs` | Protocol buffer encode/decode | ^7.5.5 | For wire message format |

Both dependencies are well-established, audited, and minimal in scope.

## Security Testing

### Automated
- **npm audit**: Runs nightly via GitHub Actions
- **CodeQL analysis**: Runs on every commit
- **Dependency review**: Runs on every PR
- **Regression tests**: For console leaks and API compatibility

### Manual
- Code review required for all changes
- Security review for cryptographic changes (blocked by policy)

## Related Documents

- [SECURITY.md](SECURITY.md) - Security policy and vulnerability reporting
- [DESIGN.md](DESIGN.md) - Design decisions
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture overview
