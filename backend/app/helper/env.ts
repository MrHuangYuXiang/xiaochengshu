// 获取环境变量
export const getEnv = (key: string): string => {
    if (!process.env[key]) {
        throw new Error(`环境变量${key}未配置`)
    }
    return process.env[key]
}