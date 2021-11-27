process.env.NODE_ENV = 'test';
const WTRSpecReporter = require('./WTRSpecReporter.js');

module.exports = {
  plugins: [require('@snowpack/web-test-runner-plugin')()],
  reporters: [
    WTRSpecReporter({ reportTestResults: true, reportTestProgress: true }),
  ],
};
