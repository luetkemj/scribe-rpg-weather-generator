import * as generators from '../../../src/weather/generators';

jest.mock('lodash');
jest.mock('../../../src/weather/utils');

test('generators should exist', () => {
  expect(generators).not.toBeUndefined();
});

const TABLE = {
  1: {
    precip: 1,
    wind: 2,
    solid: 3,
    hook: 4,
  },
};

test('generateStormCell should work', () => {
  expect(generators.generateStormCell(TABLE, 1, 1)).toEqual({
    wind: 3,
    cell_duration: 1,
    cell_precipitation_rate: 1,
    cell_solid: 3,
    cell_hook: 4,
  });
});
