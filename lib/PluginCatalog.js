/*
 * Copyright (c) 2015 S-Core Co., Ltd.
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


var fs = require('fs');
var util = require('util');

var Promise = require('promise');

var REQUIREJS_PREFIX= 'plugins/';

// Currently, package catalog is written in plugin-settins.json file
// We need a better module catalog that handles plugin metadata
// for the next generation of Webida Plugin System

function PluginCatalog() {
    this.plugins = {};
    this.starters = {};
    this.disabled = {};
}

PluginCatalog.prototype = {

    remove: function _removeFrom(plugin) {
        delete this.plugins[plugin];
        delete this.starters[plugin];
        delete this.disabled[plugin];
    },

    addFromManifest: function (prop, arr, packageId) {
        var target = this[prop];
        var dirPrefix = packageId + '/';
        if (Array.isArray(arr)) {
            arr.forEach(function (mod) {
                target[mod] = REQUIREJS_PREFIX + packageId + '/' + mod;
            });
        }
    },

    // mod[?] = 'plugins/package.id/plugin.id
    _addFromCatalog: function (prop, arr) {
        var target = this[prop];
        if (Array.isArray(arr)) {
            arr.forEach(function (mod) {
                var pos = mod.indexOf('/', REQUIREJS_PREFIX.length + 1);
                var key = mod.slice(pos + 1);
                target[key] = mod;
            });
        }
    },

    _import: function (json) {
        this._addFromCatalog('plugins', json['plugins']);
        this._addFromCatalog('starters', json['start-plugins']);
        this._addFromCatalog('disabled', json['disabled-plugins']);
    },

    getArrayFrom: function (source) {
        var ret = [];
        for (var key in source) {
            ret.push(source[key]);
        }
        return ret.sort();
    },

    _export : function () {
        var json = {};
        json['plugins'] = this.getArrayFrom(this.plugins);
        json['start-plugins'] = this.getArrayFrom(this.starters);
        json['disabled-plugins'] = this.getArrayFrom(this.disabled);
        return json;
    },

    load : function loadPluginSettings(cli, path) {
        var self =this;
        if (!fs.existsSync(path)) {
            cli.info(path + " does not exist. Will create new one");
            return Promise.resolve();
        }

        return new Promise( function (resolve, reject) {
            fs.readFile(path, function (err, data) {
                if (err) {
                    return reject(err);
                }
                cli.info("loaded plugin settings file from " + path);
                var parsed = JSON.parse(data);
                cli.debug("loaded contents " + util.inspect(parsed));
                self._import(parsed);
                return resolve();
            });
        });
    },

    save : function savePluginSettings(cli, path) {
        var self = this;
        var data = JSON.stringify(this._export(), null, 4);
        return new Promise( function (resolve, reject) {
            fs.writeFile(path, data, function (err) {
                if (err) {
                    return reject(err);
                }
                cli.info("saved plugin settings file to " + path);
                return resolve();
            });
        });
    }
}

module.exports = PluginCatalog;
