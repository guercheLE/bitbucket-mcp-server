# Bitbucket MCP Server - Endpoint Schemas Part 6

## Bitbucket Cloud - Additional Modules

### Branch Restrictions

#### List Branch Restrictions
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "id": "integer - restriction ID",
      "type": "string - restriction type",
      "kind": "string - restriction kind (push, delete, force_push, restrict_merges)",
      "branch_type": "string - branch type (branch, pattern, model)",
      "branch_match_kind": "string - branch match kind (glob, regexp)",
      "branch_match": "string - branch pattern to match",
      "users": [
        {
          "display_name": "string - user display name",
          "uuid": "string - user UUID",
          "links": {
            "self": {"href": "string - user self link"},
            "html": {"href": "string - user HTML link"},
            "avatar": {"href": "string - user avatar link"}
          },
          "type": "string - user type",
          "nickname": "string - user nickname",
          "account_id": "string - user account ID"
        }
      ],
      "groups": [
        {
          "name": "string - group name",
          "slug": "string - group slug",
          "links": {
            "self": {"href": "string - group self link"},
            "html": {"href": "string - group HTML link"}
          }
        }
      ],
      "links": {
        "self": {"href": "string - self link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Branch Restriction
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "kind": "string (required) - restriction kind (push, delete, force_push, restrict_merges)",
  "branch_type": "string (required) - branch type (branch, pattern, model)",
  "branch_match_kind": "string (optional) - branch match kind (glob, regexp)",
  "branch_match": "string (optional) - branch pattern to match",
  "users": [
    {
      "uuid": "string - user UUID"
    }
  ],
  "groups": [
    {
      "slug": "string - group slug"
    }
  ]
}
```

**Output Schema**: Same as List Branch Restrictions output (single restriction object)

#### Get Branch Restriction
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "id": "integer (required) - restriction ID in URL path"
}
```

**Output Schema**: Same as List Branch Restrictions output (single restriction object)

#### Update Branch Restriction
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "id": "integer (required) - restriction ID in URL path",
  "kind": "string (optional) - restriction kind (push, delete, force_push, restrict_merges)",
  "branch_type": "string (optional) - branch type (branch, pattern, model)",
  "branch_match_kind": "string (optional) - branch match kind (glob, regexp)",
  "branch_match": "string (optional) - branch pattern to match",
  "users": [
    {
      "uuid": "string - user UUID"
    }
  ],
  "groups": [
    {
      "slug": "string - group slug"
    }
  ]
}
```

**Output Schema**: Same as List Branch Restrictions output (single restriction object)

#### Delete Branch Restriction
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/branch-restrictions/{id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "id": "integer (required) - restriction ID in URL path"
}
```

**Output Schema**: No content (204 status)

### Commit Statuses

