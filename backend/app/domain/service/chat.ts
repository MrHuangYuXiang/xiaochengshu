import type { Request } from "express";
import type { EnhancedResponse } from "../dto/index.js";
import { chatSessionTable, chatSessionMemberTable, chatMessageTable } from "../../db/schema/chat.js";
import { userTable } from "../../db/schema/user.js";
import { createSessionOutput, getMessagesInput, getMessagesOutput, getSessionsInput, getSessionsOutput, sendMessageInput, type createSessionInput } from "../dto/chat.js";
import { getCurrent } from "../../local_stroage.js";
import { v4 as uuidv4 } from "uuid";
import { and, count, desc, eq, getTableColumns, gt, inArray, max, not, sql } from "drizzle-orm";
import { getPageParams } from "../../helper/http.js";
import type { IncGeneratorPort } from "../../io/port/IncGenerator.js";
import { httpEvents, pushChatMessageClientEvent } from "../dto/client.js";
import { clientResponseMap } from "../../client.js";

// TODO: 当前仅支持私聊会话
export class ChatService {
    private incGenerator: IncGeneratorPort;

    constructor(incGenerator: IncGeneratorPort) {
        this.incGenerator = incGenerator;
    }

    // 创建会话
    async createSession(req: Request, res: EnhancedResponse<null, typeof createSessionInput>) {
        const current = getCurrent();
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
                other_user_id: res.locals.body.userId,
            },
            {
                session_id: sessionId,
                user_id: res.locals.body.userId,
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
    }

    // 查询会话
    async getSessions(req: Request, res: EnhancedResponse<typeof getSessionsInput, null>) {
        const current = getCurrent();
        const page = getPageParams(res);

        // 查询用户参与的会话
        const sessions = await current.tx.select().
            from(chatSessionMemberTable).
            where(eq(chatSessionMemberTable.user_id, current.userId)).
            limit(page.limit).
            offset(page.offset);

        // 未读消息子查询
        const unreadMessageSubQuery = current.tx.select({
            session_member_id: chatSessionMemberTable.id,
            unreadCount: count(chatMessageTable.id).as("unreadCount"),
        }).
            from(chatSessionMemberTable).
            leftJoin(chatMessageTable, and(
                eq(chatSessionMemberTable.session_id, chatMessageTable.session_id),
                not(eq(chatSessionMemberTable.user_id, current.userId)),
            )).
            where(and(
                gt(chatMessageTable.inc_seq, chatSessionMemberTable.last_read_seq),
                not(eq(chatSessionMemberTable.user_id, current.userId))
            )).
            groupBy(chatSessionMemberTable.id).
            as("unreadMessageSubQuery");

        // 最新消息子查询
        const latestMessageSubQuery = current.tx.select({
            session_id: chatMessageTable.session_id,
            maxIncSeq: max(chatMessageTable.inc_seq).as("maxIncSeq"),
        }).
            from(chatMessageTable).
            where(eq(chatMessageTable.user_id, current.userId)).
            groupBy(chatMessageTable.session_id).
            as("latestMessageSubQuery");

        // 主查询
        const data = await current.tx.select({
            session: getTableColumns(chatSessionTable),
            sessionMember: getTableColumns(chatSessionMemberTable),
            user: getTableColumns(userTable),
            latestMessage: getTableColumns(chatMessageTable),
            unreadCount: sql<number>`CASE WHEN unreadMessageSubQuery.unreadCount IS NOT NULL THEN unreadMessageSubQuery.unreadCount ELSE 0 END`,
        }).
            from(chatSessionTable).
            leftJoin(chatSessionMemberTable, and(
                eq(chatSessionTable.id, chatSessionMemberTable.session_id),
                eq(chatSessionMemberTable.user_id, current.userId),
            )).
            leftJoin(userTable, eq(userTable.id, chatSessionMemberTable.other_user_id)).
            leftJoin(unreadMessageSubQuery, eq(unreadMessageSubQuery.session_member_id, chatSessionMemberTable.id)).
            leftJoin(latestMessageSubQuery, eq(latestMessageSubQuery.session_id, chatSessionTable.id)).
            leftJoin(chatMessageTable, eq(chatMessageTable.inc_seq, latestMessageSubQuery.maxIncSeq)).
            where(and(
                inArray(chatSessionTable.id, sessions.map((item) => item.session_id)),
                eq(chatSessionTable.type, 1),
            ))

        res.json(getSessionsOutput.parse({
            sessions: data,
        }));
    }

    // 发送消息
    async sendMessage(req: Request, res: EnhancedResponse<null, typeof sendMessageInput>) {
        const current = getCurrent();

        // 创建消息
        await current.tx.insert(chatMessageTable).values({
            session_id: res.locals.body.sessionId,
            session_member_id: res.locals.body.sessionMemberId,
            user_id: current.userId,
            content: res.locals.body.content,
            inc_seq: await this.incGenerator.gen(`chatMessage:${res.locals.body.sessionId}`),
        });

        // 查询会话成员信息
        const members = await current.tx.select().
            from(chatSessionMemberTable).
            where(eq(chatSessionMemberTable.session_id, res.locals.body.sessionId)).
            leftJoin(userTable, eq(userTable.id, chatSessionMemberTable.user_id))

        // 推送消息给对应用户客户端
        for (const member of members) {
            if (member.user) {
                clientResponseMap.push(
                    member.user.id,
                    "chatMessage",
                    pushChatMessageClientEvent.parse(member)
                );
            }
        }
    }

    // 查询消息
    async getMessages(req: Request, res: EnhancedResponse<null, typeof getMessagesInput>) {
        const current = getCurrent();
        const page = getPageParams(res);

        const messages = await current.tx.select().
            from(chatMessageTable).
            where(eq(chatMessageTable.session_id, res.locals.body.sessionId)).
            orderBy(desc(chatMessageTable.inc_seq)).
            limit(page.limit).
            offset(page.offset);

        res.json(getMessagesOutput.parse({
            messages: messages,
        }));
    }
}