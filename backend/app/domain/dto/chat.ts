import {
    userSchema,
    chatSessionSchema,
    chatSessionMemberSchema,
    chatMessageSchema,
} from "./schema.js";
import {
    booleanType,
    stringType,
    numberType,
    dateType,
    arrayType,
    objectType,
} from "./index.js";
import { page } from "./schema.js";

// 会话信息聚合模型
export const chatSessionAggregate = {
    // 会话信息
    session: chatSessionSchema,
    // 用户信息
    user: userSchema,
    // 最新消息
    latestMessage: chatMessageSchema.nullable(),
    // 未读消息数量
    unreadCount: numberType,
}

// 创建会话输入
export const createSessionInput = objectType({
    userId: stringType,
});

// 创建会话输出
export const createSessionOutput = objectType(chatSessionAggregate);

// 查询会话输入
export const getSessionsInput = objectType({
    ...page,
});

// 查询会话输出
export const getSessionsOutput = objectType({
    sessions: arrayType(objectType(chatSessionAggregate)),
});