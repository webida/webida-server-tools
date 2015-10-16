# webida-server-tools

Various Tools for Webida Server, including package manager. 

## installation 

Simple. Just get code and install as global node module. Of course you should have node.js and npm :) 

```
$ git clone https://github.com/webida/webida-server-tools
$ cd webida-server-tools
$ npm -g install ./webida-server-tools
```

*webida-server-tools is not a public node package yet. Do not search this package in your npm repository.*

# webida-package-manager

WPM(Webida Package Manager) is a simple tool to install/remove webida packages. Run webida-package-manager
with -h option to see help, usages. 

To install some pacakge from a url https://github.com/webida/webida-core-package 

```
$ export WEBIDA_CATALOG_DIR=(where.is.your.plugin-settings.json) 
$ export WEBIDA_PACKAGE_DIR=(where.is.your.plugins) 
$ webida-package-manager install https://github.com/webida/webida-core-package 
```

Use options -c and -i not to set environment variables. 

