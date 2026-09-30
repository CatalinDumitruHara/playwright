const { nxPreset } = require('@nx/jest/preset');

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    '^@api-types$': '<rootDir>/libs/api-types/src/index.ts',
  },
};
