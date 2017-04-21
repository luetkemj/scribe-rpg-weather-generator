import * as _ from 'lodash';
import moment from 'moment';
import {
  BEAUFORT_SCALE,
  PRECIP_SIZE_HAIL,
  PRECIP_SIZE_SNOW,
  PRECIP_SIZE_RAIN } from './weather.constants';

export function temporalEstimation(milliseconds) {
  const hours = moment.duration(milliseconds).asHours() % 24;

  if (_.inRange(hours, 0, 0.25)) {
    return 'midnight';
  }

  if (_.inRange(hours, 0, 6)) {
    return 'early morning';
  }

  if (_.inRange(hours, 6, 7)) {
    return 'dawn';
  }

  if (_.inRange(hours, 7, 11.75)) {
    return 'morning';
  }

  if (_.inRange(hours, 11.75, 12.25)) {
    return 'noon';
  }

  if (_.inRange(hours, 12.25, 17)) {
    return 'afternoon';
  }

  if (_.inRange(hours, 17, 18)) {
    return 'evening';
  }

  if (_.inRange(hours, 18, 19)) {
    return 'dusk';
  }

  if (_.inRange(hours, 19, 23.75)) {
    return 'night';
  }

  return 'midnight';
}

export function beaufortScale(wind) {
  if (_.inRange(wind, 0, 1)) {
    return BEAUFORT_SCALE[0];
  }
  if (_.inRange(wind, 1, 4)) {
    return BEAUFORT_SCALE[1];
  }
  if (_.inRange(wind, 4, 8)) {
    return BEAUFORT_SCALE[2];
  }
  if (_.inRange(wind, 8, 13)) {
    return BEAUFORT_SCALE[3];
  }
  if (_.inRange(wind, 13, 18)) {
    return BEAUFORT_SCALE[4];
  }
  if (_.inRange(wind, 18, 25)) {
    return BEAUFORT_SCALE[5];
  }
  if (_.inRange(wind, 25, 31)) {
    return BEAUFORT_SCALE[6];
  }
  if (_.inRange(wind, 31, 39)) {
    return BEAUFORT_SCALE[7];
  }
  if (_.inRange(wind, 39, 47)) {
    return BEAUFORT_SCALE[8];
  }
  if (_.inRange(wind, 47, 55)) {
    return BEAUFORT_SCALE[9];
  }
  if (_.inRange(wind, 55, 64)) {
    return BEAUFORT_SCALE[10];
  }
  if (_.inRange(wind, 64, 73)) {
    return BEAUFORT_SCALE[11];
  }

  return BEAUFORT_SCALE[12];
}

export function feelsLikeNotes(T) {
  const notes = {};

  // Source: https://en.wikipedia.org/wiki/Heat_index#Effects_of_the_heat_index_.28shade_values.29
  if (T > 130) {
    notes.warning = 'Extreme Danger';
    notes.description = 'Extreme danger: heat stroke is imminent.';
  }

  if (_.inRange(T, 105, 131)) {
    notes.warning = 'Danger';
    notes.description = 'Danger: heat cramps and heat exhaustion are likely; heat stroke is probable with continued activity.';
  }

  if (_.inRange(T, 90, 106)) {
    notes.warning = 'Extreme Caution';
    notes.description = 'Extreme caution: heat cramps and heat exhaustion are possible. Continuing activity could result in heat stroke.';
  }

  if (_.inRange(T, 80, 91)) {
    notes.warning = 'Caution';
    notes.description = 'Caution: fatigue is possible with prolonged exposure and activity. Continuing activity could result in heat cramps.';
  }

  // Source: http://www.math.wichita.edu/~richardson/windchill.html
  if (_.inRange(T, 30, 51)) {
    notes.warning = 'Mild Caution';
    notes.description = 'Chilly. Generally unpleasant. Hypothermia possible but unlikely.';
  }

  if (_.inRange(T, 15, 30)) {
    notes.warning = 'Caution';
    notes.description = 'Cold. Unpleasant. Hypothermia possible.';
  }

  if (_.inRange(T, 0, 15)) {
    notes.warning = 'Extreme Caution';
    notes.description = 'Very cold. Very unpleasant. Hypothermia likely.';
  }

  if (_.inRange(T, -20, 0)) {
    notes.warning = 'Mild Danger';
    notes.description = 'Bitter cold. Frostbite possible.';
  }

  if (_.inRange(T, -60, -20)) {
    notes.warning = 'Danger';
    notes.description = 'Extremely cold. Frostbite likely. Outdoor activty becomes dangerous.';
  }

  if (T < -60) {
    notes.warning = 'Extreme Danger';
    notes.description = 'Frigidly cold. Exposed flesh will freeze within 30 seconds.';
  }

  return notes;
}

export function getPrecipSize(precip) {
  if (precip === 'hail') {
    return _.sample(PRECIP_SIZE_HAIL);
  }

  if (precip === 'snow') {
    return _.sample(PRECIP_SIZE_SNOW);
  }

  if (precip === 'rain') {
    return _.sample(PRECIP_SIZE_RAIN);
  }

  return null;
}
