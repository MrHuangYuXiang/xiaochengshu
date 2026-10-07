import { and, eq, sql } from "drizzle-orm"
import { getCurrent } from "../../lib/local-stroage.js"
import { db } from "../db.js"
import { WorkLikeTable, WorkCommentTable, WorkAttachmentTable, WorkTable, WorkCollectTable, WorkCommentLikeTable } from "../model/db-schema/work.js"
import { v4 as uuidv4 } from "uuid";
import { UserTable } from "../model/db-schema/user.js";
import { throwServerError } from "../../lib/app-error.js";
import { BaseShareService } from "./base.js";

export class WorkShareService extends BaseShareService {
    // 点赞子查询
    getLikeSubQuery() {
        const current = getCurrent()

        return db.
            select({
                workId: WorkLikeTable.work_id,
                likeCount: sql<number>`COUNT(${WorkLikeTable.id})`.as("likeCount"),
                isLiked: sql<number>`MAX(CASE WHEN ${WorkLikeTable.user_id} = ${current.payload.userId} THEN 1 ELSE 0 END)`.as("isLiked"),
            }).
            from(WorkLikeTable).
            groupBy(WorkLikeTable.work_id).
            as("likeSubQuery")
    }

    // 创建评论
    async createWorkComment(
        comment: typeof WorkCommentTable.$inferInsert,
    ) {
        const current = getCurrent()
        const commentId = uuidv4()

        await current.tx.insert(WorkCommentTable).values({
            id: commentId,
            ...comment,
        })

        // 查询刚刚发布的评论
        return await current.tx.
            select({
                user: UserTable,
                comment: WorkCommentTable,
                isLiked: sql<number>`0`,
                likeCount: sql<number>`0`,
                replyCount: sql<number>`0`,
            }).
            from(WorkCommentTable).
            innerJoin(UserTable, eq(WorkCommentTable.user_id, UserTable.id)).
            where(eq(WorkCommentTable.id, commentId))
    }

    // 删除作品 TODO: 通过标志位去软删除提高性能
    async deleteWork(workId: string) {
        const current = getCurrent()

        // 删除相关图片文件
        const images = await current.tx.
            select().
            from(WorkAttachmentTable).
            where(eq(WorkAttachmentTable.work_id, workId))

        for (const image of images) {
            await this.fileStorage.deleteFile(image.path)
        }

        // 删除作品数据
        await current.tx.
            delete(WorkTable).
            where(eq(WorkTable.id, workId))

        // 删除作品图片数据
        await current.tx.
            delete(WorkAttachmentTable).
            where(eq(WorkAttachmentTable.work_id, workId))

        // 删除点赞数据
        await current.tx.
            delete(WorkLikeTable).
            where(eq(WorkLikeTable.work_id, workId))

        // 删除收藏数据
        await current.tx.
            delete(WorkCollectTable).
            where(eq(WorkCollectTable.work_id, workId))

        // 删除评论数据
        await current.tx.
            delete(WorkCommentTable).
            where(eq(WorkCommentTable.work_id, workId))

        // 删除评论点赞数据
        await current.tx.
            delete(WorkCommentLikeTable).
            where(eq(WorkCommentLikeTable.work_id, workId))
    }
}