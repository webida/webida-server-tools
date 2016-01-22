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

var logger = require('./logger');

class AbstractProgram {

        constructor(commanderOptions) {
            this._options = commanderOptions;
            let globalOptions = commanderOptions.parent || commanderOptions;
            this._options.configPath = globalOptions.configPath || process.env.WPM_CONFIG_PATH;
            this._options.debug = globalOptions.debug || 'false';
            this._options.dryRun = globalOptions.dryRun || 'false';
            if (this._options.debug) {
                logger.level = 'debug';
                Promise.config({
                    warnings:true,
                    longStackTraces:true
                });
            }
        }

        onHelp() {
            // do nothing by default. should be overrided if program wants to add help message
        }

        _handleOptions() {
            // do nothing by default
        }

        // abstract. should implement by each cli programs action
        main() {
            let args = arguments;
            this._handleOptions()
                .then( () => this._main.apply(this, args) )
                .then( (exitCode) => process.exit(exitCode) )
                .catch(err => {
                    logger.error(this.constructor.name, err);
                    process.exit(-1);
                });
        }


        // return promise should resolve an exit code
        // should handle all error. if something is thrown, then the program has some bugs.
        _main() {
            logger.error(this.constructor.name + "#_main() is not implemented");
            Promise.resolve(-1);
        }
}

module.exports = AbstractProgram;
