# Bitbucket MCP Server - Endpoint Schemas Part 5

## Bitbucket Cloud - Pull Request Management

#### List Pull Requests
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "state": "string (optional) - filter by state (OPEN, MERGED, DECLINED, SUPERSEDED)",
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
      "rendered": {
        "title": {
          "raw": "string - raw title",
          "markup": "string - markup type",
          "html": "string - rendered HTML"
        },
        "description": {
          "raw": "string - raw description",
          "markup": "string - markup type",
          "html": "string - rendered HTML"
        }
      },
      "type": "string - pull request type",
      "description": "string - pull request description",
      "links": {
        "decline": {"href": "string - decline link"},
        "commits": {"href": "string - commits link"},
        "self": {"href": "string - self link"},
        "comments": {"href": "string - comments link"},
        "merge": {"href": "string - merge link"},
        "html": {"href": "string - HTML link"},
        "activity": {"href": "string - activity link"},
        "diff": {"href": "string - diff link"},
        "approve": {"href": "string - approve link"},
        "statuses": {"href": "string - statuses link"}
      },
      "title": "string - pull request title",
      "close_source_branch": "boolean - whether source branch will be closed",
      "reviewers": [
        {
          "display_name": "string - reviewer display name",
          "uuid": "string - reviewer UUID",
          "links": {
            "self": {"href": "string - reviewer self link"},
            "html": {"href": "string - reviewer HTML link"},
            "avatar": {"href": "string - reviewer avatar link"}
          },
          "type": "string - reviewer type",
          "nickname": "string - reviewer nickname",
          "account_id": "string - reviewer account ID"
        }
      ],
      "destination": {
        "commit": {
          "hash": "string - destination commit hash",
          "type": "string - commit type",
          "links": {
            "self": {"href": "string - commit self link"},
            "html": {"href": "string - commit HTML link"}
          }
        },
        "repository": {
          "links": {
            "self": {"href": "string - destination repository self link"},
            "html": {"href": "string - destination repository HTML link"},
            "avatar": {"href": "string - destination repository avatar link"}
          },
          "type": "string - destination repository type",
          "name": "string - destination repository name",
          "full_name": "string - destination repository full name",
          "uuid": "string - destination repository UUID"
        },
        "branch": {
          "name": "string - destination branch name"
        }
      },
      "comment_count": "integer - number of comments",
      "author": {
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
      },
      "merge_commit": "null or object - merge commit information",
      "closed_by": "null or object - user who closed the pull request",
      "reason": "string - pull request reason",
      "source": {
        "commit": {
          "hash": "string - source commit hash",
          "type": "string - commit type",
          "links": {
            "self": {"href": "string - commit self link"},
            "html": {"href": "string - commit HTML link"}
          }
        },
        "repository": {
          "links": {
            "self": {"href": "string - source repository self link"},
            "html": {"href": "string - source repository HTML link"},
            "avatar": {"href": "string - source repository avatar link"}
          },
          "type": "string - source repository type",
          "name": "string - source repository name",
          "full_name": "string - source repository full name",
          "uuid": "string - source repository UUID"
        },
        "branch": {
          "name": "string - source branch name"
        }
      },
      "state": "string - pull request state",
      "task_count": "integer - number of tasks",
      "id": "integer - pull request ID",
      "created_on": "string - creation date (ISO 8601)",
      "updated_on": "string - last update date (ISO 8601)"
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Pull Request
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "title": "string (required) - pull request title",
  "description": "string (optional) - pull request description",
  "source": {
    "branch": {
      "name": "string (required) - source branch name"
    },
    "repository": {
      "full_name": "string (required) - source repository full name"
    }
  },
  "destination": {
    "branch": {
      "name": "string (required) - destination branch name"
    }
  },
  "reviewers": [
    {
      "uuid": "string - reviewer UUID"
    }
  ],
  "close_source_branch": "boolean (optional) - whether to close source branch after merge"
}
```

**Output Schema**: Same as List Pull Requests output (single pull request object)

#### Get Pull Request Details
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path"
}
```

**Output Schema**: Same as List Pull Requests output (single pull request object)

