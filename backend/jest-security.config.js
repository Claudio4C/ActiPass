module.exports = {
    displayName: 'Security Tests',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/auth/security/**/*.spec.ts'],
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/auth/**/*.(t|j)s',
        '!src/auth/**/*.spec.(t|j)s',
        '!src/auth/**/*.test.(t|j)s',
    ],
    coverageDirectory: 'coverage/security',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/src/test/setup-security.ts'],
    testTimeout: 30000,
    verbose: true,
    bail: false,
    maxWorkers: 1, // Run security tests sequentially
};
