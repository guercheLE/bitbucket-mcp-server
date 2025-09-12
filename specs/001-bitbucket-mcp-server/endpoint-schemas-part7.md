# Bitbucket MCP Server - Endpoint Schemas Part 7

## Bitbucket Cloud - Additional Modules (Continued)

### Issue Tracker

#### List Issues
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/issues`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "q": "string (optional) - query string for filtering",
  "sort": "string (optional) - sort by field (created_on, updated_on, priority, kind)",
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
      "id": "integer - issue ID",
      "title": "string - issue title",
      "content": {
        "raw": "string - raw issue content",
        "markup": "string - markup type",
        "html": "string - rendered HTML",
        "type": "string - content type"
      },
      "kind": "string - issue kind (bug, enhancement, proposal, task)",
      "priority": "string - issue priority (trivial, minor, major, critical, blocker)",
      "state": "string - issue state (new, open, resolved, on hold, invalid, duplicate, wontfix, closed)",
      "assignee": {
        "display_name": "string - assignee display name",
        "uuid": "string - assignee UUID",
        "links": {
          "self": {"href": "string - assignee self link"},
          "html": {"href": "string - assignee HTML link"},
          "avatar": {"href": "string - assignee avatar link"}
        },
        "type": "string - assignee type",
        "nickname": "string - assignee nickname",
        "account_id": "string - assignee account ID"
      },
      "reporter": {
        "display_name": "string - reporter display name",
        "uuid": "string - reporter UUID",
        "links": {
          "self": {"href": "string - reporter self link"},
          "html": {"href": "string - reporter HTML link"},
          "avatar": {"href": "string - reporter avatar link"}
        },
        "type": "string - reporter type",
        "nickname": "string - reporter nickname",
        "account_id": "string - reporter account ID"
      },
      "component": "string - issue component",
      "milestone": "string - issue milestone",
      "version": "string - issue version",
      "votes": "integer - number of votes",
      "watches": "integer - number of watchers",
      "created_on": "string - creation date (ISO 8601)",
      "updated_on": "string - last update date (ISO 8601)",
      "links": {
        "self": {"href": "string - self link"},
        "html": {"href": "string - HTML link"},
        "comments": {"href": "string - comments link"},
        "attachments": {"href": "string - attachments link"},
        "watch": {"href": "string - watch link"},
        "vote": {"href": "string - vote link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Issue
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/issues`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "title": "string (required) - issue title",
  "content": {
    "raw": "string (required) - raw issue content"
  },
  "kind": "string (optional) - issue kind (bug, enhancement, proposal, task)",
  "priority": "string (optional) - issue priority (trivial, minor, major, critical, blocker)",
  "assignee": {
    "uuid": "string - assignee UUID"
  },
  "component": "string (optional) - issue component",
  "milestone": "string (optional) - issue milestone",
  "version": "string (optional) - issue version"
}
```

**Output Schema**: Same as List Issues output (single issue object)

#### Get Issue
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "issue_id": "integer (required) - issue ID in URL path"
}
```

**Output Schema**: Same as List Issues output (single issue object)

#### Update Issue
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "issue_id": "integer (required) - issue ID in URL path",
  "title": "string (optional) - new issue title",
  "content": {
    "raw": "string (optional) - new raw issue content"
  },
  "kind": "string (optional) - new issue kind (bug, enhancement, proposal, task)",
  "priority": "string (optional) - new issue priority (trivial, minor, major, critical, blocker)",
  "state": "string (optional) - new issue state (new, open, resolved, on hold, invalid, duplicate, wontfix, closed)",
  "assignee": {
    "uuid": "string - new assignee UUID"
  },
  "component": "string (optional) - new issue component",
  "milestone": "string (optional) - new issue milestone",
  "version": "string (optional) - new issue version"
}
```

**Output Schema**: Same as List Issues output (single issue object)

#### Delete Issue
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "issue_id": "integer (required) - issue ID in URL path"
}
```

**Output Schema**: No content (204 status)

