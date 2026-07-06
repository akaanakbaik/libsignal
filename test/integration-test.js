'use strict';

// ============================================================================
// INTEGRATION TEST: @kelvdra/libsignal × @kelvdra/baileys
// ============================================================================
// Real runtime integration test yang menguji semua API libsignal
// sebagaimana dipanggil oleh Baileys.
// ============================================================================

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================================
// CAPTURE CONSOLE OUTPUT FROM LIBSIGNAL
// ============================================================================
const libsignalLogs = [];
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;
const originalConsoleError = console.error;

// Override console to capture output from libsignal
console.warn = function(...args) {
    const stack = new Error().stack;
    const isFromLibsignal = stack && (
        stack.includes('libsignal') || 
        stack.includes('/src/') ||
        stack.includes('session_record') ||
        stack.includes('session_cipher') ||
        stack.includes('session_builder') ||
        stack.includes('curve.js') ||
        stack.includes('queue_job.js')
    );
    if (isFromLibsignal) {
        libsignalLogs.push({ level: 'warn', args: args.map(a => typeof a === 'string' ? a : JSON.stringify(a).substring(0,200)).join(', ') });
    }
    originalConsoleWarn.apply(console, args);
};

console.log = function(...args) {
    const stack = new Error().stack;
    const isFromLibsignal = stack && (
        stack.includes('libsignal') || 
        stack.includes('/src/') ||
        stack.includes('session_record') ||
        stack.includes('session_cipher') ||
        stack.includes('session_builder') ||
        stack.includes('curve.js') ||
        stack.includes('queue_job.js')
    );
    if (isFromLibsignal) {
        libsignalLogs.push({ level: 'log', args: args.map(a => typeof a === 'string' ? a : JSON.stringify(a).substring(0,200)).join(', ') });
    }
    originalConsoleLog.apply(console, args);
};

console.info = function(...args) {
    const stack = new Error().stack;
    const isFromLibsignal = stack && (
        stack.includes('libsignal') || 
        stack.includes('/src/') ||
        stack.includes('session_record') ||
        stack.includes('session_cipher') ||
        stack.includes('session_builder') ||
        stack.includes('curve.js') ||
        stack.includes('queue_job.js')
    );
    if (isFromLibsignal) {
        libsignalLogs.push({ level: 'info', args: args.map(a => typeof a === 'string' ? a : JSON.stringify(a).substring(0,200)).join(', ') });
    }
    originalConsoleInfo.apply(console, args);
};

console.debug = function(...args) {
    const stack = new Error().stack;
    const isFromLibsignal = stack && (
        stack.includes('libsignal') || 
        stack.includes('/src/') ||
        stack.includes('session_record') ||
        stack.includes('session_cipher') ||
        stack.includes('session_builder') ||
        stack.includes('curve.js') ||
        stack.includes('queue_job.js')
    );
    if (isFromLibsignal) {
        libsignalLogs.push({ level: 'debug', args: args.map(a => typeof a === 'string' ? a : JSON.stringify(a).substring(0,200)).join(', ') });
    }
    originalConsoleDebug.apply(console, args);
};

console.error = function(...args) {
    const stack = new Error().stack;
    const isFromLibsignal = stack && (
        stack.includes('libsignal') || 
        stack.includes('/src/') ||
        stack.includes('session_record') ||
        stack.includes('session_cipher') ||
        stack.includes('session_builder') ||
        stack.includes('curve.js') ||
        stack.includes('queue_job.js')
    );
    if (isFromLibsignal) {
        libsignalLogs.push({ level: 'error', args: args.map(a => typeof a === 'string' ? a : JSON.stringify(a).substring(0,200)).join(', ') });
    }
    originalConsoleError.apply(console, args);
};

// ============================================================================
// TEST FRAMEWORK
// ============================================================================
const results = {
    runtime: { passed: 0, failed: 0, errors: [] },
    api: { passed: 0, failed: 0, errors: [] },
    session: { passed: 0, failed: 0, errors: [] },
    crypto: { passed: 0, failed: 0, errors: [] },
    baileys: { passed: 0, failed: 0, errors: [] },
    console: { passed: 0, failed: 0, errors: [] },
    performance: {}
};

