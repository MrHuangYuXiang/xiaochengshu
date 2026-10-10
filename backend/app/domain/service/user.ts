import { getCurrent } from "../../lib/local-stroage.js";
import { BaseService } from "./base.js";
import { UserTable, FollowTable } from "../model/db-schema/user.js";
import { WorkCollectTable, WorkTable, WorkLikeTable } from "../model/db-schema/work.js";
import { eq, and, inArray, getTableColumns, gt, sql, count, desc, fillPlaceholders } from "drizzle-orm";
import {
    updateUserInfoInput,
    getUserDetailOutput,
    smsSendInput,
    loginInput,
    loginOutput,
    followUserInput,
    getUserDetailInput,
    getInitDataOutput,
    getUserFollowsInput,
    getUserFollowsOutput,
    removeFollowerInput,
} from "../model/dto/user.js";
import { getRequestBody, getRequestPage } from "../model/dto/index.js";
import type { Request, Response } from "express";
import { getEnv } from "../../helper/env.js";
import { genJWT } from "../../helper/jwt.js";
import { FormParser } from "../../lib/framework-ext.js";
import { v4 as uuidv4 } from "uuid";
import { heartbeatClientEvent, ClientEventType } from "../model/dto/event.js";
import { AppError } from "../../lib/app-error.js";
import { ClientChatMessageTypeEnum, ClientChatSessionTypeEnum } from "../model/enum/chat.js";
import { FileExtEnum } from "../model/enum/file.js";
import e from "express";
import { ChatMessageTable, ChatSessionMemberTable, ChatSessionTable } from "../model/db-schema/chat.js";

// FIXME: 该服务下的接口需要重写加锁逻辑,锁需要放在事务外面,避免mvcc快照导致锁失效
export class UserService extends BaseService {
    // 获取手机验证码
    async smsSend(req: Request, res: Response) {
        const body = getRequestBody<typeof smsSendInput>(res)
        const code = Math.floor(Math.random() * 1000000)
        console.log("生成验证码-->", code)
    }

    /**
     * 登录
     * 该接口只负责返回jwt,关于jwt续约以及用户在线状态管理在/init接口中实现
     */
    async login(req: Request, res: Response) {
        const current = getCurrent()
        const body = getRequestBody<typeof loginInput>(res)
        let userId = ""
        let userName = ""
        let userAvatarPath = ""

        // TODO: 开发阶段默认验证码: 666666, 下同
        if (body.code != "666666") {
            throw new AppError("验证码错误")
        }

        const user = await current.tx.select().from(UserTable).where(eq(UserTable.phone_number, body.phoneNumber))

        // 用户不存在自动注册,以下为初始化逻辑
        if (!user[0]) {
            // 创建用户
            userId = uuidv4()
            userName = body.phoneNumber
            userAvatarPath = ""
            await current.tx.insert(UserTable).values({
                id: userId,
                phone_number: body.phoneNumber,
                name: userName,
                desc: "",
                birthday: new Date(),
                gender: 1,
                avatar_url: userAvatarPath,
                is_complete_profile: 0,
            })

            // 创建默认会话
            const ids = await this.chatShareService.createDefaultSession(userId)

            // 系统会话发送欢迎消息
            await this.chatShareService.sendChatMessage({
                type: ClientChatMessageTypeEnum.TEXT,
                user_id: userId,
                session_id: ids.sessionId,
                content: "小橙书欢迎你的加入!",
            }, { [ClientChatMessageTypeEnum.TEXT]: {} })
        }
        else {
            userId = user[0].id
            userName = user[0].name
            userAvatarPath = user[0].avatar_url
        }

        res.json(loginOutput.parse({
            token: genJWT({ userId, userName, userAvatarPath }),
        }))
    }

    /**
     * 建立http长连接
     * 该接口需要前端在用户上线时调用,主要负责:
     * - 多端在线状态管理
     * - 维护http长连接
     */
    async connect(req: Request, res: Response) {
        const current = getCurrent()

        // 设置相关响应头
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        this.clientManager.addClient(current.payload.userId, res)

        // 后端维持心跳,同时续约jwt
        const n = setInterval(() => {
            this.clientManager.push(current.payload.userId, ClientEventType.heartbeat, heartbeatClientEvent.parse({
                jwt: genJWT({ userId: current.payload.userId, userName: current.payload.userName, userAvatarPath: current.payload.userAvatarPath }),
            }))
        }, parseInt(getEnv("PERSISTENT_HEARTBEAT_INTERVAL")))

        // 监听客户端关闭连接,清理相关资源
        req.on("close", () => {
            console.log(`用户${current.payload.userId}的长连接已关闭`);
            this.clientManager.removeClient(current.payload.userId)
            clearInterval(n)
        })
    }

    async getInitData(req: Request, res: Response) {
        const current = getCurrent()

        // 查询用户信息
        const user = await current.tx.
            select().
            from(UserTable).
            where(eq(UserTable.id, current.payload.userId))

        // 查询未读消息数量
        const unreadMessageCount = await current.tx.
            select({
                unreadMessageCount: count(ChatMessageTable.id).as("unreadMessageCount"),
            }).
            from(ChatSessionTable).
            innerJoin(ChatSessionMemberTable, and(
                eq(ChatSessionTable.id, ChatSessionMemberTable.session_id),
                eq(ChatSessionMemberTable.user_id, current.payload.userId),
            )).
            innerJoin(ChatMessageTable, and(
                eq(ChatSessionTable.id, ChatMessageTable.session_id),
                gt(ChatMessageTable.inc_seq, ChatSessionMemberTable.last_read_seq),
            ))

        res.json(getInitDataOutput.parse({
            user: user[0],
            unreadMessageCount: unreadMessageCount[0]?.unreadMessageCount || 0,
        }))
    }

