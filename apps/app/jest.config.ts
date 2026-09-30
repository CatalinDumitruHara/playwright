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

  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@ionic|@stencil/core|swiper)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  moduleNameMapper: {
    '@ionic/angular/standalone': '<rootDir>/src/__mocks__/index.ts',
    '@api-types': '<rootDir>/../libs/api-types/src/index.ts'
  },
};
