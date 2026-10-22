import { int, mysqlTable, varchar, date, datetime, tinyint, unique } from 'drizzle-orm/mysql-core';
import { baseTable, idType } from './base.js';

// 作品表
export const WorkTable = mysqlTable('work', {
    ...baseTable,
    type: tinyint().notNull(),
    title: varchar({ length: 20 }).notNull(),
    content: varchar({ length: 200 }).notNull(),
    permission: tinyint().notNull(),
    user_id: idType(),
});

// 作品附件表
export const WorkAttachmentTable = mysqlTable('work_attachment', {
    ...baseTable,
    type: tinyint().notNull(),
    work_id: idType(),
    path: varchar({ length: 255 }).notNull(),
    // 优先级,区分封面
    priority: tinyint().notNull(),
});

// 点赞表
export const WorkLikeTable = mysqlTable('work_like', {
    ...baseTable,
    work_id: idType(),
    user_id: idType(),
}, (t) => [
    unique().on(t.work_id, t.user_id),
]);

// 收藏表
export const WorkCollectTable = mysqlTable('work_collect', {
    ...baseTable,
    work_id: idType(),
    user_id: idType(),
}, (t) => [
    unique().on(t.work_id, t.user_id),
]);



// 评论表
export const WorkCommentTable = mysqlTable('work_comment', {
    ...baseTable,
    content: varchar({ length: 200 }).notNull(),
    work_id: idType(),
    // 父评论id
    parent_id: idType(),
    // 根评论id
    root_comment_id: idType(),
    user_id: idType(),
});

// 评论点赞表
export const WorkCommentLikeTable = mysqlTable('work_comment_like', {
    ...baseTable,
    comment_id: idType(),
    user_id: idType(),
    work_id: idType(),
}, (t) => [
    unique().on(t.comment_id, t.user_id),
]);
