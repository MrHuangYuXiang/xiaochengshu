/**
 * 该文件定义基础模型,与数据库实体字段保持一致并做脱敏处理
 */

import { DbChatMessagePayload } from "../db-schema/client-chat.js";
import {
    booleanType,
    stringType,
    numberType,
    dateType,
    arrayType,
    objectType,
} from "./index.js";
import z from "zod";

export const baseSchema = {
    id: stringType,
    created_at: dateType,
    updated_at: dateType,
}

export const page = {
    page: z.coerce.number().meta({ openapiType: "integer" }).min(1, "页码至少为1").default(1),
    pageSize: z.coerce.number().meta({ openapiType: "integer" }).min(1, "每页数量至少为1").max(20, "每页数量最多为20").default(10),
}

const userFields = {
    ...baseSchema,
    name: stringType,
    desc: stringType,
    birthday: dateType,
    gender: numberType,
    avatar_url: stringType,
    is_complete_profile: numberType,
}

// 用户模型
export const userSchema = objectType({
    ...userFields,
})

// 关注关系增强用户模型
export const UserSchemaWithFollow = objectType({
    ...userFields,
    is_follow: numberType,
    is_followed: numberType,
})

const workCommonFields = {
    title: stringType,
    permission: numberType,
    user_id: stringType,
}

// 作品简单模型
export const workSimpleSchema = objectType({
    ...baseSchema,
    ...workCommonFields,
})

// 作品详情模型
export const workDetailSchema = objectType({
    ...baseSchema,
    ...workCommonFields,
    content: stringType,
})

// 作品图片模型
export const workImageSchema = objectType({
    ...baseSchema,
    work_id: stringType,
    path: stringType,
    type: numberType,
})

// 评论模型
export const workCommentSchema = {
    ...baseSchema,
    content: stringType,
    work_id: stringType,
    user_id: stringType,
    parent_id: stringType,
    root_comment_id: stringType,
}

// 会话模型
export const chatSessionSchema = objectType({
    ...baseSchema,
    type: numberType,
})

// 会话成员模型
export const chatSessionMemberSchema = objectType({
    ...baseSchema,
    session_id: stringType,
    user_id: stringType,
    last_read_seq: numberType,
    is_pin: numberType,
    other_user_id: stringType,
})

// 聊天消息模型
export const chatMessageSchema = objectType({
    ...baseSchema,
    type: numberType,
    payload: DbChatMessagePayload,
    session_id: stringType,
    user_id: stringType,
    content: stringType,
    inc_seq: numberType,
})

// 举报模型
export const reportSchema = objectType({
    ...baseSchema,
    work_id: stringType,
    reporter_id: stringType,
    report_type: numberType,
    reason: stringType,
    status: numberType,
})