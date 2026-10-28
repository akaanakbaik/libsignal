'use strict';

const { it } = require('node:test');
const assert = require('node:assert/strict');
const { WhisperMessage, PreKeyWhisperMessage } = require('../src/protobufs');
const signal = require('../index');

it('preserves the proto2 WhisperMessage wire bytes', () => {
    const message = { ephemeralKey: Buffer.from('0501', 'hex'), counter: 7,
        previousCounter: 3, ciphertext: Buffer.from('abcd', 'hex') };
    const wire = Buffer.from('0a020501100718032202abcd', 'hex');
    assert.deepEqual(Buffer.from(WhisperMessage.encode(message).finish()), wire);
    const decoded = WhisperMessage.decode(wire);
    for (const key of Object.keys(message)) assert.deepEqual(decoded[key], message[key]);
    assert.throws(() => WhisperMessage.decode(Buffer.from('0a05ff', 'hex')));
});

it('preserves PreKeyWhisperMessage field numbers and bytes', () => {
    const message = { preKeyId: 1, baseKey: Buffer.from('0501', 'hex'),
        identityKey: Buffer.from('0502', 'hex'), message: Buffer.from('abcd', 'hex'),
        registrationId: 123, signedPreKeyId: 2 };
    const wire = Buffer.from('0801120205011a0205022202abcd287b3002', 'hex');
    assert.deepEqual(Buffer.from(PreKeyWhisperMessage.encode(message).finish()), wire);
    const decoded = PreKeyWhisperMessage.decode(wire);
    for (const key of Object.keys(message)) assert.deepEqual(decoded[key], message[key]);
});

function storage(registrationId) {
    const identity = signal.keyhelper.generateIdentityKeyPair();
    const signed = signal.keyhelper.generateSignedPreKey(identity, 1);
    const preKey = signal.keyhelper.generatePreKey(2);
    const sessions = new Map();
    return {
        bundle: { registrationId, identityKey: identity.pubKey,
            signedPreKey: { keyId: 1, publicKey: signed.keyPair.pubKey, signature: signed.signature },
            preKey: { keyId: 2, publicKey: preKey.keyPair.pubKey } },
        getOurIdentity: async () => identity,
        getOurRegistrationId: async () => registrationId,
        isTrustedIdentity: async () => true,
        loadSession: async id => sessions.has(id) ? signal.SessionRecord.deserialize(sessions.get(id)) : null,
        storeSession: async (id, record) => sessions.set(id, record.serialize()),
        loadPreKey: async id => id === 2 ? preKey.keyPair : undefined,
        removePreKey: async () => {},
        loadSignedPreKey: async id => id === 1 ? signed.keyPair : undefined
    };
}

it('exchanges prekey and ratcheted messages across persisted sessions', async () => {
    const alice = storage(101), bob = storage(202);
    const bobAddress = new signal.ProtocolAddress('bob', 1);
    const aliceAddress = new signal.ProtocolAddress('alice', 1);
    await new signal.SessionBuilder(alice, bobAddress).initOutgoing(bob.bundle);
    const aliceCipher = new signal.SessionCipher(alice, bobAddress);
    const bobCipher = new signal.SessionCipher(bob, aliceAddress);
    const first = await aliceCipher.encrypt(Buffer.from('hello bob'));
    assert.equal(first.type, 3);
    assert.deepEqual(await bobCipher.decryptPreKeyWhisperMessage(first.body), Buffer.from('hello bob'));
    const reply = await bobCipher.encrypt(Buffer.from('hello alice'));
    assert.equal(reply.type, 1);
    assert.deepEqual(await aliceCipher.decryptWhisperMessage(reply.body), Buffer.from('hello alice'));
    const second = await aliceCipher.encrypt(Buffer.from('ratcheted'));
    assert.equal(second.type, 1);
    assert.deepEqual(await bobCipher.decryptWhisperMessage(second.body), Buffer.from('ratcheted'));
    await assert.rejects(bobCipher.decryptWhisperMessage(second.body));
});
