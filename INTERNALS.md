# Internal Implementation Details

## Session Storage Format

### SessionRecord Serialization

```javascript
{
  version: "v1",
  _sessions: {
    "<base64-of-baseKey>": {
      registrationId: <number>,
      currentRatchet: {
        ephemeralKeyPair: {
          pubKey: "<base64>",
          privKey: "<base64>"
        },
        lastRemoteEphemeralKey: "<base64>",
        previousCounter: <number>,
        rootKey: "<base64>"
      },
      indexInfo: {
        baseKey: "<base64>",
        baseKeyType: <1|2>,  // 1=OURS, 2=THEIRS
        closed: <number|-1>,  // -1 = open, otherwise timestamp
        used: <timestamp>,
        created: <timestamp>,
        remoteIdentityKey: "<base64>"
      },
      _chains: {
        "<base64-of-chain-key>": {
          chainKey: {
            counter: <number>,
            key: "<base64>|null"
          },
          chainType: <1|2>,  // 1=SENDING, 2=RECEIVING
          messageKeys: {
            "<counter>": "<base64>"
          }
        }
      },
      pendingPreKey: {  // optional
        signedKeyId: <number>,
        baseKey: "<base64>",
        preKeyId: <number>  // optional
      }
    }
  }
}
```

### Session Entry

Each `SessionEntry` represents one session between two devices:

- **`registrationId`**: The remote device's registration ID
- **`currentRatchet`**: Current state of the symmetric ratchet
  - `ephemeralKeyPair`: Current sending key pair
  - `lastRemoteEphemeralKey`: Last received ephemeral key
  - `previousCounter`: Counter from previous sending chain
  - `rootKey`: Current root key for deriving ratchet keys
- **`indexInfo`**: Session metadata
  - `baseKey`: The base key identifying this session
  - `baseKeyType`: Whether this key belongs to us or them
  - `closed`: Session state (-1 = open, timestamp = closed)
  - `used`: Last usage timestamp
  - `created`: Creation timestamp
  - `remoteIdentityKey`: The other party's identity key
- **`_chains`**: Map of chain key → chain data
  - Each chain has `chainKey` (counter + key), `chainType`, and `messageKeys`
- **`pendingPreKey`**: Pre-key information for first message

## Message Format

### WhisperMessage (type=1)

```
┌──────────┬──────────────────────┬──────────┐
│ Version  │   Protobuf Message   │  MAC (8) │
│ (1 byte) │    (variable)        │  bytes   │
└──────────┴──────────────────────┴──────────┘
```

Version byte encodes both minimum and maximum version:
```
high nibble = max version (3)
low nibble  = min version (3)
```

### PreKeyWhisperMessage (type=3)

```
┌──────────┬────────────────────────────┐
│ Version  │   Protobuf Message         │
│ (1 byte) │    (variable)              │
└──────────┴────────────────────────────┘
```

Protobuf fields:
- `registrationId` (uint32, field 5)
- `preKeyId` (uint32, field 1, optional)
- `signedPreKeyId` (uint32, field 6)
- `baseKey` (bytes, field 2)
- `identityKey` (bytes, field 3)
- `message` (bytes, field 4) - contains the inner WhisperMessage

### MAC Calculation

The MAC covers:
```
identityKeyPub (33 bytes) + remoteIdentityKey (33 bytes) + versionByte (1) + messageProto (variable)
```

## Key Derivation Steps

### Session Key Derivation (X3DH)

```
sharedSecret = 0xFFFF...FF (32 bytes) concat
  DH(theirSignedPub, ourIdentityPriv) +
  DH(theirIdentityPub, ourSignedKey.priv) +
  DH(theirSignedPub, ourSignedKey.priv) +
  [DH(theirEphemeralPub, ourEphemeralKey.priv)]  // optional

masterKey = deriveSecrets(sharedSecret, 0x00...00, "WhisperText")
  → [rootKey, chainKey_send, chainKey_recv]
```

### Ratchet Key Derivation

```
sharedSecret = DH(remoteEphemeralKey, ourEphemeralKey.priv)
masterKey = deriveSecrets(sharedSecret, rootKey, "WhisperRatchet", 2)
  → [newRootKey, newChainKey]
```

### Message Key Derivation

```
messageKeys = deriveSecrets(chainMessageKey, 0x00...00, "WhisperMessageKeys")
  → [encryptionKey, macKey, iv]
```

### Chain Key Ratchet

```
nextChainKey = HMAC-SHA256(currentChainKey, 0x02)
messageKey   = HMAC-SHA256(currentChainKey, 0x01)
```

## Queue System

The `queue_job.js` module implements a per-bucket async queue:

- Each device address gets its own queue
- Ensures sequential session operations (no races on session storage)
- Auto-cleanup of empty queues
- Batch processing with GC for large queues

## Migration System

The `SessionRecord.migrate()` function handles version upgrades:

- Current version: `"v1"`
- Migrations are functions that transform old data to new format
- The version field determines which migrations to apply
- Only `v1` migration exists: copies `registrationId` to sessions that lack it

## Key Format Notes

### Public Keys
- Stored as 33-byte buffers with `0x05` prefix (key bundle type)
- The prefix is stripped before X25519 operations
- Some clients may produce 32-byte keys without prefix

### Private Keys
- Stored as 32-byte buffers
- Some operations modify the key format for specific uses

### Base64 Encoding
- Session records use standard Base64 (not URL-safe)
- Chain keys are used as Base64-encoded property names
