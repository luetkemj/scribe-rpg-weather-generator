import * as _ from 'lodash';
import { minutesToMs, whipWind } from './utils';
import { getPrecipSize } from './dictionary';
import { NS_CELL_TABLE, S_CELL_TABLE } from './weather.constants';

export function generateStormCell(table, duration, roll, modifier = 0) {
  const { precip, wind, solid, hook } = table[roll + modifier];

  const whippedWind = whipWind(wind);

  return {
    wind: whippedWind,
    cell_duration: duration,
    cell_precipitation_rate: precip,
    cell_solid: solid,
    cell_hook: hook,
  };
}

function generateSingleCell() {
  const duration = minutesToMs(_.random(1, 10) + 20);
  return {
    duration,
    cells: [generateStormCell(NS_CELL_TABLE, duration, _.random(1, 30))],
  };
}

function generateMultiCell(table, cluster, d6, d10) {
  const cells = [];
  let totalDuration = 0;

  for (let i = 0; i < d6 + 2; i += 1) {
    let delay = 0;
    if (cluster) {
      delay = Math.ceil(_.random(1, 30) / 2);
      totalDuration += minutesToMs(delay);
    }

    const duration = minutesToMs(d10 + 20);
    totalDuration += duration;

    const cell = generateStormCell(table, duration, _.random(1, 30));

    cells.push({
      ...cell,
      cell_duration: duration,
      cell_delay: minutesToMs(delay),
    });
  }
  return {
    duration: totalDuration,
    cells,
  };
}

/*
 * @TODO: test this bugger CAUSE IT DON'T WORK!!
 */
function generateSuperCell() {
  const duration = 60 + (_.random(1, 30) * 10);
  const cells = [];

  for (let i = 1; i <= duration / 10; i += 1) {
    if (i === 1 || i === duration / 10) {
      const cell = generateStormCell(S_CELL_TABLE, minutesToMs(10), _.random(1, 10));

      cells.push({
        ...cell,
      });
    }

    if (i === 2) {
      const cell = generateStormCell(S_CELL_TABLE, minutesToMs(10), _.random(1, 10), 10);

      cells.push({
        ...cell,
      });
    }

    if (i > 2 && i < duration) {
      const cell = generateStormCell(S_CELL_TABLE, minutesToMs(10), _.random(1, 10), 20);

      cells.push({
        ...cell,
      });
    }
  }

  return {
    duration: minutesToMs(duration),
    cells,
  };
}


/*
 * @TODO: test this bugger!
 */
export function generateStorm(stormType) {
  let storm;
  if (stormType === 'singleCell') {
    storm = generateSingleCell();
  }
  if (stormType === 'multiCellClusterNS') {
    storm = generateMultiCell(NS_CELL_TABLE, true, _.random(1, 6), _.random(1, 10));
  }
  if (stormType === 'multiCellClusterS') {
    storm = generateMultiCell(S_CELL_TABLE, true, _.random(1, 6), _.random(1, 10));
  }
  if (stormType === 'multiCellLineNS') {
    storm = generateMultiCell(NS_CELL_TABLE, false, _.random(1, 6), _.random(1, 10));
  }
  if (stormType === 'multiCellLineS') {
    storm = generateMultiCell(S_CELL_TABLE, false, _.random(1, 6), _.random(1, 10));
  }
  if (stormType === 'superCell') {
    storm = generateSuperCell();
  }
  return {
    ...storm,
  };
}

export function generateWind(average) {
  const min = _.clamp(average - 5, 0, 20);
  const max = average + 5;

  return _.random(min, max);
}


// conditions
function getConditionSolidPrecipitation(record, season) {
  // if temp is below freezing ignore solid and do snow
  if (record.temp < 32) {
    return 'snow';
  }

  // if winter and in range for sleet - do sleet
  if (season === 'winter' && _.inRange(record.temp, 32, 41)) {
    return 'sleet';
  }

  // if spring and summer and over 40 - do hail
  if ((season === 'spring' || season === 'summer') && record.temp > 40) {
    return 'hail';
  }

  // else we should just do thunderstorm cause we know we are in a storm.
  return 'thunderstorm';
}

function getConditionPrecipitation(record, stormType) {
  // if around freezing do rain-mix
  if (_.inRange(record.temp, 32, 38)) {
    return 'rain-mix';
  }

  // if cold enough to snow - do snow
  if (record.temp < 32) {
    return 'snow';
  }

  // if storm is severe determine intensity and add lightening
  if (stormType === 'multiCellClusterS' || stormType === 'multiCellLineS' || stormType === 'superCell') {
    if (record.cell_precipitation_rate < 2) {
      return 'storm-showers';
    }

    return 'thunderstorm';
  }

  // if rain and not severe determine intensity
  if (record.cell_precipitation_rate < 0.3) {
    return 'sprinkle';
  }

  if (record.cell_precipitation_rate < 0.9) {
    return 'showers';
  }

  return 'rain';
}

