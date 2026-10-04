import type { Request, Response } from "express";
import { getRequestBody, getRequestPage } from "../model/dto/index.js";
import { ChatSessionTable, ChatSessionMemberTable, ChatMessageTable } from "../model/db-schema/chat.js";
import { UserTable } from "../model/db-schema/user.js";
import {
    createSessionOutput,
    getMessagesInput,
    getMessagesOutput,
    getSessionInput,
    getSessionOutput,
    getSessionsInput,
    getSessionsOutput,
    pinSessionInput,
    sendMessageInput,
    sendMessageOutput,
    createSessionInput
} from "../model/dto/chat.js";
import { getCurrent } from "../../lib/local-stroage.js";
import { v4 as uuidv4 } from "uuid";
import { and, count, desc, eq, getTableColumns, gt, inArray, lt, max, not, SQL, sql } from "drizzle-orm";
import { BaseService } from "./base.js";

export class ChatService extends BaseService {
    /**
     * 创建会话
     * 该接口若会话已存在将查询该会话信息并返回,保证幂等性
     * TODO: 当前仅支持创建私聊会话
     */
    async createSession(req: Request, res: Response) {
        const body = getRequestBody<typeof createSessionInput>(res)
        const current = getCurrent();

        const exist = await current.tx.
            select().
            from(ChatSessionMemberTable).
            where(and(
                eq(ChatSessionMemberTable.other_user_id, body.userId),
                eq(ChatSessionMemberTable.user_id, current.payload.userId),
            ));

        if (!exist[0]) {
            // 创建会话
            const sessionIds = await this.chatShareService.createPrivateSession(
                current.payload.userId,
                body.userId
            );

            // 查询相关信息
            const data = await current.tx.select({
                session: getTableColumns(ChatSessionTable),
                sessionMember: getTableColumns(ChatSessionMemberTable),
                user: getTableColumns(UserTable),
            }).from(ChatSessionTable).
                where(eq(ChatSessionTable.id, sessionIds.sessionId)).
                leftJoin(ChatSessionMemberTable, and(
                    eq(ChatSessionTable.id, ChatSessionMemberTable.session_id),
                    eq(ChatSessionMemberTable.user_id, current.payload.userId),
                )).
                leftJoin(UserTable, eq(UserTable.id, ChatSessionMemberTable.other_user_id));

            res.json(createSessionOutput.parse({
                ...data[0],
                unreadCount: 0,
                latestMessage: null,
            }));
        } else {
            const whereCond = eq(ChatSessionTable.id, exist[0].session_id)
            const sessions = await this.chatShareService.getSessions(whereCond)
            res.json(createSessionOutput.parse({
                ...sessions[0],
            }))
        }
    }

    // 查询单个会话
    async getSession(req: Request, res: Response) {
        const body = getRequestBody<typeof getSessionInput>(res)
        const sessions = await this.chatShareService.getSessions(eq(ChatSessionTable.id, body.sessionId))
        res.json(getSessionOutput.parse({
            session: sessions[0],
        }))
    }

    // 查询会话列表
    async getSessions(req: Request, res: Response) {
        const current = getCurrent();
        const page = getRequestPage(res);

        const sessionIds = (await current.tx.select().
            from(ChatSessionMemberTable).
            where(eq(ChatSessionMemberTable.user_id, current.payload.userId)).
            limit(page.limit).
            offset(page.offset)).map((session) => session.session_id);
        const whereCond = inArray(ChatSessionTable.id, sessionIds)
        const sessions = await this.chatShareService.getSessions(whereCond);

        res.json(getSessionsOutput.parse({
            sessions: sessions,
        }));
    }

    // 置顶会话
    async pinSession(req: Request, res: Response) {
        const body = getRequestBody<typeof pinSessionInput>(res)
        const current = getCurrent();

        await current.tx.
            update(ChatSessionMemberTable).
            set({ is_pin: body.isPin }).
            where(eq(ChatSessionMemberTable.id, body.sessionMemberId));
    }

    // 发送消息
    async sendMessage(req: Request, res: Response) {
        const body = getRequestBody<typeof sendMessageInput>(res)
        const current = getCurrent();

        const message = await this.chatShareService.sendChatMessage({
            type: body.type,
            user_id: current.payload.userId,
            session_id: body.sessionId,
            content: body.content,
        }, body.payload)

        // 更新最后阅读时间
        await this.chatShareService.updateMessageReadTime(
            message.message.inc_seq,
            and(
                eq(ChatSessionMemberTable.session_id, body.sessionId),
                eq(ChatSessionMemberTable.user_id, current.payload.userId),
            )
        )

        // 返回发送的消息
        res.json(sendMessageOutput.parse({
            message: message.message,
            user: message.user,
        }));
    }

    // 查询消息
    async getMessages(req: Request, res: Response) {
        const body = getRequestBody<typeof getMessagesInput>(res)
        const current = getCurrent();
        const page = getRequestPage(res);

        const messages = await current.tx.select({
            user: getTableColumns(UserTable),
            message: getTableColumns(ChatMessageTable),
        }).
            from(ChatMessageTable).
            leftJoin(UserTable, eq(UserTable.id, ChatMessageTable.user_id)).
            where(eq(ChatMessageTable.session_id, body.sessionId)).
            orderBy(desc(ChatMessageTable.inc_seq)).
            limit(page.limit).
            offset(page.offset);

        /** 
         * 更新最后阅读时间
         * FIX: 仅更新小于当前消息序列号的记录
         */
        if (messages[0]) {
            await this.chatShareService.updateMessageReadTime(
                messages[0].message.inc_seq,
                and(
                    eq(ChatSessionMemberTable.session_id, body.sessionId),
                    eq(ChatSessionMemberTable.user_id, current.payload.userId),
                    lt(ChatSessionMemberTable.last_read_seq, messages[0].message.inc_seq),
                )
            )
        }

        // 更新活跃会话
        this.clientManager.updateMetadata(current.payload.userId, {
            activeSessionId: body.sessionId,
        })

        res.json(getMessagesOutput.parse({
            messages: messages,
        }));
    }

    // 清理活跃会话
    async clearActiveSession(req: Request, res: Response) {
        const current = getCurrent();
        this.clientManager.updateMetadata(current.payload.userId, {
            activeSessionId: "",
        })
    }
}