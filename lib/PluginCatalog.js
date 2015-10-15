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

var _PLUGIN_DIR_PREFIX = 'plugins/';

var fs = require('fs');
var util = require('util');

var Promise = require('promise');


// Currently, package catalog is written in plugin-settins.json file
// We need a better module catalog that handles plugin metadata
// for the next generation of Webida Plugins

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

    addTo: function(prop, arr, withPrefix) {
        if (Array.isArray(arr)) {
            for (var i in arr) {
                var key = arr[i];
                var value = arr[i];
                // from plugin-settings.json
                // key, value is prefixed with 'plugins/'
                if (withPrefix) {
                    key = key.slice(_PLUGIN_DIR_PREFIX.length);
                } else {
                    if (value.indexOf(_PLUGIN_DIR_PREFIX) !== 0) {
                        value = _PLUGIN_DIR_PREFIX + value;
                    }
                }
                this[prop][key] = value;
            }
        }
    },

    _import: function (json) {
        this.addTo('plugins', json['plugins'], true);
        this.addTo('starters', json['start-plugins'], true);
        this.addTo('disabled', json['disabled-plugins'], true);
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
