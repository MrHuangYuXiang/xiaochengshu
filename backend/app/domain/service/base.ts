import { and, eq, getTableColumns, sql } from "drizzle-orm"
import { ClientFollowTable, ClientUserTable } from "../model/db-schema/client-user.js"
import { getCurrent } from "../../lib/local-stroage.js"
import { alias } from "drizzle-orm/mysql-core"
import { ClientWorkCollectTable, ClientWorkCommentLikeTable, ClientWorkCommentTable, ClientWorkImageTable, ClientWorkLikeTable, ClientWorkTable } from "../model/db-schema/client-work.js"
import type { FileStoragePort } from "../../port/file-storage-port.js"
import type { ClientManagerPort } from "../../port/client-manager-port.js"
import { ClientChatMessageTable, ClientChatSessionMemberTable, ClientChatSessionTable, MessagePayload } from "../model/db-schema/client-chat.js"
import { v4 as uuidv4 } from "uuid";
import { ClientChatSessionTypeEnum, ClientChatMessageTypeEnum } from "../model/enum/client-chat.js"
import { ClientEventType, pushChatMessageClientEvent } from "../model/dto/client-event.js"
import { AppError } from "../../lib/app-error.js"
import type z from "zod"

/**
 * 服务基类,抽离各个服务公共的业务逻辑
 */
export class BaseService {
    fileStorage: FileStoragePort
    clientManager: ClientManagerPort

    constructor(fileStorage: FileStoragePort, clientManager: ClientManagerPort) {
        this.fileStorage = fileStorage
        this.clientManager = clientManager
    }

    // 当前用户关注关系子查询
    getFollowRelationSubQuery() {
        const current = getCurrent()
        const followTableAlias1 = alias(ClientFollowTable, "followTable1")
        const followTableAlias2 = alias(ClientFollowTable, "followTable2")

        return current.tx.
            select({
                ...getTableColumns(ClientUserTable),
                // 当前用户是否关注该用户标志位
                is_follow: sql<number>`CASE WHEN followTable1.id IS NULL THEN 0 ELSE 1 END`.as("isFollow"),
                // 当前用户是否被该用户关注标志位
                is_followed: sql<number>`CASE WHEN followTable2.id IS NULL THEN 0 ELSE 1 END`.as("isFollowed"),
            }).
            from(ClientUserTable).
            leftJoin(followTableAlias1, and(
                eq(followTableAlias1.following_id, ClientUserTable.id),
                eq(followTableAlias1.follower_id, current.payload.userId),
            )).
            leftJoin(followTableAlias2, and(
                eq(followTableAlias2.follower_id, ClientUserTable.id),
                eq(followTableAlias2.following_id, current.payload.userId),
            )).
            as("followRelationSubQuery")
    }

    // 删除作品 TODO: 需要mq异步删除,通过标志位去软删除提高性能
    async baseDeleteWork(workId: string) {
        const current = getCurrent()

        // 删除相关图片文件
        const images = await current.tx.
            select().
            from(ClientWorkImageTable).
            where(eq(ClientWorkImageTable.work_id, workId))

        for (const image of images) {
            await this.fileStorage.deleteFile(image.path)
        }

        // 删除作品数据
        await current.tx.
            delete(ClientWorkTable).
            where(eq(ClientWorkTable.id, workId))

        // 删除作品图片数据
        await current.tx.
            delete(ClientWorkImageTable).
            where(eq(ClientWorkImageTable.work_id, workId))

        // 删除点赞数据
        await current.tx.
            delete(ClientWorkLikeTable).
            where(eq(ClientWorkLikeTable.work_id, workId))

        // 删除收藏数据
        await current.tx.
            delete(ClientWorkCollectTable).
            where(eq(ClientWorkCollectTable.work_id, workId))

        // 删除评论数据
        await current.tx.
            delete(ClientWorkCommentTable).
            where(eq(ClientWorkCommentTable.work_id, workId))

        // 删除评论点赞数据
        await current.tx.
            delete(ClientWorkCommentLikeTable).
            where(eq(ClientWorkCommentLikeTable.work_id, workId))
    }

    private async baseCreateSession(
        type: ClientChatSessionTypeEnum,
    ) {
        const sessionId = uuidv4()
        const current = getCurrent()

        // 创建会话
        await current.tx.insert(ClientChatSessionTable).values({
            id: sessionId,
            type: type,
        })

        return sessionId
    }

    private async baseCreateSessionMember(
        members: typeof ClientChatSessionMemberTable.$inferInsert[],
    ) {
        const current = getCurrent()

        // 创建会话成员
        await current.tx.insert(ClientChatSessionMemberTable).values(members)
    }


    /**
     * 创建系统会话
     */
    async baseCreateSystemSession(
        userId: string,
    ) {
        const current = getCurrent()

        const sessionId = await this.baseCreateSession(ClientChatSessionTypeEnum.SYSTEM)
        await current.tx.insert(ClientChatSessionMemberTable).values({
            session_id: sessionId,
            user_id: userId,
            last_read_seq: 0,
            other_user_id: userId,
            is_pin: 0,
        })

        return { sessionId }
    }

    /** 
     * 创建私聊会话
     * userId1: 发起会话者id
     * userId2: 参与会话者id
     */
    async baseCreatePrivateSession(
        userId1: string,
        userId2: string,
    ) {
        const sessionId = await this.baseCreateSession(ClientChatSessionTypeEnum.PRIVATE)
        await this.baseCreateSessionMember([
            {
                session_id: sessionId,
                user_id: userId1,
                last_read_seq: 0,
                other_user_id: userId2,
                is_pin: 0,
            },
            {
                session_id: sessionId,
                user_id: userId2,
                last_read_seq: 0,
                other_user_id: userId1,
                is_pin: 0,
            },
        ])

        return { sessionId }
    }

    /**
     * 发送聊天消息
     */
    async baseSendChatMessage(
        message: typeof ClientChatMessageTable.$inferInsert,
        payload: z.infer<typeof MessagePayload>,
    ) {
        const current = getCurrent()
        const msgId = uuidv4()

        // 创建消息
        await current.tx.insert(ClientChatMessageTable).values({
            id: msgId,
            session_id: message.session_id,
            user_id: message.user_id,
            payload: payload,
            content: message.content,
            type: message.type,
        })

        // 查询会话成员信息
        const members = await current.tx.select({
            session: ClientChatSessionTable,
            member: ClientChatSessionMemberTable,
            user: ClientUserTable,
            message: ClientChatMessageTable,
        }).
            from(ClientChatMessageTable).
            innerJoin(ClientChatSessionMemberTable, eq(ClientChatSessionMemberTable.session_id, ClientChatMessageTable.session_id)).
            innerJoin(ClientUserTable, eq(ClientUserTable.id, ClientChatMessageTable.user_id)).
            innerJoin(ClientChatSessionTable, eq(ClientChatSessionTable.id, ClientChatMessageTable.session_id)).
            where(eq(ClientChatMessageTable.id, msgId))

        // 推送消息给对应用户客户端
        for (const item of members) {
            // 系统会话推送给自己,其他会话推送给其他用户
            if (
                item.session.type === ClientChatSessionTypeEnum.SYSTEM ||
                item.member.user_id !== message.user_id
            ) {
                this.clientManager.push(
                    item.member.user_id,
                    ClientEventType.pushChatMessage,
                    pushChatMessageClientEvent.parse({
                        message: item.message,
                        user: item.user,
                    })
                );
            }
        }

        if (!members[0]) {
            throw new AppError("发送失败")
        }

        return {
            message: members[0].message,
            user: members[0].user,
        }
    }
}