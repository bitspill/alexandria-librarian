import _ from 'lodash';
import bitcoin from 'bitcoin';
import Promise from 'bluebird';
import path from 'path';
import fs from 'fs';
import DaemonActions from '../../actions/daemonEngineActions';
import CommonUtil from '../../utils/CommonUtil';
import {
	app, dialog
}
from 'remote';


class florinAPI extends bitcoin.Client {
	constructor(props) {
		super(props);
	}

}



export
default {
	api: florinAPI,

	loadConf(user = 'default', password = 'default') {
		return new Promise((resolve, reject) => {
			const confDir = path.join(app.getPath('appData'), 'Florincoin');
			const confFile = path.join(confDir, 'Florincoin.conf');

			let conf = [
				'rpcallowip=127.0.0.1',
				'rpcport=18322',
				'rpcallowip=127.0.0.1',
				'rpcallowip=192.168.*.*',
				'server=1',
				'daemon=1'
			].concat([
				`rpcuser=${user}`,
				`rpcpassword=${password}`
			]);

			const nodes = [
				'54.209.141.153',
				'192.241.171.45',
				'146.185.148.114',
				'54.164.167.95',
				'198.27.69.59',
				'37.187.27.4'
			];

			nodes.forEach(node => conf.push(`addnode=${node}`));

			if (CommonUtil.fileExists(confFile)) {
				const oldConf = fs.readFileSync(confFile, 'utf8');
				DaemonActions.enabling({
					id: 'florincoind',
					code: 3,
					task: 'Waiting for User Input...',
					percent: 60
				});
				dialog.showMessageBox({
					noLink: true,
					type: 'question',
					title: 'Alexandria Librarian: Information',
					message: 'Pre-Exsisting Florincoin config detected!',
					detail: 'Florincoin daemon requires new entrys to be added to your configuration file, would you like Librarian to automatically add them? (old configuration will be backed up).',
					buttons: ['Yes', 'No']
				}, code => {
					if (code === 1) {
						DaemonActions.enabling({
							id: 'florincoind',
							code: 8,
							error: 'Installation Aborted'
						});
						reject();
					} else {
						const backupPath = path.join(app.getPath('appData'), 'Florincoin', 'Florincoin.conf.backup');
						CommonUtil.copy(confFile, backupPath)
							.then(() => {
								fs.writeFile(confFile, conf.join('\n'), (err, data) => {
									if (err) {
										console.error('florincoind: Error saving configuration')
										DaemonActions.enabling({
											id: 'florincoind',
											code: 8,
											error: 'Error saving configuration'
										});
										reject(err);
									}
									resolve();
								});
							})
							.catch(err => {
								DaemonActions.enabling({
									id: 'florincoind',
									code: 8,
									error: 'Problem backing up pre-exsisting configuration; Installation Aborted'
								});
								reject(err);
							})
					}
				});
			} else {
				if (!fs.existsSync(confDir)) fs.mkdirSync(confDir);
				fs.writeFile(confFile, conf.join('\n'), (err, data) => {
					if (err) {
						DaemonActions.enabling({
							id: 'florincoind',
							code: 8,
							error: 'Error saving configuration'
						});
						reject(err);
					}
					resolve();
				});
			}
		});
	}
}