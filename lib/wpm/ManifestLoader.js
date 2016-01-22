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

var path = require('path');

var fs = Promise.promisifyAll(require('fs-extra'));
var _ = require('lodash');

var logger = require('../common/logger');
var GlobbingLoader = require('../common/GlobbingLoader');

class ManifestLoader extends GlobbingLoader {

    constructor(basePath) {
        let globPattern = ManifestLoader.MANIFEST_FILE_NAME;
        let globOptions =  {
            matchBase:true,
            cwd: basePath,
            root: basePath,
            ignore : ['**/node_modules/**', '**/bower_components/**'],
            nodir : true,
            nosort : true,
            nonull : false
        };
        super(globPattern, globOptions);
        this.basePath = basePath;
    }

    loadData_(relativePath) {
        let filePath = path.resolve(this.basePath, relativePath);
        logger.debug('loading ' + filePath);
        return fs.readJsonAsync(filePath);
    }

    static get MANIFEST_FILE_NAME() {
        return 'package.json';
    }
}

module.exports = ManifestLoader;