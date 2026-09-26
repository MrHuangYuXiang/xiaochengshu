import { getCurrent } from "../../lib/local-stroage.js";
import { BaseService } from "./base.js";
import { ClientUserTable, ClientFollowTable } from "../model/db-schema/client-user.js";
import { ClientWorkCollectTable, ClientWorkTable, ClientWorkLikeTable } from "../model/db-schema/client-work.js";
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
    followUserOutput,
} from "../model/dto/client-user.js";
import type { EnhancedResponse } from "../model/dto/index.js";
import type { Request } from "express";
import { getEnv } from "../../helper/env.js";
import { genClientJWT } from "../../helper/jwt.js";
import { FormParser } from "../../lib/framework-ext.js";
import { v4 as uuidv4 } from "uuid";
import { heartbeatClientEvent, ClientEventType } from "../model/dto/client-event.js";
import { AppError } from "../../lib/app-error.js";
import { getPageParams } from "../../helper/http.js";
import { ClientChatMessageTypeEnum, ClientChatSessionTypeEnum } from "../model/enum/client-chat.js";
import { FileExtEnum } from "../model/enum/file.js";

// FIXME: 该服务下的接口需要重写加锁逻辑,锁需要放在事务外面,避免mvcc快照导致锁失效
export class ClientUserService extends BaseService {
    // 获取手机验证码
    // 请求体携带字段 type -- 1: 表示登录验证码，2: 表示注册验证码
    async smsSend(req: Request, res: EnhancedResponse<null, typeof smsSendInput>) {
        const code = Math.floor(Math.random() * 1000000)
        console.log("生成验证码-->", code)

        res.json()
    }

    /**
     * 登录
     * 该接口只负责返回jwt,关于jwt续约以及用户在线状态管理在/init接口中实现
     */
    async login(req: Request, res: EnhancedResponse<null, typeof loginInput>) {
        const current = getCurrent()
        let userId = ""

        // TODO: 开发阶段默认验证码: 666666, 下同
        if (res.locals.body!.code != "666666") {
            throw new AppError("验证码错误")
        }

        const user = await current.tx.select().from(ClientUserTable).where(eq(ClientUserTable.phone_number, res.locals.body!.phoneNumber))

        // 用户不存在自动注册,以下为初始化逻辑
        if (user.length == 0) {
            // 创建用户
            userId = uuidv4()
            await current.tx.insert(ClientUserTable).values({
                id: userId,
                phone_number: res.locals.body!.phoneNumber,
                name: res.locals.body!.phoneNumber,
                desc: "",
                birthday: new Date(),
                gender: 1,
                avatar_url: "",
                is_complete_profile: 0,
            })
            // 创建系统会话
            const ids = await this.baseCreateSystemSession(userId)
            // 系统会话发送欢迎消息
            await this.baseSendChatMessage({
                type: ClientChatMessageTypeEnum.TEXT,
                user_id: userId,
                session_id: ids.sessionId,
                content: "小橙书欢迎你的加入!",
            }, { [ClientChatMessageTypeEnum.TEXT]: {} })
        } else {
            userId = user[0]!.id
        }

        res.json(loginOutput.parse({
            token: genClientJWT({ userId }, {}),
        }))
    }

    /**
     * 建立http长连接
     * 该接口需要前端在用户上线时调用,主要负责:
     * - 多端在线状态管理
     * - 维护http长连接
     */
    async connect(req: Request, res: EnhancedResponse<null, null>) {
        const current = getCurrent()

        // 设置相关响应头
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')

        this.clientManager.addClient(current.payload.userId, res)

        // 后端维持心跳,同时续约jwt
        const n = setInterval(() => {
            this.clientManager.push(current.payload.userId, ClientEventType.heartbeat, heartbeatClientEvent.parse({
                jwt: genClientJWT({ userId: current.payload.userId }, {}),
            }))
        }, parseInt(getEnv("PERSISTENT_HEARTBEAT_INTERVAL")))

        // 监听客户端关闭连接,清理相关资源
        req.on("close", () => {
            console.log(`用户${current.payload.userId}的长连接已关闭`);
            this.clientManager.removeClient(current.payload.userId)
            clearInterval(n)
        })
    }

    async getInitData(req: Request, res: EnhancedResponse<null, null>) {
        const current = getCurrent()

        // 查询初始化信息并推送初始化事件
        const result = await current.tx.select(
            {
                user: getTableColumns(ClientUserTable),
            }).
            from(ClientUserTable).
            where(eq(ClientUserTable.id, current.payload.userId))

        res.json(getInitDataOutput.parse({
            ...result[0],
        }))
    }

    // 获取用户详情
    async getUserDetail(req: Request, res: EnhancedResponse<typeof getUserDetailInput, null>) {
        const current = getCurrent()
        const followRelationSubQuery = this.getFollowRelationSubQuery()

        const user = await current.tx.select({
            user: followRelationSubQuery._.selectedFields,
            "followingCount": current.tx.select({ "count": count(ClientFollowTable.id).as("followingCount") }).from(ClientFollowTable).where(eq(ClientFollowTable.follower_id, res.locals.query!.userId)).as("followingCount"),
            "followerCount": current.tx.select({ "count": count(ClientFollowTable.id).as("followerCount") }).from(ClientFollowTable).where(eq(ClientFollowTable.following_id, res.locals.query!.userId)).as("followerCount"),
            "workCount": current.tx.select({ "count": count(ClientWorkTable.id).as("workCount") }).from(ClientWorkTable).where(eq(ClientWorkTable.user_id, res.locals.query!.userId)).as("workCount"),
            "likeCount": current.tx.select({ "count": count(ClientWorkLikeTable.id).as("likeCount") }).from(ClientWorkLikeTable).where(eq(ClientWorkLikeTable.user_id, res.locals.query!.userId)).as("likeCount"),
            "collectCount": current.tx.select({ "count": count(ClientWorkCollectTable.id).as("collectCount") }).from(ClientWorkCollectTable).where(eq(ClientWorkCollectTable.user_id, res.locals.query!.userId)).as("collectCount"),
        }).
            from(followRelationSubQuery).
            where(eq(followRelationSubQuery.id, res.locals.query!.userId))

        if (user.length == 0) {
            throw new AppError("用户不存在")
        }

        res.json(getUserDetailOutput.parse({
            ...user[0],
        }))
    }

