export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'clover', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Higher threshold for critical auth and security functions
    'src/server/auth/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 30000, // Increased for MCP protocol tests
  verbose: true,
  // Enable parallel execution for performance
  maxWorkers: '50%',
  // Improved error handling for MCP protocol tests
  bail: false, // Don't stop on first failure
  forceExit: true, // Force Jest to exit after tests complete
  detectOpenHandles: true, // Detect hanging promises/handles
  // Custom reporters for different test categories
  reporters: [
    'default'
    // TODO: Add jest-junit after package installation
    // ['jest-junit', {
    //   outputDirectory: 'test-results',
    //   outputName: 'jest-junit.xml',
    //   classNameTemplate: '{classname}',
    //   titleTemplate: '{title}',
    //   ancestorSeparator: ' › ',
    //   usePathForSuiteName: true
    // }]
  ],
  // Test categorization using projects
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    },
    {
      displayName: 'contract',
      testMatch: ['<rootDir>/tests/contract/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    },
    {
      displayName: 'compliance',
      testMatch: ['<rootDir>/tests/compliance/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    }
  ]
};