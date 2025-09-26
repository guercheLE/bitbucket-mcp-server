# Quickstart: Spec 0.1: Governance & Project Setup

This quickstart guide outlines the steps to verify the initial project setup and governance.

## Prerequisites

- Node.js 18+ installed
- Git installed

## Verification Steps

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd bitbucket-mcp-server
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run tests**:

   ```bash
   npm test
   ```

   - **Expected outcome**: All tests should pass, and code coverage should be at least 80%.

4. **Run linter**:

   ```bash
   npm run lint
   ```

   - **Expected outcome**: The linter should report no errors.

5. **Check commit message hook**:
   - Make a change to a file.
   - Try to commit with a non-semantic message:
     ```bash
     git add .
     git commit -m "test"
     ```
   - **Expected outcome**: The commit should fail with an error message about the commit message format.
   - Commit with a semantic message:
     ```bash
     git commit -m "feat: add new feature"
     ```
   - **Expected outcome**: The commit should be successful.
