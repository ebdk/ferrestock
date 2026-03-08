module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server', '<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts']
};
