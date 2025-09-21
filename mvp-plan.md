# MVP to Full Product Plan

**Project**: bitbucket-mcp-server
**Description**: A Model Context Protocol (MCP) server that provides tools for interacting with Bitbucket repositories, including repository management, code browsing, issue tracking, and pull request operations.

**Project Type**: Greenfield
**Analysis Date**: 2025-09-21

## Constitutional Requirements
- Test-First Development (NON-NEGOTIABLE) - Must implement Jest test framework first
- MCP Protocol First - Use official @modelcontextprotocol/sdk
- Multi-Transport Support - stdio, HTTP, SSE protocols
- Complete API Coverage - All Bitbucket Data Center (7.16+) and Cloud APIs
- Selective Tool Registration - Based on server capabilities

## MVP Features (Priority 1) - Core MCP Server
- [x] **MCP Server Infrastructure** - TypeScript + MCP SDK setup, basic server structure
- [x] **Test Framework Setup** - Jest test infrastructure (constitutional requirement)
- [x] **Authentication System** - OAuth 2.0, App Passwords, API Tokens, Basic Auth
- [ ] **Repository Management Tools** - Core operations (list, create, get info, clone)
- [ ] **Code Browsing Tools** - Browse files, directories, get file content, commits
- [ ] **Issue Tracking Tools** - List, create, update, comment on issues
- [ ] **Pull Request Tools** - List, create, update, merge, comment on PRs

## Full Product Features (Priority 2) - Enhanced Functionality
- [ ] **Server Detection** - Auto-detect Data Center vs Cloud and version capabilities
- [ ] **Selective Tool Registration** - Load tools based on server type and version
- [ ] **Multi-Transport Support** - stdio, HTTP, SSE protocol implementations
- [ ] **Advanced Repository Operations** - Webhooks, branch restrictions, deployments
- [ ] **Pipeline Management** - CI/CD pipeline operations and monitoring
- [ ] **Console Client** - CLI interface for all MCP tools

## Full Product Features (Priority 3) - Advanced Features
- [ ] **Security Tools** - GPG keys, SSH keys, security scanning, permissions
- [ ] **Advanced Analytics** - Repository insights, dashboard data, usage metrics
- [ ] **Admin Tools** - System administration, user management, workspace config
- [ ] **Search Tools** - Advanced search across repositories and content

## Dependencies & Execution Order
```
1. MCP Server Infrastructure (foundation)
   ↓
2. Test Framework Setup (constitutional requirement)
   ↓
3. Authentication System (required for all API calls)
   ↓
4. Repository Management Tools ← Code Browsing Tools [P]
   ↓                           ↓
5. Issue Tracking Tools ← Pull Request Tools [P]
   ↓
6. Server Detection ← Selective Tool Registration [P]
   ↓
7. Multi-Transport Support ← Advanced Repository Operations [P]
   ↓
8. Pipeline Management ← Console Client [P]
   ↓
9. Security Tools ← Advanced Analytics ← Admin Tools [P]
   ↓
10. Search Tools (final enhancement)
```

**Legend**: [P] = Can be developed in parallel

## Execution Plan
1. ✅ Project analysis completed - Greenfield project identified
2. ✅ Feature identification and prioritization completed
3. ✅ Dependency graph created
4. ✅ MCP Server Infrastructure - Complete planning (specify → plan → tasks)
5. ✅ Authentication System - Complete planning (specify → plan → tasks)  
6. 🔄 Execute workflow for remaining features in dependency order:
   - Repository Management Tools (next priority)
   - Pull Request Tools 
   - Advanced features as needed
   - Run `/plan` command for implementation plan
   - Run `/tasks` command for task breakdown
   - Create feature branches as needed

## Constitutional Compliance Status
- ✅ **Test-First Development**: Planned with Jest infrastructure in 001-mcp-server-infrastructure
- ✅ **MCP Protocol Implementation**: Foundation planned with official SDK
- ✅ **Authentication Methods**: Comprehensive auth system planned
- ❌ **Multi-Transport Support**: Planned for future implementation
- ❌ **Complete API Coverage**: Incremental implementation planned
- ❌ **Selective Tool Registration**: Enhancement feature planned

## Next Steps
**MVP Foundation Complete**: MCP Infrastructure and Authentication planning finished.
**Ready for Implementation**: Both foundation specs have complete planning artifacts.
**Next Feature**: Repository Management Tools (depends on auth system).

## Completed Specs
- **001-mcp-server-infrastructure**: Complete planning with 15 tasks
- **003-authentication-system**: Complete planning with 25 tasks
- **Branch Status**: Both specs committed to feature branches
- **Implementation Ready**: All constitutional requirements addressed