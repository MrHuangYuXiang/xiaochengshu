import { int, mysqlTable, varchar, date, datetime, tinyint, unique } from 'drizzle-orm/mysql-core';
import { baseTable } from './base.js';

// 作品表
export const WorkTable = mysqlTable('work', {
    ...baseTable,
    title: varchar({ length: 20 }).notNull(),
    content: varchar({ length: 200 }).notNull(),
    permission: tinyint().notNull(),
    user_id: varchar({ length: 255 }).notNull(),
});

// 作品图片表
export const WorkImageTable = mysqlTable('work_image', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    path: varchar({ length: 255 }).notNull(),
    type: tinyint().notNull(),
});

// 点赞表
export const WorkLikeTable = mysqlTable('work_like', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
}, (t) => [
    unique().on(t.work_id, t.user_id),
]);

// 收藏表
export const WorkCollectTable = mysqlTable('work_collect', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
}, (t) => [
    unique().on(t.work_id, t.user_id),
]);



// 评论表
export const WorkCommentTable = mysqlTable('work_comment', {
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
export const WorkCommentLikeTable = mysqlTable('work_comment_like', {
    ...baseTable,
    comment_id: varchar({ length: 255 }).notNull(),
    user_id: varchar({ length: 255 }).notNull(),
    work_id: varchar({ length: 255 }).notNull(),
}, (t) => [
    unique().on(t.comment_id, t.user_id),
]);
