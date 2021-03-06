"use strict";
exports.__esModule = true;
module.exports = function init(modules) {
    function create(info) {
        var ts = modules.typescript;
        var service = info.languageService, project = info.project, config = info.config, serverHost = info.serverHost, languageServiceHost = info.languageServiceHost;
        info.project.projectService.logger.info('Returned service proxy');
        var proxy = new Proxy(service, 
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy#handler_functions
        {
            apply: function (target, thisArg, argArray) {
                var result = Reflect.apply(target, thisArg, argArray);
                return result;
            },
            get: function (target, prop, receiver) {
                var result = Reflect.get(target, prop, receiver);
                var resultProxy = new Proxy(result, {
                    apply: function (target, thisArg, argArray) {
                        var result = Reflect.apply(target, thisArg, argArray);
                        return result;
                    }
                });
                return resultProxy;
            }
        });
        var oldRef = languageServiceHost.resolveModuleNames;
        info.project.projectService.logger.info('PROXY: monkey patching resolveModuleNames');
        if (oldRef) {
            languageServiceHost.resolveModuleNames = function (moduleNames, containingFile, reusedNames, redirectedReferences, options) {
                info.project.projectService.logger.info('PROXY: resolveModuleNames: ' + moduleNames.join(' - '));
                var result = oldRef.apply(languageServiceHost, [moduleNames, containingFile, reusedNames, redirectedReferences, options]);
                info.project.projectService.logger.info(JSON.stringify(result.map(function (n) { return n === null || n === void 0 ? void 0 : n.resolvedFileName; })));
                return result;
            };
        }
        return proxy;
    }
    return { create: create };
};
