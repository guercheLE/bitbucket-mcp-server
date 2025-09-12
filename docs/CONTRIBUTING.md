# Contributing Guide

## Overview

Thank you for your interest in contributing to the Bitbucket MCP Server! This guide will help you get started with contributing to the project.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Access to Bitbucket Cloud or Data Center for testing

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/your-username/bitbucket-mcp-server.git
   cd bitbucket-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Bitbucket credentials
   ```

4. **Run tests**
   ```bash
   npm test
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Branch Strategy

We use Git Flow for branch management:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### 2. Creating a Feature Branch

```bash
# Create and switch to a new feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/your-bug-fix-name
```

### 3. Development Process

1. **Write tests first** (TDD approach)
2. **Implement the feature**
3. **Ensure all tests pass**
4. **Run linting and formatting**
5. **Update documentation**

### 4. Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples:
```bash
feat(auth): add OAuth2 authentication support
fix(api): resolve rate limiting issue
docs(readme): update installation instructions
test(integration): add repository management tests
```

## Code Standards

### 1. TypeScript

- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use interfaces for object shapes
- Implement proper error handling

```typescript
// Good
interface UserConfig {
  username: string;
  email: string;
  preferences: UserPreferences;
}

// Avoid
const config: any = { ... };
```

### 2. ESLint Configuration

We use a custom ESLint configuration. Run linting before committing:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### 3. Prettier Formatting

Code is automatically formatted with Prettier:

```bash
npm run format
```

### 4. Testing Standards

- Write tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('ConfigService', () => {
  describe('loadConfig', () => {
    it('should load configuration from environment variables', () => {
      // Arrange
      const expectedConfig = { baseUrl: 'https://api.bitbucket.org' };
      process.env.BITBUCKET_BASE_URL = expectedConfig.baseUrl;

      // Act
      const config = configService.loadConfig();

      // Assert
      expect(config.baseUrl).toBe(expectedConfig.baseUrl);
    });
  });
});
```

## Project Structure

### Directory Organization

```
src/
├── types/           # TypeScript types and Zod schemas
├── services/        # Core business logic services
├── tools/          # MCP tool implementations
├── server/         # MCP server implementation
├── cli/            # CLI client implementation
├── integration/    # API integration layer
└── utils/          # Utility functions

tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── contract/       # Contract tests
└── e2e/           # End-to-end tests

docs/               # Documentation
examples/           # Usage examples
scripts/            # Build and deployment scripts
```

### File Naming Conventions

- Use kebab-case for file names: `user-service.ts`
- Use PascalCase for class names: `UserService`
- Use camelCase for function and variable names: `getUserById`
- Use UPPER_CASE for constants: `API_BASE_URL`

## Testing Guidelines

### 1. Unit Tests

- Test individual functions and methods
- Mock external dependencies
- Test edge cases and error conditions
- Aim for 100% code coverage for critical paths

```typescript
// Example unit test
describe('AuthService', () => {
  let authService: AuthService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockApiClient = createMockApiClient();
    authService = new AuthService(mockApiClient);
  });

  it('should authenticate with valid credentials', async () => {
    // Test implementation
  });
});
```

### 2. Integration Tests

- Test complete workflows
- Use real API endpoints (with test credentials)
- Test error scenarios
- Verify data flow between components

```typescript
// Example integration test
describe('Repository Management Integration', () => {
  it('should create, update, and delete repository', async () => {
    // Test complete workflow
  });
});
```

### 3. Contract Tests

- Validate MCP tool schemas
- Test API contract compliance
- Ensure backward compatibility

### 4. E2E Tests

- Test complete user scenarios
- Use real Bitbucket instances
- Test CLI commands
- Verify end-to-end functionality

## Documentation Standards

### 1. Code Documentation

- Document all public APIs
- Use JSDoc for functions and classes
- Include examples in documentation
- Keep documentation up to date

```typescript
/**
 * Authenticates with Bitbucket using provided credentials
 * @param config - Authentication configuration
 * @returns Promise resolving to authentication result
 * @throws {AuthenticationError} When authentication fails
 * @example
 * ```typescript
 * const result = await authService.authenticate({
 *   username: 'user',
 *   password: 'pass'
 * });
 * ```
 */
async authenticate(config: AuthConfig): Promise<AuthResult> {
  // Implementation
}
```

### 2. README Updates

- Update README for new features
- Include usage examples
- Update installation instructions
- Document configuration options

### 3. API Documentation

- Document all MCP tools
- Include input/output schemas
- Provide usage examples
- Document error conditions

## Pull Request Process

### 1. Before Submitting

- [ ] Code follows project standards
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No linting errors
- [ ] Branch is up to date with develop

### 2. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

### 3. Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: At least one maintainer reviews the code
3. **Testing**: Manual testing if required
4. **Approval**: Maintainer approves and merges

## Issue Guidelines

### 1. Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What you expected to happen.

**Environment**
- OS: [e.g., Windows 10]
- Node.js version: [e.g., 18.17.0]
- Bitbucket version: [e.g., Cloud/Data Center 8.0]

**Additional context**
Any other context about the problem.
```

### 2. Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## Release Process

### 1. Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### 2. Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Release notes prepared
- [ ] Tag created

### 3. Creating a Release

```bash
# Update version
npm version patch  # or minor, major

# Push tags
git push origin --tags

# Create GitHub release
gh release create v1.0.0 --notes "Release notes"
```

## Community Guidelines

### 1. Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the project's code of conduct

### 2. Communication

- Use clear and concise language
- Provide context for questions
- Be patient with newcomers
- Use appropriate channels for different topics

### 3. Getting Help

- Check existing documentation first
- Search existing issues
- Ask questions in discussions
- Join community channels

## Development Tools

### 1. Recommended VS Code Extensions

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Jest
- GitLens
- REST Client

### 2. VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### 3. Git Hooks

We use Husky for git hooks:

```bash
# Install git hooks
npm run prepare
```

Hooks include:
- Pre-commit: Linting and formatting
- Pre-push: Running tests
- Commit-msg: Commit message validation

## Performance Guidelines

### 1. Code Performance

- Avoid unnecessary API calls
- Implement proper caching
- Use efficient data structures
- Optimize database queries

### 2. Memory Management

- Avoid memory leaks
- Properly dispose of resources
- Use streaming for large data
- Monitor memory usage

### 3. Network Optimization

- Implement request batching
- Use connection pooling
- Implement retry logic
- Handle rate limiting

## Security Guidelines

### 1. Secure Coding

- Validate all inputs
- Sanitize outputs
- Use secure authentication
- Implement proper authorization

### 2. Dependency Management

- Keep dependencies updated
- Use security scanning tools
- Audit dependencies regularly
- Use lock files

### 3. Secret Management

- Never commit secrets
- Use environment variables
- Use secret management services
- Rotate credentials regularly

## Troubleshooting

### Common Issues

1. **Tests failing**: Check environment setup and dependencies
2. **Linting errors**: Run `npm run lint:fix`
3. **Build errors**: Check TypeScript configuration
4. **Authentication issues**: Verify credentials and network access

### Getting Help

- Check the troubleshooting section in README
- Search existing issues
- Ask in discussions
- Contact maintainers

## Recognition

Contributors are recognized in:
- README contributors section
- Release notes
- Project documentation
- Community acknowledgments

Thank you for contributing to the Bitbucket MCP Server! 🎉
