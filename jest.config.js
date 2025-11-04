export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/test/backend.test.js'],
  collectCoverageFrom: [
    'server.js',
    'src/**/*.js',
    '!src/tokioai-adapter.js', // Exclude adapter from coverage
    '!test/**',
    '!examples/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
