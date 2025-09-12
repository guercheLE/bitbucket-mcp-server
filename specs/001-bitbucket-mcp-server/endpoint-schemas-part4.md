# Bitbucket MCP Server - Endpoint Schemas Part 4

## Bitbucket Cloud - Workspace Management

#### List Workspaces
**Endpoint**: `GET /2.0/workspaces`

**Input Schema**:
```json
{
  "role": "string (optional) - filter by role (owner, member, collaborator)",
  "q": "string (optional) - query string for filtering",
  "sort": "string (optional) - sort by field (name, created_on, updated_on)"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "uuid": "string - workspace UUID",
      "name": "string - workspace name",
      "slug": "string - workspace slug",
      "is_private": "boolean - whether workspace is private",
      "created_on": "string - creation date (ISO 8601)",
      "updated_on": "string - last update date (ISO 8601)",
      "type": "string - workspace type",
      "links": {
        "self": {"href": "string - self link"},
        "html": {"href": "string - HTML link"},
        "avatar": {"href": "string - avatar link"}
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Get Workspace Details
**Endpoint**: `GET /2.0/workspaces/{workspace}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug or UUID in URL path"
}
```

**Output Schema**:
```json
{
  "uuid": "string - workspace UUID",
  "name": "string - workspace name",
  "slug": "string - workspace slug",
  "is_private": "boolean - whether workspace is private",
  "created_on": "string - creation date (ISO 8601)",
  "updated_on": "string - last update date (ISO 8601)",
  "type": "string - workspace type",
  "links": {
    "self": {"href": "string - self link"},
    "html": {"href": "string - HTML link"},
    "avatar": {"href": "string - avatar link"}
  }
}
```

#### Update Workspace
**Endpoint**: `PUT /2.0/workspaces/{workspace}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "name": "string (optional) - new workspace name",
  "is_private": "boolean (optional) - whether workspace is private"
}
```

**Output Schema**:
```json
{
  "uuid": "string - workspace UUID",
  "name": "string - workspace name",
  "slug": "string - workspace slug",
  "is_private": "boolean - whether workspace is private",
  "created_on": "string - creation date (ISO 8601)",
  "updated_on": "string - last update date (ISO 8601)",
  "type": "string - workspace type",
  "links": {
    "self": {"href": "string - self link"},
    "html": {"href": "string - HTML link"},
    "avatar": {"href": "string - avatar link"}
  }
}
```

#### Get Workspace Permissions
**Endpoint**: `GET /2.0/workspaces/{workspace}/permissions`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "q": "string (optional) - query string for filtering",
  "sort": "string (optional) - sort by field (permission, user.display_name)"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "permission": "string - permission level (read, write, admin)",
      "type": "string - permission type (user, group)",
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
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Update Member Permissions
**Endpoint**: `PUT /2.0/workspaces/{workspace}/permissions/{member}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "member": "string (required) - member UUID in URL path",
  "permission": "string (required) - permission level (read, write, admin)"
}
```

**Output Schema**:
```json
{
  "permission": "string - permission level",
  "type": "string - permission type",
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
  }
}
```

## Bitbucket Cloud - Repository Management

#### List Repositories in Workspace
**Endpoint**: `GET /2.0/repositories/{workspace}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "role": "string (optional) - filter by role (owner, admin, contributor, member)",
  "q": "string (optional) - query string for filtering",
  "sort": "string (optional) - sort by field (name, created_on, updated_on)",
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
      "scm": "string - SCM type",
      "website": "string - website URL",
      "has_wiki": "boolean - whether wiki is enabled",
      "uuid": "string - repository UUID",
      "links": {
        "watchers": {"href": "string - watchers link"},
        "branches": {"href": "string - branches link"},
        "tags": {"href": "string - tags link"},
        "commits": {"href": "string - commits link"},
        "clone": [
          {"href": "string - clone URL", "name": "string - clone method"}
        ],
        "self": {"href": "string - self link"},
        "source": {"href": "string - source link"},
        "html": {"href": "string - HTML link"},
        "avatar": {"href": "string - avatar link"},
        "hooks": {"href": "string - hooks link"},
        "forks": {"href": "string - forks link"},
        "downloads": {"href": "string - downloads link"},
        "issues": {"href": "string - issues link"},
        "pullrequests": {"href": "string - pull requests link"}
      },
      "fork_policy": "string - fork policy",
      "full_name": "string - full repository name",
      "name": "string - repository name",
      "project": {
        "links": {
          "self": {"href": "string - project self link"},
          "html": {"href": "string - project HTML link"},
          "avatar": {"href": "string - project avatar link"}
        },
        "type": "string - project type",
        "name": "string - project name",
        "key": "string - project key",
        "uuid": "string - project UUID"
      },
      "language": "string - primary language",
      "created_on": "string - creation date (ISO 8601)",
      "mainbranch": {
        "type": "string - branch type",
        "name": "string - branch name"
      },
      "workspace": {
        "slug": "string - workspace slug",
        "type": "string - workspace type",
        "name": "string - workspace name",
        "links": {
          "self": {"href": "string - workspace self link"},
          "html": {"href": "string - workspace HTML link"},
          "avatar": {"href": "string - workspace avatar link"}
        },
        "uuid": "string - workspace UUID"
      },
      "has_issues": "boolean - whether issues are enabled",
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
      "updated_on": "string - last update date (ISO 8601)",
      "size": "integer - repository size in bytes",
      "type": "string - repository type",
      "slug": "string - repository slug",
      "is_private": "boolean - whether repository is private",
      "description": "string - repository description"
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Repository
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "name": "string (optional) - repository name",
  "description": "string (optional) - repository description",
  "scm": "string (optional) - SCM type, defaults to 'git'",
  "is_private": "boolean (optional) - whether repository is private",
  "fork_policy": "string (optional) - fork policy",
  "language": "string (optional) - primary language",
  "has_issues": "boolean (optional) - whether issues are enabled",
  "has_wiki": "boolean (optional) - whether wiki is enabled"
}
```

**Output Schema**: Same as List Repositories output (single repository object)

#### Get Repository Details
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path"
}
```

