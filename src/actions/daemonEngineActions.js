import path from 'path';
import Promise from 'bluebird';
import _ from 'lodash';
import alt from '../alt';
import DaemonUtil from '../utils/daemonEngineUtil';
import IPFSUtil from '../utils/daemon/ipfs';
import LibrarydUtil from '../utils/daemon/libraryd';

/*

installing codes:

0 = disabled	- disabled
1 = checking    - exsistance
2 = installing  - to bin
3 = installed   - <.<
4 = enabling    - >.>                           
5 = updating    - can be daemon or bootstrap    w/ info key
6 = syncing     - block chain                  
7 = done        - if you dont know what this means close the tab.   
8 = error       - w/ error: key for.. info.

*/


class daemonEngineActions {

    constructor() {
        this.generateActions(
            'update',

            'enabled',
            'disabled',

            'enabling'
        );
    }

    ipfs(action, params) {
        switch (action) {
            case 'enable':
                DaemonUtil.checkInstalled('ipfs')
                    .then(installed => {
                        if (installed)
                            DaemonUtil.enable({
                                id: 'ipfs',
                                args: ['daemon']
                            });
                        else
                            this.ipfs('install');
                    });
                break;
            case 'disable':
                DaemonUtil.disable('ipfs');
                break;
            case 'pinned-total':
                IPFSUtil.refreshStats(true)
                    .then(this.update);
                break;
            case 'refresh-stats':
                IPFSUtil.refreshStats()
                    .then(this.update)
                    .catch(err => {
                        if (err)
                            console.error(err)
                    });
                break;
            case 'install':
                DaemonUtil.install({
                    id: 'ipfs',
                    args: ['init']
                }).then(this.ipfs.bind(this, 'enable')).catch(err => {
                    if (err)
                        console.error(err)
                });
                break;
        }
        return false
    }

    florincoind(action, params) {
        switch (action) {
            case 'enable':
                DaemonUtil.checkInstalled('florincoind')
                    .then(installed => {
                        if (installed)
                            DaemonUtil.enable({
                                id: 'florincoind',
                                args: ['-printtoconsole']
                            });
                        else
                            this.florincoind('install');
                    });
                break;
            case 'disable':
                DaemonUtil.disable('florincoind');
                break;
            case 'install':
                DaemonUtil.install({
                        id: 'florincoind'
                    })
                    .then(() => this.florincoind('enable'))
                    .catch(console.error);
                break;
        }
        return false
    }

    libraryd(action, params) {
        switch (action) {
            case 'enable':
                DaemonUtil.checkInstalled('libraryd')
                    .then(installed => {
                        if (!installed) {
                            this.actions.libraryd('install');
                        } else
                            return LibrarydUtil.getParms();
                    })
                    .then(params => {
                        DaemonUtil.enable({
                            id: 'libraryd',
                            args: [],
                            env: {
                                F_USER: params.user,
                                F_TOKEN: params.pass
                            }
                        });
                    });
                break;
            case 'disable':
                DaemonUtil.disable('libraryd');
                break;
            case 'install':
                DaemonUtil.install({
                        id: 'libraryd'
                    }).then(this.libraryd.bind(this, 'enable'))
                    .catch(console.error);
                break;
        }
        return false
    }
}

export
default alt.createActions(daemonEngineActions);