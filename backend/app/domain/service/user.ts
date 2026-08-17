import { getCurrent } from "../../local_stroage.js";
import { userTable, followTable } from "../../db/schema/user.js";
import { workCollectTable, workTable, workLikeTable } from "../../db/schema/work.js";
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
} from "../dto/user.js";
import type { EnhancedResponse } from "../dto/index.js";
import type { Request, Response } from "express";
import { genJWT } from "../../helper/jwt.js";
import { getEnv } from "../../helper/env.js";
import { FormParser } from "../../form_parser.js";
import type { MutexPort } from "../../io/port/mutex.js";
import { v4 as uuidv4 } from "uuid";
import { clientResponseMap } from "../../client.js";
import { heartbeatClientEvent, ClientEventType } from "../dto/client.js";
import { AppError } from "../../error.js";
import { getImageExt, getPageParams } from "../../helper/http.js";
import { getFollowRelationSubQuery } from "./common.js";
import type { FileStoragePort } from "../../io/port/file_storage.js";

export class UserService {
    private mutex: MutexPort
    private fileStorage: FileStoragePort

    constructor(mutex: MutexPort, fileStorage: FileStoragePort) {
        this.mutex = mutex
        this.fileStorage = fileStorage
    }

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

        // 上锁避免手机号重复注册
        await this.mutex.withLock(`login:${res.locals.body!.phoneNumber}`, async () => {
            const user = await current.tx.select().from(userTable).where(eq(userTable.phone_number, res.locals.body!.phoneNumber))

            // 用户不存在自动注册注册
            if (user.length == 0) {
                userId = uuidv4()
                await current.tx.insert(userTable).values({
                    id: userId,
                    phone_number: res.locals.body!.phoneNumber,
                    name: res.locals.body!.phoneNumber,
                    desc: "",
                    birthday: new Date(),
                    gender: 1,
                    avatar_url: "",
                    // 未填写个人信息
                    is_profile_completed: 0,
                })
            } else {
                userId = user[0]!.id
            }
        })

