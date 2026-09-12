import type { Request } from "express";
import type { EnhancedResponse } from "../dto/index.js";
import { chatSessionTable, chatSessionMemberTable, chatMessageTable } from "../../db/schema/chat.js";
import { userTable } from "../../db/schema/user.js";
import { createSessionOutput, getMessagesInput, getMessagesOutput, getSessionsInput, getSessionsOutput, sendMessageInput, sendMessageOutput, type createSessionInput } from "../dto/chat.js";
import { getCurrent } from "../../local_stroage.js";
import { v4 as uuidv4 } from "uuid";
import { and, count, desc, eq, getTableColumns, gt, inArray, lt, max, not, SQL, sql } from "drizzle-orm";
import { getPageParams } from "../../helper/http.js";
import { ClientEventType, pushChatMessageClientEvent } from "../dto/client.js";
import { clientResponseMap } from "../../client.js";
import type { MutexPort } from "../../io/port/mutex.js";

// TODO: 当前仅支持私聊会话
export class ChatService {
    private mutex: MutexPort;

    constructor(mutex: MutexPort) {
        this.mutex = mutex;
    }

    // 查询会话信息
    async selectSessions(whereCond: SQL | undefined) {
        const current = getCurrent();

        // 未读消息子查询
        const unreadMessageSubQuery = current.tx.select({
            session_id: chatSessionMemberTable.session_id,
            unreadCount: count(chatMessageTable.id).as("unreadCount"),
        }).
            from(chatSessionMemberTable).
            leftJoin(chatMessageTable, eq(chatSessionMemberTable.session_id, chatMessageTable.session_id)).
            where(and(
                eq(chatSessionMemberTable.user_id, current.userId),
                not(eq(chatMessageTable.user_id, current.userId)),
                gt(chatMessageTable.inc_seq, chatSessionMemberTable.last_read_seq),
            )).
            groupBy(chatSessionMemberTable.session_id).
            as("unreadMessageSubQuery");

        // 最新消息子查询
        const latestMessageSubQuery = current.tx.select({
            session_id: chatMessageTable.session_id,
            maxIncSeq: max(chatMessageTable.inc_seq).as("maxIncSeq"),
        }).
            from(chatMessageTable).
            groupBy(chatMessageTable.session_id).
            as("latestMessageSubQuery");

        // 主查询
        return await current.tx.select({
            session: getTableColumns(chatSessionTable),
            sessionMember: getTableColumns(chatSessionMemberTable),
            user: getTableColumns(userTable),
            latestMessage: getTableColumns(chatMessageTable),
            unreadCount: sql<number>`CASE WHEN unreadMessageSubQuery.unreadCount IS NOT NULL THEN unreadMessageSubQuery.unreadCount ELSE 0 END`,
        }).
            from(chatSessionTable).
            innerJoin(chatSessionMemberTable, and(
                eq(chatSessionTable.id, chatSessionMemberTable.session_id),
                eq(chatSessionMemberTable.user_id, current.userId),
            )).
            leftJoin(userTable, eq(userTable.id, chatSessionMemberTable.other_user_id)).
            leftJoin(unreadMessageSubQuery, eq(unreadMessageSubQuery.session_id, chatSessionTable.id)).
            leftJoin(latestMessageSubQuery, eq(latestMessageSubQuery.session_id, chatSessionTable.id)).
            leftJoin(chatMessageTable, eq(chatMessageTable.inc_seq, latestMessageSubQuery.maxIncSeq)).
            where(whereCond);
    }

