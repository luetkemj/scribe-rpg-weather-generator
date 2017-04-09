import { generateWeather } from '../src/weather/weather.controller';

const generator = require('../src/weather/tables.json');

generateWeather(generator.generator, 'tropical', 'plains', 'summer', 'july', 0);
