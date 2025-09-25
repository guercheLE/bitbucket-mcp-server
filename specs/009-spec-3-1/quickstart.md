# Quickstart: Maintenance & Updates

This document provides instructions on how to use the maintenance scripts for the Bitbucket MCP Server.

## Prerequisites
- Node.js 18+ and npm installed.
- Dependencies installed: `npm install`

## 1. Updating Dependencies

This script checks for and updates third-party dependencies to their latest minor/patch versions.

**Command**:
```bash
./specs/009-spec-3-1/contracts/update-dependencies.sh
```

**To perform a dry run without making changes**:
```bash
./specs/009-spec-3-1/contracts/update-dependencies.sh --dry-run
```

**Success Criteria**:
- The script should update `package.json` with the new versions.
- `npm install` should run successfully.
- The application's tests should all pass after the update.

## 2. Monitoring for Vulnerabilities

This script scans for security vulnerabilities in the project's dependencies. It is intended to be run in a CI/CD pipeline.

**Command**:
```bash
./specs/009-spec-3-1/contracts/monitor-vulnerabilities.sh --level=critical
```

**Success Criteria**:
- The script should exit with code 0 if no vulnerabilities at the 'critical' level are found.
- The script should exit with code 1 if 'critical' vulnerabilities are found, causing a CI build to fail.

## 3. Regenerating Embeddings

This script checks for changes in the Bitbucket API documentation and prepares for the embedding regeneration process.

**Command**:
```bash
./specs/009-spec-3-1/contracts/regenerate-embeddings.sh
```

**Success Criteria**:
- If the documentation has not changed, the script should report it and exit.
- If the documentation has changed, the script should detect it and halt, requiring manual intervention to proceed with the embedding generation, as per the specification.
- On first run, it should store the initial checksum of the documentation.
