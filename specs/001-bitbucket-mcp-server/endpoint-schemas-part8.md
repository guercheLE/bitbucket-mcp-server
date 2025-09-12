# Bitbucket MCP Server - Endpoint Schemas Part 8

## Bitbucket Cloud - Additional Modules (Final)

### Webhooks

#### List Webhooks
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/hooks`

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
      "uuid": "string - webhook UUID",
      "url": "string - webhook URL",
      "description": "string - webhook description",
      "subject_type": "string - subject type (repository, workspace)",
      "subject": {
        "links": {
          "self": {"href": "string - subject self link"},
          "html": {"href": "string - subject HTML link"},
          "avatar": {"href": "string - subject avatar link"}
        },
        "type": "string - subject type",
        "name": "string - subject name",
        "full_name": "string - subject full name",
        "uuid": "string - subject UUID"
      },
      "active": "boolean - whether webhook is active",
      "created_on": "string - creation date (ISO 8601)",
      "updated_on": "string - last update date (ISO 8601)",
      "events": [
        "string - webhook event types (repo:push, repo:fork, repo:updated, repo:commit_comment_created, etc.)"
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

#### Create Webhook
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/hooks`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "url": "string (required) - webhook URL",
  "description": "string (optional) - webhook description",
  "active": "boolean (optional) - whether webhook is active",
  "events": [
    "string (required) - webhook event types (repo:push, repo:fork, repo:updated, repo:commit_comment_created, etc.)"
  ]
}
```

**Output Schema**: Same as List Webhooks output (single webhook object)

#### Get Webhook
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "uid": "string (required) - webhook UUID in URL path"
}
```

**Output Schema**: Same as List Webhooks output (single webhook object)

#### Update Webhook
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "uid": "string (required) - webhook UUID in URL path",
  "url": "string (optional) - new webhook URL",
  "description": "string (optional) - new webhook description",
  "active": "boolean (optional) - new active status",
  "events": [
    "string (optional) - new webhook event types"
  ]
}
```

**Output Schema**: Same as List Webhooks output (single webhook object)

#### Delete Webhook
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/hooks/{uid}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "uid": "string (required) - webhook UUID in URL path"
}
```

**Output Schema**: No content (204 status)

### Branching Model

#### Get Branching Model
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/branching-model`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path"
}
```

**Output Schema**:
```json
{
  "type": "string - branching model type",
  "branch_types": [
    {
      "kind": "string - branch type kind (feature, bugfix, release, hotfix, development, production)",
      "prefix": "string - branch type prefix",
      "enabled": "boolean - whether branch type is enabled"
    }
  ],
  "development": {
    "name": "string - development branch name",
    "use_mainbranch": "boolean - whether to use main branch"
  },
  "production": {
    "name": "string - production branch name",
    "use_mainbranch": "boolean - whether to use main branch"
  },
  "links": {
    "self": {"href": "string - self link"}
  }
}
```

#### Update Branching Model
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/branching-model`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "branch_types": [
    {
      "kind": "string (required) - branch type kind (feature, bugfix, release, hotfix, development, production)",
      "prefix": "string (optional) - branch type prefix",
      "enabled": "boolean (optional) - whether branch type is enabled"
    }
  ],
  "development": {
    "name": "string (optional) - development branch name",
    "use_mainbranch": "boolean (optional) - whether to use main branch"
  },
  "production": {
    "name": "string (optional) - production branch name",
    "use_mainbranch": "boolean (optional) - whether to use main branch"
  }
}
```

**Output Schema**: Same as Get Branching Model output

---

## Bitbucket Data Center - Additional Modules

### Builds and Deployments

#### Get Build Status
**Endpoint**: `GET /rest/build-status/1.0/commits/{commitId}`

