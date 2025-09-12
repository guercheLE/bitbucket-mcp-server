# Bitbucket MCP Server - Complete Documentation

## Overview

This directory contains the complete specification and endpoint documentation for the Bitbucket MCP Server, which supports both Bitbucket Data Center and Cloud with selective tool loading based on server type and functionality.

## Files Structure

### Main Specification
- **`spec.md`** - Main feature specification with requirements, user scenarios, and endpoint organization

### Endpoint Schemas (Complete Documentation)
- **`endpoint-schemas.md`** - Part 1: Data Center Authentication, Project Management, and Repository Management
- **`endpoint-schemas-part2.md`** - Part 2: Data Center Pull Request Management
- **`endpoint-schemas-part3.md`** - Part 3: Data Center Commit/Source/Search + Cloud Authentication
- **`endpoint-schemas-part4.md`** - Part 4: Cloud Workspace and Repository Management
- **`endpoint-schemas-part5.md`** - Part 5: Cloud Pull Request, Commit/Source/Search Management
- **`endpoint-schemas-part6.md`** - Part 6: Cloud Branch Restrictions, Commit Statuses, Deployments, Downloads, GPG Keys
- **`endpoint-schemas-part7.md`** - Part 7: Cloud Issue Tracker, Pipelines, SSH Keys, Snippets
- **`endpoint-schemas-part8.md`** - Part 8: Cloud Webhooks, Branching Model + Data Center Builds, System Administration

## Endpoint Summary

### Bitbucket Data Center (75+ endpoints)
- **Authentication Module**: 5 endpoints
  - OAuth token management, user sessions
- **Project Management**: 8 endpoints
  - CRUD operations, permissions
- **Repository Management**: 16 endpoints
  - CRUD operations, permissions, branches, tags
- **Pull Request Management**: 15 endpoints
  - CRUD operations, actions, comments
- **Commit and Source Management**: 7 endpoints
  - Commits, file operations, browsing
- **Search and Analytics**: 4 endpoints
  - Search commits, code, repositories, users
- **Builds and Deployments**: 3 endpoints
  - Build status management
- **System Administration**: 17+ endpoints
  - Capabilities, dashboard, Jira integration, markup, mirroring, permissions, rolling upgrades, SAML, security, system maintenance

### Bitbucket Cloud (95+ endpoints)
- **Authentication Module**: 5 endpoints
  - OAuth 2.0, user management
- **Workspace Management**: 5 endpoints
  - CRUD operations, permissions
- **Repository Management**: 16 endpoints
  - CRUD operations, permissions, branches, tags
- **Pull Request Management**: 15 endpoints
  - CRUD operations, actions, comments
- **Commit and Source Management**: 7 endpoints
  - Commits, file operations, browsing
- **Search and Analytics**: 4 endpoints
  - Search commits, code, repositories, users
- **Branch Restrictions**: 5 endpoints
  - Branch restriction management
- **Commit Statuses**: 4 endpoints
  - Build status management
- **Deployments**: 5 endpoints
  - Deployment management
- **Downloads**: 4 endpoints
  - File download management
- **GPG Keys**: 4 endpoints
  - GPG key management
- **Issue Tracker**: 7 endpoints
  - Issue management
- **Pipelines**: 5 endpoints
  - Pipeline management
- **SSH Keys**: 4 endpoints
  - SSH key management
- **Snippets**: 7 endpoints
  - Code snippet management
- **Webhooks**: 5 endpoints
  - Webhook management
- **Branching Model**: 2 endpoints
  - Branching model management

**Total: 170+ endpoints** with complete input/output schemas

## Key Features

### Selective Tool Loading
- Server type detection (Data Center vs Cloud)
- Functionality-based organization (auth, repository, pull requests, etc.)
- Unified interface regardless of underlying server type

### Complete Schema Documentation
- Detailed input/output specifications for every endpoint
- Parameter types, requirements, and descriptions
- Recursive object structures for complex types
- Error handling and response codes

### Organization Benefits
- Easy implementation of selective tool loading
- Clear separation between server types
- Functional grouping for efficient development
- Comprehensive coverage of all Bitbucket API capabilities

## Usage for Implementation

1. **Server Type Detection**: Use connection parameters to determine Data Center vs Cloud
2. **Tool Registry**: Load only relevant tools based on detected server type
3. **Functionality Modules**: Organize tools by functionality (auth, repository, etc.)
4. **Schema Validation**: Use detailed schemas for input/output validation
5. **Error Handling**: Implement appropriate error handling for each server type

This documentation provides everything needed to implement a comprehensive Bitbucket MCP Server with selective tool loading capabilities.
