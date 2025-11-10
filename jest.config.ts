import type { Config } from 'jest';

const config: Config = {
  projects: [
    // Client/Frontend tests - React with jsdom
    {
      displayName: 'client',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '@/(.*)': '<rootDir>/client/src/$1',
        '@assets/(.*)': '<rootDir>/attached_assets/$1',
      },
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
        '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)'
      ],
      collectCoverageFrom: [
        'src/**/*.(ts|tsx)',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            module: 'esnext',
            moduleResolution: 'node'
          }
        }],
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      testEnvironmentOptions: {
        customExportConditions: ['node', 'node-addons']
      },
      globals: {
        'import.meta': {
          env: {
            DEV: true,
            VITE_SUPABASE_URL: 'http://test-supabase-url',
            VITE_SUPABASE_ANON_KEY: 'test-anon-key'
          }
        }
      }
    },
    // Server/Backend tests - Node environment with ESM support
    {
      displayName: 'server',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      testMatch: [
        '<rootDir>/server/**/__tests__/**/*.test.(ts|js)',
        '<rootDir>/server/**/?(*.)(spec|test).(ts|js)'
      ],
      collectCoverageFrom: [
        'server/**/*.(ts|js)',
        '!server/**/*.d.ts',
        '!server/index.ts'
      ],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            module: 'esnext',
            moduleResolution: 'node'
          },
          useESM: true
        }],
      },
      moduleFileExtensions: ['ts', 'js', 'json', 'node']
    }
  ]
};

export default config;