#!/bin/env node

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

var child_process = require('child_process'),
    fs = require('fs'),
    path = require('path'),
    util = require('util');

var cli = require('cli'),
    Promise = require('promise');

var PluginCatalog = require('./lib/PluginCatalog.js');

var PROGRAM_NAME = 'webida-packabge-manager'
var PROGRAM_VERSION = '0.2.0';
var CATALOG_FILE = 'plugin-settings.json';
var PACKAGE_DESCRIPTOR_FILE = "webida-package.json";

cli.setApp(PROGRAM_NAME, PROGRAM_VERSION);
cli.enable('help', 'version', 'status');
cli.option_width = 25;
cli.width = 80;

// TODO : add 'help' command to support : webida-pacakge-manager help install

cli.parse( {
    'catalog' : ['a', 'catalog file name', 'string', CATALOG_FILE],
    'conf' : ['c', 'configuration directory path where catalog file exists', 'dir' ],
    'install-path' : ['i', 'package install directory ', 'dir', '.'],
    'branch' : ['b', 'use specific branch of source repository to install', 'string', 'master'],
    'tmp-path' : ['t', 'temporary directory to save git repository before install', 'string', '/tmp']
}, ['install', 'update', 'remove']);

cli.main(function(args, options) {
    this.debug("cli command " + cli.command);
    this.debug("starting options \n" + util.inspect(options));

    // parse arguments build command
    this.debug("starting args " + util.inspect(args));
    switch(cli.command) {
        case 'install':
            doInstall(cli, options, args);
            break;
        case 'remove':
            doRemove(cli, options, args);
        default:
            cli.error("Sorry, not implemented yet.");
            break;
    }

});

function handleInstallError(err, tmpDir) {
    if (tmpDir) {
        cli.exec("rm -fr " + tmpDir, function () {
            cli.info("removed dir " + tmpDir );
            cli.fatal(err.stack ? err.stack : err);
        }, function () {
            cli.fatal(err.stack ? err.stack : err);
            cli.error('& ONE MORE THING! Garbage collection failed. Remove manually ' + tmpDir);
        });
    } else {
        cli.fatal(err.stack ? err.stack : err);
    }
}

function runCommand(cli, command, params, ignoreFail) {
    cli.info(util.format("running command %s %s", command, util.inspect(params)));
    var proc = child_process.spawn(command, params, {stdio: 'inherit'});
    return new Promise(function (resolve, reject) {
        proc.on('exit', function (code, signal) {
            cli.debug(command + ' process exit code ' + code + " signal " + signal);
            if (ignoreFail && code != 0) {
                var msg = util.format("%s failed, exit code %s ", command, signal);
                if (signal)
                    msg += " signal " + signal;
                return reject( new Error(msg) );
            } else {
                return resolve();
            }
        });
    });
}

function installPackage(descriptor, options, packageDir, fromLocal) {
    cli.debug("got descriptor" + util.inspect(descriptor));
    var installTo = options['install-path'] + path.sep + descriptor.id;
    if (fs.existsSync(installTo)) {
        throw new Error("already have existing package at " + installTo);
    }
    // TODO : add schema check of webida-package.json
    var manifest = descriptor.manifest;
    var command = util.format("%s %s %s",
        (fromLocal ? "cp -Rf" : "mv"),
        packageDir, installTo);
    return new Promise(function (resolve, reject) {
        cli.debug("installation command " + command);
        cli.exec(command, function () {
            return resolve(manifest);
        }, function (err) {
            return reject(err);
        });
    })
}

function cleanUpOldTmp(cli, tmpDir) {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(tmpDir) ) {
            cli.exec("rm -fr " + tmpDir, function () {
                cli.info("removed un-clenaed tmp dir " + tmpDir );
                resolve();
            }, function (err) {
                cli.fatal('could not remove old tmp dir ' + tmpDir);
            });
        } else {
            cli.info("no old tmp " + tmpDir);
            return resolve();
        }
    });
}

function doInstall(cli, options, args) {
    if (args.length < 1) {
        cli.fatal("need url argument. run with -h to see usage ");
    }

    var tmpPath = options['tmp-path'];
    var catalog = new PluginCatalog();
    var tmpDir = path.resolve(tmpPath + '/cloning');
    var descriptor;
    var cwd = process.cwd();
    var fromLocal = false;
    var catalogPath = options.conf + path.sep + options.catalog;

    cleanUpOldTmp(cli, tmpDir).then(function () {
        return catalog.load(cli, catalogPath);
    }).then(function () {
        if (fs.existsSync(args[0]) ) {
            fromLocal = true;
            tmpDir = args[0];
        } else {
            return runCommand(cli, 'git',  ['clone','--verbose', args[0], tmpDir ] );
        }
    }).then(function () {
        process.chdir(tmpDir);
        if (!fromLocal) {
            var params = ['checkout', options.branch];
            return runCommand(cli, 'git', params);
        } else {
            return Promise.resolve();
        }
    }).then(function () {
        cli.debug("current working directory is " + process.cwd());
        if (!fs.existsSync(PACKAGE_DESCRIPTOR_FILE)) {
            throw new Error("invalid package repository, no webida-packge.json found");
        }
        // read descriptor from cloned repository
        var data = fs.readFileSync(PACKAGE_DESCRIPTOR_FILE);
        return JSON.parse(data);
    }).then(function (descriptorObj) {
        descriptor = descriptorObj;
        process.chdir(cwd);
        return installPackage(descriptor, options, tmpDir, fromLocal);
    }).then(function (manifest) {
        catalog.addTo('plugins', manifest.plugins);
        catalog.addTo('starters', manifest.starters);
        catalog.addTo('disabled', manifest.disabled);
        catalog.save(cli, catalogPath);
    }).then(function () {
        cli.info("installed new package " + descriptor.id);
    }).catch(function (err) {
        var gc = fromLocal ? undefined : tmpDir;
        handleInstallError(err, gc);
    });
}

function doRemove(cli, options, args) {
    if (args.length < 1) {
        cli.fatal("need package-name argument. run with -h to see usage ");
    }

    var catalog = new PluginCatalog();
    var catalogPath = options.conf + path.sep + options.catalog;
    var packageDir = path.resolve(options['install-path'] + path.sep + args[0]);
    catalog.load(cli, catalogPath).then(function () {
        cli.debug("catalog = " + util.inspect(catalog));
        var descriptorPath = packageDir + path.sep + PACKAGE_DESCRIPTOR_FILE;
        if (!fs.existsSync(descriptorPath)) {
            throw new Error("invalid package repository, no webida-packge.json found for " + descriptorPath);
        }
        var data = fs.readFileSync(descriptorPath);
        return JSON.parse(data);
    }).then(function (descriptor) {
        var manifest = descriptor.manifest;
        for (var pidx in manifest.plugins) {
            var plugin = manifest.plugins[pidx];
            catalog.remove(plugin);
            cli.debug(plugin + " is removed from catalog ");
        }
        cli.info("update catalog file to " + catalogPath);
        return catalog.save(cli, catalogPath);
    }).then(function () {
        cli.info("removing package directory " + packageDir);
        cli.exec("rm -fr " + packageDir, function() {
            cli.info("uninstall complete");
        });
    }).catch(function (err) {
        cli.fatal(err.stack ? err.stack : err);
    });
}
