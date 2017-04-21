const utils = jest.genMockFromModule('../utils');

utils.whipWind = () => 3;

module.exports = utils;
