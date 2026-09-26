import { int, mysqlTable, varchar, date, datetime, tinyint, unique } from 'drizzle-orm/mysql-core';
import { baseTable } from './base.js';

// 作品表
export const ClientWorkTable = mysqlTable('client_work', {
    ...baseTable,
    title: varchar({ length: 20 }).notNull(),
    content: varchar({ length: 200 }).notNull(),
    permission: tinyint().notNull(),
    user_id: varchar({ length: 255 }).notNull(),
});

// 作品图片表
export const ClientWorkImageTable = mysqlTable('client_work_image', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    path: varchar({ length: 255 }).notNull(),
    type: tinyint().notNull(),
});

// 点赞表
export const ClientWorkLikeTable = mysqlTable('client_work_like', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
}, (t) => [
    unique().on(t.work_id, t.user_id),
]);

// 收藏表
export const ClientWorkCollectTable = mysqlTable('client_work_collect', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
}, (t) => [
    unique().on(t.work_id, t.user_id),
]);



// 评论表
export const ClientWorkCommentTable = mysqlTable('client_work_comment', {
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
export const ClientWorkCommentLikeTable = mysqlTable('client_work_comment_like', {
    ...baseTable,
    comment_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
    work_id: varchar({ length: 255 }).notNull(),
}, (t) => [
    unique().on(t.comment_id, t.user_id),
]);
