/*
 * Copyright (c) 2016 S-Core Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
var child_process = require('child_process');
var util = require('util');
var logger = require('./logger');

class ShellCommandResult {
    constructor() {
        this.code = 0;
        this.signal = 0;
        this.stdout = 'flowed';
        this.stderr = 'flowed';
        this.error = undefined;
    }
}

class ShellCommandRunner {

    // options are same to child_process.exec arguments
    // see https://nodejs.org/api/child_process.html
    // additional options are
    constructor(command, args, options) {
        this.command = command || null;
        this.args = args || [];
        this.options = options || {};
        this.shellCommand = this._makeShellCommand();
        this.pid = 0;
    }

    spawn(resolveAlways) {
        let result = new ShellCommandResult();
        return new Promise( (resolve, reject) => {
            this.options.stdio = this.options.stdio || 'inherit';
            let spawned = child_process.spawn(this.command, this.args, this.options);
            this.pid = spawned.pid;
            logger.debug("spawnned shell command %s (%d) with args %j, options %j",
                this.command, this.pid, this.args, this.options, {});
            spawned.on('error', (err) => {
                logger.error('spawned child %d got error', spawned.pid, err );
                result.error = err;
            });
            spawned.on('close',  (code, signal) => {
                logger.debug('spawned child %d completed with exit code %d, signal %d', spawned.pid, code, signal,{} );
                this._logFinish(code);
                result.code = code;
                result.signal = signal;
                if(!resolveAlways && (code || result.error)) {
                    reject(result);
                } else {
                    resolve(result);
                }
            });
            this._logStart();
        });
    }

    exec(resolveAlways) {
        let result = new ShellCommandResult();
        return new Promise( (resolve, reject) => {
            let executed = child_process.exec(this.shellCommand, this.options, (err, stdout, stderr) => {
                this._logFinish(err? err.code : 0);
                result.stdout = stdout;
                result.stderr = stderr;
                if (err) {
                    result.error = err;
                    result.code = err.code;
                    result.signal = err.signal;
                    if (resolveAlways) {
                        logger.debug("ignoring error %j", err);
                        resolve(err);
                    } else {
                        reject(result);
                    }
                } else {
                    resolve (result);
                }
            });
            this.pid = executed.pid;
            logger.debug('executed shell command [%s] with options %j', this.shellCommand, this.options);
            this._logStart();

        });
    }

    _logStart() {
        logger.info("start running command %s (pid %d)", this.shellCommand, this.pid, null);
    };

    _logFinish(exitCode) {
        logger.info("finish running command %s (pid %d, exit code %d)", this.command, this.pid, exitCode, null);
    }

    _makeShellCommand() {
        let argv = [this.command];
        for(let arg of this.args) {
            if (arg.indexOf(' ') >=0) {

                arg = '"' + arg + '"';
            }
            argv.push(arg);
        }
        return argv.join(' ');
    }
}

module.exports = ShellCommandRunner;