import { int, mysqlTable, varchar, date, datetime, tinyint } from 'drizzle-orm/mysql-core';
import { baseTable } from './base.js';

// 作品表
export const workTable = mysqlTable('work', {
    ...baseTable,
    title: varchar({ length: 20 }).notNull(),
    content: varchar({ length: 200 }).notNull(),

    // 访问权限 --> 1:公开 0:仅自己可见
    permission: tinyint().notNull(),

    // 封面图片id
    cover_image_id: varchar({ length: 255 }).notNull(),

    user_id: varchar({ length: 255 }).notNull(),
});

// 作品图片表
export const workImageTable = mysqlTable('work_image', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    image_url: varchar({ length: 255 }).notNull(),
});

// 点赞表
export const workLikeTable = mysqlTable('work_like', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
});

// 收藏表
export const workCollectTable = mysqlTable('work_collect', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
});

// 评论表
export const workCommentTable = mysqlTable('work_comment', {
    ...baseTable,
    content: varchar({ length: 200 }).notNull(),
    work_id: varchar({ length: 255 }).notNull(),
    // 父评论id
    parent_id: varchar({ length: 255 }).notNull(),
    // 根评论id
    root_comment_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
});

// 评论点赞表
export const workCommentLikeTable = mysqlTable('work_comment_like', {
    ...baseTable,
    comment_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
});