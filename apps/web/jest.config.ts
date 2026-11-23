import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' }, // el alias @/ de tsconfig no lo mapea next/jest
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default createJestConfig(config);
