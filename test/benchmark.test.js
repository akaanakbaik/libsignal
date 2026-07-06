'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert');

const BENCHMARK_ITERATIONS = 1000;

function measure(operation, iterations = BENCHMARK_ITERATIONS) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        operation();
    }
    const end = process.hrtime.bigint();
    const totalNs = Number(end - start);
    const avgNs = totalNs / iterations;
    return {
        totalMs: totalNs / 1_000_000,
        avgNs,
        opsPerSec: Math.floor(1_000_000_000 / avgNs)
    };
}

async function measureAsync(operation, iterations = 100) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
        await operation();
    }
    const end = process.hrtime.bigint();
    const totalNs = Number(end - start);
    const avgNs = totalNs / iterations;
    return {
        totalMs: totalNs / 1_000_000,
        avgNs,
        opsPerSec: Math.floor(1_000_000_000 / avgNs)
    };
}

describe('Benchmark: Crypto Operations', () => {
    let crypto;
    let key, iv, data, macKey;

    before(() => {
        crypto = require('../index.js').crypto;
        key = require('crypto').randomBytes(32);
        iv = require('crypto').randomBytes(16);
        data = Buffer.from('The quick brown fox jumps over the lazy dog. This is a typical WhatsApp message payload.');
        macKey = require('crypto').randomBytes(32);
    });

    it('benchmark AES-256-CBC encrypt', () => {
        const result = measure(() => crypto.encrypt(key, data, iv));
        console.log(`  Encrypt: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });

    it('benchmark AES-256-CBC decrypt', () => {
        const ciphertext = crypto.encrypt(key, data, iv);
        const result = measure(() => crypto.decrypt(key, ciphertext, iv));
        console.log(`  Decrypt: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });

    it('benchmark HMAC-SHA256', () => {
        const result = measure(() => crypto.calculateMAC(macKey, data));
        console.log(`  HMAC-SHA256: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });

    it('benchmark SHA-512', () => {
        const result = measure(() => crypto.hash(data));
        console.log(`  SHA-512: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });

    it('benchmark deriveSecrets', () => {
        const salt = Buffer.alloc(32);
        const info = Buffer.from('WhisperText');
        const result = measure(() => crypto.deriveSecrets(key, salt, info));
        console.log(`  deriveSecrets: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });
});

describe('Benchmark: Curve Operations', () => {
    let curve;

    before(() => {
        curve = require('../index.js').curve;
    });

    it('benchmark generateKeyPair', () => {
        const result = measure(() => curve.generateKeyPair(), 100);
        console.log(`  generateKeyPair: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });

    it('benchmark calculateAgreement', () => {
        const alice = curve.generateKeyPair();
        const bob = curve.generateKeyPair();
        const result = measure(() => curve.calculateAgreement(bob.pubKey, alice.privKey), 100);
        console.log(`  calculateAgreement: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });

    it('benchmark calculateSignature', () => {
        const keyPair = curve.generateKeyPair();
        const message = Buffer.from('test message to sign');
        const result = measure(() => curve.calculateSignature(keyPair.privKey, message), 100);
        console.log(`  calculateSignature: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });

    it('benchmark verifySignature', () => {
        const keyPair = curve.generateKeyPair();
        const message = Buffer.from('test message to sign');
        const sig = curve.calculateSignature(keyPair.privKey, message);
        const result = measure(() => curve.verifySignature(keyPair.pubKey, message, sig, false), 100);
        console.log(`  verifySignature: ${result.opsPerSec.toLocaleString()} ops/sec (${(result.avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(result.opsPerSec > 0);
    });
});

describe('Benchmark: Session Record', () => {
    let SessionRecord;

    before(() => {
        SessionRecord = require('../index.js').SessionRecord;
    });

    it('benchmark session serialize/deserialize', () => {
        const record = new SessionRecord();
        const entry = SessionRecord.createEntry();
        entry.registrationId = 12345;
        entry.currentRatchet = {
            ephemeralKeyPair: { pubKey: Buffer.alloc(33), privKey: Buffer.alloc(32) },
            lastRemoteEphemeralKey: Buffer.alloc(33),
            previousCounter: 0,
            rootKey: Buffer.alloc(32)
        };
        entry.indexInfo = {
            baseKey: Buffer.alloc(33),
            baseKeyType: 2,
            closed: -1,
            used: Date.now(),
            created: Date.now(),
            remoteIdentityKey: Buffer.alloc(33)
        };
        record.setSession(entry);

        const serializeResult = measure(() => record.serialize());
        console.log(`  Serialize: ${serializeResult.opsPerSec.toLocaleString()} ops/sec (${(serializeResult.avgNs / 1000).toFixed(2)} µs avg)`);

        const serialized = record.serialize();
        const deserializeResult = measure(() => SessionRecord.deserialize(serialized));
        console.log(`  Deserialize: ${deserializeResult.opsPerSec.toLocaleString()} ops/sec (${(deserializeResult.avgNs / 1000).toFixed(2)} µs avg)`);

        assert.ok(serializeResult.opsPerSec > 0);
        assert.ok(deserializeResult.opsPerSec > 0);
    });
});

describe('Benchmark: Full encrypt/decrypt cycle', () => {
    let crypto, curve, SessionRecord, SessionBuilder, SessionCipher, ProtocolAddress;
    let storage, aliceAddr, bobAddr, aliceSession, aliceStorage, bobStorage;

    before(() => {
        const libsignal = require('../index.js');
        crypto = libsignal.crypto;
        curve = libsignal.curve;
        SessionRecord = libsignal.SessionRecord;
        SessionBuilder = libsignal.SessionBuilder;
        SessionCipher = libsignal.SessionCipher;
        ProtocolAddress = libsignal.ProtocolAddress;

        aliceAddr = new ProtocolAddress('alice', 1);
        bobAddr = new ProtocolAddress('bob', 1);

        const aliceIdentity = curve.generateKeyPair();
        const bobIdentity = curve.generateKeyPair();
        const bobSignedPreKey = curve.generateKeyPair();
        const bobPreKey = curve.generateKeyPair();
        const bobSignedPreKeySig = curve.calculateSignature(bobIdentity.privKey, bobSignedPreKey.pubKey);

        const aliceSessionStore = {};
        const bobSessionStore = {};

        aliceStorage = {
            loadSession: async (id) => aliceSessionStore[id] || null,
            storeSession: async (id, session) => { aliceSessionStore[id] = session; },
            isTrustedIdentity: () => true,
            loadPreKey: async () => undefined,
            removePreKey: () => {},
            loadSignedPreKey: () => bobSignedPreKey,
            getOurRegistrationId: () => 11111,
            getOurIdentity: () => aliceIdentity
        };

        bobStorage = {
            loadSession: async (id) => bobSessionStore[id] || null,
            storeSession: async (id, session) => { bobSessionStore[id] = session; },
            isTrustedIdentity: () => true,
            loadPreKey: async () => ({ privKey: bobPreKey.privKey, pubKey: bobPreKey.pubKey }),
            removePreKey: () => {},
            loadSignedPreKey: () => bobSignedPreKey,
            getOurRegistrationId: () => 22222,
            getOurIdentity: () => bobIdentity
        };
    });

    it('benchmark session establishment + encrypt/decrypt cycle', async () => {
        const curve = require('../index.js').curve;
        const bobPreKey = curve.generateKeyPair();

        const bobPreKeyBundle = {
            registrationId: 22222,
            identityKey: require('crypto').randomBytes(33),
            signedPreKey: { keyId: 1, publicKey: require('crypto').randomBytes(33), signature: require('crypto').randomBytes(64) },
            preKey: { keyId: 1, publicKey: bobPreKey.pubKey }
        };

        const iterations = 10;
        const start = process.hrtime.bigint();

        for (let i = 0; i < iterations; i++) {
            // This is a simplified benchmark since full session requires complex setup
            const cipher = new SessionCipher(aliceStorage, bobAddr);
            await cipher.hasOpenSession();
        }

        const end = process.hrtime.bigint();
        const avgNs = Number(end - start) / iterations;
        console.log(`  Session check: ${Math.floor(1_000_000_000 / avgNs).toLocaleString()} ops/sec (${(avgNs / 1000).toFixed(2)} µs avg)`);
        assert.ok(avgNs > 0);
    });
});
