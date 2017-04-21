import * as utils from '../../../src/weather/utils';

// tell jest not to mock these modules
jest.unmock('lodash');
jest.unmock('../../../src/weather/dictionary');
jest.unmock('../../../src/weather/generators');

// require the actual modules so that we can mock exports on them later
const lodash = require.requireActual('lodash');
const dictionary = require.requireActual('../../../src/weather/dictionary');
const generators = require.requireActual('../../../src/weather/generators');

test('minutesToMs should work', () => {
  expect(utils.minutesToMs(3)).toBe(180000);
});

test('shimmy should work', () => {
  expect(utils.shimmy([5, 4, 3, 2, 1])).toEqual([1, 3, 5, 4, 2]);
});

test('assignTime should work', () => {
  expect(utils.assignTime(['a', 'b', 'c'], 1)).toEqual([
    {
      0: 'a',
      time: 1,
    },
    {
      0: 'b',
      time: 3600001,
    },
    {
      0: 'c',
      time: 7200001,
    },
  ]);
});

test('getStormWindow should work', () => {
  expect(utils.getStormWindow([{ time: 500 }], { duration: 1000 })).toEqual({
    start: 500,
    end: 86399500,
  });
});

test('trackStorm should work', () => {
  const STORM = {
    cells: [
      {
        cell_duration: 100,
        cell_delay: 100,
      },
      {
        cell_duration: 200,
        cell_delay: 100,
      },
      {
        cell_duration: 200,
      },
    ],
  };

  expect(utils.trackStorm(STORM, 100)).toEqual({
    cells: [
      {
        cell_duration: 100,
        cell_delay: 100,
        time: 100,
        cell_endTime: 200,
      },
      {
        cell_duration: 200,
        cell_delay: 100,
        time: 300,
        cell_endTime: 500,
      },
      {
        cell_duration: 200,
        time: 600,
        cell_endTime: 800,
      },
    ],
  });
});

test('backFill should work', () => {
  expect(utils.backFill([
    { a: 1, b: 2, c: 3 },
    { a: 2 },
    { a: 3, b: 2, c: 1 },
  ], ['b', 'c'])).toEqual([
    { a: 1, b: 2, c: 3 },
    { a: 2, b: 2, c: 3 },
    { a: 3, b: 2, c: 1 },
  ]);
});

test('stormOverFlow should work', () => {
  const STORMS = [
    { time: 0, cell_endTime: 100, temp: 95, meta: 'bits' },
    { time: 30, temp: 98 },
    { time: 101, cell_endTime: 130, temp: 95, meta: 'bits' },
    { time: 150, temp: 98 },
  ];

  expect(utils.stormOverFlow(STORMS)).toEqual([
    { time: 0, cell_endTime: 100, meta: 'bits', temp: 95 },
    { time: 30, cell_endTime: 100, cell_duration: 70, meta: 'bits', temp: 95 },
    { time: 101, cell_endTime: 130, meta: 'bits', temp: 95 },
    { time: 150, temp: 98 },
  ]);
});

test('fillStormGaps should work', () => {
  expect(utils.fillStormGaps([
    {
      time: 0,
      cell_endTime: 100,
      temp: 94,
      rh: 30,
    },
    {
      time: 150,
      cell_endTime: 200,
      temp: 95,
      rh: 31,
    },
    {
      time: 190,
      cell_endTime: 200,
      temp: 95,
      rh: 31,
    },
  ])).toEqual([
    {
      time: 0,
      cell_endTime: 100,
      temp: 94,
      rh: 30,
    },
    {
      time: 101,
      temp: 94,
      rh: 30,
    },
    {
      time: 150,
      cell_endTime: 200,
      temp: 95,
      rh: 31,
    },
    {
      time: 190,
      cell_endTime: 200,
      temp: 95,
      rh: 31,
    },
  ]);
});

test('topOff should work when needed', () => {
  expect(utils.topOff([
    {
      time: 150,
      cell_endTime: 200,
      temp: 95,
      rh: 30,
    },
  ])).toEqual([
    {
      time: 150,
      cell_endTime: 200,
      temp: 95,
      rh: 30,
    },
    {
      time: 201,
      temp: 95,
      rh: 30,
    },
  ]);
});

test('topOff should work when not needed', () => {
  expect(utils.topOff([
    {
      time: 150,
      cell_endTime: 86400300,
      temp: 95,
      rh: 30,
    },
  ])).toEqual([
    {
      time: 150,
      cell_endTime: 86400300,
      temp: 95,
      rh: 30,
    },
  ]);
});

test('whipWind should work when whip is 1', () => {
  lodash.random = jest.fn(() => 1);
  expect(utils.whipWind(10)).toBe(10);
});

test('whipWind should work when whip is 8', () => {
  lodash.random = jest.fn(() => 8);
  expect(utils.whipWind(10)).toBe(20);
});

test('whipWind should work when whip is 10', () => {
  lodash.random = jest.fn(() => 10);
  expect(utils.whipWind(10)).toBe(30);
});


test('addWind should work', () => {
  generators.generateWind = jest.fn(() => 1);
  dictionary.beaufortScale = jest.fn(() => 'beaufortScale');

  const ARRAY = [
    {
      a: 1,
      wind: 1,
    },
    {
      b: 2,
    },
    {
      c: 3,
      wind: 3,
    },
  ];

  expect(utils.addWind(ARRAY, 5)).toEqual([{
    a: 1,
    wind: 1,
    beaufort_scale: 'beaufortScale',
  },
  {
    b: 2,
    wind: 1,
    beaufort_scale: 'beaufortScale',
  },
  {
    c: 3,
    wind: 3,
    beaufort_scale: 'beaufortScale',
  }]);
});

test('getHeatIndex should work', () => {
  expect(utils.getHeatIndex(80, 40).feels_like).toBe(80);
  expect(utils.getHeatIndex(90, 40).feels_like).toBe(91);
  expect(utils.getHeatIndex(100, 40).feels_like).toBe(109);
  expect(utils.getHeatIndex(110, 40).feels_like).toBe(136);
});

test('getWindChill should work', () => {
  expect(utils.getWindChill(15, 60).feels_like).toBe(-11);
  expect(utils.getWindChill(5, 60).feels_like).toBe(-26);
  expect(utils.getWindChill(-5, 60).feels_like).toBe(-40);
  expect(utils.getWindChill(-15, 60).feels_like).toBe(-55);
});

test('feelsLike should work', () => {
  const ARRAY = [{
    temp: 90,
    rh: 40,
    wind: 60,
  },
  {
    temp: 70,
    rh: 40,
    wind: 60,
  },
  {
    temp: 15,
    rh: 40,
    wind: 60,
  }];
  expect(utils.feelsLike(ARRAY)[0].heat_index.feels_like).toBe(91);
  expect(utils.feelsLike(ARRAY)[1].heat_index).toBeUndefined();
  expect(utils.feelsLike(ARRAY)[1].wind_chill).toBeUndefined();
  expect(utils.feelsLike(ARRAY)[2].wind_chill.feels_like).toBe(-11);
});
