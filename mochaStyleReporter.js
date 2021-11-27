const slow = 75;

// ANSI Escape Sequences
const colour = {
    reset: '\x1b[0m',

    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    boldBlack: '\x1b[30;1m',
    boldRed: '\x1b[31;1m',
    boldGreen: '\x1b[32;1m',
    boldYellow: '\x1b[33;1m',
    boldBlue: '\x1b[34;1m',
    boldMagenta: '\x1b[35;1m',
    boldCyan: '\x1b[36;1m',
    boldWhite: '\x1b[37;1m',

    bold: '\x1b[1m',
    underline: '\x1b[4m',
    underline: '\x1b[4m',
    noUnderline: '\x1b[24m',
    reversed: '\x1b[7m',

    grey: '\x1b[90m',
    BrightBlue: '\x1b[94m',
}

// FIXME: use total run time instead of sum of test durations

// sometimes suites are spread over several files, hence we collect them before generating the report
// WARNING: in case of duplicates only one will be seen without a warning that there were duplicates
let allSuitesAndTests, numPassedTests, numFailedTests, numSkippedTests, totalDuration

function collectSuitesAndTests(sessions) {
    sessions.forEach(session => collectSuitesAndTestsHelper(session.testResults, allSuitesAndTests))
}

function collectSuitesAndTestsHelper(testResults, suiteInfo) {
    testResults.suites.forEach(suite => {
        // name: string, suites[], tests: []
        let childSuiteInfo = suiteInfo.allSuites.get(suite.name)
        if (childSuiteInfo === undefined) {
            childSuiteInfo = {
                allSuites: new Map(),
                allTests: new Map()
            }
            suiteInfo.allSuites.set(suite.name, childSuiteInfo)
        }
        collectSuitesAndTestsHelper(suite, childSuiteInfo)
    })
    testResults.tests.forEach(test => {
        // name: string, duration: number, passed: boolean
        suiteInfo.allTests.set(test.name, test)
    })
}

function reportAllSuitesAndTests(suiteInfo, indent = "") {
    suiteInfo.allTests.forEach((test, name) => {
        if (test.duration !== undefined) {
            totalDuration += test.duration
        }
        let status = "failed"
        if (test.passed) {
            ++numPassedTests
            status = "passed"
        } else {
            if (test.skipped) {
                status = "skipped"
                ++numSkippedTests
            } else {
                ++numFailedTests
            }
        }
        console.log(`${indent}${getStatus(status, name)}${getDuration(test.duration)}`)
    })
    suiteInfo.allSuites.forEach((childSuiteInfo, name) => {
        console.log(`${indent}${colour.boldWhite}${name}${colour.reset}`)
        reportAllSuitesAndTests(childSuiteInfo, `${indent}  `)
    })
}

function reportFailedTests(suiteInfo, path = "") {
    suiteInfo.allTests.forEach((test, name) => {
        if (test.error) {
            console.log(`  ${colour.red}∙ ${path} > ${name}${colour.reset}`)
            console.log(`    ${test.error.name}: ${test.error.message}`)
            console.log(`    ${colour.boldWhite}Expected:${colour.green} ${test.error.expected}${colour.reset}`)
            console.log(`    ${colour.boldWhite}Actual  :${colour.red} ${test.error.actual}${colour.reset}`)
            const stack = test.error.stack.replace(/\n/g, "\n  ")
            console.log(`  ${stack}`)
            console.log()
        }
    })
    suiteInfo.allSuites.forEach((childSuiteInfo, name) => {
        reportFailedTests(childSuiteInfo, path.length === 0 ? name : `${path} > ${name}`)
    })
}

function getStatus(status, title = "") {
    switch (status) {
        case 'passed':
            return `${colour.green}✔ ${title}${colour.reset}`
        case 'failed':
            return `${colour.red}✖ ${title}${colour.reset}`
        case 'skipped':
            return `${colour.grey}✖ ${title}${colour.reset}`
    }
}

function getDuration(duration) {
    if (duration >= slow)
      return ` ${colour.red}(${duration}ms)${colour.reset}`;
    if (duration >= slow / 2)
      return ` ${colour.yellow}(${duration}ms)${colour.reset}`;
    return "";
}

function testDuration() {
    const seconds = Math.floor(totalDuration / 1000);
    const millis = totalDuration % 1000;
    // const delta = moment.duration(moment() - new Date(startTime));
    // const seconds = delta.seconds();
    // const millis = delta.milliseconds();
    // const seconds = 0
    // const millis = 0
    return `${seconds}.${millis} secs`
}

