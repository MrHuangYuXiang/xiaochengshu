import type z from "zod";
import { ChatMessageTable, ChatSessionMemberTable, ChatSessionTable, type DbChatMessagePayload } from "../model/db-schema/chat.js";
import { getCurrent } from "../../lib/local-stroage.js";
import { v4 as uuidv4 } from "uuid";
import { UserTable } from "../model/db-schema/user.js";
import { and, count, eq, max, SQL, gt, desc, sql } from "drizzle-orm";
import { ClientChatMessageTypeEnum, ClientChatSessionTypeEnum } from "../model/enum/chat.js";
import { AppError } from "../../lib/app-error.js";
import { ClientEventType, pushChatMessageClientEvent } from "../model/dto/event.js";
import type { workInteractInputFields } from "../model/dto/work.js";
import { throwServerError } from "../../lib/app-error.js";
import { BaseShareService } from "./base.js";

export class ChatShareService extends BaseShareService {
    // 更新消息最新阅读时间
    async updateMessageReadTime(
        inc_seq: number,
        whereStmt: SQL | undefined,
    ) {
        const current = getCurrent()
        
        await current.tx.
            update(ChatSessionMemberTable).
            set({
                last_read_seq: inc_seq,
            }).
            where(whereStmt);
    }

    // 发送聊天消息
    async sendChatMessage(
        message: typeof ChatMessageTable.$inferInsert,
        payload: z.infer<typeof DbChatMessagePayload>,
    ) {
        const current = getCurrent()
        const msgId = uuidv4()

        // 创建消息
        const insertResult = await current.tx.insert(ChatMessageTable).values({
            id: msgId,
            session_id: message.session_id,
            user_id: message.user_id,
            payload: payload,
            content: message.content,
            type: message.type,
        })

        // 查询会话成员信息
        const members = await current.tx.select({
            session: ChatSessionTable,
            member: ChatSessionMemberTable,
            user: UserTable,
            message: ChatMessageTable,
        }).
            from(ChatMessageTable).
            innerJoin(ChatSessionMemberTable, eq(ChatSessionMemberTable.session_id, ChatMessageTable.session_id)).
            innerJoin(UserTable, eq(UserTable.id, ChatMessageTable.user_id)).
            innerJoin(ChatSessionTable, eq(ChatSessionTable.id, ChatMessageTable.session_id)).
            where(eq(ChatMessageTable.id, msgId))

        if (!members[0]) {
            throw new AppError("发送失败")
        }

        /** 
         * 推送消息给对应用户客户端
         * 私聊会话将推送给该会话发送方以外的所有用户
         * 其他默认会话将推送给本人
         */
        for (const item of members) {
            if (
                item.member.user_id !== message.user_id ||
                item.session.type !== ClientChatSessionTypeEnum.PRIVATE
            ) {
                this.clientManager.push(
                    item.member.user_id,
                    ClientEventType.pushChatMessage,
                    pushChatMessageClientEvent.parse({
                        message: item.message,
                        user: item.user,
                    })
                );

                // 如果目标用户的活跃会话是当前会话,则更新最新消息序列号
                const metadata = this.clientManager.getMetadata(item.member.user_id)
                if (metadata && metadata.activeSessionId === item.session.id) {
                    await this.updateMessageReadTime(
                        insertResult[0].insertId,
                        and(
                            eq(ChatSessionMemberTable.session_id, item.session.id),
                            eq(ChatSessionMemberTable.user_id, item.member.user_id),
                        )
                    )
                }
            }
        }

        return {
            message: members[0].message,
            user: members[0].user,
        }
    }

    // 发送互动消息
      async sendInteractionMessage(
        reqParams: {[K in keyof typeof workInteractInputFields]: z.infer<typeof workInteractInputFields[K]>},
        messageType: ClientChatMessageTypeEnum,
      ) {
        const current = getCurrent()

        // 查询作品作者的作品互动会话
        const session = await current.tx.
          select().
          from(ChatSessionTable).
          leftJoin(ChatSessionMemberTable, eq(ChatSessionTable.id, ChatSessionMemberTable.session_id)).
          where(and(
            eq(ChatSessionMemberTable.user_id, reqParams.workUserId),
            eq(ChatSessionTable.type, ClientChatSessionTypeEnum.INTERACTION),
          ))

        // 发送互动消息
        if (session[0]) {
          await this.sendChatMessage({
            session_id: session[0].chat_session.id,
            user_id: reqParams.workUserId,
            type: messageType,
            content: "",
          }, {
            [messageType]: {
              work_id: reqParams.workId,
              work_title: reqParams.workTitle,
              work_cover_image_path: reqParams.workCoverImagePath,
              user_id: current.payload.userId,
              user_name: current.payload.userName,
              user_avatar_path: current.payload.userAvatarPath,
            }
          })
        } else {
          throwServerError()
        }
    }

