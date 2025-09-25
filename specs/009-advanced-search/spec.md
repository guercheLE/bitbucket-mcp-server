# Feature 009: Advanced Search

## Overview
Comprehensive search functionality for the Bitbucket MCP server, providing advanced search capabilities across repositories, code, commits, issues, pull requests, and users. This feature implements powerful search tools with filtering, sorting, and pagination to enable efficient discovery and exploration of Bitbucket content.

## Objectives
- Implement advanced repository search with filtering and sorting
- Enable code search with syntax highlighting and context
- Provide commit search with author, date, and message filters
- Support issue and pull request search with status and metadata filters
- Add user and team search capabilities
- Implement search result pagination and optimization
- Ensure search performance and responsiveness

## Requirements

### Functional Requirements

#### 1. Repository Search
- **Advanced Repository Search**: Search repositories by name, description, language, topics
- **Repository Filters**: Filter by visibility, size, creation date, last updated
- **Repository Sorting**: Sort by name, stars, forks, last updated, creation date
- **Repository Metadata**: Include owner, language, size, description in results

#### 2. Code Search
- **Code Content Search**: Search within file contents across repositories
- **File Name Search**: Search for files by name and extension
- **Language Filtering**: Filter code search by programming language
- **Path Filtering**: Search within specific directories or file paths
- **Syntax Context**: Provide syntax-highlighted code snippets in results
- **Line Number References**: Include line numbers and context for matches

#### 3. Commit Search
- **Commit Message Search**: Search commits by message content
- **Author Search**: Find commits by specific authors
- **Date Range Search**: Filter commits by date ranges
- **Branch Filtering**: Search commits within specific branches
- **File Change Search**: Find commits that modified specific files
- **Commit Metadata**: Include hash, author, date, and changed files

#### 4. Issue Search
- **Issue Content Search**: Search issues by title and description
- **Status Filtering**: Filter by open, closed, or specific states
- **Assignee Filtering**: Find issues assigned to specific users
- **Label Filtering**: Search issues by labels and tags
- **Date Range Search**: Filter issues by creation or update dates
- **Priority Filtering**: Search by issue priority levels

#### 5. Pull Request Search
- **PR Content Search**: Search pull requests by title and description
- **Status Filtering**: Filter by open, merged, declined states
- **Author/Reviewer Search**: Find PRs by author or reviewer
- **Branch Search**: Find PRs affecting specific branches
- **Review Status**: Filter by approval status and review states
- **Date Range Search**: Filter PRs by creation, update, or merge dates

#### 6. User and Team Search
- **User Search**: Search for users by username, display name, or email
- **Team Search**: Find teams and their members
- **Permission Context**: Show user permissions and repository access
- **Activity Search**: Find users by their recent activity

#### 7. Global Search
- **Cross-Content Search**: Search across all content types simultaneously
- **Search Suggestions**: Provide search query suggestions and autocomplete
- **Search History**: Track and provide access to recent searches
- **Saved Searches**: Allow users to save and reuse complex search queries

### Non-Functional Requirements

#### Performance
- Search response time under 2 seconds for most queries
- Efficient pagination for large result sets
- Optimized indexing for frequently searched content
- Progressive loading for complex searches

#### Usability
- Intuitive search syntax with natural language support
- Clear search result formatting and organization
- Comprehensive filtering and sorting options
- Search result previews and context

#### Scalability
- Handle large repositories and extensive codebases
- Support concurrent search operations
- Efficient memory usage during search operations
- Pagination support for unlimited result sets

## Technical Specifications

### MCP Tools

#### 1. Advanced Repository Search Tool
```typescript
search_repositories_advanced(
  query: string,
  workspace?: string,
  language?: string,
  visibility?: 'public' | 'private',
  sort?: 'name' | 'updated' | 'created' | 'size',
  order?: 'asc' | 'desc',
  limit?: number,
  offset?: number
)
```

#### 2. Code Search Tool
```typescript
search_code(
  query: string,
  workspace?: string,
  repository?: string,
  language?: string,
  path?: string,
  filename?: string,
  extension?: string,
  limit?: number,
  offset?: number
)
```

#### 3. Commit Search Tool
```typescript
search_commits(
  query: string,
  workspace?: string,
  repository?: string,
  author?: string,
  since?: string,
  until?: string,
  branch?: string,
  path?: string,
  limit?: number,
  offset?: number
)
```

#### 4. Issue Search Tool
```typescript
search_issues(
  query: string,
  workspace?: string,
  repository?: string,
  state?: 'new' | 'open' | 'resolved' | 'closed',
  assignee?: string,
  reporter?: string,
  priority?: string,
  created_after?: string,
  created_before?: string,
  updated_after?: string,
  updated_before?: string,
  limit?: number,
  offset?: number
)
```