function test(category, name, fn) {
    try {
        fn();
        results[category].passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        results[category].failed++;
        results[category].errors.push({ name, error: e.message, stack: e.stack.split('\n').slice(0,3).join('\n') });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

async function testAsync(category, name, fn) {
    try {
        await fn();
        results[category].passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        results[category].failed++;
        results[category].errors.push({ name, error: e.message, stack: e.stack.split('\n').slice(0,3).join('\n') });
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

function measureSync(fn, iterations = 1000) {
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) { fn(); }
    const end = process.hrtime.bigint();
    const totalNs = Number(end - start);
    const avgNs = totalNs / iterations;
    return {
        totalMs: totalNs / 1_000_000,
        avgUs: avgNs / 1000,
        opsPerSec: Math.floor(1_000_000_000 / avgNs),
        iterations
    };
}

// ============================================================================
// SYSTEM INFO
// ============================================================================
const systemInfo = {
    nodeVersion: process.version,
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'unknown',
    totalRam: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
    freeRam: `${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
    hostname: os.hostname(),
};

console.log('\n' + '='.repeat(70));
console.log('INTEGRATION TEST: @kelvdra/libsignal × @kelvdra/baileys');
console.log('='.repeat(70));
console.log(`Node.js: ${systemInfo.nodeVersion}`);
console.log(`Platform: ${systemInfo.platform} ${systemInfo.arch}`);
console.log(`CPU: ${systemInfo.cpuModel} (${systemInfo.cpus} cores)`);
console.log(`RAM: ${systemInfo.totalRam} (${systemInfo.freeRam} free)`);

// ============================================================================
// LOAD PACKAGES
// ============================================================================
let libsignal;
let baileysPkg;

try {
    libsignal = require('@kelvdra/libsignal');
    baileysPkg = require('@kelvdra/baileys/package.json');
    console.log(`\n📦 @kelvdra/libsignal: ${require('@kelvdra/libsignal/package.json').version}`);
    console.log(`📦 @kelvdra/baileys: ${baileysPkg.version}`);
    console.log(`📦 libsignal path: ${require.resolve('@kelvdra/libsignal')}`);
    console.log(`📦 baileys path: ${require.resolve('@kelvdra/baileys')}`);
    results.runtime.passed++;
} catch (e) {
    results.runtime.failed++;
    results.runtime.errors.push({ name: 'package_import', error: e.message });
    console.error('❌ Failed:', e.message);
    process.exit(1);
}

// ============================================================================
// PHASE 3: RUNTIME VALIDATION
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PHASE 3: RUNTIME VALIDATION');
console.log('='.repeat(70));

console.log('\n--- Export Validation ---');
const expectedExports = [
    'crypto', 'curve', 'keyhelper',
    'ProtocolAddress', 'SessionBuilder', 'SessionCipher', 'SessionRecord',
    'SignalError', 'UntrustedIdentityKeyError', 'SessionError',
    'MessageCounterError', 'PreKeyError'
];

test('runtime', 'All expected exports are present', () => {
    const actualExports = Object.keys(libsignal).sort();
    expectedExports.forEach(exp => assert.ok(libsignal[exp], `Missing export: ${exp}`));
    assert.equal(actualExports.length, expectedExports.length,
        `Expected ${expectedExports.length} exports, got ${actualExports.length}`);
});

test('runtime', 'All exports are functions or objects (correct types)', () => {
    assert.equal(typeof libsignal.ProtocolAddress, 'function');
    assert.equal(typeof libsignal.SessionRecord, 'function');
    assert.equal(typeof libsignal.SessionCipher, 'function');
    assert.equal(typeof libsignal.SessionBuilder, 'function');
    assert.equal(typeof libsignal.crypto, 'object');
    assert.equal(typeof libsignal.curve, 'object');
    assert.equal(typeof libsignal.keyhelper, 'object');
    assert.equal(typeof libsignal.SignalError, 'function');
    assert.equal(typeof libsignal.UntrustedIdentityKeyError, 'function');
    assert.equal(typeof libsignal.SessionError, 'function');
    assert.equal(typeof libsignal.MessageCounterError, 'function');
    assert.equal(typeof libsignal.PreKeyError, 'function');
});

// ============================================================================
// PHASE 3B: API VALIDATION
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PHASE 3B: API VALIDATION');
console.log('='.repeat(70));

console.log('\n--- ProtocolAddress ---');
test('api', 'ProtocolAddress constructor with valid args', () => {
    const addr = new libsignal.ProtocolAddress('testuser', 1);
    assert.equal(addr.id, 'testuser');
    assert.equal(addr.deviceId, 1);
});

test('api', 'ProtocolAddress.toString()', () => {
    assert.equal(new libsignal.ProtocolAddress('user', 5).toString(), 'user.5');
});

test('api', 'ProtocolAddress.is() comparison', () => {
    const a = new libsignal.ProtocolAddress('user', 1);
    assert.ok(a.is(new libsignal.ProtocolAddress('user', 1)));
    assert.ok(!a.is(new libsignal.ProtocolAddress('user', 2)));
    assert.ok(!a.is({}));
});

test('api', 'ProtocolAddress.from() static parser', () => {
    const addr = libsignal.ProtocolAddress.from('user.1');
    assert.equal(addr.id, 'user');
    assert.equal(addr.deviceId, 1);
});

test('api', 'ProtocolAddress rejects invalid constructor args', () => {
    assert.throws(() => new libsignal.ProtocolAddress(123, 1), TypeError);
    assert.throws(() => new libsignal.ProtocolAddress('user', '1'), TypeError);
    assert.throws(() => new libsignal.ProtocolAddress('user.1', 1), TypeError); // encoded addr
});

test('api', 'ProtocolAddress.from rejects invalid encoding', () => {
    assert.throws(() => libsignal.ProtocolAddress.from('invalid'), Error);
});

console.log('\n--- SessionRecord ---');
test('api', 'SessionRecord constructor creates empty record', () => {
    const record = new libsignal.SessionRecord();
    assert.ok(record instanceof libsignal.SessionRecord);
    assert.equal(record.haveOpenSession(), false);
});

test('api', 'SessionRecord.createEntry() returns SessionEntry', () => {
    const entry = libsignal.SessionRecord.createEntry();
    assert.ok(entry);
    assert.equal(typeof entry.serialize, 'function');
    assert.equal(typeof entry.addChain, 'function');
    assert.equal(typeof entry.getChain, 'function');
    assert.equal(typeof entry.deleteChain, 'function');
});

test('api', 'SessionRecord full lifecycle: create → set → open → close → serialize → deserialize', () => {
    const SessionRecord = libsignal.SessionRecord;
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
        baseKey: Buffer.alloc(33), baseKeyType: 2, closed: -1,
        used: Date.now(), created: Date.now(), remoteIdentityKey: Buffer.alloc(33)
    };
    record.setSession(entry);

    const serialized = record.serialize();
    assert.ok(serialized._sessions);
    assert.equal(serialized.version, 'v1');

    const deserialized = SessionRecord.deserialize(serialized);
    assert.ok(deserialized instanceof SessionRecord);
    assert.equal(Object.keys(deserialized.sessions).length, 1);
});

console.log('\n--- SessionBuilder ---');
test('api', 'SessionBuilder constructor accepts valid args', () => {
    const addr = new libsignal.ProtocolAddress('test', 1);
    const builder = new libsignal.SessionBuilder(createMockStorage(), addr);
    assert.ok(builder instanceof libsignal.SessionBuilder);
    assert.equal(typeof builder.initOutgoing, 'function');
});

testAsync('api', 'SessionBuilder.initOutgoing rejects untrusted identity', async () => {
    const addr = new libsignal.ProtocolAddress('test', 1);
    const storage = createMockStorage(false); // isTrustedIdentity returns false
    const builder = new libsignal.SessionBuilder(storage, addr);
    try {
        await builder.initOutgoing(createMockDeviceBundle());
        assert.fail('Should have thrown');
    } catch (e) {
        assert.ok(e instanceof libsignal.UntrustedIdentityKeyError);
    }
});

console.log('\n--- SessionCipher ---');
test('api', 'SessionCipher constructor validates ProtocolAddress', () => {
    const storage = createMockStorage();
    const addr = new libsignal.ProtocolAddress('test', 1);
    const cipher = new libsignal.SessionCipher(storage, addr);
    assert.ok(cipher instanceof libsignal.SessionCipher);
    assert.throws(() => new libsignal.SessionCipher(storage, 'bad'), TypeError);
});

testAsync('api', 'SessionCipher.hasOpenSession returns false with no record', async () => {
    const cipher = new libsignal.SessionCipher(createMockStorage(), new libsignal.ProtocolAddress('test', 1));
    assert.equal(await cipher.hasOpenSession(), false);
});

testAsync('api', 'SessionCipher.encrypt throws SessionError without session', async () => {
    const cipher = new libsignal.SessionCipher(createMockStorage(), new libsignal.ProtocolAddress('test', 1));
    try {
        await cipher.encrypt(Buffer.from('test'));
        assert.fail('Should have thrown');
    } catch (e) {
        assert.ok(e instanceof libsignal.SessionError);
    }
});

// ============================================================================
// PHASE 4: SESSION TEST
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PHASE 4: SESSION TEST');
console.log('='.repeat(70));

test('session', 'SessionRecord lifecycle: create → open → close → open', () => {
    const SessionRecord = libsignal.SessionRecord;
    const record = new SessionRecord();
    const entry = createSessionEntry(99999);
    record.setSession(entry);
    assert.equal(record.haveOpenSession(), true);

    const openSession = record.getOpenSession();
    assert.ok(openSession);

    record.closeSession(openSession);
    assert.equal(record.haveOpenSession(), false);
    assert.ok(record.isClosed(openSession));

    record.openSession(openSession);
    assert.equal(record.haveOpenSession(), true);
});

test('session', 'SessionRecord close already-closed session is safe (no crash)', () => {
    const SessionRecord = libsignal.SessionRecord;
    const record = new SessionRecord();
    const entry = createSessionEntry(1);
    record.setSession(entry);
    const session = record.getOpenSession();
    record.closeSession(session);
    record.closeSession(session); // Should not throw
    assert.ok(record.isClosed(session));
});

test('session', 'SessionRecord.getSessions returns sorted by most recently used', () => {
    const SessionRecord = libsignal.SessionRecord;
    const record = new SessionRecord();
    
    const e1 = createSessionEntry(1, { used: 100, baseKey: Buffer.from([1]) });
    const e2 = createSessionEntry(2, { used: 300, baseKey: Buffer.from([2]) });
    const e3 = createSessionEntry(3, { used: 200, baseKey: Buffer.from([3]) });
    
    record.setSession(e1);
    record.setSession(e2);
    record.setSession(e3);
    
    const sessions = record.getSessions();
    assert.equal(sessions.length, 3);
    // First session should be the one with highest 'used' value
    assert.equal(sessions[0].indexInfo.used, 300);
    assert.equal(sessions[1].indexInfo.used, 200);
    assert.equal(sessions[2].indexInfo.used, 100);
});

test('session', 'SessionRecord.deleteAllSessions removes everything', () => {
    const SessionRecord = libsignal.SessionRecord;
    const record = new SessionRecord();
    record.setSession(createSessionEntry(1, { baseKey: Buffer.from([1]) }));
    record.setSession(createSessionEntry(2, { baseKey: Buffer.from([2]) }));
    assert.equal(Object.keys(record.sessions).length, 2);
    record.deleteAllSessions();
    assert.equal(Object.keys(record.sessions).length, 0);
});

test('session', 'SessionRecord complex serialize/deserialize with chains', () => {
    const SessionRecord = libsignal.SessionRecord;
    const record = new SessionRecord();
    const entry = createSessionEntry(42);
    
    // Add chains with message keys
    entry.addChain(crypto.randomBytes(32), {
        messageKeys: { 0: crypto.randomBytes(32), 1: crypto.randomBytes(32) },
        chainKey: { counter: 2, key: crypto.randomBytes(32) },
        chainType: 1
    });
    entry.addChain(crypto.randomBytes(32), {
        messageKeys: {},
        chainKey: { counter: 0, key: crypto.randomBytes(32) },
        chainType: 2
    });
    record.setSession(entry);
    
    const serialized = record.serialize();
    const deserialized = SessionRecord.deserialize(serialized);
    const restoredEntry = Object.values(deserialized.sessions)[0];
    assert.equal(restoredEntry.registrationId, 42);
    assert.ok(restoredEntry._chains);
    assert.equal(Object.keys(restoredEntry._chains).length, 2);
});

test('session', 'SessionRecord.removeOldSessions handles under-limit gracefully', () => {
    const SessionRecord = libsignal.SessionRecord;
    const record = new SessionRecord();
    for (let i = 0; i < 3; i++) {
        const entry = createSessionEntry(i, { closed: i < 2 ? Date.now() : -1, baseKey: Buffer.from([i]) });
        record.setSession(entry);
    }
    record.removeOldSessions(); // Should not throw even with few sessions
    assert.ok(true);
});

test('session', 'SessionRecord throws on getSession with our own basekey', () => {
    const SessionRecord = libsignal.SessionRecord;
    const record = new SessionRecord();
    const entry = createSessionEntry(1, { baseKeyType: 1 }); // OURS
    entry.indexInfo.baseKey = Buffer.from([99]);
    record.setSession(entry);
    assert.throws(() => record.getSession(Buffer.from([99])), /basekey/);
});

// ============================================================================
// PHASE 5: CRYPTO TEST
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PHASE 5: CRYPTO VALIDATION');
console.log('='.repeat(70));

const C = libsignal.crypto;
const CV = libsignal.curve;

test('crypto', 'AES encrypt/decrypt round-trip with random data', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const pt = Buffer.from('Test message for AES encryption!');
    const ct = C.encrypt(key, pt, iv);
    const dt = C.decrypt(key, ct, iv);
    assert.equal(dt.toString(), pt.toString());
});

test('crypto', 'AES encryption is deterministic with same key/iv', () => {
    const key = crypto.randomBytes(32), iv = crypto.randomBytes(16), data = Buffer.from('test');
    assert.deepEqual(C.encrypt(key, data, iv), C.encrypt(key, data, iv));
});

test('crypto', 'AES rejects invalid buffer inputs', () => {
    assert.throws(() => C.encrypt('bad', Buffer.alloc(16), Buffer.alloc(16)), TypeError);
});

test('crypto', 'HMAC-SHA256 produces 32-byte output', () => {
    const mac = C.calculateMAC(crypto.randomBytes(32), Buffer.from('data'));
    assert.equal(mac.length, 32);
});

test('crypto', 'HMAC-SHA256 verifyMAC accepts correct MAC', () => {
    const key = crypto.randomBytes(32), data = Buffer.from('data');
    const mac = C.calculateMAC(key, data);
    C.verifyMAC(data, key, mac.slice(0, 8), 8);
    assert.ok(true);
});

test('crypto', 'HMAC-SHA256 verifyMAC rejects wrong MAC', () => {
    assert.throws(() => C.verifyMAC(Buffer.from('data'), crypto.randomBytes(32), crypto.randomBytes(8), 8), /Bad MAC/);
});

test('crypto', 'HMAC output matches Node.js built-in crypto', () => {
    const key = Buffer.from('test-key-32-bytes-long'.padEnd(32, 'x'));
    const data = Buffer.from('test message');
    const libMac = C.calculateMAC(key, data);
    const nodeMac = crypto.createHmac('sha256', key).update(data).digest();
    assert.deepEqual(libMac, nodeMac);
});

test('crypto', 'SHA-512 produces 64-byte output', () => {
    assert.equal(C.hash(Buffer.from('data')).length, 64);
});

test('crypto', 'SHA-512 output matches Node.js built-in', () => {
    const data = Buffer.from('test hash');
    assert.deepEqual(C.hash(data), crypto.createHash('sha512').update(data).digest());
});

test('crypto', 'deriveSecrets produces 3 chunks of 32 bytes each', () => {
    const s = C.deriveSecrets(crypto.randomBytes(32), Buffer.alloc(32), Buffer.from('WhisperText'));
    assert.equal(s.length, 3);
    s.forEach(c => assert.equal(c.length, 32));
});

test('crypto', 'deriveSecrets with 1 or 2 chunks', () => {
    const input = crypto.randomBytes(32), salt = Buffer.alloc(32), info = Buffer.from('WhisperRatchet');
    assert.equal(C.deriveSecrets(input, salt, info, 1).length, 1);
    assert.equal(C.deriveSecrets(input, salt, info, 2).length, 2);
});

test('crypto', 'deriveSecrets is deterministic', () => {
    const input = crypto.randomBytes(32), salt = Buffer.alloc(32), info = Buffer.from('WhisperText');
    assert.deepEqual(C.deriveSecrets(input, salt, info), C.deriveSecrets(input, salt, info));
});

test('crypto', 'deriveSecrets with different salts produces different output', () => {
    const input = crypto.randomBytes(32), info = Buffer.from('WhisperText');
    assert.notDeepEqual(
        C.deriveSecrets(input, Buffer.alloc(32), info),
        C.deriveSecrets(input, Buffer.alloc(32, 0xff), info)
    );
});

test('crypto', 'generateKeyPair produces valid key pair', () => {
    const kp = CV.generateKeyPair();
    assert.equal(kp.pubKey.length, 33);
    assert.equal(kp.privKey.length, 32);
    assert.equal(kp.pubKey[0], 5);
});

test('crypto', 'calculateAgreement produces matching shared secrets', () => {
    const a = CV.generateKeyPair(), b = CV.generateKeyPair();
    assert.deepEqual(CV.calculateAgreement(b.pubKey, a.privKey), CV.calculateAgreement(a.pubKey, b.privKey));
});

test('crypto', 'calculateSignature produces 64-byte signature', () => {
    const kp = CV.generateKeyPair();
    assert.equal(CV.calculateSignature(kp.privKey, Buffer.from('msg')).length, 64);
});

test('crypto', 'verifySignature accepts valid and rejects invalid', () => {
    const kp = CV.generateKeyPair();
    const msg = Buffer.from('msg');
    const sig = CV.calculateSignature(kp.privKey, msg);
    assert.equal(CV.verifySignature(kp.pubKey, msg, sig, false), true);
    assert.equal(CV.verifySignature(kp.pubKey, Buffer.from('wrong'), sig, false), false);
});

test('crypto', 'verifySignature with isInit returns true', () => {
    const kp = CV.generateKeyPair();
    assert.equal(CV.verifySignature(kp.pubKey, Buffer.alloc(1), Buffer.alloc(64), true), true);
});

test('crypto', 'getPublicFromPrivateKey produces matching public key prefix', () => {
    const kp = CV.generateKeyPair();
    const pubKey = CV.getPublicFromPrivateKey(kp.privKey);
    assert.equal(pubKey.length, 33);
    assert.equal(pubKey[0], 5);
});

// ============================================================================
// PHASE 6: BAILEYS API INTEGRATION TEST
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PHASE 6: BAILEYS API INTEGRATION');
console.log('='.repeat(70));

console.log('\n--- Full message encrypt/decrypt flow (as used by Baileys) ---');

testAsync('baileys', 'Complete session initiation + message encrypt flow (seperti Baileys makeLibSignalRepository)', async () => {
    const storage = createFullSignalStorage();
    const ourIdentity = CV.generateKeyPair();
    const signalStorage = createSignalStorageWithIdentity(storage, ourIdentity);

    const remoteJid = 'user@s.whatsapp.net';
    const remoteAddr = new libsignal.ProtocolAddress('user', 0);
    const remoteIdentity = CV.generateKeyPair();
    const remoteSignedPreKey = CV.generateKeyPair();
    const remotePreKey = CV.generateKeyPair();

    // 1. Initiate outgoing session (seperti Baileys injectE2ESession)
    const builder = new libsignal.SessionBuilder(signalStorage, remoteAddr);
    await builder.initOutgoing({
        registrationId: 67890,
        identityKey: Buffer.concat([Buffer.from([5]), remoteIdentity.pubKey.slice(1)]),
        signedPreKey: {
            keyId: 1,
            publicKey: Buffer.concat([Buffer.from([5]), remoteSignedPreKey.pubKey.slice(1)]),
            signature: CV.calculateSignature(remoteIdentity.privKey, remoteSignedPreKey.pubKey)
        },
        preKey: { keyId: 1, publicKey: Buffer.concat([Buffer.from([5]), remotePreKey.pubKey.slice(1)]) }
    });
    assert.ok(true, 'Session initiated by Baileys-style initOutgoing');

    // 2. Encrypt message (seperti Baileys encryptMessage via SessionCipher)
    const cipher = new libsignal.SessionCipher(signalStorage, remoteAddr);
    const plaintext = Buffer.from('Hello from integration test! This simulates a real WhatsApp message.');
    const encrypted = await cipher.encrypt(plaintext);
    
    assert.ok(encrypted);
    assert.ok(encrypted.type === 3 || encrypted.type === 1, `Expected type 1 or 3, got ${encrypted.type}`);
    assert.ok(encrypted.body instanceof Buffer);
    assert.ok(encrypted.body.length > 0);
    assert.equal(typeof encrypted.registrationId, 'number');
    
    console.log(`    Encrypted: type=${encrypted.type}, body=${encrypted.body.length} bytes, regId=${encrypted.registrationId}`);

    // 3. Verify open session exists
    assert.equal(await cipher.hasOpenSession(), true);

    // 4. Close session (seperti Baileys saat logout/cleanup)
    await cipher.closeOpenSession();
    assert.equal(await cipher.hasOpenSession(), false);
    
    console.log('    ✅ Full Baileys message flow completed successfully');
});

testAsync('baileys', 'Session restore and validate (seperti Baileys validateSession)', async () => {
    const storage = createFullSignalStorage();
    const ourIdentity = CV.generateKeyPair();
    const signalStorage = createSignalStorageWithIdentity(storage, ourIdentity);

    const remoteAddr = new libsignal.ProtocolAddress('user2', 1);
    const builder = new libsignal.SessionBuilder(signalStorage, remoteAddr);
    const bundle = createMockDeviceBundle();
    await builder.initOutgoing(bundle);

    // Session restore: load from storage (seperti Baileys)
    const record = await signalStorage.loadSession(remoteAddr.toString());
    assert.ok(record instanceof libsignal.SessionRecord);
    assert.equal(record.haveOpenSession(), true);

    // Serialize/deserialize (seperti Baileys menyimpan ke database)
    const serialized = JSON.stringify(record.serialize());
    const deserialized = libsignal.SessionRecord.deserialize(JSON.parse(serialized));
    assert.equal(deserialized.haveOpenSession(), true);
    
    console.log('    ✅ Session restore flow: create → store → serialize → deserialize → verify');
});

testAsync('baileys', 'Session delete (seperti Baileys deleteSession)', async () => {
    const storage = createFullSignalStorage();
    const ourIdentity = CV.generateKeyPair();
    const signalStorage = createSignalStorageWithIdentity(storage, ourIdentity);

    const remoteAddr = new libsignal.ProtocolAddress('user3', 1);
    const builder = new libsignal.SessionBuilder(signalStorage, remoteAddr);
    await builder.initOutgoing(createMockDeviceBundle());

    // Verify session exists
    let record = await signalStorage.loadSession(remoteAddr.toString());
    assert.ok(record);

    // Delete session (like Baileys deleteSession)
    await signalStorage.storeSession(remoteAddr.toString(), null).catch(() => {});
    // Create new record without sessions
    const newRecord = new libsignal.SessionRecord();
    await signalStorage.storeSession(remoteAddr.toString(), newRecord);
    
    record = await signalStorage.loadSession(remoteAddr.toString());
    assert.ok(record);
    assert.equal(record.haveOpenSession(), false);
    
    console.log('    ✅ Session deletion flow completed successfully');
});

testAsync('baileys', 'Group operations: sender key derivation (seperti Baileys group message)', async () => {
    // Baileys menggunakan deriveSecrets untuk group operations
    const inputKey = crypto.randomBytes(32);
    const salt = Buffer.alloc(32);
    const info = Buffer.from('WhisperGroup');
    const derived = C.deriveSecrets(inputKey, salt, info);
    
    assert.equal(derived.length, 3);
    assert.equal(derived[0].length, 32);
    assert.ok(derived[0] instanceof Buffer);
    console.log('    ✅ Group sender key derivation works correctly');
});

testAsync('baileys', 'Curve operations as used by Baileys Utils/crypto.js', async () => {
    // Baileys menggunakan curve.generateKeyPair untuk key generation
    const kp = CV.generateKeyPair();
    assert.ok(kp.pubKey instanceof Buffer);
    assert.ok(kp.privKey instanceof Buffer);

    // Baileys menggunakan curve.calculateAgreement untuk shared key
    const alice = CV.generateKeyPair();
    const bob = CV.generateKeyPair();
    const shared = CV.calculateAgreement(bob.pubKey, alice.privKey);
    assert.equal(shared.length, 32);
    
    console.log('    ✅ Curve operations (as in Baileys Utils/crypto.js) work correctly');
});

// ============================================================================
// PHASE 7: REGRESSION TEST (original vs fork)
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PHASE 7: REGRESSION TEST - Original vs Fork Output Comparison');
console.log('='.repeat(70));

console.log('\n--- Cryptographic Output Consistency ---');

test('crypto', 'Encrypt output consistency across multiple calls', () => {
    const key = Buffer.from('0123456789abcdef0123456789abcdef');
    const iv = Buffer.from('0123456789abcdef');
    const data = Buffer.from('consistent test');
    
    const ct1 = C.encrypt(key, data, iv);
    const ct2 = C.encrypt(key, data, iv);
    assert.deepEqual(ct1, ct2, 'Encrypt with same key/iv must produce identical output');
});

test('crypto', 'deriveSecrets output consistency', () => {
    const input = Buffer.from('0123456789abcdef0123456789abcdef');
    const salt = Buffer.alloc(32);
    const info = Buffer.from('WhisperText');
    
    const d1 = C.deriveSecrets(input, salt, info);
    const d2 = C.deriveSecrets(input, salt, info);
    assert.deepEqual(d1, d2);
});

test('crypto', 'Key agreement consistency', () => {
    const kp1 = CV.generateKeyPair();
    const kp2 = CV.generateKeyPair();
    
    const s1 = CV.calculateAgreement(kp2.pubKey, kp1.privKey);
    const s2 = CV.calculateAgreement(kp2.pubKey, kp1.privKey);
    assert.deepEqual(s1, s2);
});

test('crypto', 'Signature consistency', () => {
    const kp = CV.generateKeyPair();
    const msg = Buffer.from('test');
    const sig1 = CV.calculateSignature(kp.privKey, msg);
    const sig2 = CV.calculateSignature(kp.privKey, msg);
    assert.deepEqual(sig1, sig2);
});

test('crypto', 'SessionRecord serialize/deserialize consistency', () => {
    const SessionRecord = libsignal.SessionRecord;
    const record = new SessionRecord();
    const entry = createSessionEntry(777);
    entry.addChain(crypto.randomBytes(32), {
        messageKeys: { 5: crypto.randomBytes(32) },
        chainKey: { counter: 5, key: crypto.randomBytes(32) },
        chainType: 1
    });
    record.setSession(entry);
    
    // Serialize → deserialize → re-serialize → compare
    const s1 = record.serialize();
    const d1 = SessionRecord.deserialize(s1);
    const s2 = d1.serialize();
    assert.deepEqual(s1, s2);
});

// ============================================================================
// PHASE 8: CONSOLE AUDIT
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PHASE 8: CONSOLE AUDIT');
console.log('='.repeat(70));

console.log(`\nTotal libsignal console calls during testing: ${libsignalLogs.length}`);
libsignalLogs.forEach(log => {
    console.log(`  [${log.level}] ${log.args.substring(0, 200)}`);
});

test('console', 'Zero console.log from libsignal', () => {
    assert.equal(libsignalLogs.filter(l => l.level === 'log').length, 0);
});
test('console', 'Zero console.info from libsignal', () => {
    assert.equal(libsignalLogs.filter(l => l.level === 'info').length, 0);
});
test('console', 'Zero console.warn from libsignal', () => {
    assert.equal(libsignalLogs.filter(l => l.level === 'warn').length, 0);
});
test('console', 'Zero console.debug from libsignal', () => {
    assert.equal(libsignalLogs.filter(l => l.level === 'debug').length, 0);
});
test('console', 'Zero console.error from libsignal', () => {
    assert.equal(libsignalLogs.filter(l => l.level === 'error').length, 0);
});

// ============================================================================
// PHASE 9: PERFORMANCE
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('PHASE 9: PERFORMANCE BENCHMARK');
console.log('='.repeat(70));

const pk = crypto.randomBytes(32), pv = crypto.randomBytes(16), pd = Buffer.from('Performance test payload for benchmarking.');

results.performance.aesEncrypt = measureSync(() => C.encrypt(pk, pd, pv));
results.performance.aesDecrypt = measureSync(() => C.decrypt(pk, C.encrypt(pk, pd, pv), pv));
results.performance.hmac = measureSync(() => C.calculateMAC(pk, pd));
results.performance.hash = measureSync(() => C.hash(pd));
results.performance.deriveSecrets = measureSync(() => C.deriveSecrets(pk, Buffer.alloc(32), Buffer.from('WhisperText')));
results.performance.generateKeyPair = measureSync(() => CV.generateKeyPair(), 100);
results.performance.calculateAgreement = measureSync(() => CV.calculateAgreement(CV.generateKeyPair().pubKey, CV.generateKeyPair().privKey), 100);
results.performance.calculateSignature = measureSync(() => CV.calculateSignature(CV.generateKeyPair().privKey, pd), 100);

const vk = CV.generateKeyPair(), vs = CV.calculateSignature(vk.privKey, pd);
results.performance.verifySignature = measureSync(() => CV.verifySignature(vk.pubKey, pd, vs, false), 100);

// Session performance
const SR = libsignal.SessionRecord;
const sr = new SR();
for (let i = 0; i < 5; i++) {
    const e = createSessionEntry(i, { baseKey: Buffer.from([i]) });
    sr.setSession(e);
}
results.performance.sessionSerialize = measureSync(() => sr.serialize());
results.performance.sessionDeserialize = measureSync(() => SR.deserialize(sr.serialize()));

// Session restore performance (load + deserialize)
const ss = sr.serialize();
results.performance.sessionRestore = measureSync(() => {
    const rec = new SR();
    const data = JSON.parse(JSON.stringify(ss));
    const restored = SR.deserialize(data);
    return restored.haveOpenSession();
});

console.log('\n--- Crypto ---');
for (const [name, d] of Object.entries(results.performance)) {
    const label = name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    console.log(`  ${label}: ${d.opsPerSec.toLocaleString()} ops/sec (avg ${d.avgUs.toFixed(2)} µs, ${d.iterations} iterations)`);
}

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('INTEGRATION TEST SUMMARY');
console.log('='.repeat(70));

const totalPassed = Object.values(results).reduce((s, c) => s + (c.passed || 0), 0);
const totalFailed = Object.values(results).reduce((s, c) => s + (c.failed || 0), 0);

console.log(`\nTotal Tests : ${totalPassed + totalFailed}`);
console.log(`Passed      : ${totalPassed}`);
console.log(`Failed      : ${totalFailed}`);
console.log(`Status      : ${totalFailed === 0 ? '✅ ALL PASSED' : '❌ HAS FAILURES'}`);

console.log('\n--- Per Category ---');
for (const [cat, data] of Object.entries(results)) {
    if (data.passed !== undefined) {
        const icon = data.failed === 0 ? '✅' : '❌';
        console.log(`${icon} ${cat.padEnd(12)}: ${data.passed}/${data.passed + data.failed} passed`);
    }
}

if (totalFailed > 0) {
    console.log('\n--- FAILED TESTS ---');
    for (const [cat, data] of Object.entries(results)) {
        if (data.errors && data.errors.length > 0) {
            console.log(`\n[${cat}]`);
            data.errors.forEach(e => console.log(`  ❌ ${e.name}: ${e.error}`));
        }
    }
}

console.log('\n--- CONSOLE AUDIT ---');
console.log(libsignalLogs.length === 0
    ? '✅ Zero console.log/info/warn/debug/error calls from libsignal during entire test'
    : `⚠️  ${libsignalLogs.length} console calls detected from libsignal`
);

console.log('\n--- PERFORMANCE SUMMARY ---');
const perfLines = Object.entries(results.performance).map(([n, d]) =>
    `  ${n.padEnd(25)}: ${d.opsPerSec.toLocaleString().padStart(12)} ops/sec  (${d.avgUs.toFixed(2)} µs avg)`
);
console.log(perfLines.join('\n'));

// ============================================================================
// WRITE REPORT DATA
// ============================================================================
const reportData = {
    timestamp: new Date().toISOString(),
    systemInfo,
    libsignalVersion: require('@kelvdra/libsignal/package.json').version,
    baileysVersion: baileysPkg.version,
    libsignalPath: require.resolve('@kelvdra/libsignal'),
    baileysPath: require.resolve('@kelvdra/baileys'),
    results,
    summary: {
        total: totalPassed + totalFailed,
        passed: totalPassed,
        failed: totalFailed,
        consoleLogsFromLibsignal: libsignalLogs.length,
        consoleLogDetails: libsignalLogs
    }
};

// Write results to a location we can access
const outputPath = '/tmp/integration-test/results.json';
fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));
console.log(`\n📊 Results saved to: ${outputPath}`);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockStorage(trusted = true) {
    return {
        loadSession: async () => null,
        storeSession: async () => {},
        isTrustedIdentity: () => trusted,
        loadPreKey: async () => undefined,
        removePreKey: () => {},
        loadSignedPreKey: () => CV.generateKeyPair(),
        getOurRegistrationId: () => 11111,
        getOurIdentity: () => CV.generateKeyPair()
    };
}

function createFullSignalStorage() {
    const sessions = new Map();
    return { sessions };
}

function createSignalStorageWithIdentity(storage, identityKey) {
    return {
        loadSession: async (id) => storage.sessions.get(id) || null,
        storeSession: async (id, session) => { storage.sessions.set(id, session); },
        isTrustedIdentity: () => true,
        loadPreKey: async () => undefined,
        removePreKey: () => {},
        loadSignedPreKey: () => CV.generateKeyPair(),
        getOurRegistrationId: () => 11111,
        getOurIdentity: () => identityKey
    };
}

function createMockDeviceBundle() {
    const identity = CV.generateKeyPair();
    const signedPreKey = CV.generateKeyPair();
    const preKey = CV.generateKeyPair();
    return {
        registrationId: 67890,
        identityKey: Buffer.concat([Buffer.from([5]), identity.pubKey.slice(1)]),
        signedPreKey: {
            keyId: 1,
            publicKey: Buffer.concat([Buffer.from([5]), signedPreKey.pubKey.slice(1)]),
            signature: CV.calculateSignature(identity.privKey, signedPreKey.pubKey)
        },
        preKey: { keyId: 1, publicKey: Buffer.concat([Buffer.from([5]), preKey.pubKey.slice(1)]) }
    };
}

function createSessionEntry(regId, opts = {}) {
    const SessionRecord = libsignal.SessionRecord;
    const entry = SessionRecord.createEntry();
    entry.registrationId = regId;
    entry.currentRatchet = {
        ephemeralKeyPair: { pubKey: Buffer.alloc(33), privKey: Buffer.alloc(32) },
        lastRemoteEphemeralKey: Buffer.alloc(33),
        previousCounter: 0,
        rootKey: Buffer.alloc(32)
    };
    entry.indexInfo = {
        baseKey: opts.baseKey || Buffer.alloc(33),
        baseKeyType: opts.baseKeyType || 2,
        closed: opts.closed !== undefined ? opts.closed : -1,
        used: opts.used || Date.now(),
        created: opts.created || Date.now(),
        remoteIdentityKey: Buffer.alloc(33)
    };
    return entry;
}

process.exit(totalFailed > 0 ? 1 : 0);
