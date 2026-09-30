export default {
  displayName: 'app',
  testEnvironment: 'jsdom',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts', 'jest-preset-angular/setup-jest'],
  coverageDirectory: '../../coverage/apps/app',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@ionic|@stencil/core|swiper|@mapfre-tech/b2b-components)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  moduleNameMapper: {
    '@ionic/angular/standalone': '<rootDir>/src/__mocks__/index.ts',
    '@b2b/shared/ui': '<rootDir>/../../libs/shared/ui/src/index.ts',
    '^@mapfre-tech/b2b-components/(.*)$': '<rootDir>/src/__mocks__/@mapfre-tech/b2b-components/$1.ts',
  },
};
