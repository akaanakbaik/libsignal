# API Reference

## Table of Contents

- [Exports](#exports)
- [crypto](#crypto-module)
- [curve](#curve-module)
- [keyhelper](#keyhelper-module)
- [ProtocolAddress](#protocoladdress-class)
- [SessionBuilder](#sessionbuilder-class)
- [SessionCipher](#sessioncipher-class)
- [SessionRecord](#sessionrecord-class)
- [Errors](#errors)
- [Type Definitions](#type-definitions)

## Exports

```javascript
const libsignal = require('@akaanakbaik/libsignal');
// or
import * as libsignal from '@akaanakbaik/libsignal';
```

| Export | Source | Description |
|--------|--------|-------------|
| `crypto` | `./src/crypto.js` | Cryptographic primitives |
| `curve` | `./src/curve.js` | Curve25519/Ed25519 operations |
| `keyhelper` | `./src/keyhelper.js` | Key generation helpers |
| `ProtocolAddress` | `./src/protocol_address.js` | Device address representation |
| `SessionBuilder` | `./src/session_builder.js` | Session establishment |
| `SessionCipher` | `./src/session_cipher.js` | Message encryption/decryption |
| `SessionRecord` | `./src/session_record.js` | Session state management |
| `SignalError` | `./src/errors.js` | Base error class |
| `UntrustedIdentityKeyError` | `./src/errors.js` | Untrusted identity error |
| `SessionError` | `./src/errors.js` | Session error |
| `MessageCounterError` | `./src/errors.js` | Message counter error |
| `PreKeyError` | `./src/errors.js` | Pre-key error |

---

## crypto Module

### `crypto.encrypt(key, data, iv)`
AES-256-CBC encryption.

| Param | Type | Description |
|-------|------|-------------|
| `key` | `Buffer` | 32-byte AES key |
| `data` | `Buffer` | Plaintext to encrypt |
| `iv` | `Buffer` | 16-byte initialization vector |

**Returns**: `Buffer` - Ciphertext

### `crypto.decrypt(key, data, iv)`
AES-256-CBC decryption.

| Param | Type | Description |
|-------|------|-------------|
| `key` | `Buffer` | 32-byte AES key |
| `data` | `Buffer` | Ciphertext to decrypt |
| `iv` | `Buffer` | 16-byte initialization vector |

**Returns**: `Buffer` - Plaintext

### `crypto.calculateMAC(key, data)`
SHA-256 HMAC calculation.

| Param | Type | Description |
|-------|------|-------------|
| `key` | `Buffer` | HMAC key |
| `data` | `Buffer` | Data to authenticate |

**Returns**: `Buffer` - 32-byte HMAC

### `crypto.hash(data)`
SHA-512 hash.

| Param | Type | Description |
|-------|------|-------------|
| `data` | `Buffer` | Data to hash |

**Returns**: `Buffer` - 64-byte hash

### `crypto.deriveSecrets(input, salt, info, [chunks])`
HKDF-like key derivation (RFC 5869-based).

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `input` | `Buffer` | - | Input key material (IKM) |
| `salt` | `Buffer` | - | 32-byte salt |
| `info` | `Buffer` | - | Context information |
| `chunks` | `number` | `3` | Number of 32-byte chunks (1-3) |

**Returns**: `Buffer[]` - Array of derived keys

### `crypto.verifyMAC(data, key, mac, length)`
Verify HMAC with constant-time comparison.

| Param | Type | Description |
|-------|------|-------------|
| `data` | `Buffer` | Data to verify |
| `key` | `Buffer` | HMAC key |
| `mac` | `Buffer` | Expected MAC |
| `length` | `number` | MAC length |

**Throws**: `Error` - If MAC is invalid

---

## curve Module

### `curve.generateKeyPair()`
Generate an X25519 key pair.

**Returns**: `{ pubKey: Buffer, privKey: Buffer }`
- `pubKey`: 33-byte buffer (0x05 prefix + 32-byte public key)
- `privKey`: 32-byte buffer

### `curve.calculateAgreement(pubKey, privKey)`
Calculate X25519 Diffie-Hellman shared secret.

| Param | Type | Description |
|-------|------|-------------|
| `pubKey` | `Buffer` | 32 or 33-byte public key |
| `privKey` | `Buffer` | 32-byte private key |

**Returns**: `Buffer` - 32-byte shared secret

### `curve.calculateSignature(privKey, message)`
Create an Ed25519 signature.

| Param | Type | Description |
|-------|------|-------------|
| `privKey` | `Buffer` | 32-byte private key |
| `message` | `Buffer` | Message to sign |

**Returns**: `Buffer` - 64-byte signature

### `curve.verifySignature(pubKey, msg, sig, isInit)`
Verify an Ed25519 signature.

| Param | Type | Description |
|-------|------|-------------|
| `pubKey` | `Buffer` | 32 or 33-byte public key |
| `msg` | `Buffer` | Original message |
| `sig` | `Buffer` | 64-byte signature |
| `isInit` | `boolean` | If true, skip verification (return true) |

**Returns**: `boolean`

### `curve.getPublicFromPrivateKey(privKey)` (Internal)
Derive public key from private key.

| Param | Type | Description |
|-------|------|-------------|
| `privKey` | `Buffer` | 32-byte private key |

**Returns**: `Buffer` - 33-byte public key

---

## keyhelper Module

### `keyhelper.generateIdentityKeyPair()`
Generate an identity key pair. Alias for `curve.generateKeyPair()`.

**Returns**: `{ pubKey: Buffer, privKey: Buffer }`

### `keyhelper.generateRegistrationId()`
Generate a random registration ID (14-bit).

**Returns**: `number` - Integer between 0 and 16383

### `keyhelper.generateSignedPreKey(identityKeyPair, signedKeyId)`
Generate a signed pre-key.

| Param | Type | Description |
|-------|------|-------------|
| `identityKeyPair` | `Object` | `{ pubKey: Buffer, privKey: Buffer }` |
| `signedKeyId` | `number` | Non-negative integer key ID |

**Returns**: `{ keyId: number, keyPair: Object, signature: Buffer }`

### `keyhelper.generatePreKey(keyId)`
Generate a one-time pre-key.

| Param | Type | Description |
|-------|------|-------------|
| `keyId` | `number` | Non-negative integer key ID |

**Returns**: `{ keyId: number, keyPair: Object }`

---

## ProtocolAddress Class

### Constructor
```javascript
new ProtocolAddress(name, deviceId)
```

| Param | Type | Description |
|-------|------|-------------|
| `name` | `string` | User identifier (no dots allowed) |
| `deviceId` | `number` | Device ID |

### Static Methods
#### `ProtocolAddress.from(encodedAddress)`
Parse an encoded address string.

| Param | Type | Description |
|-------|------|-------------|
| `encodedAddress` | `string` | Format: `name.deviceId` |

**Returns**: `ProtocolAddress`

### Instance Methods
#### `address.toString()`
Get string representation.

**Returns**: `string` - Format: `name.deviceId`

#### `address.is(other)`
Compare with another address.

| Param | Type | Description |
|-------|------|-------------|
| `other` | `ProtocolAddress` | Address to compare |

**Returns**: `boolean`

### Properties
- `id: string` - User identifier
- `deviceId: number` - Device ID

---

## SessionBuilder Class

### Constructor
```javascript
new SessionBuilder(storage, protocolAddress)
```

| Param | Type | Description |
|-------|------|-------------|
| `storage` | `SignalStorage` | Storage interface |
| `protocolAddress` | `ProtocolAddress` | Remote address |

### Methods

#### `sessionBuilder.initOutgoing(device)`
Initialize an outgoing session.

| Param | Type | Description |
|-------|------|-------------|
| `device` | `E2ESession` | Device session parameters |

**Returns**: `Promise<void>`

**Throws**: `UntrustedIdentityKeyError`, `SessionError`

---

## SessionCipher Class

### Constructor
```javascript
new SessionCipher(storage, protocolAddress)
```

| Param | Type | Description |
|-------|------|-------------|
| `storage` | `SignalStorage` | Storage interface |
| `protocolAddress` | `ProtocolAddress` | Remote address |

### Methods

#### `sessionCipher.encrypt(data)`
Encrypt an outgoing message.

| Param | Type | Description |
|-------|------|-------------|
| `data` | `Buffer` | Plaintext data |

**Returns**: `Promise<{ type: number, body: Buffer, registrationId: number }>`
- `type`: `1` for normal message, `3` for pre-key bundle
- `body`: Encrypted message buffer
- `registrationId`: Sender's registration ID

**Throws**: `SessionError`, `UntrustedIdentityKeyError`

#### `sessionCipher.decryptWhisperMessage(data)`
Decrypt a standard message.

| Param | Type | Description |
|-------|------|-------------|
| `data` | `Buffer` | Encrypted message |

**Returns**: `Promise<Buffer>` - Decrypted plaintext

**Throws**: `SessionError`, `UntrustedIdentityKeyError`

#### `sessionCipher.decryptPreKeyWhisperMessage(data)`
Decrypt a pre-key message.

| Param | Type | Description |
|-------|------|-------------|
| `data` | `Buffer` | Encrypted pre-key message |

**Returns**: `Promise<Buffer>` - Decrypted plaintext

**Throws**: `SessionError`, `UntrustedIdentityKeyError`, `PreKeyError`

#### `sessionCipher.hasOpenSession()`
Check if an open session exists.

**Returns**: `Promise<boolean>`

#### `sessionCipher.closeOpenSession()`
Close the current open session.

**Returns**: `Promise<void>`

---

## SessionRecord Class

### Static Methods

#### `SessionRecord.deserialize(data)`
Deserialize a session record.

| Param | Type | Description |
|-------|------|-------------|
| `data` | `Object` | Serialized session data |

**Returns**: `SessionRecord`

#### `SessionRecord.createEntry()`
Create a new session entry.

**Returns**: `SessionEntry`

### Instance Methods

#### `record.serialize()`
Serialize the session record.

**Returns**: `{ _sessions: Object, version: string }`

#### `record.haveOpenSession()`
Check if an open session exists.

**Returns**: `boolean`

#### `record.getSession(key)`
Get a session by base key.

| Param | Type | Description |
|-------|------|-------------|
| `key` | `Buffer` | Base key |

**Returns**: `SessionEntry | undefined`

#### `record.getOpenSession()`
Get the currently open session.

**Returns**: `SessionEntry | undefined`

#### `record.setSession(session)`
Store a session.

| Param | Type | Description |
|-------|------|-------------|
| `session` | `SessionEntry` | Session to store |

#### `record.getSessions()`
Get all sessions sorted by most recently used first.

**Returns**: `SessionEntry[]`

#### `record.closeSession(session)`
Close a session.

| Param | Type | Description |
|-------|------|-------------|
| `session` | `SessionEntry` | Session to close |

#### `record.openSession(session)`
Open a closed session.

| Param | Type | Description |
|-------|------|-------------|
| `session` | `SessionEntry` | Session to open |

#### `record.isClosed(session)`
Check if a session is closed.

| Param | Type | Description |
|-------|------|-------------|
| `session` | `SessionEntry` | Session to check |

**Returns**: `boolean`

#### `record.removeOldSessions()`
Remove old closed sessions when exceeding `CLOSED_SESSIONS_MAX` (40).

**Throws**: `Error` - If sessions are corrupt

#### `record.deleteAllSessions()`
Remove all sessions.

---

## Errors

### Hierarchy
```
SignalError (Error)
├── UntrustedIdentityKeyError
└── SessionError
    ├── MessageCounterError
    └── PreKeyError
```

### `SignalError`
Base error class for all Signal Protocol errors.
- Extends: `Error`

### `UntrustedIdentityKeyError`
Thrown when an identity key is not trusted.
- Properties: `addr`, `identityKey`
- Extends: `SignalError`

### `SessionError`
Thrown for session-related errors.
- Extends: `SignalError`

### `MessageCounterError`
Thrown when a message key has already been used (duplicate detection).
- Extends: `SessionError`

### `PreKeyError`
Thrown for pre-key related errors (invalid/missing pre-keys).
- Extends: `SessionError`

---

## Type Definitions

### `SignalStorage`
```typescript
interface SignalStorage {
  loadSession(id: string): Promise<SessionRecord | null | undefined>;
  storeSession(id: string, session: SessionRecord): Promise<void>;
  isTrustedIdentity(identifier: string, identityKey: Uint8Array, direction: number): boolean;
  loadPreKey(id: number | string): Promise<{ privKey: Buffer; pubKey: Buffer } | undefined>;
  removePreKey(id: number): void;
  loadSignedPreKey(): { privKey: Buffer; pubKey: Buffer };
  getOurRegistrationId(): Promise<number> | number;
  getOurIdentity(): { privKey: Buffer; pubKey: Buffer };
}
```

### `E2ESession`
```typescript
interface E2ESession {
  registrationId: number;
  identityKey: Uint8Array;
  signedPreKey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  preKey: {
    keyId: number;
    publicKey: Uint8Array;
  };
}
```
