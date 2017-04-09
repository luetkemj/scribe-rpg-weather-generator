import * as _ from 'lodash';
import {
  d30,
  shimmy,
  assignTime,
  getStormWindow,
  backFill,
  stormOverFlow,
  fillStormGaps,
  trackStorm,
  topOff,
  addWind,
  feelsLike,
} from './utils';
import { temporalEstimation } from './dictionary';
import { generateStorm, generateStormConditions, generateSkyConditions } from './generators';
import { ZONE_VARIANCE, STORM_TYPE_TABLE } from './weather.constants';

const logger = require('./logger')();

/*
 * @TODO: there is a lot happening here... can it be simplified further? tested at all?
 * cause at the moment it is buggy!
 */
export function generateWeather(generator, zone, terrain, season, month, initialMs) {
  // Temperature
  const { temp: baseTemp } = generator[zone][terrain][season][month];
  const { high: seasonalHighTemp } = generator[zone].seasonalVariance.temp[season];
  const { high: terrainHighTemp } = generator[zone].terrainVariance.temp[terrain];
  const { low: seasonalLowTemp } = generator[zone].seasonalVariance.temp[season];
  const { low: terrainLowTemp } = generator[zone].terrainVariance.temp[terrain];
  // Humidity
  const { humidity: baseRH } = generator[zone][terrain][season][month];
  const { high: seasonalHighRH } = generator[zone].seasonalVariance.temp[season];
  const { high: terrainHighRH } = generator[zone].terrainVariance.temp[terrain];
  const { low: seasonalLowRH } = generator[zone].seasonalVariance.temp[season];
  const { low: terrainLowRH } = generator[zone].terrainVariance.temp[terrain];

  const { weatherClass } = generator[zone][terrain][season][month];

  const meanTemp = baseTemp + _.random(0, _.sample(ZONE_VARIANCE));
  const highTemp = meanTemp + _.random(0, seasonalHighTemp + terrainHighTemp);
  const lowTemp = meanTemp + _.random(0, seasonalLowTemp + terrainLowTemp);

  const meanRH = baseRH + _.random(0, _.sample(ZONE_VARIANCE));
  const highRH = _.clamp(meanRH + _.random(0, seasonalHighRH + terrainHighRH), 1, 100);
  const lowRH = _.clamp(meanRH + _.random(0, seasonalLowRH + terrainLowRH), 1, 100);

  const temps = [];
  // create an array of temps within our range of highTemp and lowTemp for one day
  for (let i = 0; i < 24; i += 1) {
    temps.push({ temp: _.random(lowTemp, highTemp) });
  }

  const RHs = [];
  // create an array of relative humidities within our range of highRH and lowRH for one day
  for (let i = 0; i < 24; i += 1) {
    RHs.push({ rh: _.random(lowRH, highRH) });
  }

  // reverse order temps and shimmy into an ordered set of hourlyTemps
  // with each hour of the day
  const hourlyTemps = assignTime(
    shimmy(_.chain(temps).orderBy('temp').reverse().value()),
    initialMs,
  );

  // order RHs and shimmy into an ordered set of hourlyRHs with each hour of the day
  const hourlyRHs = assignTime(
    shimmy(_.orderBy(RHs, 'rh')),
    initialMs,
  );

  let stormType = null;
  if (weatherClass) {
    const roll = d30();
    stormType = STORM_TYPE_TABLE[weatherClass][roll];
  }

  // merge hourlyTemps and hourlyRHs into hourlyWeather
  let hourlyWeather = _.merge(hourlyTemps, hourlyRHs);

  let stormStartEstimate;
  let stormStart;

  // if stormType run storm generator
  if (stormType) {
    const storm = generateStorm(stormType);

    // if we generated a storm track it over hourlyWeather
    if (storm) {
      const stormWindow = getStormWindow(hourlyWeather, storm);
      stormStart = _.random(stormWindow.start, stormWindow.end);

      stormStartEstimate = temporalEstimation(stormStart);

      const trackedStorm = trackStorm(storm, stormStart);
      const hourlyWeatherWithStorms = _.orderBy(hourlyWeather.concat(trackedStorm.cells), 'time');

      // order weather array with storms by time
      hourlyWeather = _.orderBy(hourlyWeatherWithStorms, 'time');

      // storms cells are not generated with a current temp or relative humidity
      // Now that our storms are ordered with our hourly temps we can look back to the previous
      // record and grab that temp and rh in order to add it to our storm cells
      hourlyWeather = backFill(hourlyWeather, ['temp', 'rh']);

      // Sometimes a storm cells duration does not end before the next record begins.
      // Here we handle that problem by overflowing the conditions of the storm cell into
      // the next record.
      hourlyWeather = stormOverFlow(hourlyWeather);

      // Sometimes a storm cells record will end before the next record begins. Here we fill in
      // the gap with a new record.
      hourlyWeather = fillStormGaps(hourlyWeather);

      // Sometimes a storm begins after 11pm and ends before midnight. In this instance we
      // do not have a record from the end of the storm to midnight.
      // Here we test for this case and add a record if need be.
      hourlyWeather = topOff(hourlyWeather);
    }
  }

  // now that we have our entire list it's time to start filling missing data!
  // Here we add wind and beaufort number to any records that are missing it.
  hourlyWeather = addWind(hourlyWeather, _.random(25));

  // Add heat index and wind chill if necessary
  hourlyWeather = feelsLike(hourlyWeather);

  hourlyWeather = generateSkyConditions(hourlyWeather, stormType, terrain);
  hourlyWeather = generateStormConditions(hourlyWeather, season, stormType, stormStart);

  const currentWeather = {
    time: initialMs,
    forecast: {
      lowTemp,
      highTemp,
      highRH,
      lowRH,
      stormType,
      stormStartEstimate,
    },
    hourlyWeather,
  };

  logger.log('generateWeather: currentWeather: %o', currentWeather);

  return currentWeather;
}
