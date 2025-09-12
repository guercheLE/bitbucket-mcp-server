# Bitbucket MCP Server - Complete Endpoint Schemas

This document provides detailed input/output specifications for ALL Bitbucket endpoints organized by server type and functionality.

## Bitbucket Data Center - Complete Endpoint Schemas

### Authentication Module

#### Create OAuth Token
**Endpoint**: `POST /rest/oauth/1.0/tokens`

**Input Schema**:
```json
{
  "grant_type": "string (required) - 'authorization_code' or 'refresh_token'",
  "code": "string (optional) - authorization code for authorization_code grant",
  "redirect_uri": "string (optional) - redirect URI",
  "client_id": "string (optional) - OAuth client ID",
  "client_secret": "string (optional) - OAuth client secret",
  "refresh_token": "string (optional) - refresh token for refresh_token grant"
}
```

**Output Schema**:
```json
{
  "access_token": "string - OAuth access token",
  "token_type": "string - token type (usually 'Bearer')",
  "expires_in": "integer - token expiration time in seconds",
  "refresh_token": "string - refresh token for token renewal",
  "scope": "string - granted scopes"
}
```

#### List OAuth Tokens
**Endpoint**: `GET /rest/oauth/1.0/tokens`

**Input Schema**: No parameters required

**Output Schema**:
```json
{
  "size": "integer - number of tokens returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "id": "string - token ID",
      "name": "string - token name",
      "createdDate": "integer - creation timestamp",
      "expiresDate": "integer - expiration timestamp",
      "scopes": ["string - granted scopes"]
    }
  ]
}
```

#### Revoke OAuth Token
**Endpoint**: `DELETE /rest/oauth/1.0/tokens/{tokenId}`

**Input Schema**:
```json
{
  "tokenId": "string (required) - token ID in URL path"
}
```

**Output Schema**: No content (204 status)

#### Get Current User
**Endpoint**: `GET /rest/api/1.0/users`

**Input Schema**: No parameters required

**Output Schema**:
```json
{
  "name": "string - user display name",
  "emailAddress": "string - user email address",
  "id": "integer - user ID",
  "displayName": "string - user display name",
  "active": "boolean - whether user is active",
  "slug": "string - user slug",
  "type": "string - user type",
  "directoryName": "string - directory name",
  "mutableDetails": "boolean - whether details are mutable",
  "mutableGroups": "boolean - whether groups are mutable",
  "lastAuthenticationTimestamp": "integer - last authentication timestamp"
}
```

#### Create User Session
**Endpoint**: `POST /rest/api/1.0/users`

**Input Schema**:
```json
{
  "name": "string (required) - username",
  "password": "string (required) - password"
}
```

**Output Schema**:
```json
{
  "name": "string - user display name",
  "emailAddress": "string - user email address",
  "id": "integer - user ID",
  "displayName": "string - user display name",
  "active": "boolean - whether user is active",
  "slug": "string - user slug",
  "type": "string - user type"
}
```

### Project Management

#### List Projects
**Endpoint**: `GET /rest/api/1.0/projects`

**Input Schema**:
```json
{
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results",
  "name": "string (optional) - filter by project name",
  "permission": "string (optional) - filter by permission level"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of projects returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "key": "string - project key",
      "id": "integer - project ID",
      "name": "string - project name",
      "description": "string - project description",
      "public": "boolean - whether project is public",
      "type": "string - project type",
      "links": {
        "self": [{"href": "string - self link"}],
        "avatar": [{"href": "string - avatar link"}]
      }
    }
  ]
}
```

#### Create Project
**Endpoint**: `POST /rest/api/1.0/projects`

**Input Schema**:
```json
{
  "key": "string (required) - project key (max 10 characters)",
  "name": "string (required) - project name",
  "description": "string (optional) - project description",
  "avatar": "string (optional) - base64 encoded avatar image"
}
```

**Output Schema**:
```json
{
  "key": "string - project key",
  "id": "integer - project ID",
  "name": "string - project name",
  "description": "string - project description",
  "public": "boolean - whether project is public",
  "type": "string - project type",
  "links": {
    "self": [{"href": "string - self link"}],
    "avatar": [{"href": "string - avatar link"}]
  }
}
```

