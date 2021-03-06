
import * as tssl from "typescript/lib/tsserverlibrary";


module.exports = function init(modules: { typescript: typeof tssl }) {
    function create(info: tssl.server.PluginCreateInfo) {
        const ts = modules.typescript;

        const {
            languageService: service,
            project,
            config,
            serverHost,
            languageServiceHost,
        } = info;

        info.project.projectService.logger.info('Returned service proxy');
        const proxy = new Proxy(
            service,
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy#handler_functions
            {
                apply(target, thisArg, argArray) {
                    const result = Reflect.apply(target, thisArg, argArray);
                    return result;
                },
                get(target, prop, receiver) {
                    const result = Reflect.get(target, prop, receiver);
                    const resultProxy = new Proxy(
                        result,
                        {
                            apply(target, thisArg, argArray) {
                                const result = Reflect.apply(target, thisArg, argArray);
                                return result;
                            }
                        }
                    );

                    return resultProxy;
                }
            }
        );

        
        const oldRef = languageServiceHost.resolveModuleNames;

        info.project.projectService.logger.info('PROXY: monkey patching resolveModuleNames');
        if (oldRef) {
            languageServiceHost.resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReferences, options) => {
                info.project.projectService.logger.info('PROXY: resolveModuleNames: ' + moduleNames.join(' - '));
                const result = oldRef.apply(languageServiceHost, [moduleNames, containingFile, reusedNames, redirectedReferences, options]);
                info.project.projectService.logger.info(JSON.stringify(result.map(n => n?.resolvedFileName)));
                return result;
            }
        }

        return proxy;
    }

    return { create };
};
