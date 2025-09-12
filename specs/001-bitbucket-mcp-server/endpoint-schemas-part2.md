# Bitbucket MCP Server - Endpoint Schemas Part 2

## Bitbucket Data Center - Pull Request Management

#### List Pull Requests
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results",
  "state": "string (optional) - filter by state (OPEN, DECLINED, MERGED)",
  "order": "string (optional) - order by field"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of pull requests returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "id": "integer - pull request ID",
      "version": "integer - pull request version",
      "title": "string - pull request title",
      "description": "string - pull request description",
      "state": "string - pull request state",
      "open": "boolean - whether pull request is open",
      "closed": "boolean - whether pull request is closed",
      "createdDate": "integer - creation timestamp",
      "updatedDate": "integer - last update timestamp",
      "fromRef": {
        "id": "string - source branch ID",
        "displayId": "string - source branch display ID",
        "latestCommit": "string - latest commit hash",
        "repository": {
          "slug": "string - source repository slug",
          "name": "string - source repository name",
          "project": {
            "key": "string - source project key",
            "name": "string - source project name"
          }
        }
      },
      "toRef": {
        "id": "string - target branch ID",
        "displayId": "string - target branch display ID",
        "latestCommit": "string - latest commit hash",
        "repository": {
          "slug": "string - target repository slug",
          "name": "string - target repository name",
          "project": {
            "key": "string - target project key",
            "name": "string - target project name"
          }
        }
      },
      "author": {
        "user": {
          "name": "string - author username",
          "displayName": "string - author display name",
          "emailAddress": "string - author email"
        }
      },
      "reviewers": [
        {
          "user": {
            "name": "string - reviewer username",
            "displayName": "string - reviewer display name"
          },
          "approved": "boolean - whether reviewer approved",
          "status": "string - reviewer status"
        }
      ]
    }
  ]
}
```

#### Create Pull Request
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "title": "string (required) - pull request title",
  "description": "string (optional) - pull request description",
  "fromRef": {
    "id": "string (required) - source branch ID",
    "repository": {
      "slug": "string (required) - source repository slug",
      "project": {
        "key": "string (required) - source project key"
      }
    }
  },
  "toRef": {
    "id": "string (required) - target branch ID",
    "repository": {
      "slug": "string (required) - target repository slug",
      "project": {
        "key": "string (required) - target project key"
      }
    }
  },
  "reviewers": [
    {
      "user": {
        "name": "string - reviewer username"
      }
    }
  ]
}
```

**Output Schema**:
```json
{
  "id": "integer - pull request ID",
  "version": "integer - pull request version",
  "title": "string - pull request title",
  "description": "string - pull request description",
  "state": "string - pull request state",
  "open": "boolean - whether pull request is open",
  "closed": "boolean - whether pull request is closed",
  "createdDate": "integer - creation timestamp",
  "updatedDate": "integer - last update timestamp",
  "fromRef": {
    "id": "string - source branch ID",
    "displayId": "string - source branch display ID",
    "latestCommit": "string - latest commit hash",
    "repository": {
      "slug": "string - source repository slug",
      "name": "string - source repository name",
      "project": {
        "key": "string - source project key",
        "name": "string - source project name"
      }
    }
  },
  "toRef": {
    "id": "string - target branch ID",
    "displayId": "string - target branch display ID",
    "latestCommit": "string - latest commit hash",
    "repository": {
      "slug": "string - target repository slug",
      "name": "string - target repository name",
      "project": {
        "key": "string - target project key",
        "name": "string - target project name"
      }
    }
  },
  "author": {
    "user": {
      "name": "string - author username",
      "displayName": "string - author display name",
      "emailAddress": "string - author email"
    }
  },
  "reviewers": [
    {
      "user": {
        "name": "string - reviewer username",
        "displayName": "string - reviewer display name"
      },
      "approved": "boolean - whether reviewer approved",
      "status": "string - reviewer status"
    }
  ]
}
```

#### Get Pull Request Details
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path"
}
```

**Output Schema**: Same as Create Pull Request output

#### Update Pull Request
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "version": "integer (required) - pull request version",
  "title": "string (optional) - new pull request title",
  "description": "string (optional) - new pull request description",
  "reviewers": [
    {
      "user": {
        "name": "string - reviewer username"
      }
    }
  ]
}
```