#### Get Project Details
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path"
}
```

**Output Schema**:
```json
{
  "key": "string - project key",
  "id": "integer - project ID",
  "name": "string - project name",
  "description": "string - project description",
  "public": "boolean - whether project is public",
  "type": "string - project type",
  "links": {
    "self": [{"href": "string - self link"}],
    "avatar": [{"href": "string - avatar link"}]
  }
}
```

#### Update Project
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "name": "string (optional) - new project name",
  "description": "string (optional) - new project description",
  "avatar": "string (optional) - new base64 encoded avatar image"
}
```

**Output Schema**:
```json
{
  "key": "string - project key",
  "id": "integer - project ID",
  "name": "string - project name",
  "description": "string - project description",
  "public": "boolean - whether project is public",
  "type": "string - project type",
  "links": {
    "self": [{"href": "string - self link"}],
    "avatar": [{"href": "string - avatar link"}]
  }
}
```

#### Delete Project
**Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path"
}
```

**Output Schema**: No content (204 status)

#### Get Project Permissions
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/permissions`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of permissions returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "user": {
        "name": "string - username",
        "displayName": "string - user display name",
        "emailAddress": "string - user email"
      },
      "permission": "string - permission level (PROJECT_READ, PROJECT_WRITE, PROJECT_ADMIN)"
    }
  ]
}
```

#### Update User Permissions
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/permissions/users`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "name": "string (required) - username",
  "permission": "string (required) - permission level (PROJECT_READ, PROJECT_WRITE, PROJECT_ADMIN)"
}
```

**Output Schema**:
```json
{
  "user": {
    "name": "string - username",
    "displayName": "string - user display name",
    "emailAddress": "string - user email"
  },
  "permission": "string - permission level"
}
```

#### Update Group Permissions
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/permissions/groups`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "name": "string (required) - group name",
  "permission": "string (required) - permission level (PROJECT_READ, PROJECT_WRITE, PROJECT_ADMIN)"
}
```

**Output Schema**:
```json
{
  "group": {
    "name": "string - group name"
  },
  "permission": "string - permission level"
}
```

### Repository Management

#### List Repositories
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results",
  "name": "string (optional) - filter by repository name",
  "permission": "string (optional) - filter by permission level"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of repositories returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "slug": "string - repository slug",
      "id": "integer - repository ID",
      "name": "string - repository name",
      "scmId": "string - SCM ID",
      "state": "string - repository state",
      "statusMessage": "string - status message",
      "forkable": "boolean - whether repository can be forked",
      "project": {
        "key": "string - project key",
        "id": "integer - project ID",
        "name": "string - project name"
      },
      "public": "boolean - whether repository is public",
      "links": {
        "clone": [{"href": "string - clone URL", "name": "string - clone method"}],
        "self": [{"href": "string - self link"}]
      }
    }
  ]
}
```

#### Create Repository
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "name": "string (required) - repository name",
  "scmId": "string (optional) - SCM ID, defaults to 'git'",
  "forkable": "boolean (optional) - whether repository can be forked",
  "public": "boolean (optional) - whether repository is public"
}
```

**Output Schema**:
```json
{
  "slug": "string - repository slug",
  "id": "integer - repository ID",
  "name": "string - repository name",
  "scmId": "string - SCM ID",
  "state": "string - repository state",
  "statusMessage": "string - status message",
  "forkable": "boolean - whether repository can be forked",
  "project": {
    "key": "string - project key",
    "id": "integer - project ID",
    "name": "string - project name"
  },
  "public": "boolean - whether repository is public",
  "links": {
    "clone": [{"href": "string - clone URL", "name": "string - clone method"}],
    "self": [{"href": "string - self link"}]
  }
}
```

#### Get Repository Details
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path"
}
```

**Output Schema**:
```json
{
  "slug": "string - repository slug",
  "id": "integer - repository ID",
  "name": "string - repository name",
  "scmId": "string - SCM ID",
  "state": "string - repository state",
  "statusMessage": "string - status message",
  "forkable": "boolean - whether repository can be forked",
  "project": {
    "key": "string - project key",
    "id": "integer - project ID",
    "name": "string - project name"
  },
  "public": "boolean - whether repository is public",
  "links": {
    "clone": [{"href": "string - clone URL", "name": "string - clone method"}],
    "self": [{"href": "string - self link"}]
  }
}
```

