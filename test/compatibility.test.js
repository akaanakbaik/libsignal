'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert');

describe('Public API Compatibility', () => {
  let libsignal;

  before(() => {
    libsignal = require('../index.js');
  });

  it('should export crypto module', () => {
    assert.ok(libsignal.crypto);
    assert.equal(typeof libsignal.crypto.encrypt, 'function');
    assert.equal(typeof libsignal.crypto.decrypt, 'function');
    assert.equal(typeof libsignal.crypto.hash, 'function');
    assert.equal(typeof libsignal.crypto.calculateMAC, 'function');
    assert.equal(typeof libsignal.crypto.verifyMAC, 'function');
    assert.equal(typeof libsignal.crypto.deriveSecrets, 'function');
  });

  it('should export curve module', () => {
    assert.ok(libsignal.curve);
    assert.equal(typeof libsignal.curve.generateKeyPair, 'function');
    assert.equal(typeof libsignal.curve.calculateAgreement, 'function');
    assert.equal(typeof libsignal.curve.calculateSignature, 'function');
    assert.equal(typeof libsignal.curve.verifySignature, 'function');
  });

  it('should export keyhelper module', () => {
    assert.ok(libsignal.keyhelper);
    assert.equal(typeof libsignal.keyhelper.generateIdentityKeyPair, 'function');
    assert.equal(typeof libsignal.keyhelper.generateRegistrationId, 'function');
    assert.equal(typeof libsignal.keyhelper.generateSignedPreKey, 'function');
    assert.equal(typeof libsignal.keyhelper.generatePreKey, 'function');
  });

  it('should export ProtocolAddress class', () => {
    assert.ok(libsignal.ProtocolAddress);
    const addr = new libsignal.ProtocolAddress('test', 1);
    assert.equal(addr.id, 'test');
    assert.equal(addr.deviceId, 1);
    assert.equal(addr.toString(), 'test.1');
    assert.ok(addr.is(new libsignal.ProtocolAddress('test', 1)));
    assert.ok(!addr.is(new libsignal.ProtocolAddress('other', 1)));
  });

  it('should export SessionBuilder class', () => {
    assert.ok(libsignal.SessionBuilder);
    assert.equal(typeof libsignal.SessionBuilder.prototype.initOutgoing, 'function');
  });

  it('should export SessionCipher class', () => {
    assert.ok(libsignal.SessionCipher);
    assert.equal(typeof libsignal.SessionCipher.prototype.encrypt, 'function');
    assert.equal(typeof libsignal.SessionCipher.prototype.decryptWhisperMessage, 'function');
    assert.equal(typeof libsignal.SessionCipher.prototype.decryptPreKeyWhisperMessage, 'function');
    assert.equal(typeof libsignal.SessionCipher.prototype.hasOpenSession, 'function');
    assert.equal(typeof libsignal.SessionCipher.prototype.closeOpenSession, 'function');
  });

  it('should export SessionRecord class', () => {
    assert.ok(libsignal.SessionRecord);
    assert.equal(typeof libsignal.SessionRecord.deserialize, 'function');
    assert.equal(typeof libsignal.SessionRecord.prototype.serialize, 'function');
    assert.equal(typeof libsignal.SessionRecord.prototype.haveOpenSession, 'function');
  });

  it('should export errors', () => {
    assert.ok(libsignal.SignalError);
    assert.ok(libsignal.UntrustedIdentityKeyError);
    assert.ok(libsignal.SessionError);
    assert.ok(libsignal.MessageCounterError);
    assert.ok(libsignal.PreKeyError);
  });

  it('should create proper error types', () => {
    const untrustedErr = new libsignal.UntrustedIdentityKeyError('addr', Buffer.alloc(32));
    assert.ok(untrustedErr instanceof libsignal.SignalError);
    assert.equal(untrustedErr.name, 'UntrustedIdentityKeyError');
    assert.equal(untrustedErr.addr, 'addr');
    assert.ok(untrustedErr.identityKey);

    const sessionErr = new libsignal.SessionError('test');
    assert.ok(sessionErr instanceof libsignal.SignalError);
    assert.equal(sessionErr.name, 'SessionError');
    assert.equal(sessionErr.message, 'test');

    const counterErr = new libsignal.MessageCounterError('test');
    assert.ok(counterErr instanceof libsignal.SessionError);
    assert.equal(counterErr.name, 'MessageCounterError');
  });
});

