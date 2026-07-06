# Release Guide

## Overview

Releases are managed through GitHub Actions workflow and follow [Semantic Versioning](https://semver.org/).

**Current version**: 6.0.x (maintained version)

## Versioning Strategy

| Version | Change Type | When |
|---------|-------------|------|
| 6.0.x | Patch | Bug fixes, security patches, documentation |
| 6.x.0 | Minor | New features (backward compatible) |
| 7.0.0 | Major | Breaking changes (not planned) |

**Since we maintain Zero Breaking Change policy, major version changes are not expected.**

## Release Process

### Automated Release (Recommended)

1. Go to GitHub → Actions → Release workflow
2. Click "Run workflow"
3. Select release type: `patch`, `minor`, or `major`
4. Optionally check "Dry run" to test without publishing
5. Click "Run workflow"

The workflow will:
1. Run all tests and security audits
2. Bump the version in `package.json`
3. Publish to npm
4. Create a git tag
5. Create a GitHub Release with auto-generated release notes

### Manual Release

```bash
# 1. Ensure you're on main branch
git checkout main
git pull origin main

# 2. Verify tests pass
npm test

# 3. Bump version
npm version patch  # or minor
git push origin main --tags

# 4. Publish to npm
npm publish --access public

# 5. Create GitHub Release
# Go to https://github.com/kelvdra/libsignal/releases
# Click "Draft a new release"
# Select the new tag
# Generate release notes
# Publish
```

### Pre-release Checklist

- [ ] All tests pass: `npm test`
- [ ] No console leaks: `node --test test/no-console-log.test.js`
- [ ] Lint passes: `npx eslint src/`
- [ ] Security audit: `npm audit`
- [ ] CHANGELOG.md is updated
- [ ] Version is bumped correctly
- [ ] Package can be published: `npm pack --dry-run`

## npm Publishing

### Requirements
- npm account with access to `@kelvdra/libsignal`
- 2FA enabled on npm account
- `NPM_TOKEN` set in GitHub secrets

### First-time setup
```bash
npm login
npm publish --access public
```

### Package content
The published package includes:
- `index.js` - Entry point
- `index.d.ts` - TypeScript definitions
- `src/*` - Source code
- Excluded by `.npmignore`:
  - `.git/`, `.github/`
  - Test files
  - Configuration files (`.eslintrc.json`, `.prettierrc`, etc.)
  - Logs, build artifacts

## Post-Release

1. Verify npm package: `npm view @kelvdra/libsignal`
2. Test in Baileys: Update dependency and run tests
3. Announce in relevant channels
4. Monitor for issues

## Emergency Releases

For critical security fixes:
1. Create branch from the latest tag
2. Apply the fix
3. Create a PR with `[SECURITY]` prefix
4. Tag maintainers for immediate review
5. Follow manual release process
