process.env.NODE_ENV = 'test';
const {defaultReporter} = require('@web/test-runner');
const specReporter = require('./spec-reporter.js');
const mochaStyleReporter = require('./mochaStyleReporter.js');

module.exports = {
  plugins: [require('@snowpack/web-test-runner-plugin')()],
  reporters: [
    // defaultReporter({ reportTestResults: false, reportTestProgress: true }),
    mochaStyleReporter(),
  ],
};
