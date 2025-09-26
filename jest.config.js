module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.ts", "**/*.test.js"],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: {
        "^src/(.*)$": "<rootDir>/src/$1"
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.{ts,tsx}"]
};
