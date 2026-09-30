import 'jest-preset-angular/setup-jest';

jest.mock('@mapfre-tech/b2b-components/read-data', () => ({
  ReadDataComponent: 'app-read-data',
}));

jest.mock('@mapfre-tech/b2b-components/spinner', () => ({
  SpinnerComponent: 'app-spinner',
}));

jest.mock('@mapfre-tech/b2b-components/card', () => ({
  CardPrimaryDirective: 'appCardPrimary',
}));

