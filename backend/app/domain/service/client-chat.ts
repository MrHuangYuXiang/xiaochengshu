import type { Request } from "express";
import type { EnhancedResponse } from "../model/dto/index.js";
import { ClientChatSessionTable, ClientChatSessionMemberTable, ClientChatMessageTable } from "../model/db-schema/client-chat.js";
import { ClientUserTable } from "../model/db-schema/client-user.js";
import { createSessionOutput, getMessagesInput, getMessagesOutput, getSessionsInput, getSessionsOutput, pinSessionInput, sendMessageInput, sendMessageOutput, type createSessionInput } from "../model/dto/client-chat.js";
import { getCurrent } from "../../lib/local-stroage.js";
import { v4 as uuidv4 } from "uuid";
import { and, count, desc, eq, getTableColumns, gt, inArray, lt, max, not, SQL, sql } from "drizzle-orm";
import { getPageParams } from "../../helper/http.js";
import { ClientEventType, pushChatMessageClientEvent } from "../model/dto/client-event.js";
import { BaseService } from "./base.js";
import { ClientChatMessageTypeEnum, ClientChatSessionTypeEnum } from "../model/enum/client-chat.js";

export class ClientChatService extends BaseService {
    // 查询会话信息
    async selectSessions(whereCond: SQL | undefined) {
        const current = getCurrent();

        // 未读消息子查询
        const unreadMessageSubQuery = current.tx.select({
            session_id: ClientChatSessionMemberTable.session_id,
            unreadCount: count(ClientChatMessageTable.id).as("unreadCount"),
        }).
            from(ClientChatSessionMemberTable).
            leftJoin(ClientChatMessageTable, eq(ClientChatSessionMemberTable.session_id, ClientChatMessageTable.session_id)).
            where(and(
                eq(ClientChatSessionMemberTable.user_id, current.payload.userId),
                not(eq(ClientChatMessageTable.user_id, current.payload.userId)),
                gt(ClientChatMessageTable.inc_seq, ClientChatSessionMemberTable.last_read_seq),
            )).
            groupBy(ClientChatSessionMemberTable.session_id).
            as("unreadMessageSubQuery");

        // 最新消息子查询
        const latestMessageSubQuery = current.tx.select({
            session_id: ClientChatMessageTable.session_id,
            maxIncSeq: max(ClientChatMessageTable.inc_seq).as("maxIncSeq"),
        }).
            from(ClientChatMessageTable).
            groupBy(ClientChatMessageTable.session_id).
            as("latestMessageSubQuery");

        // 主查询
        return await current.tx.select({
            session: ClientChatSessionTable,
            sessionMember: ClientChatSessionMemberTable,
            user: ClientUserTable,
            latestMessage: ClientChatMessageTable,
            unreadCount: sql<number>`CASE WHEN unreadMessageSubQuery.unreadCount IS NOT NULL THEN unreadMessageSubQuery.unreadCount ELSE 0 END`,
        }).
            from(ClientChatSessionTable).
            innerJoin(ClientChatSessionMemberTable, and(
                eq(ClientChatSessionTable.id, ClientChatSessionMemberTable.session_id),
                eq(ClientChatSessionMemberTable.user_id, current.payload.userId),
            )).
            leftJoin(ClientUserTable, eq(ClientUserTable.id, ClientChatSessionMemberTable.other_user_id)).
            leftJoin(unreadMessageSubQuery, eq(unreadMessageSubQuery.session_id, ClientChatSessionTable.id)).
            leftJoin(latestMessageSubQuery, eq(latestMessageSubQuery.session_id, ClientChatSessionTable.id)).
            leftJoin(ClientChatMessageTable, eq(ClientChatMessageTable.inc_seq, latestMessageSubQuery.maxIncSeq)).
            where(whereCond).
            orderBy(desc(ClientChatSessionMemberTable.is_pin));
    }

