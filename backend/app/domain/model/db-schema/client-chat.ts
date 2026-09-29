import { int, mysqlTable, varchar, date, datetime, tinyint, json } from 'drizzle-orm/mysql-core';
import { baseTable, idType } from "./base.js";
import { ClientChatMessageTypeEnum } from '../enum/client-chat.js';
import { objectType, stringType } from '../dto/index.js';

/**
 * 由于聊天模块查询复杂, 该模块的表设计上会采用冗余字段, 以提高查询效率
 */

// 会话表
export const ClientChatSessionTable = mysqlTable("client_chat_session", {
    ...baseTable,
    type: tinyint().notNull(),
})

// 会话成员表
export const ClientChatSessionMemberTable = mysqlTable("client_chat_session_member", {
    ...baseTable,
    session_id: idType(),
    user_id: idType(),
    last_read_seq: int().notNull().default(0), // 最后阅读消息序列号
    is_pin: tinyint().notNull().default(0), // 是否置顶

    /** 以下字段只在私聊类型生效 */
    other_user_id: idType(), // 对方用户id
})

/** 
 * 消息表
 * 采用快照形式存储不同类型的附带结构化数据
 */
export const ClientChatMessageTable = mysqlTable("client_chat_message", {
    ...baseTable,
    type: tinyint().notNull(), // 消息类型
    payload: json().notNull().default({}), // 储存结构化数据
    session_id: idType(),
    user_id: idType(),
    content: varchar({ length: 200 }).notNull(),
    inc_seq: int().primaryKey().autoincrement(), // 自增序列号
})

// 作品互动会话消息载荷字段
export const DbWorkNoticeMessagePayload = {
    work_id: stringType,
    work_title: stringType,
    work_cover_url: stringType,
    user_id: stringType,
    user_name: stringType,
    user_avatar_path: stringType,
}

// 该模型为消息表payload结构,由于消息类型不同, 
// payload结构不同, 因此需要根据消息类型进行判
// 断
export const DbChatMessagePayload = objectType({
    [ClientChatMessageTypeEnum.TEXT]: objectType({}).optional(),
    [ClientChatMessageTypeEnum.REPORT_NOTICE]: objectType({
        report_id: stringType,
    }).optional(),
    [ClientChatMessageTypeEnum.WORK_SHARE]: objectType({
        work_id: stringType,
        work_title: stringType,
        work_cover_url: stringType,
        work_user_id: stringType,
        work_user_name: stringType,
        work_user_avatar_path: stringType,
    }).optional(),

    [ClientChatMessageTypeEnum.WORK_LIKE_NOTICE]: objectType({
        ...DbWorkNoticeMessagePayload,
    }).optional(),
    [ClientChatMessageTypeEnum.WORK_COLLECT_NOTICE]: objectType({
        ...DbWorkNoticeMessagePayload,
    }).optional(),
    [ClientChatMessageTypeEnum.WORK_FORWARD_NOTICE]: objectType({
        ...DbWorkNoticeMessagePayload,
    }).optional(),
})