    /**
     * 创建会话
     * 该接口若会话已存在将查询该会话信息并返回,不存在则创建会话
     */
    async createSession(req: Request, res: EnhancedResponse<null, typeof createSessionInput>) {
        const current = getCurrent();

        // 保证幂等性 TODO: 需要加锁避免并发重复创建
        const exist = await current.tx.
            select().
            from(chatSessionMemberTable).
            where(and(
                eq(chatSessionMemberTable.other_user_id, res.locals.body!.userId),
                eq(chatSessionMemberTable.user_id, current.userId),
            ));
    
        if (exist.length === 0) {
            const sessionId = uuidv4();

            // 创建会话
            await current.tx.insert(chatSessionTable).values({
                id: sessionId,
                type: 1,
            });

            // 创建会话成员
            await current.tx.insert(chatSessionMemberTable).values([
                {
                    session_id: sessionId,
                    user_id: current.userId,
                    last_read_seq: 0,
                    other_user_id: res.locals.body!.userId,
                },
                {
                    session_id: sessionId,
                    user_id: res.locals.body!.userId,
                    last_read_seq: 0,
                    other_user_id: current.userId,
                },
            ]);

            // 查询相关信息
            const data = await current.tx.select({
                session: getTableColumns(chatSessionTable),
                sessionMember: getTableColumns(chatSessionMemberTable),
                user: getTableColumns(userTable),
            }).from(chatSessionTable).
                where(eq(chatSessionTable.id, sessionId)).
                leftJoin(chatSessionMemberTable, and(
                    eq(chatSessionTable.id, chatSessionMemberTable.session_id),
                    eq(chatSessionMemberTable.user_id, current.userId),
                )).
                leftJoin(userTable, eq(userTable.id, chatSessionMemberTable.other_user_id));

            res.json(createSessionOutput.parse({
                ...data[0],
                unreadCount: 0,
                latestMessage: null,
            }));
        } else {
            const whereCond = and(
                eq(chatSessionMemberTable.other_user_id, res.locals.body!.userId),
                eq(chatSessionTable.type, 1),
            )
            const sessions = await this.selectSessions(whereCond);
            res.json(createSessionOutput.parse({
                ...sessions[0],
            }));
        }
    }

    // 查询会话
    async getSessions(req: Request, res: EnhancedResponse<typeof getSessionsInput, null>) {
        const current = getCurrent();
        const page = getPageParams(res);
        let sessionIds: string[] = []

        sessionIds = (await current.tx.select().
            from(chatSessionMemberTable).
            where(eq(chatSessionMemberTable.user_id, current.userId)).
            limit(page.limit).
            offset(page.offset)).map((session) => session.session_id);

        const whereCond = and(
            inArray(chatSessionTable.id, sessionIds),
            eq(chatSessionTable.type, 1),
        )
        
        const data = await this.selectSessions(whereCond);

        res.json(getSessionsOutput.parse({
            sessions: data,
        }));
    }

    // 发送消息
    async sendMessage(req: Request, res: EnhancedResponse<null, typeof sendMessageInput>) {
        const current = getCurrent();
        const msgId = uuidv4();

        // 创建消息
        await current.tx.insert(chatMessageTable).values({
            id: msgId,
            session_id: res.locals.body!.sessionId,
            session_member_id: res.locals.body!.sessionMemberId,
            user_id: current.userId,
            content: res.locals.body!.content,
        });

        // 查询会话成员信息
        const data = await current.tx.select({
            member: getTableColumns(chatSessionMemberTable),
            user: getTableColumns(userTable),
            message: getTableColumns(chatMessageTable),
        }).
            from(chatMessageTable).
            leftJoin(userTable, eq(userTable.id, chatMessageTable.user_id)).
            leftJoin(chatSessionMemberTable, eq(chatSessionMemberTable.session_id, chatMessageTable.session_id)).
            where(eq(chatMessageTable.id, msgId))

        // 推送消息给对应用户客户端
        for (const item of data) {
            if (item.member && item.user && item.member.user_id !== current.userId) {
                clientResponseMap.push(
                    item.member.user_id,
                    ClientEventType.pushChatMessage,
                    pushChatMessageClientEvent.parse({
                        message: item.message,
                        user: item.user,
                    })
                );
            }
        }

        // 返回发送的消息
        res.json(sendMessageOutput.parse({
            message: data[0]!.message,
            user: data[0]!.user,
        }));
    }

    // 查询消息
    async getMessages(req: Request, res: EnhancedResponse<typeof getMessagesInput, null>) {
        const current = getCurrent();
        const page = getPageParams(res);

        const messages = await current.tx.select({
            user: getTableColumns(userTable),
            message: getTableColumns(chatMessageTable),
        }).
            from(chatMessageTable).
            leftJoin(userTable, eq(userTable.id, chatMessageTable.user_id)).
            where(eq(chatMessageTable.session_id, res.locals.query!.sessionId)).
            orderBy(desc(chatMessageTable.inc_seq)).
            limit(page.limit).
            offset(page.offset);

        /** 
         * 更新最后阅读时间
         * FIX: 仅更新小于当前消息序列号的记录
         */
        if (messages[0]) {
            await current.tx.update(chatSessionMemberTable).set({
                last_read_seq: messages[0].message.inc_seq,
            }).where(and(
                eq(chatSessionMemberTable.session_id, res.locals.query!.sessionId),
                eq(chatSessionMemberTable.user_id, current.userId),
                lt(chatSessionMemberTable.last_read_seq, messages[0].message.inc_seq),
            ));
        }

        res.json(getMessagesOutput.parse({
            messages: messages,
        }));
    }
}