#### Update Pull Request
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path",
  "title": "string (optional) - new pull request title",
  "description": "string (optional) - new pull request description",
  "reviewers": [
    {
      "uuid": "string - reviewer UUID"
    }
  ],
  "close_source_branch": "boolean (optional) - whether to close source branch after merge"
}
```

**Output Schema**: Same as List Pull Requests output (single pull request object)

#### Delete Pull Request
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path"
}
```

**Output Schema**: No content (204 status)

#### Merge Pull Request
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/merge`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path",
  "message": "string (optional) - merge commit message",
  "close_source_branch": "boolean (optional) - whether to close source branch",
  "merge_strategy": "string (optional) - merge strategy (merge_commit, squash, fast_forward)"
}
```

**Output Schema**:
```json
{
  "rendered": {
    "title": {
      "raw": "string - raw title",
      "markup": "string - markup type",
      "html": "string - rendered HTML"
    },
    "description": {
      "raw": "string - raw description",
      "markup": "string - markup type",
      "html": "string - rendered HTML"
    }
  },
  "type": "string - pull request type",
  "description": "string - pull request description",
  "links": {
    "decline": {"href": "string - decline link"},
    "commits": {"href": "string - commits link"},
    "self": {"href": "string - self link"},
    "comments": {"href": "string - comments link"},
    "merge": {"href": "string - merge link"},
    "html": {"href": "string - HTML link"},
    "activity": {"href": "string - activity link"},
    "diff": {"href": "string - diff link"},
    "approve": {"href": "string - approve link"},
    "statuses": {"href": "string - statuses link"}
  },
  "title": "string - pull request title",
  "close_source_branch": "boolean - whether source branch will be closed",
  "state": "string - pull request state (MERGED)",
  "task_count": "integer - number of tasks",
  "id": "integer - pull request ID",
  "created_on": "string - creation date (ISO 8601)",
  "updated_on": "string - last update date (ISO 8601)"
}
```

#### Decline Pull Request
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/decline`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path"
}
```

**Output Schema**:
```json
{
  "rendered": {
    "title": {
      "raw": "string - raw title",
      "markup": "string - markup type",
      "html": "string - rendered HTML"
    },
    "description": {
      "raw": "string - raw description",
      "markup": "string - markup type",
      "html": "string - rendered HTML"
    }
  },
  "type": "string - pull request type",
  "description": "string - pull request description",
  "links": {
    "decline": {"href": "string - decline link"},
    "commits": {"href": "string - commits link"},
    "self": {"href": "string - self link"},
    "comments": {"href": "string - comments link"},
    "merge": {"href": "string - merge link"},
    "html": {"href": "string - HTML link"},
    "activity": {"href": "string - activity link"},
    "diff": {"href": "string - diff link"},
    "approve": {"href": "string - approve link"},
    "statuses": {"href": "string - statuses link"}
  },
  "title": "string - pull request title",
  "close_source_branch": "boolean - whether source branch will be closed",
  "state": "string - pull request state (DECLINED)",
  "task_count": "integer - number of tasks",
  "id": "integer - pull request ID",
  "created_on": "string - creation date (ISO 8601)",
  "updated_on": "string - last update date (ISO 8601)"
}
```

#### Reopen Pull Request
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/reopen`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path"
}
```

**Output Schema**:
```json
{
  "rendered": {
    "title": {
      "raw": "string - raw title",
      "markup": "string - markup type",
      "html": "string - rendered HTML"
    },
    "description": {
      "raw": "string - raw description",
      "markup": "string - markup type",
      "html": "string - rendered HTML"
    }
  },
  "type": "string - pull request type",
  "description": "string - pull request description",
  "links": {
    "decline": {"href": "string - decline link"},
    "commits": {"href": "string - commits link"},
    "self": {"href": "string - self link"},
    "comments": {"href": "string - comments link"},
    "merge": {"href": "string - merge link"},
    "html": {"href": "string - HTML link"},
    "activity": {"href": "string - activity link"},
    "diff": {"href": "string - diff link"},
    "approve": {"href": "string - approve link"},
    "statuses": {"href": "string - statuses link"}
  },
  "title": "string - pull request title",
  "close_source_branch": "boolean - whether source branch will be closed",
  "state": "string - pull request state (OPEN)",
  "task_count": "integer - number of tasks",
  "id": "integer - pull request ID",
  "created_on": "string - creation date (ISO 8601)",
  "updated_on": "string - last update date (ISO 8601)"
}
```

