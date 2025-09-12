# Bitbucket MCP Server - Endpoint Schemas Part 3

## Bitbucket Data Center - Commit and Source Management

#### List Commits
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "until": "string (optional) - commit ID or ref to list commits until",
  "since": "string (optional) - commit ID or ref to list commits since",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of commits returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "id": "string - commit hash",
      "displayId": "string - abbreviated commit hash",
      "author": {
        "name": "string - author name",
        "emailAddress": "string - author email address"
      },
      "authorTimestamp": "integer - author timestamp",
      "message": "string - commit message",
      "parents": [
        {
          "id": "string - parent commit hash",
          "displayId": "string - abbreviated parent commit hash"
        }
      ]
    }
  ]
}
```

#### Get Commit Details
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "commitId": "string (required) - commit ID in URL path"
}
```

**Output Schema**:
```json
{
  "id": "string - commit hash",
  "displayId": "string - abbreviated commit hash",
  "author": {
    "name": "string - author name",
    "emailAddress": "string - author email address"
  },
  "authorTimestamp": "integer - author timestamp",
  "committer": {
    "name": "string - committer name",
    "emailAddress": "string - committer email address"
  },
  "committerTimestamp": "integer - committer timestamp",
  "message": "string - commit message",
  "parents": [
    {
      "id": "string - parent commit hash",
      "displayId": "string - abbreviated parent commit hash"
    }
  ]
}
```

#### Get Commit Changes
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/commits/{commitId}/changes`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "commitId": "string (required) - commit ID in URL path",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of changes returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "contentId": "string - content ID",
      "fromContentId": "string - from content ID",
      "path": {
        "components": ["string - path components"],
        "parent": "string - parent path",
        "name": "string - file name",
        "extension": "string - file extension",
        "toString": "string - full path"
      },
      "executable": "boolean - whether file is executable",
      "percentUnchanged": "integer - percentage unchanged",
      "type": "string - change type (MODIFY, ADD, DELETE, MOVE)",
      "nodeType": "string - node type (FILE, DIRECTORY)",
      "srcExecutable": "boolean - whether source is executable",
      "links": {
        "self": [{"href": "string - self link"}],
        "diff": [{"href": "string - diff link"}]
      }
    }
  ]
}
```

#### Browse Repository Files
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "at": "string (optional) - commit ID or branch name",
  "path": "string (optional) - path to browse",
  "type": "boolean (optional) - whether to return type information",
  "blame": "boolean (optional) - whether to return blame information",
  "noContent": "boolean (optional) - whether to exclude content"
}
```

**Output Schema**:
```json
{
  "path": {
    "components": ["string - path components"],
    "parent": "string - parent path",
    "name": "string - file name",
    "extension": "string - file extension",
    "toString": "string - full path"
  },
  "revision": {
    "id": "string - revision ID",
    "displayId": "string - abbreviated revision ID"
  },
  "children": {
    "size": "integer - number of children",
    "limit": "integer - maximum number of results",
    "isLastPage": "boolean - whether this is the last page",
    "values": [
      {
        "path": {
          "components": ["string - path components"],
          "parent": "string - parent path",
          "name": "string - file name",
          "extension": "string - file extension",
          "toString": "string - full path"
        },
        "contentId": "string - content ID",
        "type": "string - node type (FILE, DIRECTORY)",
        "size": "integer - file size in bytes",
        "executable": "boolean - whether file is executable"
      }
    ]
  },
  "content": "string - file content (if not noContent)",
  "size": "integer - file size in bytes",
  "isLastPage": "boolean - whether this is the last page"
}
```

#### Get Raw File Content
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/raw/{path}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "path": "string (required) - file path in URL path",
  "at": "string (optional) - commit ID or branch name"
}
```

**Output Schema**: Raw file content (text/plain)

