process.env.NODE_ENV = 'test';
const { esbuildPlugin } = require('@web/dev-server-esbuild')
const {defaultReporter} = require('@web/test-runner');
const specReporter = require('./spec-reporter.js');
const mochaStyleReporter = require('./mochaStyleReporter.js');

module.exports = {
    plugins: [esbuildPlugin({ ts: true, target: 'esnext' })],
//   plugins: [require('@snowpack/web-test-runner-plugin')()],
  reporters: [
    defaultReporter({ reportTestResults: false, reportTestProgress: true }),
    mochaStyleReporter(),
  ],
};
