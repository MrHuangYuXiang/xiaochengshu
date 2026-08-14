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

// 会话聚合模型
export const chatSessionAggregate = {
    session: chatSessionSchema,
    sessionMember: chatSessionMemberSchema,
    user: userSchema,
    // 最新消息
    latestMessage: chatMessageSchema.nullable(),
    // 未读消息数量
    unreadCount: numberType,
}

// 消息聚合模型
export const chatMessageAggregate = {
    message: chatMessageSchema,
    user: userSchema,
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

// 发送消息输入
export const sendMessageInput = objectType({
    sessionId: stringType,
    sessionMemberId: stringType,
    content: stringType,
});

// 查询消息输入
export const getMessagesInput = objectType({
    ...page,
    sessionId: stringType,
});

// 查询消息输出
export const getMessagesOutput = objectType({
    messages: arrayType(objectType(chatMessageAggregate)),
});
