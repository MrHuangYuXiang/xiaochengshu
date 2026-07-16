
/**
 * 该文件用来定义后端事件推送模型
 * 所有相关模型需要添加meta: { openapiName: "事件名称" }元数据支持openapi文档生成
 */
import { userSchema } from "./schema.js";
import {
    booleanType,
    stringType,
    numberType,
    dateType,
    arrayType,
    objectType,
} from "./index.js";

// 事件枚举定义
export const HttpEventType = {
    error: "error",
    heartbeat: "heartbeat",
}

// 心跳
export const heartbeatHttpEvent = objectType({
    jwt: stringType,
}).meta({
    openapiName: "heartbeatHttpEvent",
})

// 错误
export const errorHttpEvent = objectType({
    msg: stringType,
}).meta({
    openapiName: "errorHttpEvent",
})

export const httpEvents = [
    heartbeatHttpEvent,
    errorHttpEvent,
]