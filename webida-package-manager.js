#!/usr/bin/env node

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
    fsExtra = require('fs-extra'),
    Promise = require('promise');

var PluginCatalog = require('./lib/PluginCatalog.js');

var PROGRAM_NAME = 'webida-packabge-manager';
var PROGRAM_VERSION = '0.3.0';
var CATALOG_FILE = 'plugin-settings.json';
var PACKAGE_DESCRIPTOR_FILE = "webida-package.json";
var WEBIDA_CLIENT_CONF_DIR = "WEBIDA_CLIENT_CONF_DIR";
var WEBIDA_CLIENT_PKGS_DIR = "WEBIDA_CLIENT_PKGS_DIR";

cli.setApp(PROGRAM_NAME, PROGRAM_VERSION);
cli.enable('help', 'version', 'status');
cli.option_width = 26;
cli.width = 100;

cli.parse( {
    'catalog-dir' : ['c', 'configuration directory path where catalog file exists ($WEBIDA_CLIENT_CONF_DIR)'],
    'install-dir' : ['i', 'package install directory ($WEBIDA_CLIENT_PKGS_DIR)'],
    'tmp-dir' : ['t', 'temporary directory to save git repository before install', 'string', '/tmp'],
    'branch' : ['b', 'use specific branch of source repository to install', 'string', 'master']
}, ['install', 'update', 'remove']);

cli.main(function(args, options) {
    this.debug("cli starting options \n" + util.inspect(options));
    this.debug("cli command " + cli.command);
    this.debug("cli starting args " + util.inspect(args));

    options.catalogDir = options['catalog-dir'] || process.env[WEBIDA_CLIENT_CONF_DIR];
    options.installDir = options['install-dir'] || process.env[WEBIDA_CLIENT_PKGS_DIR];
    options.tmpDir = options['tmp-dir'];

    if (!options.catalogDir) {
        this.fatal("need a catalog dir option or WEBIDA_CLIENT_CONF_DIR in env variable");
    }
    if (!options.installDir) {
        this.fatal("need a install dir option or WEBIDA_CLIENT_PKGS_DIR in env variable");
    }

    options.catalogPath = options.catalogDir + path.sep + CATALOG_FILE;

    switch(cli.command) {
        case 'install':
            doInstall(cli, options, args);
            break;
        case 'remove':
            doRemove(cli, options, args);
            break;
        default:
            cli.error("Sorry, not implemented yet.");
            break;
    }
});

function handleInstallError(err, tmpDir) {
    if (tmpDir) {
        fsExtra.removeSync(tmpDir, function(rmErr) {
            if (rmErr) {
                cli.error('Garbage collection failed. Remove manually ' + tmpDir);
            } else {
                cli.info("removed dir " + tmpDir);
            }
            cli.fatal(err.stack ? err.stack : err);
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
    var installTo = options.installDir + path.sep + descriptor.id;
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

    var catalog = new PluginCatalog();
    var tmpGitRepoDir = path.resolve(options.tmpDir + '/cloning');
    var descriptor;
    var cwd = process.cwd();
    var fromLocal = false;

    cleanUpOldTmp(cli, tmpGitRepoDir).then(function () {
        return catalog.load(cli, options.catalogPath);
    }).then(function () {
        if (fs.existsSync(args[0]) ) {
            fromLocal = true;
            tmpGitRepoDir = args[0];
        } else {
            return runCommand(cli, 'git',  ['clone','--verbose', args[0], tmpGitRepoDir ] );
        }
    }).then(function () {
        process.chdir(tmpGitRepoDir);
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
        return fsExtra.readJsonSync(PACKAGE_DESCRIPTOR_FILE);
    }).then(function (descriptorObj) {
        descriptor = descriptorObj;
        process.chdir(cwd);
        return installPackage(descriptor, options, tmpGitRepoDir, fromLocal);
    }).then(function (manifest) {
        catalog.addFromManifest('plugins', manifest.plugins, descriptor.id);
        catalog.addFromManifest('starters', manifest.starters, descriptor.id);
        catalog.addFromManifest('disabled', manifest.disabled, descriptor.id);
        catalog.save(cli, options.catalogPath);
    }).then(function () {
        cli.info("installed new package " + descriptor.id);
    }).catch(function (err) {
        var gc = fromLocal ? undefined : tmpGitRepoDir;
        handleInstallError(err, gc);
    });
}

function doRemove(cli, options, args) {

    if (args.length < 1) {
        cli.fatal("need package-name argument. run with -h to see usage ");
    }

    var catalog = new PluginCatalog();
    var packageDir = path.resolve(options.installDir + path.sep + args[0]);

    catalog.load(cli, options.catalogPath).then(function () {
        cli.debug("catalog = " + util.inspect(catalog));
        var descriptorPath = packageDir + path.sep + PACKAGE_DESCRIPTOR_FILE;
        if (!fs.existsSync(descriptorPath)) {
            throw new Error("cannot find package for " + descriptorPath);
        }
        return fsExtra.readJsonSync(descriptorPath);
    }).then(function (descriptor) {
        var manifest = descriptor.manifest;
        for (var pidx in manifest.plugins) {
            var plugin = manifest.plugins[pidx];
            catalog.remove(plugin);
            cli.debug(plugin + " is removed from catalog ");
        }
        cli.info("update catalog file to " + options.catalogPath);
        return catalog.save(cli, options.catalogPath);
    }).then(function () {
        cli.info("removing package directory " + packageDir);
        cli.exec("rm -fr " + packageDir, function() {
            cli.info("uninstall complete");
        });
    }).catch(function (err) {
        cli.fatal(err.stack ? err.stack : err);
    });
}
