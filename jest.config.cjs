module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/tests/**/*.test.ts',
        '**/tests/**/*.spec.ts'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
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
        'src/server/auth/**/*.ts': {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 30000,
    verbose: true,
    maxWorkers: '50%',
    bail: false,
    forceExit: true,
    detectOpenHandles: true,
    reporters: ['default'],
    projects: [
        {
            displayName: 'unit',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
            transform: {
                '^.+\\.ts$': 'ts-jest'
            },
            setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
        },
        {
            displayName: 'integration',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
            transform: {
                '^.+\\.ts$': 'ts-jest'
            },
            setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
            testTimeout: 60000
        },
        {
            displayName: 'contract',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/contract/**/*.test.ts'],
            transform: {
                '^.+\\.ts$': 'ts-jest'
            },
            setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
        },
        {
            displayName: 'compliance',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/compliance/**/*.test.ts'],
            transform: {
                '^.+\\.ts$': 'ts-jest'
            },
            setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
            testTimeout: 60000
        },
        {
            displayName: 'performance',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/performance/**/*.test.ts'],
            transform: {
                '^.+\\.ts$': 'ts-jest'
            },
            setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
            testTimeout: 120000
        }
    ]
};