        res.json(loginOutput.parse({
            token: genJWT(userId),
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

        // 在线状态通过httpResponseMap维护,加锁避免高并发单用户同时在线问题
        await this.mutex.withLock(`online:${current.userId}`, async () => {
            if (!clientResponseMap.get(current.userId)) {
                clientResponseMap.add(current.userId, res)
            } else {
                throw new AppError("用户已在线")
            }
        })

        // 后端维持心跳,同时续约jwt
        clientResponseMap.push(current.userId, ClientEventType.heartbeat, heartbeatClientEvent.parse({
            jwt: genJWT(current.userId),
        }))
        const n = setInterval(() => {
            clientResponseMap.push(current.userId, ClientEventType.heartbeat, heartbeatClientEvent.parse({
                jwt: genJWT(current.userId),
            }))
        }, parseInt(getEnv("PERSISTENT_HEARTBEAT_INTERVAL")))

        // 监听客户端关闭连接,清理相关资源
        req.on("close", () => {
            console.log(`用户${current.userId}的长连接已关闭`);
            clientResponseMap.del(current.userId)
            clearInterval(n)
        });
    }

    async getInitData(req: Request, res: EnhancedResponse<null, null>) {
        const current = getCurrent()

        // 查询初始化信息并推送初始化事件
        const result = await current.tx.select(
            {
                user: getTableColumns(userTable),
            }).
            from(userTable).
            where(eq(userTable.id, current.userId))

        res.json(getInitDataOutput.parse({
            ...result[0],
        }))
    }

    // 获取用户详情
    async getUserDetail(req: Request, res: EnhancedResponse<typeof getUserDetailInput, null>) {
        const current = getCurrent()
        const followRelationSubQuery = getFollowRelationSubQuery()

        const user = await current.tx.select({
            user: followRelationSubQuery._.selectedFields,
            "followingCount": current.tx.select({ "count": count(followTable.id).as("followingCount") }).from(followTable).where(eq(followTable.follower_id, res.locals.query!.userId)).as("followingCount"),
            "followerCount": current.tx.select({ "count": count(followTable.id).as("followerCount") }).from(followTable).where(eq(followTable.following_id, res.locals.query!.userId)).as("followerCount"),
            "workCount": current.tx.select({ "count": count(workTable.id).as("workCount") }).from(workTable).where(eq(workTable.user_id, res.locals.query!.userId)).as("workCount"),
            "likeCount": current.tx.select({ "count": count(workLikeTable.id).as("likeCount") }).from(workLikeTable).where(eq(workLikeTable.user_id, res.locals.query!.userId)).as("likeCount"),
            "collectCount": current.tx.select({ "count": count(workCollectTable.id).as("collectCount") }).from(workCollectTable).where(eq(workCollectTable.user_id, res.locals.query!.userId)).as("collectCount"),
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
        let fileName = ""

        await formParser.exec(async (fieldType) => {
            const ext = getImageExt(fieldType)
            fileName = `/avatars/${current.userId}${ext}`
            return await this.fileStorage.getWritableStream(fileName)
        })
        
        await current.tx.update(userTable).set({
            avatar_url: fileName,
        }).where(eq(userTable.id, current.userId))
    }

    // 更新用户信息
    async updateUserInfo(req: Request, res: EnhancedResponse<null, typeof updateUserInfoInput>) {
        const current = getCurrent()

        await current.tx.update(userTable).set({
            name: res.locals.body!.name,
            desc: res.locals.body!.desc,
            birthday: new Date(res.locals.body!.birthday),
            gender: res.locals.body!.gender,
            // 标记为已填写个人信息
            is_profile_completed: 1,
        }).where(eq(userTable.id, current.userId))
    }

    // 获取用户的关注/粉丝接口
    async getUserFollows(req: Request, res: EnhancedResponse<typeof getUserFollowsInput, null>) {
        const page = getPageParams(res)
        const current = getCurrent()
        const followRelationSubQuery = await getFollowRelationSubQuery()

        switch (res.locals.query!.type) {
            // 查询目标用户关注的人
            case "following": {
                // 聚合数据查询
                const followingCount = await current.tx.
                    select({ "followingCount": count(followTable.id).as("followingCount") }).
                    from(followTable).
                    where(eq(followTable.follower_id, res.locals.query!.userId))

                const users = await current.tx.
                    select({
                        ...followRelationSubQuery._.selectedFields,
                    }).
                    from(followTable).
                    where(eq(followTable.follower_id, res.locals.query!.userId)).
                    innerJoin(followRelationSubQuery, eq(followRelationSubQuery.id, followTable.following_id)).
                    orderBy(desc(followTable.created_at)).
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
                    select({ "followerCount": count(followTable.id).as("followerCount") }).
                    from(followTable).
                    where(eq(followTable.following_id, res.locals.query!.userId))

                const users = await current.tx.
                    select({
                        ...followRelationSubQuery._.selectedFields,
                    }).
                    from(followTable).
                    where(eq(followTable.following_id, res.locals.query!.userId)).
                    innerJoin(followRelationSubQuery, eq(followRelationSubQuery.id, followTable.follower_id)).
                    orderBy(desc(followTable.created_at)).
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
                    from(followTable).
                    where(and(
                        eq(followTable.follower_id, current.userId),
                        eq(followTable.following_id, res.locals.body!.userId),
                    ))

                // 关注用户
                if (user.length !== 0) {
                    throw new AppError("已关注该用户")
                }

                await current.tx.insert(followTable).values({
                    follower_id: current.userId,
                    following_id: res.locals.body!.userId,
                })
                break
            case 1:
                await current.tx.delete(followTable).
                    where(and(
                        eq(followTable.follower_id, current.userId),
                        eq(followTable.following_id, res.locals.body!.userId),
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
            delete(followTable).
            where(and(
                eq(followTable.follower_id, res.locals.body!.userId),
                eq(followTable.following_id, current.userId)
            ))

        const user = await this.queryUserWithFollow(res.locals.body!.userId)
        res.json(followUserOutput.parse({
            user,
        }))
    }

    async queryUserWithFollow(userId: string) {
        const current = getCurrent()
        const followRelationSubQuery = await getFollowRelationSubQuery()


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