**Input Schema**:
```json
{
  "commitId": "string (required) - commit ID in URL path"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of builds returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "key": "string - build key",
      "state": "string - build state (SUCCESSFUL, FAILED, INPROGRESS, STOPPED)",
      "name": "string - build name",
      "description": "string - build description",
      "url": "string - build URL",
      "dateAdded": "integer - build date timestamp",
      "lastUpdated": "integer - last update timestamp"
    }
  ],
  "start": "integer - start index"
}
```

#### Create Build Status
**Endpoint**: `POST /rest/build-status/1.0/commits/{commitId}`

**Input Schema**:
```json
{
  "commitId": "string (required) - commit ID in URL path",
  "key": "string (required) - build key",
  "state": "string (required) - build state (SUCCESSFUL, FAILED, INPROGRESS, STOPPED)",
  "name": "string (optional) - build name",
  "description": "string (optional) - build description",
  "url": "string (optional) - build URL"
}
```

**Output Schema**: Same as Get Build Status output (single build object)

#### Delete Build Status
**Endpoint**: `DELETE /rest/build-status/1.0/commits/{commitId}/builds/{key}`

**Input Schema**:
```json
{
  "commitId": "string (required) - commit ID in URL path",
  "key": "string (required) - build key in URL path"
}
```

**Output Schema**: No content (204 status)

### System Administration

#### Get System Capabilities
**Endpoint**: `GET /rest/api/1.0/admin/capabilities`

**Input Schema**: No parameters required

**Output Schema**:
```json
{
  "capabilities": {
    "capability_name": "boolean - whether capability is enabled"
  }
}
```

#### Get Dashboard Data
**Endpoint**: `GET /rest/api/1.0/dashboard`

**Input Schema**: No parameters required

**Output Schema**:
```json
{
  "recentRepositories": [
    {
      "id": "integer - repository ID",
      "name": "string - repository name",
      "slug": "string - repository slug",
      "project": {
        "id": "integer - project ID",
        "key": "string - project key",
        "name": "string - project name"
      },
      "public": "boolean - whether repository is public",
      "links": {
        "self": [{"href": "string - self link"}]
      }
    }
  ],
  "recentPullRequests": [
    {
      "id": "integer - pull request ID",
      "version": "integer - pull request version",
      "title": "string - pull request title",
      "description": "string - pull request description",
      "state": "string - pull request state",
      "open": "boolean - whether pull request is open",
      "closed": "boolean - whether pull request is closed",
      "createdDate": "integer - creation timestamp",
      "updatedDate": "integer - update timestamp",
      "fromRef": {
        "id": "string - source reference ID",
        "displayId": "string - source reference display ID",
        "latestCommit": "string - source latest commit",
        "repository": {
          "id": "integer - source repository ID",
          "name": "string - source repository name",
          "slug": "string - source repository slug",
          "project": {
            "id": "integer - source project ID",
            "key": "string - source project key",
            "name": "string - source project name"
          }
        }
      },
      "toRef": {
        "id": "string - destination reference ID",
        "displayId": "string - destination reference display ID",
        "latestCommit": "string - destination latest commit",
        "repository": {
          "id": "integer - destination repository ID",
          "name": "string - destination repository name",
          "slug": "string - destination repository slug",
          "project": {
            "id": "integer - destination project ID",
            "key": "string - destination project key",
            "name": "string - destination project name"
          }
        }
      },
      "locked": "boolean - whether pull request is locked",
      "author": {
        "user": {
          "name": "string - author name",
          "emailAddress": "string - author email",
          "id": "integer - author ID",
          "displayName": "string - author display name",
          "active": "boolean - whether author is active",
          "slug": "string - author slug",
          "type": "string - author type",
          "links": {
            "self": [{"href": "string - author self link"}]
          }
        },
        "role": "string - author role",
        "approved": "boolean - whether author approved",
        "status": "string - author status"
      },
      "reviewers": [
        {
          "user": {
            "name": "string - reviewer name",
            "emailAddress": "string - reviewer email",
            "id": "integer - reviewer ID",
            "displayName": "string - reviewer display name",
            "active": "boolean - whether reviewer is active",
            "slug": "string - reviewer slug",
            "type": "string - reviewer type",
            "links": {
              "self": [{"href": "string - reviewer self link"}]
            }
          },
          "role": "string - reviewer role",
          "approved": "boolean - whether reviewer approved",
          "status": "string - reviewer status"
        }
      ],
      "participants": [
        {
          "user": {
            "name": "string - participant name",
            "emailAddress": "string - participant email",
            "id": "integer - participant ID",
            "displayName": "string - participant display name",
            "active": "boolean - whether participant is active",
            "slug": "string - participant slug",
            "type": "string - participant type",
            "links": {
              "self": [{"href": "string - participant self link"}]
            }
          },
          "role": "string - participant role",
          "approved": "boolean - whether participant approved",
          "status": "string - participant status"
        }
      ],
      "links": {
        "self": [{"href": "string - self link"}]
      }
    }
  ]
}
```

