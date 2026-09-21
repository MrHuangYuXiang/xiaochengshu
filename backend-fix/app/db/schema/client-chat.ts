import { int, mysqlTable, varchar, date, datetime, tinyint } from 'drizzle-orm/mysql-core';
import { baseTable } from "./base.js";

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
    session_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
    last_read_seq: int().notNull(), // 最后阅读消息序列号
    is_pin: tinyint().notNull(), // 是否置顶

    /** 以下字段只在私聊类型生效 */
    other_user_id: varchar({ length: 255 }), // 对方用户id
})

// 消息表
export const ClientChatMessageTable = mysqlTable("client_chat_message", {
    ...baseTable,
    session_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
    content: varchar({ length: 200 }).notNull(),
    inc_seq: int().primaryKey().autoincrement(), // 自增序列号
})