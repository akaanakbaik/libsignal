# Security Policy

## Supported Versions

| Version | Supported                               |
| ------- | --------------------------------------- |
| 6.0.x   | ✅ Active development & security fixes  |
| < 6.0   | ❌ End of life                          |

## Reporting a Vulnerability

**IMPORTANT: This package implements the Signal Protocol for end-to-end encryption.
Security vulnerabilities must be handled with utmost priority.**

### Responsible Disclosure Process

1. **DO NOT** file a public GitHub issue for security vulnerabilities.
2. Send an email to **security@kelvdra.dev** with:
   - Subject: `[SECURITY] libsignal - Brief description`
   - Detailed description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

3. You will receive an acknowledgment within 48 hours.
4. We will work on a fix and coordinate a release timeline.
5. Once the fix is released, we will credit you in the release notes (unless you prefer to remain anonymous).

### What to Report

- Cryptographic weaknesses in the Signal Protocol implementation
- Side-channel attacks
- Timing attacks
- Key leakage through logging or error messages
- Session corruption or manipulation
- Authentication bypass
- Dependency vulnerabilities

### Scope

This policy covers:
- The `@kelvdra/libsignal` npm package
- The source code in this repository
- Build and release pipelines

### Out of Scope

- The official Signal Protocol specification (report to Signal Foundation)
- Downstream projects using this package (report to respective maintainers)

## Security Measures

### Code Protection
- **No console.log/info/warn/debug/error** in production code paths that could leak sensitive data
- **Constant-time comparisons** for MAC verification
- **Cryptographic boundary checks** on all key material
- **Input validation** on all public API parameters

### Dependency Security
- Automated `npm audit` runs nightly via GitHub Actions
- Dependency review on all PRs
- Dependabot configured for weekly updates
- All dependencies are pinned to minor versions

### Supply Chain
- Package is published with `--access public`
- All releases are git-tagged and signed
- npm 2FA is required for publishing
- CI/CD pipeline enforces test pass before release

## Encryption & Key Handling

This package implements the Signal Protocol. Key security properties:

- **Private keys are NEVER logged** under any circumstances
- **Session data is NEVER logged** under any circumstances
- **Ephemeral keys are NEVER logged** under any circumstances
- **Root keys are NEVER logged** under any circumstances
- **Registration IDs are NEVER logged** under any circumstances

If you encounter any log output containing sensitive data, please report it immediately.
