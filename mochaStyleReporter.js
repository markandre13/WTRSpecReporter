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

function outputSuite(suite, indent = '') {
    let results = `${colour.BrightBlue}${suite.name}\n`
    results += `${suite.tests
        .map(test => {
            let result = indent
            switch (test instanceof Object) {
                case test.skipped:
                    result += `${colour.grey} - ${test.name}`
                    break
                case test.passed:
                    result += `${colour.green} ✓ ${colour.reset}${colour.bright}${test.name}`
                    break
                default:
                    result += `${colour.red} ✕ ${test.name}`
                    break
            }
            switch (test instanceof Object) {
                case test.duration > 100:
                    result += ` ${colour.reset}${colour.red}(${test.duration}ms)`
                    break
                case test.duration > 50:
                    result += ` ${colour.reset}${colour.yellow}(${test.duration}ms)`
                    break
                default:
                    result += ``
                    break
            }
            result += `${colour.reset}`
            return result
        })
        .join('\n')}\n`

    if (suite.suites) {
        results += suite.suites
            .map(suiteIn => outputSuite(suiteIn, `${indent}`))
            .join('\n')
    }
    return results
}

async function generateTestReport(testFile, sessionsForTestFile) {
    let results = ''
    sessionsForTestFile.forEach(session => {
        results += session.testResults.suites
            .map(suite => outputSuite(suite, ''))
            .join('\n\n')
    })
    return results
}

function testDuration() {
    // const delta = moment.duration(moment() - new Date(startTime));
    // const seconds = delta.seconds();
    // const millis = delta.milliseconds();
    const seconds = 0
    const millis = 0
    return `${seconds}.${millis} secs`
  }

// sometimes suites are spread over several files, hence we collect them before generating the report
const allSuitesAndTests = {
    allSuites: new Map(),
    allTests: new Map()
}

let numPassedTests = 0
let numFailedTests = 0
let numSkippedTests = 0

function collectSuitesAndTests(sessions) {
    sessions.forEach( session => collectSuitesAndTestsHelper(session.testResults, allSuitesAndTests) )
}

function collectSuitesAndTestsHelper(testResults, suiteInfo) {
    testResults.suites.forEach( suite => {
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
    testResults.tests.forEach( test => {
        // name: string, duration: number, passed: boolean
        suiteInfo.allTests.set(test.name, test)
    })
}

function reportAllSuitesAndTests(suiteInfo, indent = "") {
    suiteInfo.allTests.forEach( (test, name) => {
        let status = "failed"
        if (test.passed) {
            ++numPassedTests
            status = "passed"
        } else
        if (test.skipped) {
            status = "skipped"
            ++numSkippedTests
        } else {
            ++numFailedTests
        }
        console.log(`${indent}${getStatus(status, name)}`)
    })
    suiteInfo.allSuites.forEach( (childSuiteInfo, name) => {
        console.log(`${indent}${colour.boldWhite}${name}${colour.reset}`)
        reportAllSuitesAndTests(childSuiteInfo, `${indent}  `)
    })
}

function getStatus(status, title = "") {
    switch (status) {
      case 'passed':
        return `${colour.green}✔ ${title}${colour.reset}`;
      case 'failed':
        return `${colour.red}✖ ${title}${colour.reset}`;
      case 'skipped':
        return `${colour.grey}✖ ${title}${colour.reset}`;
    }
  }

module.exports = function mochaStyleReporter({
    reportResults = true,
    reportProgress = true,
} = {}) {
    return {
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
            collectSuitesAndTests(sessions)
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

            // console.log(testRun)
            // console.log(sessions)
            // console.log(testCoverage)
            // console.log(focusedTestFile)

            if (testCoverage?.summary) {
                console.log(`SUMMARY:`)
                if (testCoverage?.summary?.branchesTrue?.pct === 'Unknown') {
                    delete testCoverage.summary.branchesTrue
                }
                console.table(testCoverage.summary)
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
    }
}
