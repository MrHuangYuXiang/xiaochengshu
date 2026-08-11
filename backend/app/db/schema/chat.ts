import { int, mysqlTable, varchar, date, datetime, tinyint } from 'drizzle-orm/mysql-core';
import { baseTable } from "./base.js";

// 会话表
export const chatSessionTable = mysqlTable("chat_session", {
    ...baseTable,
})

// 会话成员表
export const chatSessionMemberTable = mysqlTable("chat_session_member", {
    ...baseTable,
    session_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),

    // 最后阅读消息序列号
    last_read_seq: int().notNull(),
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