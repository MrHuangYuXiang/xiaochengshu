import { corsMiddleware, middlewareWrapper } from "./middleware.js"
import { newUserService, UserService } from "./domain/service/user.js"
import { newWorkService } from "./domain/service/work.js"
import {
    getWorksInput,
    createWorkCommentInput,
    createWorkCommentOutput,
    getWorkDetailInput,
    getWorkDetailOutput,
    getWorkCommentsOutput,
    getWorkCommentsInput,
    getWorksOutput,
    likeWorkInput,
    collectWorkInput,
    likeWorkCommentInput,
} from "./domain/dto/work.js"
import {
    smsSendInput,
    loginInput,
    loginOutput,
    updateUserInfoInput,
    getUserDetailInput,
    getUserDetailOutput,
    followUserInput,
    getInitDataOutput,
    getUserFollowsInput,
    getUserFollowsOutput,
    removeFollowerInput,
    followUserOutput,
    removeFollowerOutput,
} from "./domain/dto/user.js"
import express from "express"
import { routeMap } from "./route_map.js"
import { doc } from "./doc.js"
import { z } from "zod"
import { newLocalMutex } from "./io/adapter/mutex.js"
import { newNginxFileStorage } from "./io/adapter/file_storage.js"

export interface ServerPort {
    Run(): void
}

// express实例代理类
// 增强get和post方法,添加注册前缀树以及生成openapi文档功能
class RouterProxy {
    public router: express.Router

    constructor() {
        this.router = express.Router()
    }

    // isPersistent: 是否持久化响应,默认false
    get(path: string, inputSchema: z.ZodObject | null, outputSchema: z.ZodObject | null, cb: (req: express.Request, res: express.Response) => Promise<void>, isPersistent: boolean = false) {
        doc.registerPath("GET", path, inputSchema, outputSchema)
        routeMap.add("GET", path, inputSchema || undefined)
        return this.router.get(path, middlewareWrapper(cb, isPersistent))
    }

    post(path: string, requestSchema: z.ZodObject | null, outputSchema: z.ZodObject | null, cb: (req: express.Request, res: express.Response) => Promise<void>, isPersistent: boolean = false) {
        doc.registerPath("POST", path, requestSchema, outputSchema)
        routeMap.add("POST", path, requestSchema || undefined)
        return this.router.post(path, middlewareWrapper(cb, isPersistent))
    }
}

export class Server implements ServerPort {
    constructor() {
    }

    async Run() {
        const app = express()
        const routerProxy = new RouterProxy()
        
        const mutex = newLocalMutex()
        const fileStorage = newNginxFileStorage()
        const userService = await newUserService(mutex, fileStorage)
        const workService = await newWorkService(fileStorage)

        // express中间件注册
        routerProxy.router.use(express.json())
        routerProxy.router.use(corsMiddleware)

        /**
         * 下面为express路由注册
         * 注意: 必须显式绑定this防止this丢失
         */

        /** 用户模块 */
        routerProxy.post('/user/connect', null, null, userService.connect.bind(userService), true) // 建立长连接
        routerProxy.get('/user/init-data', null, getInitDataOutput, userService.getInitData.bind(userService)) // 获取初始化数据
        routerProxy.post('/sms/send', smsSendInput, null, userService.smsSend.bind(userService)) // 发送短信验证码
        routerProxy.post('/login', loginInput, loginOutput, userService.login.bind(userService)) // 登录
        routerProxy.get('/user', getUserDetailInput, getUserDetailOutput, userService.getUserDetail.bind(userService)) // 获取用户详情
        routerProxy.post('/upload/user/avatar', null, null, userService.uploadUserAvatar.bind(userService)) // 上传头像
        routerProxy.post('/update/user/info', updateUserInfoInput, null, userService.updateUserInfo.bind(userService)) // 更新用户信息
        routerProxy.get('/user/follows', getUserFollowsInput, getUserFollowsOutput, userService.getUserFollows.bind(userService)) // 获取用户关注/粉丝
        routerProxy.post('/follow/user', followUserInput, followUserOutput, userService.followUser.bind(userService)) // 关注用户
        routerProxy.post('/remove/follower', removeFollowerInput, removeFollowerOutput, userService.removeFollower.bind(userService)) // 移除粉丝

        /** 作品模块 */
        routerProxy.get('/work', getWorkDetailInput, getWorkDetailOutput, workService.getWorkDetail.bind(workService)) // 获取作品详情
        routerProxy.get('/works', getWorksInput, getWorksOutput, workService.getWorks.bind(workService)) // 获取用户作品列表
        routerProxy.get('/work/comments', getWorkCommentsInput, getWorkCommentsOutput, workService.getWorkComments.bind(workService)) // 获取作品评论/回复
        routerProxy.post('/create/work', null, null, workService.createWork.bind(workService)) // 发表作品
        routerProxy.post('/create/work/comment', createWorkCommentInput, createWorkCommentOutput, workService.createWorkComment.bind(workService)) // 评论作品
        // routerProxy.post('/like/work/:workId', likeWorkInput, null, workService.likeWork.bind(workService)) // 点赞作品
        // routerProxy.post('/collect/work/:workId', collectWorkInput, null, workService.collectWork.bind(workService)) // 收藏作品
        // routerProxy.post('/like/work/:workId/comment/:commentId', likeWorkCommentInput, null, workService.likeWorkComment.bind(workService)) // 点赞评论

        /** 聊天模块 TODO: 待开发*/

        /** 直播模块 TODO: 待开发 */

        app.use('/api', routerProxy.router)

        app.listen(8080, (err?: Error | undefined) => {
            if (err) {
                console.log(err)
            }
            // 导出openapi文档
            doc.exportDoc()
            console.log('server is running on port 8080')
        })
    }
}