    /** 
     * 创建私聊会话
     * userId1: 发起会话者id
     * userId2: 参与会话者id
     */
    async createPrivateSession(
        userId1: string,
        userId2: string,
    ) {
        const current = getCurrent()

        const sessionId = uuidv4()
        await current.tx.insert(ChatSessionTable).values({
            id: sessionId,
            type: ClientChatSessionTypeEnum.PRIVATE,
        })
        await current.tx.insert(ChatSessionMemberTable).values([
            {
                session_id: sessionId,
                user_id: userId1,
                other_user_id: userId2,
            },
            {
                session_id: sessionId,
                user_id: userId2,
                other_user_id: userId1,
            },
        ])

        return { sessionId }
    }

    /**
     * 创建默认会话(系统会话, 作品互动, 评论互动, 关注互动)
     */
    async createDefaultSession(
        userId: string,
    ) {
        const current = getCurrent()
        const systemSessionId = uuidv4()
        const workSessionId = uuidv4()

        const sessions = [
            // 系统会话
            {
                id: systemSessionId,
                type: ClientChatSessionTypeEnum.SYSTEM,
            },
            // 互动会话
            {
                id: workSessionId,
                type: ClientChatSessionTypeEnum.INTERACTION,
            }
        ]
        
        // 对于默认会话,只包含一个会话成员并且为当前用户
        const members = [
            // 系统会话成员
            {
                session_id: systemSessionId,
                user_id: userId,
                other_user_id: userId,
            },
            // 作品互动会话成员
            {
                session_id: workSessionId,
                user_id: userId,
                other_user_id: userId,
            }
        ]

        await current.tx.insert(ChatSessionTable).values(sessions)
        await current.tx.insert(ChatSessionMemberTable).values(members)

        return { sessionId: systemSessionId }
    }

    // 查询会话信息
    async getSessions(whereCond: SQL | undefined) {
        const current = getCurrent();

        // 未读消息子查询
        const unreadMessageSubQuery = current.tx.select({
            session_id: ChatSessionMemberTable.session_id,
            unreadCount: count(ChatMessageTable.id).as("unreadCount"),
        }).
            from(ChatSessionMemberTable).
            leftJoin(ChatMessageTable, eq(ChatSessionMemberTable.session_id, ChatMessageTable.session_id)).
            where(and(
                eq(ChatSessionMemberTable.user_id, current.payload.userId),
                gt(ChatMessageTable.inc_seq, ChatSessionMemberTable.last_read_seq),
            )).
            groupBy(ChatSessionMemberTable.session_id).
            as("unreadMessageSubQuery");

        // 最新消息子查询
        const latestMessageSubQuery = current.tx.select({
            session_id: ChatMessageTable.session_id,
            maxIncSeq: max(ChatMessageTable.inc_seq).as("maxIncSeq"),
        }).
            from(ChatMessageTable).
            groupBy(ChatMessageTable.session_id).
            as("latestMessageSubQuery");

        // 主查询
        return await current.tx.select({
            session: ChatSessionTable,
            sessionMember: ChatSessionMemberTable,
            user: UserTable,
            latestMessage: ChatMessageTable,
            unreadCount: sql<number>`CASE WHEN unreadMessageSubQuery.unreadCount IS NOT NULL THEN unreadMessageSubQuery.unreadCount ELSE 0 END`,
        }).
            from(ChatSessionTable).
            innerJoin(ChatSessionMemberTable, and(
                eq(ChatSessionTable.id, ChatSessionMemberTable.session_id),
                eq(ChatSessionMemberTable.user_id, current.payload.userId),
            )).
            leftJoin(UserTable, eq(UserTable.id, ChatSessionMemberTable.other_user_id)).
            leftJoin(unreadMessageSubQuery, eq(unreadMessageSubQuery.session_id, ChatSessionTable.id)).
            leftJoin(latestMessageSubQuery, eq(latestMessageSubQuery.session_id, ChatSessionTable.id)).
            leftJoin(ChatMessageTable, eq(ChatMessageTable.inc_seq, latestMessageSubQuery.maxIncSeq)).
            where(whereCond).
            orderBy(desc(ChatSessionMemberTable.is_pin), desc(ChatMessageTable.inc_seq));
    }
}