#### Get Jira-Linked Commits
**Endpoint**: `GET /rest/jira/1.0/projects/{projectKey}/repos/{repositorySlug}/commits`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "issueKey": "string (optional) - Jira issue key",
  "start": "integer (optional) - start index",
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
      "id": "string - commit ID",
      "displayId": "string - commit display ID",
      "author": {
        "name": "string - author name",
        "emailAddress": "string - author email",
        "id": "integer - author ID",
        "displayName": "string - author display name",
        "active": "boolean - whether author is active",
        "slug": "string - author slug",
        "type": "string - author type",
        "links": {
          "self": [{"href": "string - author self link"}]
        }
      },
      "authorTimestamp": "integer - author timestamp",
      "committer": {
        "name": "string - committer name",
        "emailAddress": "string - committer email",
        "id": "integer - committer ID",
        "displayName": "string - committer display name",
        "active": "boolean - whether committer is active",
        "slug": "string - committer slug",
        "type": "string - committer type",
        "links": {
          "self": [{"href": "string - committer self link"}]
        }
      },
      "committerTimestamp": "integer - committer timestamp",
      "message": "string - commit message",
      "parents": [
        {
          "id": "string - parent commit ID",
          "displayId": "string - parent commit display ID"
        }
      ],
      "properties": {
        "jira-key": [
          "string - Jira issue keys"
        ]
      },
      "links": {
        "self": [{"href": "string - self link"}]
      }
    }
  ],
  "start": "integer - start index"
}
```

#### Link Commits to Jira
**Endpoint**: `POST /rest/jira/1.0/projects/{projectKey}/repos/{repositorySlug}/commits`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "commits": [
    {
      "id": "string (required) - commit ID",
      "issueKey": "string (required) - Jira issue key"
    }
  ]
}
```

**Output Schema**: Same as Get Jira-Linked Commits output

#### Preview Markup
**Endpoint**: `POST /rest/api/1.0/markup/preview`

**Input Schema**:
```json
{
  "markup": "string (required) - markup content to preview",
  "hardWrap": "boolean (optional) - whether to hard wrap lines"
}
```

**Output Schema**:
```json
{
  "html": "string - rendered HTML content"
}
```

---

## Summary

This document provides detailed input/output specifications for the final Bitbucket Cloud modules and additional Bitbucket Data Center modules:

### Bitbucket Cloud Additional Modules (Final)
- **Webhooks**: 5 endpoints
- **Branching Model**: 2 endpoints

### Bitbucket Data Center Additional Modules
- **Builds and Deployments**: 3 endpoints
- **System Administration**: 4 endpoints

**Total: 14 additional endpoints** with complete input/output schemas.

### Complete Coverage Summary
- **Bitbucket Cloud**: 95+ endpoints across all modules
- **Bitbucket Data Center**: 75+ endpoints across all modules
- **Total**: 170+ endpoints with comprehensive input/output schemas