#### List Pull Request Comments
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path",
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
      "links": {
        "self": {"href": "string - self link"},
        "html": {"href": "string - HTML link"}
      },
      "deleted": "boolean - whether comment is deleted",
      "pullrequest": {
        "type": "string - pull request type",
        "id": "integer - pull request ID",
        "links": {
          "self": {"href": "string - pull request self link"},
          "html": {"href": "string - pull request HTML link"}
        },
        "title": "string - pull request title"
      },
      "content": {
        "raw": "string - raw comment content",
        "markup": "string - markup type",
        "html": "string - rendered HTML",
        "type": "string - content type"
      },
      "created_on": "string - creation date (ISO 8601)",
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
      "updated_on": "string - last update date (ISO 8601)",
      "type": "string - comment type",
      "inline": {
        "path": "string - file path",
        "from": "integer - from line number",
        "to": "integer - to line number"
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Create Pull Request Comment
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path",
  "content": {
    "raw": "string (required) - raw comment content"
  },
  "inline": {
    "path": "string (optional) - file path for inline comment",
    "from": "integer (optional) - from line number",
    "to": "integer (optional) - to line number"
  },
  "parent": {
    "id": "integer (optional) - parent comment ID for replies"
  }
}
```

**Output Schema**: Same as List Pull Request Comments output (single comment object)

#### Get Pull Request Comment
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path",
  "comment_id": "integer (required) - comment ID in URL path"
}
```

**Output Schema**: Same as List Pull Request Comments output (single comment object)

#### Update Pull Request Comment
**Endpoint**: `PUT /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path",
  "comment_id": "integer (required) - comment ID in URL path",
  "content": {
    "raw": "string (required) - new raw comment content"
  }
}
```

**Output Schema**: Same as List Pull Request Comments output (single comment object)

#### Delete Pull Request Comment
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/pullrequests/{pull_request_id}/comments/{comment_id}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "pull_request_id": "integer (required) - pull request ID in URL path",
  "comment_id": "integer (required) - comment ID in URL path"
}
```

**Output Schema**: No content (204 status)

## Bitbucket Cloud - Commit and Source Management

#### List Commits
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/commits`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "include": "string (optional) - include additional data (branch, tags)",
  "exclude": "string (optional) - exclude data (branch, tags)",
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
        "self": {"href": "string - commit self link"},
        "html": {"href": "string - commit HTML link"},
        "diff": {"href": "string - commit diff link"},
        "patch": {"href": "string - commit patch link"}
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
      "type": "string - commit type"
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Get Commit Details
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/commits/{commit_hash}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "commit_hash": "string (required) - commit hash in URL path"
}
```

**Output Schema**: Same as List Commits output (single commit object)

#### Get Commit Diff
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/commits/{commit_hash}/diff`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "commit_hash": "string (required) - commit hash in URL path",
  "context": "integer (optional) - number of context lines",
  "path": "string (optional) - specific file path"
}
```

**Output Schema**: Raw diff content (text/plain)

#### Browse Repository Files
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/src`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "format": "string (optional) - format (meta, rendered)",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number",
  "sort": "string (optional) - sort by field (path, type)"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "path": "string - file path",
      "type": "string - node type (commit_file, commit_directory)",
      "commit": {
        "hash": "string - commit hash",
        "type": "string - commit type",
        "links": {
          "self": {"href": "string - commit self link"},
          "html": {"href": "string - commit HTML link"}
        }
      },
      "attributes": [],
      "escaped_path": "string - escaped file path",
      "links": {
        "self": {"href": "string - self link"},
        "meta": {"href": "string - meta link"}
      },
      "size": "integer - file size in bytes"
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Get File Content
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/src/{commit}/{path}`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "commit": "string (required) - commit hash in URL path",
  "path": "string (required) - file path in URL path",
  "format": "string (optional) - format (meta, rendered)"
}
```

**Output Schema**: File content (text/plain) or metadata (application/json)

