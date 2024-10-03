/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30 * 1000,
  collectCoverage: true,
  coverageReporters: ['text', 'cobertura'],
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
