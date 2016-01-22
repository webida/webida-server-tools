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

var logger = require('../common/logger');
var AbstractProgram = require('../common/AbstractProgram.js');

class TestProgram extends AbstractProgram {

    constructor(commanderOptions) {
        super(commanderOptions);
    }

    onHelp() {
        console.log('  test program aux help - need some helps?' );
    }

    _handleOptions() {
        return new Promise( (resolve, reject) => {
            if (!this._options.testOption2) {
                reject(new Error('missing mandatory option --test-option2'));
            } else {
                resolve();
            }
        });
    }
    // return promise should resolve an exit code
    // should handle all error. if something is thrown, then the program has some bugs.
    _main(m1, m2, others) {
        return new Promise((resolve, reject) => {
            console.log('test : m1 == ', m1);
            console.log('test : m2 == ', m2);
            console.log('test : others == ', others);
            console.log('test : option test-option1 ==', this._options.testOption1);
            console.log('test : option test-option2 ==', this._options.testOption2);
            //console.log('test options ==', this._options);
            throw new Error('intended error thrown');
        });
    }
}

module.exports = TestProgram;
