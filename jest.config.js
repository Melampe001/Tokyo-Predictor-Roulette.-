export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/test/backend.test.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testTimeout: 10000
};