#### List Commit Statuses
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "commit": "string (required) - commit hash in URL path",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "key": "string - status key",
      "refname": "string - reference name",
      "url": "string - status URL",
      "state": "string - status state (SUCCESSFUL, FAILED, INPROGRESS, STOPPED)",
      "name": "string - status name",
      "description": "string - status description",
      "created_on": "string - creation date (ISO 8601)",
      "updated_on": "string - last update date (ISO 8601)",
      "links": {
        "commit": {"href": "string - commit link"},
        "self": {"href": "string - self link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Build Status
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "commit": "string (required) - commit hash in URL path",
  "key": "string (required) - unique status key",
  "state": "string (required) - status state (SUCCESSFUL, FAILED, INPROGRESS, STOPPED)",
  "name": "string (optional) - status name",
  "description": "string (optional) - status description",
  "url": "string (optional) - status URL"
}
```

**Output Schema**: Same as List Commit Statuses output (single status object)

#### Get Build Status
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "commit": "string (required) - commit hash in URL path",
  "key": "string (required) - status key in URL path"
}
```

**Output Schema**: Same as List Commit Statuses output (single status object)

#### Update Build Status
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/commit/{commit}/statuses/build/{key}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "commit": "string (required) - commit hash in URL path",
  "key": "string (required) - status key in URL path",
  "state": "string (optional) - new status state (SUCCESSFUL, FAILED, INPROGRESS, STOPPED)",
  "name": "string (optional) - new status name",
  "description": "string (optional) - new status description",
  "url": "string (optional) - new status URL"
}
```

**Output Schema**: Same as List Commit Statuses output (single status object)

### Deployments

#### List Deployments
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/deployments`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "uuid": "string - deployment UUID",
      "type": "string - deployment type",
      "name": "string - deployment name",
      "key": "string - deployment key",
      "url": "string - deployment URL",
      "state": "string - deployment state (PENDING, IN_PROGRESS, COMPLETED, FAILED, STOPPED)",
      "environment": {
        "uuid": "string - environment UUID",
        "type": "string - environment type",
        "name": "string - environment name",
        "rank": "integer - environment rank"
      },
      "release": {
        "uuid": "string - release UUID",
        "type": "string - release type",
        "name": "string - release name",
        "full_name": "string - release full name"
      },
      "created_on": "string - creation date (ISO 8601)",
      "updated_on": "string - last update date (ISO 8601)",
      "links": {
        "self": {"href": "string - self link"},
        "commits": {"href": "string - commits link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Deployment
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/deployments`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "name": "string (required) - deployment name",
  "key": "string (required) - deployment key",
  "url": "string (optional) - deployment URL",
  "state": "string (optional) - deployment state (PENDING, IN_PROGRESS, COMPLETED, FAILED, STOPPED)",
  "environment": {
    "name": "string (required) - environment name"
  },
  "release": {
    "name": "string (optional) - release name"
  }
}
```

**Output Schema**: Same as List Deployments output (single deployment object)

#### Get Deployment
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "deployment_uuid": "string (required) - deployment UUID in URL path"
}
```

**Output Schema**: Same as List Deployments output (single deployment object)

#### Update Deployment
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "deployment_uuid": "string (required) - deployment UUID in URL path",
  "name": "string (optional) - new deployment name",
  "key": "string (optional) - new deployment key",
  "url": "string (optional) - new deployment URL",
  "state": "string (optional) - new deployment state (PENDING, IN_PROGRESS, COMPLETED, FAILED, STOPPED)",
  "environment": {
    "name": "string (optional) - new environment name"
  },
  "release": {
    "name": "string (optional) - new release name"
  }
}
```

**Output Schema**: Same as List Deployments output (single deployment object)

#### Delete Deployment
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/deployments/{deployment_uuid}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "deployment_uuid": "string (required) - deployment UUID in URL path"
}
```

**Output Schema**: No content (204 status)

### Downloads

#### List Downloads
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/downloads`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "name": "string - download filename",
      "links": {
        "self": {"href": "string - self link"},
        "meta": {"href": "string - meta link"}
      },
      "path": "string - download path",
      "size": "integer - file size in bytes",
      "created_on": "string - creation date (ISO 8601)"
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Download
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/downloads`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "files": "string (required) - file content (base64 encoded)",
  "name": "string (required) - filename"
}
```

**Output Schema**: Same as List Downloads output (single download object)

#### Get Download
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/downloads/{filename}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "filename": "string (required) - filename in URL path"
}
```

**Output Schema**: Same as List Downloads output (single download object)

#### Delete Download
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/downloads/{filename}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "filename": "string (required) - filename in URL path"
}
```

**Output Schema**: No content (204 status)

### GPG Keys

#### List User GPG Keys
**Endpoint**: `GET /2.0/users/{username}/gpg-keys`

**Input Schema**:
```json
{
  "username": "string (required) - username in URL path",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "key_id": "string - GPG key ID",
      "key": "string - GPG public key",
      "created_on": "string - creation date (ISO 8601)",
      "links": {
        "self": {"href": "string - self link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create GPG Key
**Endpoint**: `POST /2.0/users/{username}/gpg-keys`

**Input Schema**:
```json
{
  "username": "string (required) - username in URL path",
  "key": "string (required) - GPG public key"
}
```

**Output Schema**: Same as List User GPG Keys output (single GPG key object)

#### Get GPG Key
**Endpoint**: `GET /2.0/users/{username}/gpg-keys/{key_id}`

**Input Schema**:
```json
{
  "username": "string (required) - username in URL path",
  "key_id": "string (required) - GPG key ID in URL path"
}
```

**Output Schema**: Same as List User GPG Keys output (single GPG key object)

#### Delete GPG Key
**Endpoint**: `DELETE /2.0/users/{username}/gpg-keys/{key_id}`

**Input Schema**:
```json
{
  "username": "string (required) - username in URL path",
  "key_id": "string (required) - GPG key ID in URL path"
}
```

**Output Schema**: No content (204 status)

---

## Summary

This document provides detailed input/output specifications for additional Bitbucket Cloud modules:

### Bitbucket Cloud Additional Modules
- **Branch Restrictions**: 5 endpoints
- **Commit Statuses**: 4 endpoints
- **Deployments**: 5 endpoints
- **Downloads**: 4 endpoints
- **GPG Keys**: 4 endpoints

**Total: 22 additional endpoints** with complete input/output schemas for Bitbucket Cloud.
