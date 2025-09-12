# Quickstart: Bitbucket MCP Server

## Installation and Configuration

### 1. Installation
```bash
# Install dependencies
npm install

# Install specific MCP SDK version
npm install @modelcontextprotocol/sdk

# Install Zod for schema validation
npm install zod

# Build project
npm run build

# Install globally (optional)
npm install -g .
```

### 2. Environment Configuration

#### For Bitbucket Cloud
```bash
# .env
BITBUCKET_BASE_URL=https://bitbucket.org
ATLASSIAN_USER_EMAIL=your@email.com
ATLASSIAN_API_TOKEN=your_token_here
# or
BITBUCKET_APP_PASSWORD=your_app_password
```

#### For Bitbucket Data Center
```bash
# .env
BITBUCKET_BASE_URL=https://your-bitbucket.com
BITBUCKET_USERNAME=your_username
BITBUCKET_API_TOKEN=your_token_here
```

### 3. Tool Configuration
```bash
# Enable Cloud tools
CLOUD_CORE_AUTH=true
CLOUD_CORE_REPOSITORY=true
CLOUD_CORE_PULL_REQUEST=true
CLOUD_CORE_ISSUE=true
CLOUD_CORE_PIPELINE=true

# Enable Data Center tools
DATACENTER_CORE_AUTH=true
DATACENTER_CORE_REPOSITORY=true
DATACENTER_CORE_PULL_REQUEST=true
DATACENTER_CORE_PROJECT=true
```

## MCP Server Usage

### 1. Start MCP Server
```bash
# STDIO mode (default)
npm start

# HTTP mode
TRANSPORT_MODE=http PORT=3000 npm start

# With debug
DEBUG=true npm start
```

### 2. Check Status
```bash
# Check server information
curl http://localhost:3000/server/info

# Check loaded tools
curl http://localhost:3000/tools
```

## Console Client Usage

### 1. Authentication
```bash
# Login with API Token (Cloud)
bitbucket-mcp auth login --method api_token --username user --token token

# Login with App Password (Cloud)
bitbucket-mcp auth login --method app_password --username user --password password

# Login with API Token (Data Center)
bitbucket-mcp auth login --method api_token --username user --token token

# Check authentication status
bitbucket-mcp auth status

# Logout
bitbucket-mcp auth logout
```

### 2. Repository Management

#### List Repositories
```bash
# List all repositories in workspace
bitbucket-mcp repository list --workspace my-workspace

# List with pagination
bitbucket-mcp repository list --workspace my-workspace --limit 20 --page 2

# JSON format
bitbucket-mcp repository list --workspace my-workspace --format json
```

#### Create Repository
```bash
# Create private repository
bitbucket-mcp repository create \
  --workspace my-workspace \
  --name new-repo \
  --description "Repository description" \
  --private

# Create public repository
bitbucket-mcp repository create \
  --workspace my-workspace \
  --name public-repo \
  --description "Public repository" \
  --public
```

#### Get Repository Information
```bash
# Get detailed information
bitbucket-mcp repository get \
  --workspace my-workspace \
  --repository my-repo
```

#### Update Repository
```bash
# Update description
bitbucket-mcp repository update \
  --workspace my-workspace \
  --repository my-repo \
  --description "New description"

# Change visibility
bitbucket-mcp repository update \
  --workspace my-workspace \
  --repository my-repo \
  --public
```

#### Delete Repository
```bash
# Delete repository (confirmation required)
bitbucket-mcp repository delete \
  --workspace my-workspace \
  --repository my-repo \
  --confirm
```

### 3. Pull Request Management

#### List Pull Requests
```bash
# List all PRs
bitbucket-mcp pull-request list \
  --workspace my-workspace \
  --repository my-repo

# Filter by state
bitbucket-mcp pull-request list \
  --workspace my-workspace \
  --repository my-repo \
  --state open

# List PRs by specific author
bitbucket-mcp pull-request list \
  --workspace my-workspace \
  --repository my-repo \
  --author user
```

#### Create Pull Request
```bash
# Create basic PR
bitbucket-mcp pull-request create \
  --workspace my-workspace \
  --repository my-repo \
  --title "New feature" \
  --description "Detailed feature description" \
  --source-branch feature/new-feature \
  --destination-branch main

# Create PR with reviewers
bitbucket-mcp pull-request create \
  --workspace my-workspace \
  --repository my-repo \
  --title "Bug fix" \
  --source-branch bugfix/fix \
  --destination-branch develop \
  --reviewers user1,user2
```

