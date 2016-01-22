#!/bin/env node

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

var util = require('util');
global.Promise = require('bluebird');

var commander = require('commander');
var logger = require('./lib/common/logger');

commander
    .version('0.5.0')
    .option('-g. --debug', 'enable debug mode')
    .option('-D, --dry-run', 'without affecting to current installation, see what happens')
    .option('-c, --config-path <config-path>',
        'configuration file path that contains install path & other options (defaults to $WPM_CONFIG_PATH');

commander.command('test <m1> <m2> [optionalArgs...]')
    .option('-1, --test-option1', 'test option 1')
    .option('-2, --test-option2 <opt-value>', 'test option 2 with value')
    .action( (mandatoryArg1, mandatoryArg2, optionalArgs, options) => {
        let TestProgram = require('./lib/wpm/TestProgram');
        let program = new TestProgram(options);
        program.main(mandatoryArg1, mandatoryArg2, optionalArgs );
    });

//commander
//    .command('install <source> [configurations...]')
//    .on('--help', () => {
//        global.program.onHelp();
//        console.log('  Arguments: ');
//        console.log('');
//        console.log('    source : <path | source_id | '*' >');
//        console.log('      Value of source should be a valid directory path or a property of $.sources in config. ' );
//        console.log('      See sample/wpm-configuration.js to see how to set source id that maps to path or some url');
//        console.log('');
//        console.log('    configurations : <key1>=<value1> <key2>=<value2> ...');
//        console.log('      Each key is json path of configuration object property');
//        console.log('      Each value will be coerced to boolean from "true" or "false" only');
//        console.log('      See samples/package-setup.json for available keys');
//    })
//    .action( function (source, configurations, options) {
//        console.log("source %s", source);
//        console.log("configurations", configurations);
//        console.log("program opt parent g", options.parent.debug);
//        console.log("program opt parent D", options.parent.dryRun);
//        console.log("program opt parent c ", options.parent.configPath);
//        process.exit(0);
//    });


//commander.command('test')
//    .action( (options) =>  {
//        registerOptions(options);
//        let runner = new CommandRunner('git', ["branch", "-avv"]);
//        runner.spawn().then( (result) => {
//            logger.debug("git execution result [%j]", result, {}); // need 'empty meta data' to show result
//            process.exit(0);
//        }).catch( (err) => {
//            logger.error("git command result error %j", err, {});
//            process.exit(-2);
//        });
//    });

//commander.command('rescan')
//    .action( (options) => {
//        let Rescanner = require('./lib/wpm/RescannerProgram');
//        global.program = new Rescanner(options);
//        global.program.main();
//    });

        /*
        var ManifestLoader = require('./lib/wpm/ManifestLoader');
        registerOptions(options);
        let loader = new ManifestLoader('../webida-server-ng-prototype');

        loader.loadAll().then( (result) => {
            logger.debug("glob result [%j]", result, {}); // need 'empty meta data' to show result
            process.exit(0);
        }).catch( (err) => {
            logger.error("glob error %j", err, {});
            process.exit(-2);
        });
        */

commander.parse(process.argv);

if (commander.args.length < 1) {
    commander.outputHelp();
    process.exit(-1);
}