describe('Crypto Compatibility', () => {
  it('should encrypt and decrypt with AES-256-CBC', () => {
    const crypto = require('../index.js').crypto;
    const key = require('crypto').randomBytes(32);
    const iv = require('crypto').randomBytes(16);
    const data = Buffer.from('Hello, World!');

    const ciphertext = crypto.encrypt(key, data, iv);
    const plaintext = crypto.decrypt(key, ciphertext, iv);

    assert.equal(plaintext.toString(), 'Hello, World!');
  });

  it('should calculate and verify MAC', () => {
    const crypto = require('../index.js').crypto;
    const key = require('crypto').randomBytes(32);
    const data = Buffer.from('test data');

    const mac = crypto.calculateMAC(key, data);
    assert.ok(mac instanceof Buffer);
    assert.equal(mac.length, 32);

    // Verify with truncated MAC of specified length (as used in Signal Protocol)
    crypto.verifyMAC(data, key, mac.slice(0, 8), 8); // Should not throw
  });

  it('should derive secrets using HKDF-like scheme', () => {
    const crypto = require('../index.js').crypto;
    const input = require('crypto').randomBytes(32);
    const salt = require('crypto').randomBytes(32);
    const info = Buffer.from('WhisperText');

    const secrets = crypto.deriveSecrets(input, salt, info);
    assert.ok(Array.isArray(secrets));
    assert.equal(secrets.length, 3);
    assert.ok(secrets[0] instanceof Buffer);
  });
});

describe('Curve Compatibility', () => {
  it('should generate key pairs', () => {
    const curve = require('../index.js').curve;
    const keyPair = curve.generateKeyPair();
    assert.ok(keyPair.pubKey instanceof Buffer);
    assert.ok(keyPair.privKey instanceof Buffer);
    assert.equal(keyPair.pubKey.length, 33); // prefixed with 0x05
    assert.equal(keyPair.privKey.length, 32);
  });

  it('should calculate agreement', () => {
    const curve = require('../index.js').curve;
    const alice = curve.generateKeyPair();
    const bob = curve.generateKeyPair();

    const secret1 = curve.calculateAgreement(bob.pubKey, alice.privKey);
    const secret2 = curve.calculateAgreement(alice.pubKey, bob.privKey);

    assert.ok(secret1 instanceof Buffer);
    assert.ok(secret2 instanceof Buffer);
    assert.equal(secret1.toString('hex'), secret2.toString('hex'));
  });

  it('should sign and verify', () => {
    const curve = require('../index.js').curve;
    const keyPair = curve.generateKeyPair();
    const message = Buffer.from('test message');

    const sig = curve.calculateSignature(keyPair.privKey, message);
    assert.ok(sig instanceof Buffer);
    assert.equal(sig.length, 64);

    const valid = curve.verifySignature(keyPair.pubKey, message, sig, false);
    assert.equal(valid, true);
  });
});

describe('KeyHelper Compatibility', () => {
  it('should generate registration ID', () => {
    const keyhelper = require('../index.js').keyhelper;
    const regId = keyhelper.generateRegistrationId();
    assert.equal(typeof regId, 'number');
    assert.ok(regId >= 0);
    assert.ok(regId <= 0x3fff); // 14-bit max
  });

  it('should generate signed pre key', () => {
    const keyhelper = require('../index.js').keyhelper;
    const curve = require('../index.js').curve;
    const identityKeyPair = curve.generateKeyPair();
    const signedPreKey = keyhelper.generateSignedPreKey(identityKeyPair, 1);

    assert.equal(signedPreKey.keyId, 1);
    assert.ok(signedPreKey.keyPair);
    assert.ok(signedPreKey.signature instanceof Buffer);
  });

  it('should generate pre key', () => {
    const keyhelper = require('../index.js').keyhelper;
    const preKey = keyhelper.generatePreKey(1);

    assert.equal(preKey.keyId, 1);
    assert.ok(preKey.keyPair);
  });
});

describe('SessionRecord Compatibility', () => {
  it('should create and serialize/deserialize', () => {
    const SessionRecord = require('../index.js').SessionRecord;
    const record = new SessionRecord();
    assert.equal(record.haveOpenSession(), false);

    const entry = SessionRecord.createEntry();
    entry.registrationId = 123;
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

    const serialized = record.serialize();
    assert.ok(serialized._sessions);
    assert.equal(serialized.version, 'v1');

    const deserialized = SessionRecord.deserialize(serialized);
    assert.ok(deserialized instanceof SessionRecord);
    assert.equal(Object.keys(deserialized.sessions).length, 1);
  });

  it('should track open/close state', () => {
    const SessionRecord = require('../index.js').SessionRecord;
    const record = new SessionRecord();

    const entry = SessionRecord.createEntry();
    entry.registrationId = 456;
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
    assert.equal(record.haveOpenSession(), true);

    const openSession = record.getOpenSession();
    assert.ok(openSession);

    record.closeSession(openSession);
    assert.equal(record.haveOpenSession(), false);
    assert.ok(record.isClosed(openSession));

    record.openSession(openSession);
    assert.equal(record.haveOpenSession(), true);
  });
});
