import { int, mysqlTable, varchar, date, datetime, tinyint } from 'drizzle-orm/mysql-core';
import { baseTable } from './base.js';

// 用户表
export const UserTable = mysqlTable('user', {
    ...baseTable,
    phone_number: varchar({ length: 11 }).notNull().unique(),
    name: varchar({ length: 20 }).notNull(),
    desc: varchar({ length: 200 }).notNull(),
    birthday: date().notNull(),

    // 性别 1: 男 2: 女
    gender: int().notNull(),
    avatar_url: varchar({ length: 255 }).notNull(),

    // 是否完善个人信息
    is_complete_profile: tinyint().notNull().default(0),
});

// 关注表
export const FollowTable = mysqlTable('follow', {
    ...baseTable,
    follower_id: varchar({ length: 255 }).notNull(),
    following_id: varchar({ length: 255 }).notNull(),
});