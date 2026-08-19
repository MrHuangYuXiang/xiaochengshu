import { z } from "zod"
import fs from "fs"
import { httpEvents } from "./domain/dto/client.js"

class Doc {
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
        else if (obj instanceof z.ZodDefault || obj instanceof z.ZodNullable) {
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
        for (const item of httpEvents) {
            const begin = this.doc.components.schemas
            this.createOpenApiObject(item.meta()!.openapiName as string, begin, item)
        }

        fs.writeFileSync("/opt/xiaochengshu/openapi.json", JSON.stringify(this.doc, null, 2))
    }
}

export const doc = new Doc()