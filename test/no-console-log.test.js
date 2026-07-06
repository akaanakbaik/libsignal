'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// List of console calls that are STILL acceptable after cleanup
// - console.error() in session_cipher.js's decryptWithSessions is removed now
// - Any remaining console.error calls should be for true error cases only
const ALLOWED_CONSOLE_PATTERNS = [
  // If we find any remaining console.xxx, document them here
];

describe('No sensitive data leaked via console', () => {
  const srcFiles = [];
  const consoleLogs = [];

  before(() => {
    // Read all JS source files
    const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf8');
      srcFiles.push({ file, content });

      // Find all console.xxx calls
      const consoleRegex = /console\.(log|info|warn|debug|error)\s*\(/g;
      let match;
      while ((match = consoleRegex.exec(content)) !== null) {
        // Get the line
        const lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineEnd = content.indexOf('\n', match.index);
        const line = content.substring(lineStart, lineEnd !== -1 ? lineEnd : content.length).trim();
        consoleLogs.push({
          file,
          method: match[1],
          line: content.substring(0, match.index).split('\n').length,
          snippet: line
        });
      }
    }
  });

  it('should not contain any console.log calls', () => {
    const logs = consoleLogs.filter(l => l.method === 'log');
    assert.equal(logs.length, 0,
      `Found console.log calls:\n${logs.map(l => `  ${l.file}:${l.line} - ${l.snippet}`).join('\n')}`);
  });

  it('should not contain any console.info calls', () => {
    const infos = consoleLogs.filter(l => l.method === 'info');
    assert.equal(infos.length, 0,
      `Found console.info calls:\n${infos.map(l => `  ${l.file}:${l.line} - ${l.snippet}`).join('\n')}`);
  });

  it('should not contain any console.warn calls', () => {
    const warns = consoleLogs.filter(l => l.method === 'warn');
    assert.equal(warns.length, 0,
      `Found console.warn calls:\n${warns.map(l => `  ${l.file}:${l.line} - ${l.snippet}`).join('\n')}`);
  });

  it('should not contain any console.debug calls', () => {
    const debugs = consoleLogs.filter(l => l.method === 'debug');
    assert.equal(debugs.length, 0,
      `Found console.debug calls:\n${debugs.map(l => `  ${l.file}:${l.line} - ${l.snippet}`).join('\n')}`);
  });

  it('should not contain any console.error calls', () => {
    const errors = consoleLogs.filter(l => l.method === 'error');
    assert.equal(errors.length, 0,
      `Found console.error calls:\n${errors.map(l => `  ${l.file}:${l.line} - ${l.snippet}`).join('\n')}`);
  });
});