#### 5. Pull Request Search Tool
```typescript
search_pull_requests(
  query: string,
  workspace?: string,
  repository?: string,
  state?: 'open' | 'merged' | 'declined',
  author?: string,
  reviewer?: string,
  source_branch?: string,
  destination_branch?: string,
  created_after?: string,
  created_before?: string,
  updated_after?: string,
  updated_before?: string,
  limit?: number,
  offset?: number
)
```

#### 6. User Search Tool
```typescript
search_users(
  query: string,
  workspace?: string,
  role?: string,
  active?: boolean,
  limit?: number,
  offset?: number
)
```

#### 7. Global Search Tool
```typescript
search_global(
  query: string,
  workspace?: string,
  types?: ('repositories' | 'code' | 'commits' | 'issues' | 'pull_requests' | 'users')[],
  limit?: number,
  offset?: number
)
```

### API Integration

#### Bitbucket Cloud API Endpoints
- `/2.0/repositories?q={query}` - Repository search
- `/2.0/repositories/{workspace}/{repo_slug}/src/search` - Code search
- `/2.0/repositories/{workspace}/{repo_slug}/commits?q={query}` - Commit search
- `/2.0/repositories/{workspace}/{repo_slug}/issues?q={query}` - Issue search
- `/2.0/repositories/{workspace}/{repo_slug}/pullrequests?q={query}` - PR search
- `/2.0/workspaces/{workspace}/members?q={query}` - User search

#### Bitbucket Data Center API Endpoints
- `/rest/api/1.0/repos?q={query}` - Repository search
- `/rest/api/1.0/projects/{project}/repos/{repository}/browse?search={query}` - Code search
- `/rest/api/1.0/projects/{project}/repos/{repository}/commits?q={query}` - Commit search

### Data Models

#### Search Result Types
```typescript
interface SearchResult<T> {
  query: string;
  total_count: number;
  page: number;
  page_length: number;
  has_more: boolean;
  results: T[];
  facets?: SearchFacets;
  suggestions?: string[];
}

interface SearchFacets {
  languages?: { [key: string]: number };
  repositories?: { [key: string]: number };
  authors?: { [key: string]: number };
  date_ranges?: { [key: string]: number };
}

interface CodeSearchResult {
  repository: RepositoryInfo;
  path: string;
  filename: string;
  language: string;
  matches: CodeMatch[];
  url: string;
}

interface CodeMatch {
  line_number: number;
  line_content: string;
  match_start: number;
  match_end: number;
  context_before?: string[];
  context_after?: string[];
}
```

## Implementation Details

### Architecture
- **Search Service Layer**: Centralized search logic and API coordination
- **Result Processing**: Formatting and enrichment of search results
- **Caching Layer**: Performance optimization for frequent searches
- **Filter Engine**: Advanced filtering and sorting capabilities

### Key Components
1. **Search Manager**: Orchestrates different search operations
2. **Query Parser**: Processes and optimizes search queries
3. **Result Formatter**: Standardizes search result presentation
4. **Cache Service**: Manages search result caching
5. **Pagination Handler**: Manages large result set pagination

### Search Optimization
- **Query Optimization**: Intelligent query processing and enhancement
- **Result Caching**: Cache frequently accessed search results
- **Faceted Search**: Provide search facets for better filtering
- **Search Analytics**: Track search patterns for optimization

## Testing Strategy

### Unit Tests
- Search query parsing and validation
- API request construction and response handling
- Result formatting and pagination logic
- Caching behavior and invalidation

### Integration Tests
- End-to-end search workflows across different content types
- API integration with Bitbucket Cloud and Data Center
- Search result accuracy and completeness
- Performance testing with large datasets

### Performance Tests
- Search response time benchmarks
- Concurrent search operation handling
- Memory usage during complex searches
- Pagination performance with large result sets

## Dependencies
- **002-authentication-system**: Required for authenticated API access
- **003-repository-management**: Repository context and metadata

## Success Criteria
- [ ] All search tools implemented with comprehensive filtering
- [ ] Search results include relevant metadata and context
- [ ] Pagination works correctly for all search types
- [ ] Search performance meets response time requirements
- [ ] Integration tests pass for both Bitbucket platforms
- [ ] Documentation and examples provided for all search tools
- [ ] Error handling covers edge cases and API limitations

## Risk Mitigation
- **API Rate Limits**: Implement efficient caching and query optimization
- **Large Result Sets**: Use pagination and progressive loading
- **Complex Queries**: Provide query validation and optimization
- **Search Accuracy**: Include relevance scoring and result ranking