#### Update Repository
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "name": "string (optional) - new repository name",
  "forkable": "boolean (optional) - whether repository can be forked",
  "public": "boolean (optional) - whether repository is public"
}
```

**Output Schema**:
```json
{
  "slug": "string - repository slug",
  "id": "integer - repository ID",
  "name": "string - repository name",
  "scmId": "string - SCM ID",
  "state": "string - repository state",
  "statusMessage": "string - status message",
  "forkable": "boolean - whether repository can be forked",
  "project": {
    "key": "string - project key",
    "id": "integer - project ID",
    "name": "string - project name"
  },
  "public": "boolean - whether repository is public",
  "links": {
    "clone": [{"href": "string - clone URL", "name": "string - clone method"}],
    "self": [{"href": "string - self link"}]
  }
}
```

#### Delete Repository
**Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path"
}
```

**Output Schema**: No content (204 status)

#### Get Repository Permissions
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of permissions returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "user": {
        "name": "string - username",
        "displayName": "string - user display name",
        "emailAddress": "string - user email"
      },
      "permission": "string - permission level (REPO_READ, REPO_WRITE, REPO_ADMIN)"
    }
  ]
}
```

#### Update Repository User Permissions
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/users`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "name": "string (required) - username",
  "permission": "string (required) - permission level (REPO_READ, REPO_WRITE, REPO_ADMIN)"
}
```

**Output Schema**:
```json
{
  "user": {
    "name": "string - username",
    "displayName": "string - user display name",
    "emailAddress": "string - user email"
  },
  "permission": "string - permission level"
}
```

#### Update Repository Group Permissions
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/permissions/groups`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "name": "string (required) - group name",
  "permission": "string (required) - permission level (REPO_READ, REPO_WRITE, REPO_ADMIN)"
}
```

**Output Schema**:
```json
{
  "group": {
    "name": "string - group name"
  },
  "permission": "string - permission level"
}
```

#### List Branches
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results",
  "orderBy": "string (optional) - order by field",
  "filterText": "string (optional) - filter text for branch names"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of branches returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "id": "string - branch ID",
      "displayId": "string - display ID",
      "type": "string - branch type",
      "latestCommit": "string - latest commit hash",
      "latestChangeset": "string - latest changeset",
      "isDefault": "boolean - whether this is the default branch"
    }
  ]
}
```

#### Create Branch
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "name": "string (required) - branch name",
  "startPoint": "string (required) - starting point (commit or branch)",
  "message": "string (optional) - commit message"
}
```

**Output Schema**:
```json
{
  "id": "string - branch ID",
  "displayId": "string - display ID",
  "type": "string - branch type",
  "latestCommit": "string - latest commit hash",
  "latestChangeset": "string - latest changeset",
  "isDefault": "boolean - whether this is the default branch"
}
```

#### Set Default Branch
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/default`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "id": "string (required) - branch ID to set as default"
}
```

**Output Schema**:
```json
{
  "id": "string - branch ID",
  "displayId": "string - display ID",
  "type": "string - branch type",
  "latestCommit": "string - latest commit hash",
  "latestChangeset": "string - latest changeset",
  "isDefault": "boolean - whether this is the default branch"
}
```

#### Delete Branch
**Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/branches/{branchId}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "branchId": "string (required) - branch ID in URL path"
}
```

**Output Schema**: No content (204 status)

#### List Tags
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results",
  "orderBy": "string (optional) - order by field",
  "filterText": "string (optional) - filter text for tag names"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of tags returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "id": "string - tag ID",
      "displayId": "string - display ID",
      "type": "string - tag type",
      "latestCommit": "string - latest commit hash",
      "latestChangeset": "string - latest changeset"
    }
  ]
}
```

#### Create Tag
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "name": "string (required) - tag name",
  "startPoint": "string (required) - starting point (commit or branch)",
  "message": "string (optional) - tag message"
}
```

**Output Schema**:
```json
{
  "id": "string - tag ID",
  "displayId": "string - display ID",
  "type": "string - tag type",
  "latestCommit": "string - latest commit hash",
  "latestChangeset": "string - latest changeset"
}
```

#### Delete Tag
**Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/tags/{tagName}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "tagName": "string (required) - tag name in URL path"
}
```

**Output Schema**: No content (204 status)

---

*Note: This is Part 2 of the complete endpoint schemas. The file will continue with Pull Request Management, Commit and Source Management, and Search and Analytics modules for Data Center, followed by all Cloud endpoints.*