    /**
     * 创建会话
     * 该接口若会话已存在将查询该会话信息并返回,保证幂等性
     * TODO: 当前仅支持创建私聊会话
     */
    async createSession(req: Request, res: EnhancedResponse<null, typeof createSessionInput>) {
        const current = getCurrent();

        const exist = await current.tx.
            select().
            from(ClientChatSessionMemberTable).
            where(and(
                eq(ClientChatSessionMemberTable.other_user_id, res.locals.body!.userId),
                eq(ClientChatSessionMemberTable.user_id, current.payload.userId),
            ));

        if (!exist[0]) {
            // 创建会话
            const sessionIds = await this.baseCreatePrivateSession(
                current.payload.userId,
                res.locals.body!.userId
            );
            // 查询相关信息
            const data = await current.tx.select({
                session: getTableColumns(ClientChatSessionTable),
                sessionMember: getTableColumns(ClientChatSessionMemberTable),
                user: getTableColumns(ClientUserTable),
            }).from(ClientChatSessionTable).
                where(eq(ClientChatSessionTable.id, sessionIds.sessionId)).
                leftJoin(ClientChatSessionMemberTable, and(
                    eq(ClientChatSessionTable.id, ClientChatSessionMemberTable.session_id),
                    eq(ClientChatSessionMemberTable.user_id, current.payload.userId),
                )).
                leftJoin(ClientUserTable, eq(ClientUserTable.id, ClientChatSessionMemberTable.other_user_id));

            res.json(createSessionOutput.parse({
                ...data[0],
                unreadCount: 0,
                latestMessage: null,
            }));
        } else {
            const whereCond = eq(ClientChatSessionTable.id, exist[0].session_id)
            const sessions = await this.selectSessions(whereCond)
            res.json(createSessionOutput.parse({
                ...sessions[0],
            }))
        }
    }

    // 查询会话
    async getSessions(req: Request, res: EnhancedResponse<typeof getSessionsInput, null>) {
        const current = getCurrent();
        const page = getPageParams(res);
        let sessionIds: string[] = []

        sessionIds = (await current.tx.select().
            from(ClientChatSessionMemberTable).
            where(eq(ClientChatSessionMemberTable.user_id, current.payload.userId)).
            limit(page.limit).
            offset(page.offset)).map((session) => session.session_id);

        const whereCond = inArray(ClientChatSessionTable.id, sessionIds)

        const data = await this.selectSessions(whereCond);

        res.json(getSessionsOutput.parse({
            sessions: data,
        }));
    }

    // 置顶会话
    async pinSession(req: Request, res: EnhancedResponse<null, typeof pinSessionInput>) {
        const current = getCurrent();

        await current.tx.
            update(ClientChatSessionMemberTable).
            set({ is_pin: res.locals.body!.isPin }).
            where(eq(ClientChatSessionMemberTable.id, res.locals.body!.sessionMemberId));
    }

    // 发送消息
    async sendMessage(req: Request, res: EnhancedResponse<null, typeof sendMessageInput>) {
        const current = getCurrent();

        const message = await this.baseSendChatMessage({
            type: ClientChatMessageTypeEnum.TEXT,
            user_id: current.payload.userId,
            session_id: res.locals.body!.sessionId,
            content: res.locals.body!.content,
        }, { [ClientChatMessageTypeEnum.TEXT]: {} })

        // 返回发送的消息
        res.json(sendMessageOutput.parse({
            message: message.message,
            user: message.user,
        }));
    }

    // 查询消息
    async getMessages(req: Request, res: EnhancedResponse<typeof getMessagesInput, null>) {
        const current = getCurrent();
        const page = getPageParams(res);

        const messages = await current.tx.select({
            user: getTableColumns(ClientUserTable),
            message: getTableColumns(ClientChatMessageTable),
        }).
            from(ClientChatMessageTable).
            leftJoin(ClientUserTable, eq(ClientUserTable.id, ClientChatMessageTable.user_id)).
            where(eq(ClientChatMessageTable.session_id, res.locals.query!.sessionId)).
            orderBy(desc(ClientChatMessageTable.inc_seq)).
            limit(page.limit).
            offset(page.offset);

        /** 
         * 更新最后阅读时间
         * FIX: 仅更新小于当前消息序列号的记录
         */
        if (messages[0]) {
            await current.tx.update(ClientChatSessionMemberTable).set({
                last_read_seq: messages[0].message.inc_seq,
            }).where(and(
                eq(ClientChatSessionMemberTable.session_id, res.locals.query!.sessionId),
                eq(ClientChatSessionMemberTable.user_id, current.payload.userId),
                lt(ClientChatSessionMemberTable.last_read_seq, messages[0].message.inc_seq),
            ));
        }

        res.json(getMessagesOutput.parse({
            messages: messages,
        }));
    }
}