    // 更新头像
    async uploadUserAvatar(req: Request, res: EnhancedResponse<null, null>) {
        const current = getCurrent()
        const formParser = new FormParser(req)
        let filePath = ""

        await formParser.exec(async (header) => {
            filePath = this.fileStorage.getFilePath(`/user-avatars/${current.payload.userId}`, header.contentType)
            return await this.fileStorage.getWritableStream(filePath)
        }, [FileExtEnum.Jpg, FileExtEnum.Png])

        // 数据库更新用户信息
        await current.tx.update(ClientUserTable).set({
            avatar_url: filePath,
        }).where(eq(ClientUserTable.id, current.payload.userId))
    }

    // 更新用户信息
    async updateUserInfo(req: Request, res: EnhancedResponse<null, typeof updateUserInfoInput>) {
        const current = getCurrent()

        await current.tx.update(ClientUserTable).set({
            name: res.locals.body!.name,
            desc: res.locals.body!.desc,
            birthday: new Date(res.locals.body!.birthday),
            gender: res.locals.body!.gender,
            is_complete_profile: 1,
        }).where(eq(ClientUserTable.id, current.payload.userId))
    }

    // 获取用户的关注/粉丝接口
    async getUserFollows(req: Request, res: EnhancedResponse<typeof getUserFollowsInput, null>) {
        const page = getPageParams(res)
        const current = getCurrent()
        const followRelationSubQuery = this.getFollowRelationSubQuery()

        switch (res.locals.query!.type) {
            // 查询目标用户关注的人
            case "following": {
                // 聚合数据查询
                const followingCount = await current.tx.
                    select({ "followingCount": count(ClientFollowTable.id).as("followingCount") }).
                    from(ClientFollowTable).
                    where(eq(ClientFollowTable.follower_id, res.locals.query!.userId))

                const users = await current.tx.
                    select({
                        ...followRelationSubQuery._.selectedFields,
                    }).
                    from(ClientFollowTable).
                    where(eq(ClientFollowTable.follower_id, res.locals.query!.userId)).
                    innerJoin(followRelationSubQuery, eq(followRelationSubQuery.id, ClientFollowTable.following_id)).
                    orderBy(desc(ClientFollowTable.created_at)).
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
                    select({ "followerCount": count(ClientFollowTable.id).as("followerCount") }).
                    from(ClientFollowTable).
                    where(eq(ClientFollowTable.following_id, res.locals.query!.userId))

                const users = await current.tx.
                    select({
                        ...followRelationSubQuery._.selectedFields,
                    }).
                    from(ClientFollowTable).
                    where(eq(ClientFollowTable.following_id, res.locals.query!.userId)).
                    innerJoin(followRelationSubQuery, eq(followRelationSubQuery.id, ClientFollowTable.follower_id)).
                    orderBy(desc(ClientFollowTable.created_at)).
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
    async followUser(req: Request, res: EnhancedResponse<null, typeof followUserInput>) {
        const current = getCurrent()

        switch (res.locals.body!.isFollow) {
            case 0:
                const user = await current.tx.
                    select().
                    from(ClientFollowTable).
                    where(and(
                        eq(ClientFollowTable.follower_id, current.payload.userId),
                        eq(ClientFollowTable.following_id, res.locals.body!.userId),
                    ))

                // 关注用户
                if (user.length !== 0) {
                    throw new AppError("已关注该用户")
                }

                await current.tx.insert(ClientFollowTable).values({
                    follower_id: current.payload.userId,
                    following_id: res.locals.body!.userId,
                })
                break
            case 1:
                await current.tx.delete(ClientFollowTable).
                    where(and(
                        eq(ClientFollowTable.follower_id, current.payload.userId),
                        eq(ClientFollowTable.following_id, res.locals.body!.userId),
                    ))
                break
            default:
                throw new AppError("关注状态错误")
        }

        const user = await this.queryUserWithFollow(res.locals.body!.userId)
        res.json(followUserOutput.parse({
            user,
        }))
    }

    // 移除粉丝
    async removeFollower(req: Request, res: EnhancedResponse<null, typeof removeFollowerInput>) {
        const current = getCurrent()

        await current.tx.
            delete(ClientFollowTable).
            where(and(
                eq(ClientFollowTable.follower_id, res.locals.body!.userId),
                eq(ClientFollowTable.following_id, current.payload.userId)
            ))

        const user = await this.queryUserWithFollow(res.locals.body!.userId)
        res.json(followUserOutput.parse({
            user,
        }))
    }

    async queryUserWithFollow(userId: string) {
        const current = getCurrent()
        const followRelationSubQuery = this.getFollowRelationSubQuery()


        const user = await current.tx.
            select({
                ...followRelationSubQuery._.selectedFields,
            }).
            from(followRelationSubQuery).
            where(eq(followRelationSubQuery.id, userId))
        if (user[0] === undefined) {
            throw new AppError("用户不存在")
        }
        return user[0]
    }
}
