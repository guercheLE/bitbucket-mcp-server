# Contributing to Bitbucket MCP Server

Thank you for your interest in contributing to the Bitbucket MCP Server! This document provides comprehensive guidelines and information for contributors.

## 🤝 Welcome Contributors

We welcome contributions from developers of all skill levels. Whether you're fixing a bug, adding a feature, improving documentation, or helping with testing, your contributions make this project better for everyone.

## 📋 Table of Contents

- [🚀 Getting Started](#-getting-started)
- [🛠️ Development Setup](#️-development-setup)
- [📝 Contributing Guidelines](#-contributing-guidelines)
- [🎨 Code Style](#-code-style)
- [🧪 Testing](#-testing)
- [📚 Documentation](#-documentation)
- [🔄 Pull Request Process](#-pull-request-process)
- [🐛 Issue Reporting](#-issue-reporting)
- [👥 Community Guidelines](#-community-guidelines)
- [🏆 Recognition](#-recognition)

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: npm, yarn, or pnpm
- **Git**: For version control
- **Bitbucket Account**: Cloud or Server/Data Center instance for testing
- **Knowledge**: Basic understanding of TypeScript and the MCP protocol
- **IDE**: VS Code or similar with TypeScript support (recommended)

### Fork and Clone

1. **Fork the repository** on GitHub by clicking the "Fork" button
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/bitbucket-mcp-server.git
   cd bitbucket-mcp-server
   ```
3. **Add the upstream repository**:
   ```bash
   git remote add upstream https://github.com/guercheLE/bitbucket-mcp-server.git
   ```
4. **Verify your setup**:
   ```bash
   git remote -v
   ```

## 🛠️ Development Setup

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Build the project**:

   ```bash
   npm run build
   ```

3. **Run tests** to ensure everything works:

   ```bash
   npm test
   ```

4. **Create a `.env` file** for local development:

   ```bash
   cp env.example .env
   ```

5. **Configure your environment variables** (see [Setup Guide](SETUP_GUIDE.md))

### Development Commands

```bash
# Build the project
npm run build

# Start development server with watch mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check

# Clean build artifacts
npm run clean

# Start MCP server in STDIO mode
npm run mcp:stdio

# Start MCP server in HTTP mode
npm run mcp:http
```

### Project Structure

```
src/
├── client.ts                 # CLI interface
├── server.ts                 # MCP server implementation
├── index.ts                  # Main entry point
├── commands/                 # CLI commands
│   ├── cloud/               # Cloud-specific commands
│   └── datacenter/          # Server/DC-specific commands
├── tools/                   # MCP tools
│   ├── cloud/               # Cloud-specific tools
│   └── datacenter/          # Server/DC-specific tools
├── services/                # API service layers
│   ├── cloud/               # Cloud API services
│   └── datacenter/          # Server/DC API services
└── utils/                   # Utility functions
    ├── api-client.util.ts   # HTTP client
    ├── config.util.ts       # Configuration management
    ├── logger.util.ts       # Logging utilities
    └── constants.util.ts    # Application constants
```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

1. **🐛 Bug Fixes**: Fix existing issues and improve stability
2. **✨ Feature Additions**: Add new functionality and capabilities
3. **📚 Documentation**: Improve or add documentation and guides
4. **🧪 Tests**: Add or improve test coverage and quality
5. **⚡ Performance**: Optimize existing code and improve efficiency
6. **🔧 Refactoring**: Improve code quality and maintainability
7. **🌐 Localization**: Add support for different languages
8. **🎨 UI/UX**: Improve user interface and experience

### Before You Start

1. **🔍 Check Existing Issues**: Look for existing issues or discussions
2. **📝 Create an Issue**: For significant changes, create an issue first
3. **💬 Discuss**: Engage with maintainers and community
4. **📋 Plan**: Break down large changes into smaller, manageable pieces
5. **📖 Read Documentation**: Familiarize yourself with the project structure and guidelines

### Development Workflow

1. **🌿 Create a Branch**:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number
   ```

2. **✏️ Make Changes**: Implement your changes following our guidelines

3. **🧪 Test**: Ensure all tests pass and add new tests as needed

4. **📝 Commit**: Use conventional commit messages

5. **⬆️ Push**: Push your branch to your fork

6. **🔄 Pull Request**: Create a pull request

7. **👀 Review**: Address feedback and make necessary changes

8. **✅ Merge**: Once approved, your changes will be merged

## 🎨 Code Style

### TypeScript Guidelines

- **Strict Mode**: Use TypeScript strict mode for better type safety
- **Interfaces**: Prefer interfaces over types for object shapes
- **Return Types**: Use explicit return types for public methods
- **Type Safety**: Avoid `any` type; use proper typing
- **Async/Await**: Use async/await over Promises when possible
- **Generics**: Use generics for reusable components
- **Utility Types**: Leverage TypeScript utility types when appropriate

### Naming Conventions

- **Files**: Use kebab-case (e.g., `pull-request.tool.ts`)
- **Classes**: Use PascalCase (e.g., `CloudPullRequestTools`)
- **Functions**: Use camelCase (e.g., `createPullRequest`)
- **Variables**: Use camelCase (e.g., `userEmail`, `repositoryName`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `DEFAULT_TIMEOUT`)
- **Interfaces**: Use PascalCase with descriptive names (e.g., `PullRequestData`)
- **Enums**: Use PascalCase (e.g., `TransportMode`)
- **Types**: Use PascalCase with descriptive names (e.g., `ApiResponse`)

### Code Organization

- **Function Size**: Keep functions small and focused (ideally < 50 lines)
- **Naming**: Use meaningful variable and function names
- **Documentation**: Add JSDoc comments for public APIs
- **Grouping**: Group related functionality together
- **Structure**: Follow the existing project structure
- **Imports**: Organize imports logically (external, internal, relative)
- **Exports**: Use named exports over default exports when possible

### Example Code Style

```typescript
/**
 * Creates a new pull request in the specified repository
 * @param workspace - The workspace slug
 * @param repository - The repository slug
 * @param pullRequest - The pull request data
 * @returns Promise resolving to the created pull request
 */
export async function createPullRequest(
  workspace: string,
  repository: string,
  pullRequest: CreatePullRequestData
): Promise<PullRequest> {
  try {
    const response = await apiClient.post(
      `/repositories/${workspace}/${repository}/pullrequests`,
      pullRequest
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create pull request: ${error.message}`);
  }
}
```

## 🧪 Testing

### Test Structure

- **Unit Tests**: Test individual functions and methods
- **Integration Tests**: Test API interactions and external dependencies
- **CLI Tests**: Test command-line interface functionality
- **MCP Tests**: Test MCP protocol compliance and tool registration
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Test response times and resource usage

### Writing Tests

1. **Test Files**: Place tests in `*.test.ts` files alongside source files
2. **Test Structure**: Use describe/it blocks with clear descriptions
3. **Mocking**: Mock external dependencies and API calls
4. **Coverage**: Aim for high test coverage (>80% for new code)
5. **Edge Cases**: Test error conditions and edge cases
6. **Assertions**: Use specific assertions and avoid generic ones
7. **Setup/Teardown**: Properly clean up resources and mocks

### Example Test

```typescript
import { createPullRequest } from '../services/cloud/pull-request.service';

describe('createPullRequest', () => {
  it('should create a pull request successfully', async () => {
    const mockResponse = { data: { id: 1, title: 'Test PR' } };
    jest.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await createPullRequest('workspace', 'repo', {
      title: 'Test PR',
      source: { branch: { name: 'feature' } },
      destination: { branch: { name: 'main' } },
    });

    expect(result).toEqual(mockResponse.data);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/repositories/workspace/repo/pullrequests',
      expect.any(Object)
    );
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    jest.spyOn(apiClient, 'post').mockRejectedValue(error);

    await expect(createPullRequest('workspace', 'repo', {} as any)).rejects.toThrow(
      'Failed to create pull request: API Error'
    );
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- pull-request.service.test.ts
```

## 📚 Documentation

### Documentation Standards

- **README**: Keep the main README updated with latest features
- **API Docs**: Document all public APIs with examples
- **Examples**: Provide clear usage examples and code snippets
- **Changelog**: Update changelog for releases and breaking changes
- **Type Definitions**: Use TypeScript for self-documenting code
- **Comments**: Add inline comments for complex logic
- **Guides**: Create step-by-step guides for common tasks

### Documentation Types

1. **Code Documentation**: JSDoc comments for functions and classes
2. **API Documentation**: Document tool parameters and responses
3. **User Documentation**: Guides and tutorials for end users
4. **Developer Documentation**: Architecture and development guides
5. **Setup Documentation**: Installation and configuration guides
6. **Troubleshooting**: Common issues and solutions

### Example Documentation

````typescript
/**
 * MCP tool for creating pull requests in Bitbucket Cloud
 *
 * @example
 * ```typescript
 * const tool = new CloudPullRequestTools();
 * await tool.createPullRequest({
 *   workspace: 'my-workspace',
 *   repository: 'my-repo',
 *   title: 'Feature: Add new functionality',
 *   sourceBranch: 'feature-branch',
 *   destinationBranch: 'main'
 * });
 * ```
 */
export class CloudPullRequestTools {
  // Implementation...
}
````

## 🔄 Pull Request Process

### Before Submitting

1. **📚 Update Documentation**: Update relevant documentation
2. **🧪 Add Tests**: Add tests for new functionality
3. **📝 Update Changelog**: Add entry to CHANGELOG.md
4. **✅ Check CI**: Ensure all CI checks pass
5. **👀 Self-Review**: Review your own changes
6. **🔍 Run Linting**: Fix any linting issues
7. **🏗️ Build Check**: Ensure the project builds successfully

### Pull Request Template

When creating a pull request, please include:

- **📝 Description**: Clear description of changes and motivation
- **🏷️ Type**: Bug fix, feature, documentation, refactoring, etc.
- **🧪 Testing**: How you tested the changes
- **⚠️ Breaking Changes**: Any breaking changes and migration steps
- **🔗 Related Issues**: Link to related issues (closes #123)
- **📸 Screenshots**: For UI changes, include before/after screenshots
- **📋 Checklist**: Complete the PR checklist

### Review Process

1. **🤖 Automated Checks**: CI/CD pipeline runs automatically
2. **👥 Code Review**: Maintainers review the code
3. **🧪 Testing**: Changes are tested in different environments
4. **✅ Approval**: At least one maintainer approval required
5. **🔄 Merge**: Changes are merged after approval
6. **📢 Release**: Changes are included in the next release

### Commit Message Format

Use conventional commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:

- `feat(auth): add OAuth 2.0 support`
- `fix(api): handle rate limiting errors`
- `docs(readme): update installation instructions`
- `test(pull-request): add integration tests`

## 🐛 Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **📝 Description**: Clear description of the issue
- **🔄 Steps to Reproduce**: Detailed steps to reproduce
- **✅ Expected Behavior**: What you expected to happen
- **❌ Actual Behavior**: What actually happened
- **💻 Environment**: OS, Node.js version, package version, etc.
- **📋 Logs**: Relevant error logs or output
- **🔍 Additional Context**: Any other relevant information

### Feature Requests

For feature requests, please include:

- **📝 Description**: Clear description of the feature
- **🎯 Use Case**: Why this feature is needed
- **💡 Proposed Solution**: How you think it should work
- **🔄 Alternatives**: Other solutions you've considered
- **📋 Additional Context**: Any other relevant information
- **🏷️ Priority**: How important is this feature to you

### Issue Labels

We use labels to categorize issues:

- `🐛 bug`: Something isn't working
- `✨ enhancement`: New feature or request
- `📚 documentation`: Improvements or additions to documentation
- `🆕 good first issue`: Good for newcomers
- `🆘 help wanted`: Extra attention is needed
- `❓ question`: Further information is requested
- `🔧 maintenance`: Maintenance and housekeeping tasks
- `🚀 performance`: Performance improvements
- `🔒 security`: Security-related issues

## 👥 Community Guidelines

### Communication

- **🤝 Be Respectful**: Treat everyone with respect and kindness
- **⏰ Be Patient**: Remember that maintainers are volunteers
- **💡 Be Constructive**: Provide constructive feedback and suggestions
- **📝 Be Clear**: Use clear and concise language
- **🎯 Be Focused**: Stay on topic and relevant to the discussion

### Getting Help

- **📚 Documentation**: Check existing documentation first
- **🔍 Issues**: Search existing issues for similar problems
- **💬 Discussions**: Use GitHub Discussions for questions
- **👥 Community**: Engage with the community
- **📧 Email**: Contact [guerchele@hotmail.com](mailto:guerchele@hotmail.com) for direct support

## 🏆 Recognition

Contributors are recognized in:

- **📖 README**: Listed as contributors
- **📜 Changelog**: Mentioned in release notes
- **📊 GitHub**: Shown in contributor statistics
- **👥 Community**: Acknowledged in community discussions
- **🎖️ Hall of Fame**: Featured in our contributors hall of fame
- **🏅 Special Recognition**: For significant contributions

## Development Resources

### Useful Links

- [📖 Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [☁️ Bitbucket API Documentation](https://developer.atlassian.com/cloud/bitbucket/)
- [📘 TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [🧪 Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [🔧 ESLint Documentation](https://eslint.org/docs/)
- [💅 Prettier Documentation](https://prettier.io/docs/)

### Tools and Extensions

Recommended VS Code extensions:

- **TypeScript and JavaScript Language Features** - Built-in TypeScript support
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Jest** - Test runner and debugging
- **GitLens** - Enhanced Git capabilities
- **Thunder Client** - API testing
- **Auto Rename Tag** - HTML/XML tag management

### Development Tips

1. **📘 Use TypeScript**: Leverage TypeScript for better development experience
2. **🔄 Follow Patterns**: Follow existing code patterns and conventions
3. **🧪 Test Early**: Write tests as you develop
4. **📝 Document Changes**: Document your changes as you make them
5. **❓ Ask Questions**: Don't hesitate to ask questions
6. **🔍 Code Review**: Review your own code before submitting
7. **📊 Monitor Performance**: Keep an eye on performance implications

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**: Update version in package.json
2. **Update Changelog**: Update CHANGELOG.md
3. **Create Release**: Create GitHub release
4. **Publish**: Publish to npm
5. **Announce**: Announce to community

## 📞 Contact

- **🐛 GitHub Issues**: [Create an issue](https://github.com/guercheLE/bitbucket-mcp-server/issues)
- **💬 GitHub Discussions**: [Join discussions](https://github.com/guercheLE/bitbucket-mcp-server/discussions)
- **📧 Email**: [guerchele@hotmail.com](mailto:guerchele@hotmail.com)

---

**Thank you for contributing to the Bitbucket MCP Server! 🚀**

_Your contributions help make this project better for everyone in the community._
