import * as dictionary from '../../../src/weather/dictionary';

// jest.unmock('../../../src/weather/weather.constants');
const constants = require.requireActual('../../../src/weather/weather.constants');

test('temporalEstimation should work', () => {
  const oneHour = 3.6e+6;
  expect(dictionary.temporalEstimation(720000)).toBe('midnight');
  expect(dictionary.temporalEstimation(1 * oneHour)).toBe('early morning');
  expect(dictionary.temporalEstimation(6 * oneHour)).toBe('dawn');
  expect(dictionary.temporalEstimation(7 * oneHour)).toBe('morning');
  expect(dictionary.temporalEstimation(12 * oneHour)).toBe('noon');
  expect(dictionary.temporalEstimation(13 * oneHour)).toBe('afternoon');
  expect(dictionary.temporalEstimation(17 * oneHour)).toBe('evening');
  expect(dictionary.temporalEstimation(18 * oneHour)).toBe('dusk');
  expect(dictionary.temporalEstimation(19 * oneHour)).toBe('night');
  expect(dictionary.temporalEstimation(23.8 * oneHour)).toBe('midnight');
});

test('beaufortScale should work', () => {
  constants.BEAUFORT_SCALE = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
    12: 12,
  };

  expect(dictionary.beaufortScale(0.5)).toBe(0);
  expect(dictionary.beaufortScale(1)).toBe(1);
  expect(dictionary.beaufortScale(4)).toBe(2);
  expect(dictionary.beaufortScale(8)).toBe(3);
  expect(dictionary.beaufortScale(13)).toBe(4);
  expect(dictionary.beaufortScale(18)).toBe(5);
  expect(dictionary.beaufortScale(25)).toBe(6);
  expect(dictionary.beaufortScale(31)).toBe(7);
  expect(dictionary.beaufortScale(39)).toBe(8);
  expect(dictionary.beaufortScale(47)).toBe(9);
  expect(dictionary.beaufortScale(55)).toBe(10);
  expect(dictionary.beaufortScale(64)).toBe(11);
  expect(dictionary.beaufortScale(73)).toBe(12);
});


test('feelsLikeNotes should work', () => {
  expect(dictionary.feelsLikeNotes(145).warning).toBe('Extreme Danger');
  expect(dictionary.feelsLikeNotes(110).warning).toBe('Danger');
  expect(dictionary.feelsLikeNotes(100).warning).toBe('Extreme Caution');
  expect(dictionary.feelsLikeNotes(85).warning).toBe('Caution');

  expect(dictionary.feelsLikeNotes(65).warning).toBeUndefined();

  expect(dictionary.feelsLikeNotes(40).warning).toBe('Mild Caution');
  expect(dictionary.feelsLikeNotes(20).warning).toBe('Caution');
  expect(dictionary.feelsLikeNotes(10).warning).toBe('Extreme Caution');
  expect(dictionary.feelsLikeNotes(-5).warning).toBe('Mild Danger');
  expect(dictionary.feelsLikeNotes(-30).warning).toBe('Danger');
  expect(dictionary.feelsLikeNotes(-80).warning).toBe('Extreme Danger');
});

test('getPrecipSize should work', () => {
  constants.PRECIP_SIZE_HAIL = ['ball'];
  constants.PRECIP_SIZE_SNOW = ['flake'];
  constants.PRECIP_SIZE_RAIN = ['drop'];

  expect(dictionary.getPrecipSize('hail')).toBe('ball');
  expect(dictionary.getPrecipSize('snow')).toBe('flake');
  expect(dictionary.getPrecipSize('rain')).toBe('drop');
  expect(dictionary.getPrecipSize('butter')).toBeNull();
});
