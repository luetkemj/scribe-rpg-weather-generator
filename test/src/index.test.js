import should from 'should';
import * as weatherGenerator from '../../src';

describe('weatherGenerator', () => {
  it('should have the correct number of exports', () => {
    should(Object.keys(weatherGenerator.default).length).equal(0);
  });
});