    // 获取用户详情
    async getUserDetail(req: Request, res: Response) {
        const current = getCurrent()
        const body = getRequestBody<typeof getUserDetailInput>(res)
        const followRelationSubQuery = this.userShareService.getFollowRelationSubQuery()

        const user = await current.tx.select({
            user: followRelationSubQuery.user,
            followingCount: current.tx.select({ "count": count(FollowTable.id).as("followingCount") }).from(FollowTable).where(eq(FollowTable.follower_id, body.userId)).as("followingCount"),
            followerCount: current.tx.select({ "count": count(FollowTable.id).as("followerCount") }).from(FollowTable).where(eq(FollowTable.following_id, body.userId)).as("followerCount"),
            workCount: current.tx.select({ "count": count(WorkTable.id).as("workCount") }).from(WorkTable).where(eq(WorkTable.user_id, body.userId)).as("workCount"),
            likeCount: current.tx.select({ "count": count(WorkLikeTable.id).as("likeCount") }).from(WorkLikeTable).where(eq(WorkLikeTable.user_id, body.userId)).as("likeCount"),
            collectCount: current.tx.select({ "count": count(WorkCollectTable.id).as("collectCount") }).from(WorkCollectTable).where(eq(WorkCollectTable.user_id, body.userId)).as("collectCount"),
        }).
            from(followRelationSubQuery).
            where(eq(followRelationSubQuery.user.id, body.userId))

        res.json(getUserDetailOutput.parse({
            user: user[0],
        }))
    }

    // 更新头像
    async uploadUserAvatar(req: Request, res: Response) {
        // const current = getCurrent()
        // const formParser = new FormParser(req)
        // let filePath = ""

        // await formParser.exec(async (header) => {
        //     filePath = `/user-avatars/${current.payload.userId}${header.contentType}`
        //     return await this.fileStorage.getWritableStream(filePath)
        // }, [FileExtEnum.JPG, FileExtEnum.PNG])

        // // 数据库更新用户信息
        // await current.tx.update(UserTable).set({
        //     avatar_url: filePath,
        // }).where(eq(UserTable.id, current.payload.userId))
    }

    // 更新用户信息
    async updateUserInfo(req: Request, res: Response) {
        const current = getCurrent()
        const body = getRequestBody<typeof updateUserInfoInput>(res)

        await current.tx.update(UserTable).set({
            name: body.name,
            desc: body.desc,
            birthday: new Date(body.birthday),
            gender: body.gender,
            is_complete_profile: 1,
        }).where(eq(UserTable.id, current.payload.userId))
    }

    // 获取用户的关注/粉丝接口
    async getUserFollows(req: Request, res: Response) {
        const page = getRequestPage(res)
        const current = getCurrent()
        const body = getRequestBody<typeof getUserFollowsInput>(res)
        const followRelationSubQuery = this.userShareService.getFollowRelationSubQuery()

        switch (body.type) {
            // 查询目标用户关注的人
            case "following": {
                // 聚合数据查询
                const followingCount = await current.tx.
                    select({ "followingCount": count(FollowTable.id).as("followingCount") }).
                    from(FollowTable).
                    where(eq(FollowTable.follower_id, body.userId))

                const users = await current.tx.
                    select({
                        ...followRelationSubQuery.user,
                    }).
                    from(FollowTable).
                    where(eq(FollowTable.follower_id, body.userId)).
                    innerJoin(followRelationSubQuery, eq(followRelationSubQuery.user.id, FollowTable.following_id)).
                    orderBy(desc(FollowTable.created_at)).
                    limit(page.limit).
                    offset(page.offset)

                res.json(getUserFollowsOutput.parse({
                    users,
                    count: followingCount[0]!.followingCount,
                }))
                break
            }

            // 查询目标用户的粉丝
            case "follower": {
                // 聚合数据查询
                const followerCount = await current.tx.
                    select({ "followerCount": count(FollowTable.id).as("followerCount") }).
                    from(FollowTable).
                    where(eq(FollowTable.following_id, body.userId))

                const users = await current.tx.
                    select({
                        ...followRelationSubQuery.user,
                    }).
                    from(FollowTable).
                    where(eq(FollowTable.following_id, body.userId)).
                    innerJoin(followRelationSubQuery, eq(followRelationSubQuery.user.id, FollowTable.follower_id)).
                    orderBy(desc(FollowTable.created_at)).
                    limit(page.limit).
                    offset(page.offset)

                res.json(getUserFollowsOutput.parse({
                    users,
                    count: followerCount[0]!.followerCount,
                }))
                break
            }
            default:
                throw new AppError("查询类型错误")
        }
    }

    // 关注用户
    async followUser(req: Request, res: Response) {
        const current = getCurrent()
        const body = getRequestBody<typeof followUserInput>(res)

        if (body.isFollow === 1) {
            await current.tx.insert(FollowTable).values({
                follower_id: current.payload.userId,
                following_id: body.userId,
            })
        } else {
            await current.tx.delete(FollowTable).
                where(and(
                    eq(FollowTable.follower_id, current.payload.userId),
                    eq(FollowTable.following_id, body.userId),
                ))
        }
    }

    // 移除粉丝
    async removeFollower(req: Request, res: Response) {
        const current = getCurrent()
        const body = getRequestBody<typeof removeFollowerInput>(res)
        await current.tx.
            delete(FollowTable).
            where(and(
                eq(FollowTable.follower_id, body.userId),
                eq(FollowTable.following_id, current.payload.userId)
            ))
    }
}
