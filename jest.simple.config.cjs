module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        '**/tests/simple.test.ts'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    verbose: true
};