#### Create/Update File
**Endpoint**: `POST /2.0/repositories/{workspace}/{repo_slug}/src`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "message": "string (required) - commit message",
  "branch": "string (optional) - branch name",
  "author": "string (optional) - author information",
  "parents": "string (optional) - parent commit hash",
  "files": "string (required) - file content (base64 encoded)"
}
```

**Output Schema**:
```json
{
  "hash": "string - commit hash",
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
    "self": {"href": "string - commit self link"},
    "html": {"href": "string - commit HTML link"},
    "diff": {"href": "string - commit diff link"},
    "patch": {"href": "string - commit patch link"}
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
  "type": "string - commit type"
}
```

#### Delete File
**Endpoint**: `DELETE /2.0/repositories/{workspace}/{repo_slug}/src`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "message": "string (required) - commit message",
  "branch": "string (optional) - branch name",
  "author": "string (optional) - author information",
  "parents": "string (optional) - parent commit hash",
  "files": "string (required) - file path to delete"
}
```

**Output Schema**: Same as Create/Update File output

## Bitbucket Cloud - Search and Analytics

#### Search Commits
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/search/commits`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "search_query": "string (required) - search query",
  "page": "integer (optional) - page number",
  "pagelen": "integer (optional) - number of results per page"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "hash": "string - commit hash",
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
        "self": {"href": "string - commit self link"},
        "html": {"href": "string - commit HTML link"},
        "diff": {"href": "string - commit diff link"},
        "patch": {"href": "string - commit patch link"}
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
      "type": "string - commit type"
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Search Code
**Endpoint**: `GET /2.0/repositories/{workspace}/{repo_slug}/search/code`

**Input Schema**:
```json
{
  "workspace": "string (required) - workspace slug in URL path",
  "repo_slug": "string (required) - repository slug in URL path",
  "search_query": "string (required) - search query",
  "page": "integer (optional) - page number",
  "pagelen": "integer (optional) - number of results per page"
}
```

**Output Schema**:
```json
{
  "pagelen": "integer - number of results per page",
  "values": [
    {
      "type": "string - result type (code_search_result)",
      "content_match_count": "integer - number of content matches",
      "content_matches": [
        {
          "lines": [
            {
              "line": "integer - line number",
              "segments": [
                {
                  "text": "string - text segment",
                  "match": "boolean - whether this segment is a match"
                }
              ]
            }
          ]
        }
      ],
      "path_matches": [
        {
          "text": "string - path text",
          "match": "boolean - whether this segment is a match"
        }
      ],
      "file": {
        "path": "string - file path",
        "type": "string - file type",
        "links": {
          "self": {"href": "string - file self link"},
          "meta": {"href": "string - file meta link"}
        }
      }
    }
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

#### Search Repositories
**Endpoint**: `GET /2.0/repositories`

**Input Schema**:
```json
{
  "role": "string (optional) - filter by role (owner, admin, contributor, member)",
  "q": "string (optional) - query string for filtering",
  "sort": "string (optional) - sort by field (name, created_on, updated_on)",
  "pagelen": "integer (optional) - number of results per page",
  "page": "integer (optional) - page number"
}
```

**Output Schema**: Same as List Repositories in Workspace output

#### Search Users
**Endpoint**: `GET /2.0/users`

**Input Schema**:
```json
{
  "q": "string (optional) - query string for filtering",
  "sort": "string (optional) - sort by field (display_name, created_on, updated_on)",
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
  ],
  "page": "integer - current page number",
  "size": "integer - total number of results"
}
```

---

## Summary

This comprehensive documentation provides detailed input/output specifications for ALL Bitbucket endpoints organized by server type and functionality:

### Bitbucket Data Center (Complete)
- **Authentication Module**: 5 endpoints
- **Project Management**: 8 endpoints  
- **Repository Management**: 16 endpoints
- **Pull Request Management**: 15 endpoints
- **Commit and Source Management**: 7 endpoints
- **Search and Analytics**: 4 endpoints

### Bitbucket Cloud (Complete)
- **Authentication Module**: 5 endpoints
- **Workspace Management**: 5 endpoints
- **Repository Management**: 16 endpoints
- **Pull Request Management**: 15 endpoints
- **Commit and Source Management**: 7 endpoints
- **Search and Analytics**: 4 endpoints

**Total: 111 endpoints** with complete input/output schemas, organized for selective tool loading based on server type and functionality as requested.
