module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.ts"],
    transform: {
        "^.+\\.(t|j)s$": "ts-jest"
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    collectCoverage: true,
    collectCoverageFrom: ["src/**/*.{ts,tsx}"]
};
