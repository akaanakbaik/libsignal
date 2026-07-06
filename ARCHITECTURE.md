# Architecture

## Overview

`@kelvdra/libsignal` is a Node.js implementation of the **Signal Protocol** - a cryptographic protocol providing end-to-end encryption with forward secrecy and future secrecy (post-compromise security).

This is a modernized fork of [WhiskeySockets/libsignal-node](https://github.com/WhiskeySockets/libsignal-node), designed specifically as a dependency for [@kelvdra/baileys](https://github.com/kelvdra/baileys).

## High-Level Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Baileys    │────▶│  @kelvdra/   │────▶│   Node.js    │
│  (WhatsApp)  │     │   libsignal  │     │   Builtins   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ Session  │ │  Curve   │ │  Crypto  │
         │ Manager  │ │  X25519  │ │ AES/HMAC │
         └──────────┘ └──────────┘ └──────────┘
```

## Module Structure

### Entry Point (`index.js`)
The main entry point re-exports all public modules:

```javascript
exports.crypto            = require('./src/crypto');           // Cryptographic primitives
exports.curve             = require('./src/curve');            // X25519 key agreement
exports.keyhelper         = require('./src/keyhelper');        // Key generation helpers
exports.ProtocolAddress   = require('./src/protocol_address'); // Device addressing
exports.SessionBuilder    = require('./src/session_builder');  // Session establishment
exports.SessionCipher     = require('./src/session_cipher');   // Message encryption/decryption
exports.SessionRecord     = require('./src/session_record');   // Session state persistence
Object.assign(exports, require('./src/errors'));               // Error types
```

### Core Modules

#### `src/crypto.js`
Cryptographic primitives using Node.js built-in `crypto` module:
- **AES-256-CBC**: Symmetric encryption/decryption
- **SHA-256 HMAC**: Message authentication codes
- **SHA-512**: Hash function
- **HKDF-like key derivation**: `deriveSecrets(input, salt, info)`

#### `src/curve.js`
Curve25519/Ed25519 operations:
- **Key generation**: X25519 keypair (ECC)
- **Key agreement**: Diffie-Hellman on Curve25519
- **Signatures**: Ed25519 signing and verification

#### `src/keyhelper.js`
Key generation helpers for the Signal Protocol:
- `generateIdentityKeyPair()` - Long-term identity key
- `generateRegistrationId()` - Device registration ID
- `generateSignedPreKey()` - Signed pre-key bundle
- `generatePreKey()` - One-time pre-key

#### `src/session_record.js`
Session state management:
- `SessionEntry` - Individual session state
- `SessionRecord` - Collection of sessions for a device
  - Session serialization/deserialization with versioning
  - Session lifecycle (open, close, remove old)
  - Chain management (sending/receiving chains)
  - Message key ratcheting

#### `src/session_builder.js`
Session establishment protocol:
- `initOutgoing()` - Initiate session (Alice → Bob)
- `initIncoming()` - Respond to session initiation (Bob → Alice)
- `initSession()` - Triple/multi-DH key agreement (X3DH)
- `calculateSendingRatchet()` - Initialize sending chain after key agreement

#### `src/session_cipher.js`
Message encryption/decryption:
- `encrypt()` - Encrypt outgoing message
- `decryptWhisperMessage()` - Decrypt standard message
- `decryptPreKeyWhisperMessage()` - Decrypt pre-key message
- `doDecryptWhisperMessage()` - Core decryption logic
- `fillMessageKeys()` - Key derivation for message chains
- `maybeStepRatchet()` - Ratchet advancement logic
- `calculateRatchet()` - Ratchet key derivation

#### `src/protobufs.js` / `src/WhisperTextProtocol.js`
Protocol buffer definitions for Signal messages:
- `WhisperMessage` - Standard message format
- `PreKeyWhisperMessage` - Pre-key message format

### Utility Modules

#### `src/protocol_address.js`
Address representation for devices in the Signal Protocol:
- `ProtocolAddress(name, deviceId)` - Represents `name.deviceId`
- `ProtocolAddress.from(encodedString)` - Parse from string format

#### `src/queue_job.js`
Async job queue for serializing session operations:
- Ensures sequential access to session storage per device
- Prevents race conditions in session read/write

#### `src/errors.js`
Error types specific to the Signal Protocol:
- `SignalError` - Base error class
- `UntrustedIdentityKeyError` - Identity key verification failure
- `SessionError` - Session-related errors
- `MessageCounterError` - Duplicate/out-of-order message
- `PreKeyError` - Pre-key related errors

## Data Flow

### Session Establishment (Outgoing)
```
Baileys ──► SessionBuilder.initOutgoing(device)
              ├── isTrustedIdentity()
              ├── verifySignature()
              ├── curve.generateKeyPair()
              ├── initSession() → X3DH key agreement
              │   ├── triple DH calculations
              │   └── crypto.deriveSecrets()
              ├── SessionRecord.createEntry()
              ├── record.closeSession(openSession)
              ├── record.setSession(session)
              └── storage.storeSession()
```

### Message Encryption
```
Baileys ──► SessionCipher.encrypt(data)
              ├── getRecord()
              ├── getOpenSession()
              ├── fillMessageKeys() → chain key ratchet
              ├── crypto.deriveSecrets() → message keys
              ├── crypto.encrypt() → AES-256-CBC
              ├── protobufs.WhisperMessage.encode()
              ├── crypto.calculateMAC()
              └── format output (type, body, registrationId)
```

### Message Decryption
```
Baileys ──► SessionCipher.decryptWhisperMessage(data)
              ├── getRecord()
              ├── decryptWithSessions()
              │   └── doDecryptWhisperMessage()
              │       ├── maybeStepRatchet() → DH ratchet
              │       ├── fillMessageKeys()
              │       ├── crypto.deriveSecrets()
              │       ├── crypto.verifyMAC()
              │       └── crypto.decrypt()
              └── storeRecord()
```

## Security Architecture

See [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) for detailed security analysis.

## Related Documents

- [API_REFERENCE.md](API_REFERENCE.md) - Complete API documentation
- [DESIGN.md](DESIGN.md) - Design decisions and rationale
- [INTERNALS.md](INTERNALS.md) - Internal implementation details
- [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Security analysis
