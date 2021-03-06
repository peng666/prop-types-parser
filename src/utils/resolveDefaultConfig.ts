/**
 * 合并默认配置与传入的配置
 * @param defaultConfig 默认配置
 * @param config 传入的配置
 */
export default function resolveDefaultConfig(defaultConfig: object, config: object): object {
    for (let key of Object.keys(defaultConfig)) {
        if (config.hasOwnProperty(key) && config[key]) {
            if (config[key] instanceof Array) {
                defaultConfig[key] = defaultConfig[key].concat(config[key])
            } else if (typeof config[key] === 'object') {
                defaultConfig[key] = resolveDefaultConfig(defaultConfig[key], config[key])
            } else {
                defaultConfig[key] = config[key]
            }
        }
    }

    return defaultConfig
}