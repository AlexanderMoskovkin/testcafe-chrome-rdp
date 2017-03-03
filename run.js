const createTestCafe = require('testcafe');
const browser        = require('./browser');

let testcafe         = null;
let runner           = null;
let error            = null;
let failedTests      = 0;
let browserTab       = null;
let remoteConnection = null;

createTestCafe('localhost', 1337, 1338)
    .then(tc => {
        testcafe = tc;

        runner = testcafe.createRunner();

        return testcafe.createBrowserConnection();
    })
    .then(rc => {
        remoteConnection = rc;

        return browser.open(remoteConnection.url);
    })
    .then(tab => {
        browserTab = tab;

        return runner
            .src('test.js')
            .browsers(remoteConnection)
            .run();
    })
    .then(failed => {
        failedTests = failed;
    })
    .catch(err => {
        console.log(err);
        error = err;
    })
    .then(() => {
        if (testcafe)
            testcafe.close();

        return browser.close(browserTab);
    })
    .then(() => {
        process.exit(failedTests || error ? 1 : 0);
    });