export function generateNextSky(sky) {
  const SKIES = [
    'clear',
    'partly-cloudy',
    'mostly-cloudy',
    'overcast',
  ];

  // current sky is sticky - so we try here to unstick it.
  // we have unstuck the sky
  if (_.random(1, 30) > 10) {
    // check which way to lean
    // first we get the index of sky in SKIES
    let index = SKIES.indexOf(sky);
    if (_.random(1, 30) % 2) {
      // so we can move up or down
      index -= 1;
    } else {
      index += 1;
    }

    // now we return our new sky at the calulated index
    // making sure to clamp between possible indices
    return SKIES[_.clamp(index, 0, SKIES.length - 1)];
  }

  return sky;
}

export function generateStormConditions(hourlyWeather, season, stormType, stormStart) {
  const newArray = [];
  _.each(hourlyWeather, (record) => {
    // set storm conditions on records
    if (stormType) {
      // if storm is severe and this is the last record before the first storm cell
      // add lightning and continue
      if (stormType === 'multiCellClusterS' || stormType === 'multiCellLineS') {
        if (record.time === stormStart) {
          newArray[newArray.length - 1].condition = 'lightning';
          newArray[newArray.length - 1].outlook = 'distant lightning - loud cracks of thunder';
        }
      }

      // if storm is not severe and this is the last record before the first storm cell
      // try lightning and continue
      if (stormType === 'multiCellClusterNS' || stormType === 'multiCellLineNS' || stormType === 'singleCell') {
        if (record.time === stormStart) {
          if (!_.random(1, 30) % 3) {
            newArray[newArray.length - 1].condition = 'lightning';
            newArray[newArray.length - 1].outlook = 'rolling thunder off in the distance';
          }
          if (record.temp < 32) {
            newArray[newArray.length - 1].outlook = 'looks like snow';
          } else {
            newArray[newArray.length - 1].outlook = 'the smell of rain is in the air';
          }
        }
      }

      // try hail or sleet
      if (record.cell_solid) {
        const precip = getConditionPrecipitation(record, stormType);

        if (precip === 'hail') {
          const newRecord = _.assign(record, {
            condition: precip,
            cell_precipitation_size: getPrecipSize('hail'),
          });

          return newArray.push({
            ...newRecord,
          });
        }

        return newArray.push({
          ...record,
          condition: getConditionSolidPrecipitation(record, season),
        });
      }

      // try snow, rain, or mix
      if (record.cell_precipitation_rate && !record.cell_solid) {
        const precip = getConditionPrecipitation(record, stormType);

        if (precip === 'snow') {
          const newRecord = _.assign(record, {
            condition: precip,
            cell_precipitation_rate: record.cell_precipitation_rate * 2,
            cell_precipitation_size: getPrecipSize('snow'),
          });

          return newArray.push({
            ...newRecord,
          });
        }

        return newArray.push({
          ...record,
          condition: getConditionPrecipitation(record, stormType),
        });
      }
    }

    return newArray.push({
      ...record,
    });
  });

  return newArray;
}

export function generateSkyConditions(hourlyWeather, stormType, terrain) {
  const SKIES = [
    'clear',
    'partly-cloudy',
    'mostly-cloudy',
    'overcast',
  ];

  const newArray = [];
  _.each(hourlyWeather, (record, index) => {
    // set initial sky
    if (index === 0) {
      if (stormType) {
        // if there is a severe storm today
        if (stormType === 'multiCellClusterS' || stormType === 'multiCellLineS') {
          // The day is more likely to be clear to partly-cloudy overall
          if (_.random(1, 30) % 2) {
            return newArray.push({
              ...record,
              condition: generateNextSky('clear'),
            });
          }

          return newArray.push({
            ...record,
            condition: generateNextSky('partly-cloudy'),
          });
        }

        // if there is a non severe storm today
        if (stormType === 'multiCellClusterS' || stormType === 'multiCellClusterS') {
          // The day is more likely to be mostly-cloudy to overcast
          if (_.random(1, 30) % 2) {
            return newArray.push({
              ...record,
              condition: generateNextSky('mostly-cloudy'),
            });
          }

          return newArray.push({
            ...record,
            condition: generateNextSky('overcast'),
          });
        }
      }
      // if no storm than we just take a stab
      return newArray.push({
        ...record,
        condition: generateNextSky(_.sample(SKIES)),
      });
    }

    // if no storm today we check terrain & wind for dust and sand storms
    if (terrain === 'desert' && record.wind > 24) {
      return newArray.push({
        ...record,
        condition: 'sandstorm',
      });
    }

    if (terrain === 'hills' && record.wind > 24) {
      return newArray.push({
        ...record,
        condition: 'duststorm',
      });
    }

    // we have set our first sky so now we set each new sky sticky to the previous
    // if previous is sandstorm or dustorm look back till we find something to stick with.
    let lookback = 1;
    while (newArray[newArray.length - lookback].condition === 'sandstorm' || newArray[newArray.length - lookback].condition === 'dustorm') {
      lookback += 1;
    }

    const prevRecord = newArray[newArray.length - lookback];

    return newArray.push({
      ...record,
      condition: generateNextSky(prevRecord.condition),
    });
  });

  return newArray;
}
