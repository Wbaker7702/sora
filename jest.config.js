const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './renderer',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/renderer/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/renderer/$1',
    '^components/(.*)$': '<rootDir>/renderer/components/$1',
    '^lib/(.*)$': '<rootDir>/renderer/lib/$1',
    '^hooks/(.*)$': '<rootDir>/renderer/hooks/$1',
  },
  collectCoverageFrom: [
    'renderer/**/*.{js,jsx,ts,tsx}',
    '!renderer/**/*.d.ts',
    '!renderer/**/*.stories.{js,jsx,ts,tsx}',
    '!renderer/**/index.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);