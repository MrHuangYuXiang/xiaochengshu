
/**
 * 该文件用来定义客户端事件推送模型
 * 所有相关模型需要添加meta: { openapiName: "事件名称" }元数据支持openapi文档生成
 */
import { chatSessionSchema, userSchema } from "./common.js";
import {
    booleanType,
    stringType,
    numberType,
    dateType,
    arrayType,
    objectType,
} from "./index.js";
import { chatMessageAggregate } from "./client-chat.js";

// 事件枚举定义
export const ClientEventType = {
    // 错误
    error: "error",
    // 心跳
    heartbeat: "heartbeat",
    // 聊天消息推送
    pushChatMessage: "pushChatMessage",
}

export const heartbeatClientEvent = objectType({
    jwt: stringType,
}).meta({
    openapiName: "heartbeatClientEvent",
})

export const errorClientEvent = objectType({
    msg: stringType,
}).meta({
    openapiName: "errorClientEvent",
})

export const pushChatMessageClientEvent = objectType(
    chatMessageAggregate,
).meta({
    openapiName: "pushChatMessageEvent",
})

export const clientEvents = [
    heartbeatClientEvent,
    errorClientEvent,
    pushChatMessageClientEvent,
]