module.exports = function mochaStyleReporter({
    reportResults = true,
    reportProgress = true,
} = {}) {
    return {
        /**
         * Called once when the test runner starts.
         */
        start({ config, sessions, testFiles, browserNames, startTime }) {
            console.log()
            console.log(`${colour.boldWhite}${colour.underline}START:${colour.reset}`)
            console.log()
        },

        /**
         * Called when a test is re-run in watch mode.
         */
        onTestRunStarted({ testRun }) {
            console.log()
            console.log(`${colour.boldWhite}${colour.underline}START:${colour.reset}`)
            console.log()
        },

        /**
         * Called once when the test runner stops. This can be used to write a test
         * report to disk for regular test runs.
         */
        stop({ sessions, testCoverage, focusedTestFile }) {
            // console.log()
            // console.log(`${colour.boldWhite}${colour.underline}STOP:${colour.reset}`)
            // console.log()
        },

        /**
         * Called when a test run is finished. Each file change in watch mode
         * triggers a test run. This can be used to report the end of a test run,
         * or to write a test report to disk in watch mode for each test run.
         *
         * @param testRun the test run
         */
        onTestRunFinished({ testRun, sessions, testCoverage, focusedTestFile }) {
            numPassedTests = 0
            numSkippedTests = 0
            numFailedTests = 0
            allSuitesAndTests = {
                allSuites: new Map(),
                allTests: new Map()
            }
            totalDuration = 0

            collectSuitesAndTests(sessions)

            console.log()
            reportAllSuitesAndTests(allSuitesAndTests)

            const numTotalTestSuites = allSuitesAndTests.allSuites.size
            const numTotalTests = numPassedTests + numSkippedTests + numFailedTests
            console.log()
            console.log(`${colour.green}Finished ${numTotalTests} tests in ${numTotalTestSuites} test suites in ${testDuration()}`)
            console.log()
            console.log(`${colour.boldWhite}${colour.underline}SUMMARY:${colour.reset}`)
            console.log()
            if (numPassedTests !== 0) {
                console.log(getStatus("passed", `${numPassedTests} tests completed`))
            }
            if (numSkippedTests !== 0) {
                console.log(getStatus("skipped", `${numSkippedTests} tests skipped`))
            }
            if (numFailedTests !== 0) {
                console.log(getStatus("failed", `${numFailedTests} tests failed`))
            }
            console.log()

            if (numFailedTests !== 0) {
                console.log(`${colour.boldWhite}${colour.underline}FAILED TESTS:${colour.reset}`)
                console.log()
                reportFailedTests(allSuitesAndTests)
                console.log()
            }

            if (testCoverage?.summary) {
                console.log(`${colour.boldWhite}${colour.underline}COVERAGE:${colour.reset}`)
                if (testCoverage?.summary?.branchesTrue?.pct === 'Unknown') {
                    delete testCoverage.summary.branchesTrue
                }
                console.table(testCoverage.summary)
                console.log()
            }
        },

        /**
         * Called when results for a test file can be reported. This is called
         * when all browsers for a test file are finished, or when switching between
         * menus in watch mode.
         *
         * If your test results are calculated async, you should return a promise from
         * this function and use the logger to log test results. The test runner will
         * guard against race conditions when re-running tests in watch mode while reporting.
         *
         * @param logger the logger to use for logging tests
         * @param testFile the test file to report for
         * @param sessionsForTestFile the sessions for this test file. each browser is a
         * different session
         */
        async reportTestFileResults({ logger, sessionsForTestFile, testFile }) {
            if (!reportResults) {
                console.log(`pending ${testFile}`)
                return
            }

            // console.log(logger)
            // console.log(testFile)
            // console.log(sessionsForTestFile)

            // const testReport = await generateTestReport(testFile, sessionsForTestFile)

            // logger.group()
            console.log(`ran ${testFile}`)
            // console.log(testReport)
            // logger.groupEnd()
            // console.log(testReport)
        },

        /**
         * Called when test progress should be rendered to the terminal. This is called
         * any time there is a change in the test runner to display the latest status.
         *
         * This function should return the test report as a string. Previous results from this
         * function are overwritten each time it is called, they are rendered "dynamically"
         * to the terminal so that the progress bar is live updating.
         */
        // getTestProgress({
        //     config,
        //     sessions,
        //     testFiles,
        //     startTime,
        //     testRun,
        //     focusedTestFile,
        //     testCoverage,
        // }) {
        //     if (!reportProgress) {
        //         return
        //     }

        //     return `Current progress: 21%`
        // },
    }
}
