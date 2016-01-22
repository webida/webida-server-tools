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

var fs = Promise.promisifyAll(require('fs-extra'));
var globAsync = Promise.promisify(require('glob'));
var _ = require('lodash');

var logger = require('../common/logger.js');

class GlobbingLoader {

    constructor(globPattern, globOptions, filter) {
        this.globPattern = globPattern;
        this.globOptions = globOptions;
    }

    loadAll() {
        return new Promise((resolve, reject) => {
            let allPaths;
            globAsync(this.globPattern, this.globOptions)
                .then(paths => {
                    logger.debug('loader found files ', paths);
                    allPaths = paths;
                    return Promise.map(paths, this.loadData_.bind(this));
                })
                .then((objects) => {
                    // now we have to build a map from paths to objects
                    let result = this._buildResultMap(allPaths, objects);
                    _.forOwn(result, (data, path) => {
                        if(!this.filterResult_(path, data)) {
                            delete result[path];
                            logger.info('loader filtered out %s', path, null);
                        } else {
                            logger.debug('loader added path %s ', path, null);
                        }
                    });
                    logger.debug('loaded files = %j', Object.keys(result), null);
                    resolve(result);
                })
                .catch(err => {
                    logger.error('loader met error ', err);
                    reject(err);
                })
        });
    }

    _buildResultMap(paths, objects) {
        let ret = {};
        for (let i=0; i < paths.length; i++) {
            const path = paths[i];
            const data = objects[i];
            ret[path] = data;
        }
        return ret;
    }

    // should return boolean
    filterResult_(relativePath, data) {
       return true;
    }

    // should return a promise or data
    loadData_(relativePath) {
        return fs.readJsonAsync(relativePath);
    }
}

module.exports = GlobbingLoader;

