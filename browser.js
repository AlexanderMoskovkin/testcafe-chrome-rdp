const CDP          = require('chrome-remote-interface');
const browserTools = require('testcafe-browser-tools');

function getClient ({ port, tab }) {
    return new Promise((resolve, reject) => {
        CDP({ port, tab }, client => {
            resolve(client);
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function createNewTab ({ port, url }) {
    return new Promise((resolve, reject) => {
        CDP.New({ port: port, url: url }, (err, tab) => {
            if (err)
                reject(err);
            else
                resolve(tab);
        });
    });
}

const remoteDebuggingPort = 9225;

exports.open = function (url) {
    let client    = null;
    let Emulation = null;
    let Network   = null;
    let tab       = null;

    return getClient({ port: remoteDebuggingPort })
        .catch(() => {
            return browserTools.getBrowserInfo('chrome')
                .then(chromeInfo => {
                    chromeInfo.cmd += ` --remote-debugging-port=${remoteDebuggingPort}`;

                    return browserTools.open(chromeInfo, '');
                });
        })
        .then(() => createNewTab({ port: remoteDebuggingPort, url }))
        .then(t => {
            tab = t;
            return getClient({ port: remoteDebuggingPort, tab })
        })
        .then(cl => {
            client    = cl;
            Emulation = client.Emulation;
            Network   = client.Network;

            Emulation.setDeviceMetricsOverride({
                width:             320,
                height:            568,
                deviceScaleFactor: 1,
                fitWindow:         false,
                mobile:            true
            });
        })
        .then(() => {
            return Emulation.setTouchEmulationEnabled({
                enabled:       true,
                configuration: 'mobile'
            });
        })
        .then(() => {
            return Network.enable();
        })
        .then(() => {
            return Network.setUserAgentOverride({
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
            });
        })
        .then(() => {
            return tab;
        })
        .catch((err) => {
            console.error(`ERROR: ${err.message}`);
            client.close();
            throw err;
        });
};

exports.close = function (tab) {
    return new Promise(resolve => {
        CDP.Close({ id: tab.id, port: remoteDebuggingPort }, () => {
            resolve();
        });
    });
};