**Output Schema**: Same as Create Pull Request output

#### Delete Pull Request
**Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path"
}
```

**Output Schema**: No content (204 status)

#### Merge Pull Request
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/merge`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "version": "integer (required) - pull request version",
  "mergeCommitMessage": "string (optional) - merge commit message"
}
```

**Output Schema**:
```json
{
  "id": "integer - pull request ID",
  "version": "integer - pull request version",
  "title": "string - pull request title",
  "state": "string - pull request state (MERGED)",
  "open": "boolean - false",
  "closed": "boolean - true",
  "createdDate": "integer - creation timestamp",
  "updatedDate": "integer - last update timestamp"
}
```

#### Decline Pull Request
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/decline`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "version": "integer (required) - pull request version"
}
```

**Output Schema**:
```json
{
  "id": "integer - pull request ID",
  "version": "integer - pull request version",
  "title": "string - pull request title",
  "state": "string - pull request state (DECLINED)",
  "open": "boolean - false",
  "closed": "boolean - true",
  "createdDate": "integer - creation timestamp",
  "updatedDate": "integer - last update timestamp"
}
```

#### Reopen Pull Request
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/reopen`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "version": "integer (required) - pull request version"
}
```

**Output Schema**:
```json
{
  "id": "integer - pull request ID",
  "version": "integer - pull request version",
  "title": "string - pull request title",
  "state": "string - pull request state (OPEN)",
  "open": "boolean - true",
  "closed": "boolean - false",
  "createdDate": "integer - creation timestamp",
  "updatedDate": "integer - last update timestamp"
}
```

#### List Pull Request Comments
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "start": "integer (optional) - start index for pagination",
  "limit": "integer (optional) - maximum number of results"
}
```

**Output Schema**:
```json
{
  "size": "integer - number of comments returned",
  "limit": "integer - maximum number of results",
  "isLastPage": "boolean - whether this is the last page",
  "values": [
    {
      "id": "integer - comment ID",
      "version": "integer - comment version",
      "text": "string - comment text",
      "author": {
        "user": {
          "name": "string - author username",
          "displayName": "string - author display name",
          "emailAddress": "string - author email"
        }
      },
      "createdDate": "integer - creation timestamp",
      "updatedDate": "integer - last update timestamp",
      "comments": [
        {
          "id": "integer - reply comment ID",
          "text": "string - reply comment text",
          "author": {
            "user": {
              "name": "string - reply author username",
              "displayName": "string - reply author display name"
            }
          },
          "createdDate": "integer - reply creation timestamp"
        }
      ]
    }
  ]
}
```

#### Create Pull Request Comment
**Endpoint**: `POST /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "text": "string (required) - comment text",
  "parent": {
    "id": "integer (optional) - parent comment ID for replies"
  }
}
```

**Output Schema**:
```json
{
  "id": "integer - comment ID",
  "version": "integer - comment version",
  "text": "string - comment text",
  "author": {
    "user": {
      "name": "string - author username",
      "displayName": "string - author display name",
      "emailAddress": "string - author email"
    }
  },
  "createdDate": "integer - creation timestamp",
  "updatedDate": "integer - last update timestamp"
}
```

#### Get Pull Request Comment
**Endpoint**: `GET /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "commentId": "integer (required) - comment ID in URL path"
}
```

**Output Schema**: Same as Create Pull Request Comment output

#### Update Pull Request Comment
**Endpoint**: `PUT /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "commentId": "integer (required) - comment ID in URL path",
  "version": "integer (required) - comment version",
  "text": "string (required) - new comment text"
}
```

**Output Schema**: Same as Create Pull Request Comment output

#### Delete Pull Request Comment
**Endpoint**: `DELETE /rest/api/1.0/projects/{projectKey}/repos/{repositorySlug}/pull-requests/{pullRequestId}/comments/{commentId}`

**Input Schema**:
```json
{
  "projectKey": "string (required) - project key in URL path",
  "repositorySlug": "string (required) - repository slug in URL path",
  "pullRequestId": "integer (required) - pull request ID in URL path",
  "commentId": "integer (required) - comment ID in URL path"
}
```

**Output Schema**: No content (204 status)

---

*Note: This is Part 2 of the complete endpoint schemas. The file will continue with Commit and Source Management, and Search and Analytics modules for Data Center, followed by all Cloud endpoints.*
