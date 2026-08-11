import type { Request } from "express";
import type { EnhancedResponse } from "../dto/index.js";
import { chatSessionTable, chatSessionMemberTable, chatMessageTable } from "../../db/schema/chat.js";
import { userTable } from "../../db/schema/user.js";
import { createSessionOutput, getSessionsInput, getSessionsOutput, type createSessionInput } from "../dto/chat.js";
import { getCurrent } from "../../local_stroage.js";
import { v4 as uuidv4 } from "uuid";
import { and, count, desc, eq, getTableColumns, gt, inArray, max, not, sql } from "drizzle-orm";
import { getPageParams } from "../../helper/http.js";
import type { IncGeneratorPort } from "../../io/port/IncGenerator.js";

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
        });

        // 创建会话成员
        await current.tx.insert(chatSessionMemberTable).values([
            {
                session_id: sessionId,
                user_id: current.userId,
                last_read_seq: 0,
            },
            {
                session_id: sessionId,
                user_id: res.locals.body?.userId || "",
                last_read_seq: 0,
            },
        ]);

        // 查询相关信息
        const data = await current.tx.select({
            session: getTableColumns(chatSessionTable),
            user: getTableColumns(userTable),
        }).from(chatSessionTable).
            where(eq(chatSessionTable.id, sessionId)).
            leftJoin(userTable, eq(userTable.id, res.locals.body?.userId || ""))

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
            session_id: chatMessageTable.session_id,
            unreadCount: count(chatMessageTable.id).as("unreadCount"),
        }).
            from(chatMessageTable).
            leftJoin(chatSessionMemberTable, and(
                eq(chatSessionMemberTable.session_id, chatMessageTable.session_id),
                eq(chatSessionMemberTable.user_id, current.userId),
            )).
            where(and(
                gt(chatMessageTable.inc_seq, chatSessionMemberTable.last_read_seq),
                not(eq(chatMessageTable.user_id, current.userId))
            )).
            groupBy(chatMessageTable.session_id).
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
            user: getTableColumns(userTable),
            latestMessage: getTableColumns(chatMessageTable),
            unreadCount: sql<number>`CASE WHEN unreadMessageSubQuery.unreadCount IS NOT NULL THEN unreadMessageSubQuery.unreadCount ELSE 0 END`,
        }).
            from(chatSessionTable).
            leftJoin(chatSessionMemberTable, and(
                eq(chatSessionTable.id, chatSessionMemberTable.session_id),
                not(eq(chatSessionMemberTable.user_id, current.userId))
            )).
            leftJoin(userTable, eq(userTable.id, chatSessionMemberTable.user_id)).
            leftJoin(unreadMessageSubQuery, eq(unreadMessageSubQuery.session_id, chatSessionTable.id)).
            leftJoin(latestMessageSubQuery, eq(latestMessageSubQuery.session_id, chatSessionTable.id)).
            leftJoin(chatMessageTable, eq(chatMessageTable.inc_seq, latestMessageSubQuery.maxIncSeq)).
            where(and(
                inArray(chatSessionTable.id, sessions.map((item) => item.session_id)),
            ))

        res.json(getSessionsOutput.parse({
            sessions: data,
        }));
    }

    // 发送消息
    async sendMessage(req: Request, res: EnhancedResponse<null, null>) {
        const current = getCurrent();
    }

    // 查询消息
    async getMessages(req: Request, res: EnhancedResponse<null, null>) {
        const current = getCurrent();
    }
}