#### List Issue Comments
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "issue_id": "integer (required) - issue ID in URL path",
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
      "id": "integer - comment ID",
      "content": {
        "raw": "string - raw comment content",
        "markup": "string - markup type",
        "html": "string - rendered HTML",
        "type": "string - content type"
      },
      "created_on": "string - creation date (ISO 8601)",
      "updated_on": "string - last update date (ISO 8601)",
      "user": {
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
      },
      "links": {
        "self": {"href": "string - self link"},
        "html": {"href": "string - HTML link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Issue Comment
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/issues/{issue_id}/comments`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "issue_id": "integer (required) - issue ID in URL path",
  "content": {
    "raw": "string (required) - raw comment content"
  }
}
```

**Output Schema**: Same as List Issue Comments output (single comment object)

### Pipelines

#### List Pipelines
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines`

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
      "uuid": "string - pipeline UUID",
      "type": "string - pipeline type",
      "build_number": "integer - build number",
      "creator": {
        "display_name": "string - creator display name",
        "uuid": "string - creator UUID",
        "links": {
          "self": {"href": "string - creator self link"},
          "html": {"href": "string - creator HTML link"},
          "avatar": {"href": "string - creator avatar link"}
        },
        "type": "string - creator type",
        "nickname": "string - creator nickname",
        "account_id": "string - creator account ID"
      },
      "repository": {
        "links": {
          "self": {"href": "string - repository self link"},
          "html": {"href": "string - repository HTML link"},
          "avatar": {"href": "string - repository avatar link"}
        },
        "type": "string - repository type",
        "name": "string - repository name",
        "full_name": "string - repository full name",
        "uuid": "string - repository UUID"
      },
      "target": {
        "type": "string - target type",
        "ref_type": "string - reference type",
        "ref_name": "string - reference name",
        "selector": {
          "type": "string - selector type",
          "pattern": "string - selector pattern"
        },
        "commit": {
          "hash": "string - commit hash",
          "type": "string - commit type",
          "links": {
            "self": {"href": "string - commit self link"},
            "html": {"href": "string - commit HTML link"}
          }
        }
      },
      "state": {
        "name": "string - state name (PENDING, IN_PROGRESS, COMPLETED, FAILED, STOPPED)",
        "type": "string - state type",
        "result": {
          "name": "string - result name (SUCCESSFUL, FAILED, STOPPED, EXPIRED)",
          "type": "string - result type"
        }
      },
      "created_on": "string - creation date (ISO 8601)",
      "completed_on": "string - completion date (ISO 8601)",
      "build_seconds_used": "integer - build seconds used",
      "links": {
        "self": {"href": "string - self link"},
        "steps": {"href": "string - steps link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Pipeline
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "target": {
    "type": "string (required) - target type (pipeline_ref_target, pipeline_pullrequest_target)",
    "ref_type": "string (required) - reference type (branch, tag, named_branch, bookmark)",
    "ref_name": "string (required) - reference name",
    "selector": {
      "type": "string (optional) - selector type",
      "pattern": "string (optional) - selector pattern"
    }
  }
}
```

**Output Schema**: Same as List Pipelines output (single pipeline object)

#### Get Pipeline
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pipeline_uuid": "string (required) - pipeline UUID in URL path"
}
```

**Output Schema**: Same as List Pipelines output (single pipeline object)

#### Stop Pipeline
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/stopPipeline`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pipeline_uuid": "string (required) - pipeline UUID in URL path"
}
```

**Output Schema**: Same as List Pipelines output (single pipeline object with updated state)

#### List Pipeline Steps
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/pipelines/{pipeline_uuid}/steps`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pipeline_uuid": "string (required) - pipeline UUID in URL path",
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
      "uuid": "string - step UUID",
      "type": "string - step type",
      "name": "string - step name",
      "state": {
        "name": "string - state name (PENDING, IN_PROGRESS, COMPLETED, FAILED, STOPPED)",
        "type": "string - state type",
        "result": {
          "name": "string - result name (SUCCESSFUL, FAILED, STOPPED, EXPIRED)",
          "type": "string - result type"
        }
      },
      "image": {
        "name": "string - image name",
        "username": "string - image username",
        "password": "string - image password"
      },
      "script": [
        {
          "type": "string - script type",
          "name": "string - script name",
          "command": "string - script command"
        }
      ],
      "max_time": "integer - maximum time in seconds",
      "build_time_seconds": "integer - build time in seconds",
      "created_on": "string - creation date (ISO 8601)",
      "started_on": "string - start date (ISO 8601)",
      "completed_on": "string - completion date (ISO 8601)",
      "links": {
        "self": {"href": "string - self link"},
        "log": {"href": "string - log link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

### SSH Keys

#### List User SSH Keys
**Endpoint**: `GET /2.0/users/{username}/ssh-keys`

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
      "uuid": "string - SSH key UUID",
      "key": "string - SSH public key",
      "label": "string - SSH key label",
      "created_on": "string - creation date (ISO 8601)",
      "last_used": "string - last used date (ISO 8601)",
      "links": {
        "self": {"href": "string - self link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create SSH Key
**Endpoint**: `POST /2.0/users/{username}/ssh-keys`

**Input Schema**:
```json
{
  "username": "string (required) - username in URL path",
  "key": "string (required) - SSH public key",
  "label": "string (required) - SSH key label"
}
```

**Output Schema**: Same as List User SSH Keys output (single SSH key object)

#### Get SSH Key
**Endpoint**: `GET /2.0/users/{username}/ssh-keys/{key_id}`

**Input Schema**:
```json
{
  "username": "string (required) - username in URL path",
  "key_id": "string (required) - SSH key ID in URL path"
}
```

**Output Schema**: Same as List User SSH Keys output (single SSH key object)

#### Delete SSH Key
**Endpoint**: `DELETE /2.0/users/{username}/ssh-keys/{key_id}`

**Input Schema**:
```json
{
  "username": "string (required) - username in URL path",
  "key_id": "string (required) - SSH key ID in URL path"
}
```

**Output Schema**: No content (204 status)

### Snippets

#### List Workspace Snippets
**Endpoint**: `GET /2.0/snippets/{workspace}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "role": "string (optional) - filter by role (owner, admin, contributor, member)",
  "q": "string (optional) - query string for filtering",
  "sort": "string (optional) - sort by field (created_on, updated_on, name)",
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
      "id": "integer - snippet ID",
      "title": "string - snippet title",
      "scm": "string - source control management (git, hg)",
      "created_on": "string - creation date (ISO 8601)",
      "updated_on": "string - last update date (ISO 8601)",
      "owner": {
        "display_name": "string - owner display name",
        "uuid": "string - owner UUID",
        "links": {
          "self": {"href": "string - owner self link"},
          "html": {"href": "string - owner HTML link"},
          "avatar": {"href": "string - owner avatar link"}
        },
        "type": "string - owner type",
        "nickname": "string - owner nickname",
        "account_id": "string - owner account ID"
      },
      "creator": {
        "display_name": "string - creator display name",
        "uuid": "string - creator UUID",
        "links": {
          "self": {"href": "string - creator self link"},
          "html": {"href": "string - creator HTML link"},
          "avatar": {"href": "string - creator avatar link"}
        },
        "type": "string - creator type",
        "nickname": "string - creator nickname",
        "account_id": "string - creator account ID"
      },
      "is_private": "boolean - whether snippet is private",
      "links": {
        "self": {"href": "string - self link"},
        "html": {"href": "string - HTML link"},
        "commits": {"href": "string - commits link"},
        "patch": {"href": "string - patch link"},
        "diff": {"href": "string - diff link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Snippet
**Endpoint**: `POST /2.0/snippets/{workspace}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "title": "string (required) - snippet title",
  "scm": "string (required) - source control management (git, hg)",
  "is_private": "boolean (optional) - whether snippet is private",
  "files": {
    "filename": {
      "content": "string (required) - file content"
    }
  }
}
```

**Output Schema**: Same as List Workspace Snippets output (single snippet object)

#### Get Snippet
**Endpoint**: `GET /2.0/snippets/{workspace}/{encoded_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "encoded_id": "string (required) - encoded snippet ID in URL path"
}
```

**Output Schema**: Same as List Workspace Snippets output (single snippet object)

#### Update Snippet
**Endpoint**: `PUT /2.0/snippets/{workspace}/{encoded_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "encoded_id": "string (required) - encoded snippet ID in URL path",
  "title": "string (optional) - new snippet title",
  "is_private": "boolean (optional) - new privacy setting",
  "files": {
    "filename": {
      "content": "string (optional) - new file content"
    }
  }
}
```

**Output Schema**: Same as List Workspace Snippets output (single snippet object)

#### Delete Snippet
**Endpoint**: `DELETE /2.0/snippets/{workspace}/{encoded_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "encoded_id": "string (required) - encoded snippet ID in URL path"
}
```

**Output Schema**: No content (204 status)

#### List Snippet Commits
**Endpoint**: `GET /2.0/snippets/{workspace}/{encoded_id}/commits`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "encoded_id": "string (required) - encoded snippet ID in URL path",
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
      "hash": "string - commit hash",
      "date": "string - commit date (ISO 8601)",
      "message": "string - commit message",
      "type": "string - commit type",
      "author": {
        "raw": "string - author raw string",
        "type": "string - author type",
        "user": {
          "display_name": "string - author display name",
          "uuid": "string - author UUID",
          "links": {
            "self": {"href": "string - author self link"},
            "html": {"href": "string - author HTML link"},
            "avatar": {"href": "string - author avatar link"}
          },
          "type": "string - author type",
          "nickname": "string - author nickname",
          "account_id": "string - author account ID"
        }
      },
      "links": {
        "self": {"href": "string - self link"},
        "html": {"href": "string - HTML link"},
        "diff": {"href": "string - diff link"},
        "patch": {"href": "string - patch link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Get Snippet Commit
**Endpoint**: `GET /2.0/snippets/{workspace}/{encoded_id}/commits/{revision}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "encoded_id": "string (required) - encoded snippet ID in URL path",
  "revision": "string (required) - commit revision in URL path"
}
```

**Output Schema**: Same as List Snippet Commits output (single commit object)

---

## Summary

This document provides detailed input/output specifications for additional Bitbucket Cloud modules:

### Bitbucket Cloud Additional Modules (Continued)
- **Issue Tracker**: 7 endpoints
- **Pipelines**: 5 endpoints
- **SSH Keys**: 4 endpoints
- **Snippets**: 7 endpoints

**Total: 23 additional endpoints** with complete input/output schemas for Bitbucket Cloud.
