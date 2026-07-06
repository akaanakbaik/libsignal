# Design

## Design Philosophy

The Signal Protocol is a well-established, peer-reviewed cryptographic protocol. This implementation prioritizes:

1. **Correctness over performance** - Protocol behavior must be identical to the specification
2. **Simplicity over cleverness** - Code must be auditable and reviewable
3. **Stability over features** - No new features that could introduce bugs
4. **Backward compatibility over modernization** - Zero breaking changes, always

## Key Design Decisions

### Pure JavaScript Implementation

**Decision**: Pure JavaScript with Node.js built-in `crypto` module.

**Rationale**: The original libsignal-node was written in pure JavaScript for maximum compatibility. We maintain this approach because:
- No native compilation required
- Works across all Node.js versions without rebuild
- Easy to audit and review
- No platform-specific issues

### X3DH Key Agreement

The implementation follows the [X3DH (Extended Triple Diffie-Hellman)](https://signal.org/docs/specifications/x3dh/) key agreement protocol:

- **Triple DH** between identity keys and ephemeral keys
- **Optional fourth DH** when pre-keys are available
- Key derivation using HKDF-like `deriveSecrets()` with "WhisperText" info

### Double Ratchet Algorithm

The implementation follows the [Double Ratchet](https://signal.org/docs/specifications/doubleratchet/) algorithm:

- **DH ratchet**: Forward secrecy through Diffie-Hellman ratchet steps
- **Symmetric ratchet**: Per-message keys derived from chain keys
- **Message key derivation**: HKDF-like with "WhisperMessageKeys" info
- **Root key update**: HKDF-like with "WhisperRatchet" info

### Session Management

- **Multiple sessions per device**: A `SessionRecord` can hold multiple `SessionEntry` objects
- **Closed session limit**: Maximum 40 closed sessions before oldest are evicted
- **Most-recently-used ordering**: Sessions are sorted by `used` timestamp
- **Session migration**: Versioned serialization format with migration support

### Serialization Format

- **Protocol Buffers**: Wire message format via `protobufjs`
- **JSON + Base64**: Session record serialization for storage
- **Version field**: `"v1"` for forward compatibility
- **No encryption at rest**: Storage encryption is the responsibility of the consumer

## Why We Don't...

### ...use @signalapp/libsignal-client

The official Signal library uses native Rust bindings and does not provide the same API as this package. Switching would require significant changes to Baileys and would break backward compatibility.

### ...use TypeScript

The original codebase is JavaScript. Converting to TypeScript would require type annotations on all internal code while maintaining exact runtime behavior, which risks introducing bugs. Type definitions are provided separately via `index.d.ts`.

### ...add streaming/worker support

The Signal Protocol operates on individual messages. Streaming or worker parallelism is not required and would add unnecessary complexity.

### ...add database backends

Session storage is abstracted through the `SignalStorage` interface, allowing consumers to implement their own storage backend. Bundling a specific database would be opinionated and unnecessary.

## Security Considerations

### Constant-Time Operations
- MAC verification uses `Buffer.equals()` (not constant-time on all Node.js versions)
- Key comparison is done through MAC verification, which is cryptographically sound

### Random Number Generation
- All random values use `crypto.randomBytes()` (Node.js CSPRNG)
- No use of `Math.random()` for cryptographic purposes

### Key Hygiene
- Private keys are never logged (enforced by regression tests)
- Ephemeral keys are generated fresh for each session
- Old sessions are automatically cleaned up

## Related Documents

- [ARCHITECTURE.md](ARCHITECTURE.md) - High-level architecture
- [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Security analysis
- [INTERNALS.md](INTERNALS.md) - Internal implementation details
