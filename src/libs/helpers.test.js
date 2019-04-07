/* eslint-disable global-require */

describe('Helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('timeConverter', () => {
    test('2m', () => {
      const { timeConverter } = require('./helpers');
      expect(timeConverter('2m')).toBe(2 * 60 * 1000);
    });
    test('5m 30s', () => {
      const { timeConverter } = require('./helpers');
      expect(timeConverter('5m 30s')).toBe(5 * 60 * 1000 + 30 * 1000);
    });
  });
});
