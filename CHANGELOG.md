# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-19

### Added
- **Issues Management (Bitbucket Cloud)**: Complete implementation of Issues management functionality
  - 15 MCP tools for Issues CRUD operations, comments, transitions, relationships, and attachments
  - Issues service with comprehensive API integration
  - Issues validation service with business rules and state transition validation
  - Support for all Issue operations: create, read, update, delete, search, comment, transition
  - Attachment management for Issues
  - Relationship management between Issues
  - State transition validation and business rules enforcement

- **Internationalization (i18n) Support**: 20-language support for global accessibility
  - Support for 20 most spoken languages worldwide (Mandarin, Hindi, Spanish, English, Arabic, Bengali, Russian, Portuguese, French, Urdu, German, Japanese, Punjabi, Marathi, Telugu, Persian, Vietnamese, Tamil, Turkish, Korean)
  - i18next integration with file-based backend
  - CLI and server internationalization
  - Translation files for common, errors, validation, issues, auth, and CLI namespaces
  - Portuguese (pt-BR) as default language

- **Enhanced Security**: Security audit and vulnerability fixes
  - Updated axios to latest version (1.12.2) to fix DoS vulnerability
  - Comprehensive security audit with 0 vulnerabilities found
  - Enhanced authentication and authorization mechanisms

- **Comprehensive Documentation**: Updated documentation for new features
  - API reference documentation for all Issues tools
  - Architecture documentation with Issues feature details
  - Contributing guidelines with Issues development patterns
  - Mermaid diagrams for data flow and component architecture

### Enhanced
- **CLI Functionality**: Improved command-line interface
  - Health check command with server detection
  - Configuration management (init, validate)
  - Authentication management (OAuth, token)
  - Internationalized CLI messages and help text

- **Error Handling**: Robust error handling and retry logic
  - Comprehensive error handling for Issues operations
  - Automatic retry logic for transient failures
  - Detailed error logging and sanitization

- **Performance**: Optimized performance and caching
  - 5-minute TTL cache for Issues data
  - Rate limiting and circuit breaker patterns
  - Request/response logging with performance metrics

### Technical Details
- **MCP Tools**: 15 new MCP tools for Issues management
  - `mcp_bitbucket_issues_list`: List issues with filtering and pagination
  - `mcp_bitbucket_issues_create`: Create new issues
  - `mcp_bitbucket_issues_get`: Get issue details
  - `mcp_bitbucket_issues_update`: Update existing issues
  - `mcp_bitbucket_issues_delete`: Delete issues
  - `mcp_bitbucket_issues_search`: Search issues with advanced filters
  - `mcp_bitbucket_issues_list_comments`: List issue comments
  - `mcp_bitbucket_issues_create_comment`: Add comments to issues
  - `mcp_bitbucket_issues_update_comment`: Update issue comments
  - `mcp_bitbucket_issues_delete_comment`: Delete issue comments
  - `mcp_bitbucket_issues_list_transitions`: List available state transitions
  - `mcp_bitbucket_issues_transition`: Transition issue states
  - `mcp_bitbucket_issues_list_relationships`: List issue relationships
  - `mcp_bitbucket_issues_list_attachments`: List issue attachments
  - `mcp_bitbucket_issues_upload_attachment`: Upload attachments to issues

- **Cloud-Only Support**: Issues functionality is exclusively available for Bitbucket Cloud servers
- **Validation**: Comprehensive business rule validation for Issue operations
- **Type Safety**: Full TypeScript support with comprehensive type definitions

### Breaking Changes
- None in this release. All existing functionality remains compatible.

### Migration Guide
- No migration required. This is a feature addition release.

## [1.0.0] - 2024-12-18

### Added
- Initial release of Bitbucket MCP Server
- Comprehensive Bitbucket API integration
- Support for both Data Center and Cloud servers
- Pull Request management functionality
- Repository management
- Project management
- Authentication and authorization
- Search functionality
- Health checks and monitoring
- CLI interface
- Comprehensive documentation

### Technical Features
- 250+ API endpoints support
- MCP (Model Context Protocol) compliance
- Multiple transport support (stdio, HTTP, SSE)
- Rate limiting and circuit breakers
- Caching with Redis support
- Comprehensive logging
- Error handling and retry logic
- Security best practices
- Performance monitoring

---

## Version History

- **1.1.0**: Issues Management + Internationalization (Current)
- **1.0.0**: Initial Release

## Support

For support and questions:
- GitHub Issues: https://github.com/guercheLE/bitbucket-mcp-server/issues
- Documentation: See `docs/` directory
- Contributing: See `docs/contributing.md`

## License

This project is licensed under the LGPL-3.0 License - see the [LICENSE](LICENSE) file for details.
