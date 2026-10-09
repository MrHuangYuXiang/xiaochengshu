import { spawn } from "child_process"

// 执行命令行程序
export function execCommandLineProgram(
    filePath: string, // 可执行文件路径
    args: string[] = [], // 命令行参数
) {
    return new Promise((resolve, reject) => {
        const child = spawn(filePath, args)

        // 监听close事件
        child.on("close", (code, signal) => {
            if (code === 0) {
                resolve(undefined)
            } else {
                reject(new Error(`命令行程序执行失败,退出码${code},信号${signal}`))
            }
        })

        // 监听error事件,启动失败时触发
        child.on("error", (err) => {
            reject(new Error(`命令行程序启动失败,错误信息${err}`))
        })

        child.stderr.on("data", (data) => {
            console.log(data.toString())
        })

        child.stdout.on("data", (data) => {
            console.log(data.toString())
        })

        // 超时关闭
        setTimeout(() => {
            child.kill()
        }, 10000)
    })
}