**Output Schema**: Same as List Repositories output (single repository object)

#### Update Repository
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "name": "string (optional) - new repository name",
  "description": "string (optional) - new repository description",
  "is_private": "boolean (optional) - whether repository is private",
  "fork_policy": "string (optional) - fork policy",
  "language": "string (optional) - primary language",
  "has_issues": "boolean (optional) - whether issues are enabled",
  "has_wiki": "boolean (optional) - whether wiki is enabled"
}
```

**Output Schema**: Same as List Repositories output (single repository object)

#### Delete Repository
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path"
}
```

**Output Schema**: No content (204 status)

#### Get Repository Permissions
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/permissions`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "q": "string (optional) - query string for filtering",
  "sort": "string (optional) - sort by field (permission, user.display_name)"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "permission": "string - permission level (read, write, admin)",
      "type": "string - permission type (user, group)",
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
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Update Member Permissions
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/permissions/{member}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "member": "string (required) - member UUID in URL path",
  "permission": "string (required) - permission level (read, write, admin)"
}
```

**Output Schema**:
```json
{
  "permission": "string - permission level",
  "type": "string - permission type",
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
  }
}
```

#### List Branches
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/refs/branches`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number",
  "q": "string (optional) - query string for filtering"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "name": "string - branch name",
      "links": {
        "commits": {"href": "string - commits link"},
        "self": {"href": "string - self link"},
        "html": {"href": "string - HTML link"}
      },
      "default_merge_strategy": "string - default merge strategy",
      "merge_strategies": ["string - available merge strategies"],
      "type": "string - branch type",
      "target": {
        "hash": "string - target commit hash",
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
        "links": {
          "self": {"href": "string - target self link"},
          "html": {"href": "string - target HTML link"}
        },
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
        "parents": [
          {
            "hash": "string - parent commit hash",
            "type": "string - parent type",
            "links": {
              "self": {"href": "string - parent self link"},
              "html": "string - parent HTML link"
            }
          }
        ],
        "date": "string - commit date (ISO 8601)",
        "message": "string - commit message",
        "type": "string - target type"
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Branch
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/refs/branches`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "name": "string (required) - branch name",
  "target": {
    "hash": "string (required) - target commit hash"
  }
}
```

**Output Schema**: Same as List Branches output (single branch object)

#### Update Branch
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "name": "string (required) - branch name in URL path",
  "target": {
    "hash": "string (required) - new target commit hash"
  }
}
```

**Output Schema**: Same as List Branches output (single branch object)

#### Delete Branch
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/branches/{name}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "name": "string (required) - branch name in URL path"
}
```

**Output Schema**: No content (204 status)

#### List Tags
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/refs/tags`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number",
  "q": "string (optional) - query string for filtering"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "name": "string - tag name",
      "links": {
        "commits": {"href": "string - commits link"},
        "self": {"href": "string - self link"},
        "html": {"href": "string - HTML link"}
      },
      "tagger": {
        "raw": "string - tagger raw string",
        "type": "string - tagger type",
        "user": {
          "display_name": "string - tagger display name",
          "uuid": "string - tagger UUID",
          "links": {
            "self": {"href": "string - tagger self link"},
            "html": {"href": "string - tagger HTML link"},
            "avatar": {"href": "string - tagger avatar link"}
          },
          "type": "string - tagger type",
          "nickname": "string - tagger nickname",
          "account_id": "string - tagger account ID"
        }
      },
      "date": "string - tag date (ISO 8601)",
      "message": "string - tag message",
      "type": "string - tag type",
      "target": {
        "hash": "string - target commit hash",
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
        "links": {
          "self": {"href": "string - target self link"},
          "html": {"href": "string - target HTML link"}
        },
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
        "parents": [
          {
            "hash": "string - parent commit hash",
            "type": "string - parent type",
            "links": {
              "self": {"href": "string - parent self link"},
              "html": "string - parent HTML link"
            }
          }
        ],
        "date": "string - commit date (ISO 8601)",
        "message": "string - commit message",
        "type": "string - target type"
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Tag
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/refs/tags`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "name": "string (required) - tag name",
  "target": {
    "hash": "string (required) - target commit hash"
  },
  "message": "string (optional) - tag message"
}
```

**Output Schema**: Same as List Tags output (single tag object)

#### Delete Tag
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/refs/tags/{name}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "name": "string (required) - tag name in URL path"
}
```

**Output Schema**: No content (204 status)

---

*Note: This is Part 4 of the complete endpoint schemas. The file continues with Pull Request Management, Commit and Source Management, and Search and Analytics modules for Cloud.*
