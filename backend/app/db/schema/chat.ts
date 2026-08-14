import { int, mysqlTable, varchar, date, datetime, tinyint } from 'drizzle-orm/mysql-core';
import { baseTable } from "./base.js";

/**
 * 由于聊天模块查询复杂, 该模块的表设计上会采用冗余字段, 以提高查询效率
 */

// 会话表
export const chatSessionTable = mysqlTable("chat_session", {
    ...baseTable,
    // 会话类型 1: 私聊 2: 群聊
    type: tinyint().notNull(),
})

// 会话成员表
export const chatSessionMemberTable = mysqlTable("chat_session_member", {
    ...baseTable,
    session_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),

    // 最后阅读消息序列号
    last_read_seq: int().notNull(),

    /** 以下字段只在私聊类型生效 */

    // 对方用户id
    other_user_id: varchar({ length: 255 }),
})

// 消息表
export const chatMessageTable = mysqlTable("chat_message", {
    ...baseTable,
    session_id: varchar({ length: 255 }).notNull(),
    session_member_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
    content: varchar({ length: 200 }).notNull(),
    // 自增序列号
    inc_seq: int().notNull(),
})