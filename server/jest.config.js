export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': ['babel-jest', { rootMode: 'upward' }],
  },
  injectGlobals: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/config/db.js'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  testPathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: ['/node_modules/'],
  extensionsToTreatAsEsm: ['.js'],
};