#### Create/Update File
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "path": "string (required) - file path",
  "content": "string (required) - file content",
  "message": "string (required) - commit message",
  "branch": "string (optional) - branch name",
  "sourceCommitId": "string (optional) - source commit ID"
}
```

**Output Schema**:
```json
{
  "path": {
    "components": ["string - path components"],
    "parent": "string - parent path",
    "name": "string - file name",
    "extension": "string - file extension",
    "toString": "string - full path"
  },
  "revision": {
    "id": "string - revision ID",
    "displayId": "string - abbreviated revision ID"
  },
  "content": "string - file content",
  "size": "integer - file size in bytes"
}
```

#### Delete File
**Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/browse`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "path": "string (required) - file path",
  "message": "string (required) - commit message",
  "branch": "string (optional) - branch name",
  "sourceCommitId": "string (optional) - source commit ID"
}
```

**Output Schema**: No content (204 status)

## Bitbucket Data Center - Search and Analytics

#### Search Commits
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/search/commits`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "searchTerm": "string (required) - search term",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of commits returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "id": "string - commit hash",
      "displayId": "string - abbreviated commit hash",
      "author": {
        "name": "string - author name",
        "emailAddress": "string - author email address"
      },
      "authorTimestamp": "integer - author timestamp",
      "message": "string - commit message",
      "parents": [
        {
          "id": "string - parent commit hash",
          "displayId": "string - abbreviated parent commit hash"
        }
      ]
    }
  ]
}
```

#### Search Code
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/search/code`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "searchTerm": "string (required) - search term",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of results returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "path": {
        "components": ["string - path components"],
        "parent": "string - parent path",
        "name": "string - file name",
        "extension": "string - file extension",
        "toString": "string - full path"
      },
      "contentId": "string - content ID",
      "type": "string - node type (FILE, DIRECTORY)",
      "size": "integer - file size in bytes",
      "executable": "boolean - whether file is executable",
      "lines": [
        {
          "line": "integer - line number",
          "text": "string - line text"
        }
      ]
    }
  ]
}
```

#### Search Repositories
**Endpoint**: `GET /rest/api/1.0/search/repositories`

**Input Schema**:
```json
{
  "searchTerm": "string (required) - search term",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results"
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

#### Search Users
**Endpoint**: `GET /rest/api/1.0/search/users`

**Input Schema**:
```json
{
  "searchTerm": "string (required) - search term",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of users returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "name": "string - user display name",
      "emailAddress": "string - user email address",
      "id": "integer - user ID",
      "displayName": "string - user display name",
      "active": "boolean - whether user is active",
      "slug": "string - user slug",
      "type": "string - user type"
    }
  ]
}
```

---

## Bitbucket Cloud - Complete Endpoint Schemas

### Authentication Module

#### Get Access Token
**Endpoint**: `POST /site/oauth2/access_token`

**Input Schema**:
```json
{
  "grant_type": "string (required) - 'authorization_code', 'refresh_token', or 'client_credentials'",
  "code": "string (optional) - authorization code",
  "redirect_uri": "string (optional) - redirect URI",
  "client_id": "string (optional) - OAuth client ID",
  "client_secret": "string (optional) - OAuth client secret",
  "refresh_token": "string (optional) - refresh token"
}
```

**Output Schema**:
```json
{
  "access_token": "string - OAuth access token",
  "token_type": "string - token type (usually 'Bearer')",
  "expires_in": "integer - token expiration time in seconds",
  "refresh_token": "string - refresh token for token renewal",
  "scopes": "string - granted scopes"
}
```

#### Refresh Access Token
**Endpoint**: `POST /site/oauth2/refresh_token`

**Input Schema**:
```json
{
  "refresh_token": "string (required) - refresh token",
  "client_id": "string (required) - OAuth client ID",
  "client_secret": "string (required) - OAuth client secret"
}
```

**Output Schema**:
```json
{
  "access_token": "string - new OAuth access token",
  "token_type": "string - token type (usually 'Bearer')",
  "expires_in": "integer - token expiration time in seconds",
  "refresh_token": "string - new refresh token",
  "scopes": "string - granted scopes"
}
```

#### Revoke Token
**Endpoint**: `POST /site/oauth2/revoke_token`

**Input Schema**:
```json
{
  "token": "string (required) - token to revoke",
  "client_id": "string (required) - OAuth client ID",
  "client_secret": "string (required) - OAuth client secret"
}
```

**Output Schema**: No content (200 status)

#### Get Current User
**Endpoint**: `GET /2.0/user`

**Input Schema**: No parameters required

**Output Schema**:
```json
{
  "username": "string - username",
  "display_name": "string - display name",
  "uuid": "string - user UUID",
  "account_id": "string - account ID",
  "links": {
    "self": {"href": "string - self link"},
    "html": {"href": "string - HTML link"},
    "avatar": {"href": "string - avatar link"}
  },
  "created_on": "string - creation date (ISO 8601)",
  "type": "string - user type",
  "has_2fa_enabled": "boolean - whether 2FA is enabled"
}
```

#### Get User Details
**Endpoint**: `GET /2.0/users/{username}`

**Input Schema**:
```json
{
  "username": "string (required) - username in URL path"
}
```

**Output Schema**:
```json
{
  "username": "string - username",
  "display_name": "string - display name",
  "uuid": "string - user UUID",
  "account_id": "string - account ID",
  "links": {
    "self": {"href": "string - self link"},
    "html": {"href": "string - HTML link"},
    "avatar": {"href": "string - avatar link"}
  },
  "created_on": "string - creation date (ISO 8601)",
  "type": "string - user type",
  "has_2fa_enabled": "boolean - whether 2FA is enabled"
}
```

---

*Note: This is Part 3 of the complete endpoint schemas. The file continues with Workspace Management, Repository Management, Pull Request Management, Commit and Source Management, and Search and Analytics modules for Cloud.*
