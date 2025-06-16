module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '\!src/**/*.test.js',
        '\!src/index.js',
        '\!src/app.js'
    ],
    testMatch: [
        '**/tests/unit/**/*.test.js',
        '**/tests/integration/**/*.test.js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/frontend/'
    ],
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    verbose: true
};
