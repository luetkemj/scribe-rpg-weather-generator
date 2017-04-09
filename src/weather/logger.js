import debugCaller from 'debug-caller';

// enable project namespace to print log messages by default
debugCaller.debug.enable('scribe*');

module.exports = function exports() {
  // set a depth of 2 to avoid using this file within debug statements
  // (since this is just a passthrough for logging)
  return debugCaller('scribe*', {
    depth: 2,
    logColor: 6,
  });
};