#### Merge Pull Request
```bash
# Merge with merge commit
bitbucket-mcp pull-request merge \
  --workspace my-workspace \
  --repository my-repo \
  --pull-request-id 123 \
  --strategy merge_commit

# Merge with squash
bitbucket-mcp pull-request merge \
  --workspace my-workspace \
  --repository my-repo \
  --pull-request-id 123 \
  --strategy squash \
  --message "Merge: New feature"
```

### 4. Project Management (Data Center)

#### List Projects
```bash
# List all projects
bitbucket-mcp project list

# List with pagination
bitbucket-mcp project list --limit 10 --page 1
```

#### Create Project
```bash
# Create project
bitbucket-mcp project create \
  --key MYPROJ \
  --name "My Project" \
  --description "Project description" \
  --public
```

### 5. Issue Management (Cloud)

#### List Issues
```bash
# List all issues
bitbucket-mcp issue list \
  --workspace my-workspace \
  --repository my-repo

# Filter by state
bitbucket-mcp issue list \
  --workspace my-workspace \
  --repository my-repo \
  --state open

# Filter by priority
bitbucket-mcp issue list \
  --workspace my-workspace \
  --repository my-repo \
  --priority critical
```

#### Create Issue
```bash
# Create bug issue
bitbucket-mcp issue create \
  --workspace my-workspace \
  --repository my-repo \
  --title "Bug: Validation error" \
  --content "Detailed bug description" \
  --kind bug \
  --priority major
```

## Integration Examples

### 1. Automation Script
```bash
#!/bin/bash
# Script to create repository and PR

# Authenticate
bitbucket-mcp auth login --method api_token --username $USER --token $TOKEN

# Create repository
bitbucket-mcp repository create \
  --workspace $WORKSPACE \
  --name $REPO_NAME \
  --description "Automatically created repository" \
  --private

# Create branch
git checkout -b feature/automation
git add .
git commit -m "Add functionality"
git push origin feature/automation

# Create PR
bitbucket-mcp pull-request create \
  --workspace $WORKSPACE \
  --repository $REPO_NAME \
  --title "Feature: Automation" \
  --source-branch feature/automation \
  --destination-branch main
```

### 2. CI/CD Integration
```yaml
# .github/workflows/bitbucket-sync.yml
name: Sync to Bitbucket
on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install Bitbucket MCP
        run: npm install -g bitbucket-mcp
      - name: Authenticate
        run: |
          bitbucket-mcp auth login \
            --method api_token \
            --username ${{ secrets.BITBUCKET_USERNAME }} \
            --token ${{ secrets.BITBUCKET_TOKEN }}
      - name: Create PR
        run: |
          bitbucket-mcp pull-request create \
            --workspace ${{ secrets.BITBUCKET_WORKSPACE }} \
            --repository ${{ secrets.BITBUCKET_REPO }} \
            --title "Sync from GitHub" \
            --source-branch main \
            --destination-branch develop
```

## Troubleshooting

### 1. Authentication Issues
```bash
# Check configuration
bitbucket-mcp auth status

# Test connectivity
curl -H "Authorization: Bearer $TOKEN" $BITBUCKET_BASE_URL/2.0/user

# Check logs
DEBUG=true bitbucket-mcp auth login --method api_token --username user --token token
```

### 2. Connectivity Issues
```bash
# Check server URL
echo $BITBUCKET_BASE_URL

# Test basic connectivity
curl -I $BITBUCKET_BASE_URL

# Check timeouts
bitbucket-mcp config get --section timeouts
```

### 3. Permission Issues
```bash
# Check user permissions
bitbucket-mcp auth status

# Check repository permissions
bitbucket-mcp repository get --workspace workspace --repository repo
```

## Advanced Configuration

### 1. Timeout Configuration
```bash
# Increase timeout for slow operations
export BITBUCKET_READ_TIMEOUT=5000
export BITBUCKET_WRITE_TIMEOUT=10000
```

### 2. Rate Limiting Configuration
```bash
# Adjust rate limiting
export BITBUCKET_RATE_LIMIT=30  # requests per minute
export BITBUCKET_BURST_LIMIT=5
```

### 3. Logging Configuration
```bash
# Enable detailed logs
export DEBUG=bitbucket-mcp:*
export LOG_LEVEL=debug
```

### 4. Proxy Configuration
```bash
# Configure proxy
export HTTP_PROXY=http://proxy:8080
export HTTPS_PROXY=http://proxy:8080
```
