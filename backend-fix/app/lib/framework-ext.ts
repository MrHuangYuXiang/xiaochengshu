import z from 'zod';
import type { Request } from "express"
import { sscanf } from "scanf"
import { AppError } from "./app-error.js"
import fs from "fs"
import { clientEvents } from "../domain/model/dto/client-event.js"

// 路由映射表
export class RouteMap {
    map: Map<string, z.ZodObject | undefined>

    constructor() {
        this.map = new Map();
    }

    add(method: "GET" | "POST", url: string, schema: z.ZodObject | undefined) {
        if (this.map.has(method + url)) {
            throw new Error('url路径已存在');
        }
        this.map.set(method + url, schema);
    }

    get(method: "GET" | "POST", url: string) {
        if (!this.map.has(method + url)) {
            throw new Error('url路径不存在');
        }
        return this.map.get(method + url);
    }
}

export const routeMap = new RouteMap();

/////////////////////////////////////////////////////////////////////

/**
 * 字段元数据结构
 */
export type FormFieldHeader = {
    // 字段名
    name: string,

    // 仅对文件字段有值,当字段为普通字段时以下为空字符串
    filename: string,
    contentType: string,
}

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

    // 当前writer实例以及provider函数
    private currentWriter: WritableStreamDefaultWriter<Buffer> | undefined
    private writerProvider: undefined | ((fieldType: FormFieldHeader) => Promise<WritableStream<Buffer>>)

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
        this.currentWriter = undefined
        this.writerProvider = undefined

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

    /**
     * @param provider: 写入流对象提供者回调,在解析字段元数据时调用获取Writer实例
     */
    exec(provider: (fieldType: FormFieldHeader) => Promise<WritableStream<Buffer>>) {
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
            this.writerProvider = provider
            this.currentResolve = resolve
            this.currentReject = reject
            this.isExecuting = true

            // 传入空Buffer,先解析缓冲区中剩余碎片,被动触发resume
            this.parse(Buffer.from(""))
        })
    }

    /**
     * 解析主逻辑
     */
    private async parse(chunk: Buffer) {
        try {
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

                    // 解析字段头部信息
                    const fieldType: FormFieldHeader = {
                        name: "",
                        filename: "",
                        contentType: "",
                    }
                    const header = buffer.subarray(0, endIndex)
                    const headerLines = header.toString().split("\r\n")
                    const ContentDispositionLines = headerLines[1]!.split(";")!
                    if (ContentDispositionLines[1]) {
                        fieldType.name = sscanf(ContentDispositionLines[1], " name=\"%s\"")
                    }
                    if (ContentDispositionLines[2]) {
                        fieldType.filename = sscanf(ContentDispositionLines[2], " filename=\"%s\"")
                    }
                    if (headerLines[2]) {
                        fieldType.contentType = sscanf(headerLines[2], "Content-Type: %s")
                    }
                    this.currentWriter = (await this.writerProvider?.(fieldType))?.getWriter()

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
                    throw new Error("表单解析错误: 未知状态")
                }
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.req.pause()
                this.currentReject(error)
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

//////////////////////////////////////////////////////////////////////////////

/** openapi文档生成类 */
class DocGen {
    private doc: {
        openapi: string
        info: {
            title: string
            description: string
            version: string
        }
        paths: any
        components: {
            schemas: any
        }
    }

    constructor() {
        this.doc = {
            openapi: "3.0.0",
            info: {
                title: "小橙书",
                description: "小橙书官方openapi文档",
                version: "1.0.0",
            },
            paths: {},
            components: {
                schemas: {},
            },
        }
    }

    // 创建openapi对象
    private createOpenApiObject(key: string, begin: any, obj: any) {
        let current = begin //  标记当前位置
        this.createOpenApiObjectMain(key, obj, current)
    }

    // 创建openapi对象主逻辑
    private createOpenApiObjectMain(key: string, obj: any, current: any) {
        // 获取zod原始类型
        obj = this.getOriginalType(obj)

        // 对象类型处理逻辑
        if (obj instanceof z.ZodObject) {
            current[key] = {
                type: obj.meta()?.openapiType,
                required: [],
                properties: {},
            }
            for (const propKey in obj.shape) {
                // 设置对象的required属性
                current[key].required.push(propKey)
                this.createOpenApiObjectMain(propKey, obj.shape[propKey], current[key].properties)
            }
        }
        // 数组类型处理逻辑
        else if (obj instanceof z.ZodArray) {
            current[key] = {
                type: obj.meta()?.openapiType,
            }
            // 对于Array类型需要通过unwrap拿到内部类型
            this.createOpenApiObjectMain("items", obj.unwrap(), current[key])
        }
        // 基础类型处理逻辑
        else {
            current[key] = {
                type: obj.meta()?.openapiType,
            }
        }
    }

    // 获取schema原始类型
    private getOriginalType(obj: any): any {
        // 对于Pipe类型,需要通过in拿到内部类型
        if (obj instanceof z.ZodPipe) {
            return this.getOriginalType(obj.in)
        }
        // 对于Default类型,需要通过unwrap拿到内部类型
        else if (
            obj instanceof z.ZodDefault ||
            obj instanceof z.ZodNullable ||
            obj instanceof z.ZodOptional
        ) {
            return this.getOriginalType(obj.unwrap())
        }
        else {
            return obj
        }
    }

    registerPath(method: "GET" | "POST", path: string, inputSchema: z.ZodObject | null, outputSchema: z.ZodObject | null) {
        this.doc.paths[path] = {
            [method.toLowerCase()]: {
                parameters: [],
                responses: {
                    "200": {
                        description: "响应模型",
                        content: {
                            "application/json": {}
                        },
                    },
                },
            },
        }

        // 设置请求查询参数
        // 注意对于查询参数只允许基础类型,不允许object,array等复杂类型
        const setRequestQuery = (key: string, obj: z.ZodObject) => {
            for (const key in obj.shape) {
                if (obj.shape[key] instanceof z.ZodObject || obj.shape[key] instanceof z.ZodArray) {
                    throw new Error(`查询参数不允许复杂类型 ${key}`)
                }
                this.doc.paths[path][method.toLowerCase()].parameters.push({
                    name: key,
                    in: "query",
                    required: true,
                    schema: {
                        type: this.getOriginalType(obj.shape[key]).meta()?.openapiType,
                    },
                })
            }
        }

        // 设置请求查询参数
        if (inputSchema && method === "GET") {
            setRequestQuery("", inputSchema)
        }

        // 设置请求体参数
        if (inputSchema && method === "POST") {
            this.doc.paths[path][method.toLowerCase()].requestBody = {
                description: "请求体参数",
                required: true,
                content: {
                    "application/json": {
                    },
                },
            }
            const begin = this.doc.paths[path][method.toLowerCase()].requestBody.content["application/json"]
            if (inputSchema) { this.createOpenApiObject("schema", begin, inputSchema) }
            else { this.createOpenApiObject("schema", begin, z.object({})) }
        }

        // 设置响应体参数
        const begin = this.doc.paths[path][method.toLowerCase()].responses["200"].content["application/json"]
        if (outputSchema) {
            this.createOpenApiObject("schema", begin, outputSchema)
        }
        else {
            this.createOpenApiObject("schema", begin, z.object({}))
        }
    }

    // 导出openapi文档字符串
    exportDoc() {
        for (const item of clientEvents) {
            const begin = this.doc.components.schemas
            this.createOpenApiObject(item.meta()!.openapiName as string, begin, item)
        }

        fs.writeFileSync("/opt/xiaochengshu/openapi.json", JSON.stringify(this.doc, null, 2))
    }
}

export const doc = new DocGen()