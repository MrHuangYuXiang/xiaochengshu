import type { Request } from "express"
import { sscanf } from "scanf"

/**
 * http form-data请求头解析器
 * 注意: 对于每个字段必须顺序解读!
 */
export class FormParser {
    // 缓冲区,缓存二进制碎片
    private buf: Buffer

    // 分隔符字符串
    private boundary: Buffer

    // 结束分隔符字符串
    private endBoundary: Buffer

    // 请求对象
    private req: Request

    // 当前writer实例,解决web标准lock问题
    private currentWriter: WritableStreamDefaultWriter<Buffer> | null

    // reject和resolve对象
    private currentReject: (err: Error) => void
    private currentResolve: (value: any) => void

    // 状态: 0: 读取字段头部信息 1: 读取字段内容
    private status: number

    // 标志位
    private isEnd: boolean
    private isExecuting: boolean

    /**
     * 构造函数
     * @param req express请求对象
     * @param writers web标准写入流数组,必须按照字段顺序传入
     */
    constructor(req: Request) {
        this.buf = Buffer.from("")
        this.req = req
        this.currentWriter = null

        const contentType = req.get("Content-Type")
        if (!contentType) {
            throw new Error("未设置请求头Content-Type")
        }
        const boundaryString = sscanf(contentType, "multipart/form-data; boundary=%s")
        this.boundary = Buffer.from("--" + boundaryString)
        this.endBoundary = Buffer.from("--" + boundaryString + "--")

        this.req.pause()
        this.req.on("data", async (chunk: Buffer) => {
            await this.parse(chunk)
        })
        this.currentReject = (err: Error) => { }
        this.currentResolve = (value: any) => { }
        this.status = 0
        this.isEnd = false
        this.isExecuting = false
    }

    exec(writer: WritableStream<Buffer>) {
        return new Promise(async (resolve, reject) => {
            if (this.isEnd) {
                reject(new Error("表单已解析结束"))
                return
            }
            if (this.isExecuting) {
                reject(new Error("正在解析中"))
                return
            }

            this.status = 0
            this.currentResolve = resolve
            this.currentReject = reject
            this.currentWriter = writer.getWriter()
            this.isExecuting = true

            // 传入空Buffer,先解析缓冲区中剩余碎片,被动触发resume
            this.parse(Buffer.from(""))
        })
    }

    /**
     * 解析主逻辑
     */
    private async parse(chunk: Buffer) {
        // 由于writer需要异步写入,必须在解析开始时暂停流防止
        // writer乱序写入
        this.req.pause()
        let buffer = Buffer.concat([this.buf, chunk])

        while (true) {
            // 解析字段头部信息
            if (this.status === 0) {
                const endIndex = buffer.indexOf(Buffer.from("\r\n\r\n"))

                // 当前chunk不包含"\r\n\r\n",缓存当前buffer并恢复请求流
                if (endIndex === -1) {
                    this.buf = Buffer.from(buffer)
                    this.req.resume()
                    break
                }

                // 去除字段头部内容,进入解析字段内容状态
                buffer = buffer.subarray(endIndex + 4)
                this.status = 1
            }

            // 解析字段内容
            else if (this.status === 1) {
                const boundaryIndex = buffer.indexOf(this.boundary)
                const endBoundaryIndex = buffer.indexOf(this.endBoundary)
                let content: Buffer = Buffer.from("")

                // 解析到边界
                if (boundaryIndex !== -1) {
                    // 写入内容并关闭当前writer
                    content = buffer.subarray(0, boundaryIndex - 1)
                    await this.currentWriter?.write(content)
                    await this.currentWriter?.close()

                    // 缓存剩余内容并resolve
                    this.buf = buffer.subarray(boundaryIndex, buffer.length)
                    this.isExecuting = false
                    this.status = 0
                    this.currentResolve(null)
                    break
                }

                // 解析到结束边界
                else if (endBoundaryIndex !== -1) {
                    // 请求体解析到末尾,写入剩余内容并关闭writer,设置isEnd标志位
                    content = buffer.subarray(0, endBoundaryIndex - 1)
                    await this.currentWriter?.write(content)
                    await this.currentWriter?.close()
                    this.isEnd = true
                    this.isExecuting = false

                    // 唤醒promise,解析完成
                    this.currentResolve(null)
                    break
                }

                else {
                    // 同上
                    await this.currentWriter?.write(buffer)
                    this.buf = Buffer.from("")

                    // 恢复请求流
                    this.req.resume()
                    break
                }
            }

            // 未知状态
            else {
                this.currentReject(new Error("FormParser-->未知状态"))
            }
        }
    }
}

/**
 * 内存WritableStream实现,用于获取number,string等参数在内存中直接处理
 */
export class MemoryWritableStream extends WritableStream {
    private buffer: Buffer

    constructor() {
        super({
            write: (chunk) => {
                // 防止内存泄漏
                if (this.buffer.length > 1024) {
                    return
                }
                this.buffer = Buffer.concat([this.buffer, chunk])
            }
        })
        this.buffer = Buffer.from("")
    }

    getBuffer() {
        return this.buffer
    }

    getString() {
        return this.buffer.toString()
    }

    getNumber() {
        const str = this.buffer.toString()
        const res = parseInt(str, 10)
        if (isNaN(res)) {
            throw new Error(`无法解析${str}为数字`)
        }
        return res
    }
}