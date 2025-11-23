export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'server.js',
    'src/**/*.js',
    '!src/tokioai.js',  // Exclude as it's tested separately
    '!test/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  testTimeout: 10000,
  maxWorkers: 1  // Run tests serially to avoid port conflicts
};
