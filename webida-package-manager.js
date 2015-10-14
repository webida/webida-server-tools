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

var path = require('path');
var fs = require('fs');
var util = require('util');
var cli = require('cli');
var Promise = require('promise');

cli.enable('help', 'version', 'status', 'catchall');
cli.setApp('webida-package-manager', '0.1.0');

cli.parse( {
    'usage' : ['u', 'show detail usage', true],
    'conf' : ['c', 'configuration directory path where catalog file exists', 'dir' ],
    'install-path' : ['i', 'package install directory ', 'dir', '.'],
    'new' : ['n', 'create new catalog file if it does not exist (install only)', true],
    'development' : ['d', 'use development plugin catalog file name \'plugin-settings-dev.json\'', true],
    'branch' : ['b', 'use specific branch of source repository to install/update', 'string', 'master']
});


function loadCatalog(cli, command, options) {
    var catalogDir = options.conf;

    if (!catalogDir) {
        cli.fatal("should run with --conf option. (-h for help)");
    }
    var catalogFileName = options.development ? 'plugin-settings-dev.json' : 'plugin-settings.json'
    cli.debug("catalog file name = " + catalogFileName);
    var catalogPath = path.resolve(options.conf + path.sep + catalogFileName);
    cli.debug("catalog path = " + catalogPath);

    if( fs.existsSync(catalogPath) ) {
        options.catalogPath = catalogPath;
        var data = fs.readFileSync(catalogPath);
        return JSON.parse(data);
    } else {
        if (command != 'install' || !options.new) {
            cli.fatal("no catalog file found at path " +catalogPath );
            // program exits by fatal message.
        }  else {
            return {};
        }
    }
}

function showUsage() {
    console.log('More Usages: ');
    console.log(this.app + ' install <git-repository-url> <OPTIONS> [-b branch]');
    console.log('  installs package from given git repository. ');
    console.log(this.app + ' install <local-directory-path> <OPTIONS>');
    console.log('  installs package from given local directory path ');
    console.log('');
    console.log('Notes:');
    console.log('  Run ' + this.app + ' -h to see all <OPTIONS>' );
    console.log('  Installation fails when <install-path>/<package-id> directory exists' )
}

cli.main(function(args, options) {


    if (options.usage) {
        showUsage();
        process.exit(0);
    }

    this.debug("starting options \n" + util.inspect(options));

    // parse arguments build command
    this.debug("starting args " + util.inspect(args));
    if (args.length < 2) {
        this.fatal("need arguments. use --usages to read detailed commands  ")
    }

    var command = args[0].toLowerCase();
    var source, target;

    var catalog = loadCatalog(this, command, options);

    switch(command) {
        case 'install':
            break;
        case 'update' :
            break;
        case 'remove' :
            break;
        default:
            this.fatal("unknown command - " + command);
            break;
    }
});
