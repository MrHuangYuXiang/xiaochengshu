import { corsMiddleware, middlewareWrapper } from "./middleware.js"
import { ClientUserService } from "./domain/service/client-user.js"
import { ClientChatService } from "./domain/service/client-chat.js"
import { ClientWorkService } from "./domain/service/client-work.js"
import { ClientReportService } from "./domain/service/client-report.js"
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
    deleteWorkInput,
} from "./domain/model/dto/client-work.js"
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
} from "./domain/model/dto/client-user.js"
import { reportWorkInput, getReportTypesOutput } from "./domain/model/dto/client-report.js"
import express from "express"
import { routeMap } from "./lib/framework-ext.js"
import { doc } from "./lib/framework-ext.js"
import { z } from "zod"
import { createSessionInput, createSessionOutput, getMessagesInput, getMessagesOutput, getSessionsInput, getSessionsOutput, pinSessionInput, sendMessageInput, sendMessageOutput } from "./domain/model/dto/client-chat.js"
import { LocalMutexAdapter } from "./port/mutex-adapter.js"
import { LocalFileStorageAdapter } from "./port/file-storage-adapter.js"
import { LocalClientManagerAdapter } from "./port/client-manager-adapter.js"
import type { ClientManagerPort } from "./port/client-manager-port.js"
import { adminAddUserInput, adminLoginInput, adminLoginOutput } from "./domain/model/dto/admin-user.js"
import { AdminUserService } from "./domain/service/admin-user.js"
import { AdminReportService } from "./domain/service/admin-report.js"
import type { FileStoragePort } from "./port/file-storage-port.js"

export interface ServerPort {
    Run(): void
}

export class Server implements ServerPort {
    // 端口实例
    private clientManager: ClientManagerPort
    private fileStorage: FileStoragePort
    // express相关变量
    private app: express.Express
    private router: express.Router

    constructor() {
        this.clientManager = new LocalClientManagerAdapter()
        this.fileStorage = new LocalFileStorageAdapter()
        this.app = express()
        this.router = express.Router()
    }

    async Run() {
        // 端口实例
        const mutex = new LocalMutexAdapter()
        const fileStorage = new LocalFileStorageAdapter()

        // 服务实例
        const clientChatService = new ClientChatService(this.fileStorage, this.clientManager)
        const clientReportService = new ClientReportService(this.fileStorage, this.clientManager)
        const clientUserService = new ClientUserService(this.fileStorage, this.clientManager)
        const clientWorkService = new ClientWorkService(this.fileStorage, this.clientManager)
        const adminUserService = new AdminUserService(this.fileStorage, this.clientManager)
        const adminReportService = new AdminReportService(this.fileStorage, this.clientManager)

        // express中间件注册
        this.app.use(express.json())
        this.app.use(corsMiddleware)

        /**
         * 下面为express路由注册
         * 注意: 必须显式绑定this防止this丢失
         */

        /** 以下为客户系统api,面向普通用户 */

        // 用户模块
        this.registerHandler("POST", '/user/connect', null, null, clientUserService.connect.bind(clientUserService), true) // 建立长连接
        this.registerHandler("GET", '/user/init-data', null, getInitDataOutput, clientUserService.getInitData.bind(clientUserService)) // 获取初始化数据
        this.registerHandler("POST", '/sms/send', smsSendInput, null, clientUserService.smsSend.bind(clientUserService)) // 发送短信验证码
        this.registerHandler("POST", '/login', loginInput, loginOutput, clientUserService.login.bind(clientUserService)) // 登录
        this.registerHandler("GET", '/user', getUserDetailInput, getUserDetailOutput, clientUserService.getUserDetail.bind(clientUserService)) // 获取用户详情
        this.registerHandler("POST", '/upload/user/avatar', null, null, clientUserService.uploadUserAvatar.bind(clientUserService)) // 上传头像
        this.registerHandler("POST", '/update/user/info', updateUserInfoInput, null, clientUserService.updateUserInfo.bind(clientUserService)) // 更新用户信息
        this.registerHandler("GET", '/user/follows', getUserFollowsInput, getUserFollowsOutput, clientUserService.getUserFollows.bind(clientUserService)) // 获取用户关注/粉丝
        this.registerHandler("POST", '/follow/user', followUserInput, followUserOutput, clientUserService.followUser.bind(clientUserService)) // 关注用户
        this.registerHandler("POST", '/remove/follower', removeFollowerInput, removeFollowerOutput, clientUserService.removeFollower.bind(clientUserService)) // 移除粉丝

        // 作品模块
        this.registerHandler("GET", '/work', getWorkDetailInput, getWorkDetailOutput, clientWorkService.getWorkDetail.bind(clientWorkService)) // 获取作品详情
        this.registerHandler("GET", '/works', getWorksInput, getWorksOutput, clientWorkService.getWorks.bind(clientWorkService)) // 获取用户作品列表
        this.registerHandler("POST", '/create/work', null, null, clientWorkService.createWork.bind(clientWorkService)) // 发表作品
        this.registerHandler("POST", '/delete/work', deleteWorkInput, null, clientWorkService.deleteWork.bind(clientWorkService)) // 删除作品
        this.registerHandler("GET", '/work/comments', getWorkCommentsInput, getWorkCommentsOutput, clientWorkService.getWorkComments.bind(clientWorkService)) // 获取作品评论/回复
        this.registerHandler("POST", '/create/work/comment', createWorkCommentInput, createWorkCommentOutput, clientWorkService.createWorkComment.bind(clientWorkService)) // 评论作品

        // 聊天模块
        this.registerHandler("POST", '/chat/create/session', createSessionInput, createSessionOutput, clientChatService.createSession.bind(clientChatService)) // 创建会话
        this.registerHandler("GET", '/chat/get/sessions', getSessionsInput, getSessionsOutput, clientChatService.getSessions.bind(clientChatService)) // 查询会话
        this.registerHandler("POST", '/chat/pin/session', pinSessionInput, null, clientChatService.pinSession.bind(clientChatService)) // 置顶会话
        this.registerHandler("POST", '/chat/send/message', sendMessageInput, sendMessageOutput, clientChatService.sendMessage.bind(clientChatService)) // 发送消息
        this.registerHandler("GET", '/chat/get/messages', getMessagesInput, getMessagesOutput, clientChatService.getMessages.bind(clientChatService)) // 查询消息

        // 举报模块
        this.registerHandler("POST", '/report', reportWorkInput, null, clientReportService.report.bind(clientReportService)) // 举报
        this.registerHandler("GET", '/report/types', null, getReportTypesOutput, clientReportService.getReportTypes.bind(clientReportService)) // 查询举报类型

        // 直播模块

        /** 以下为后台系统api,面向企业后台管理 */

        // 用户模块
        this.registerHandler("POST", '/admin/login', adminLoginInput, adminLoginOutput, adminUserService.login.bind(adminUserService)) // 登录
        this.registerHandler("POST", '/admin/add/user', adminAddUserInput, null, adminUserService.addUser.bind(adminUserService)) // 添加新员工

        // 举报模块

        this.app.use('/api', this.router)

        this.app.listen(8080, (err?: Error | undefined) => {
            if (err) {
                console.log(err)
            }
            // 导出openapi文档
            doc.exportDoc()
            console.log('server is running on port 8080')
        })
    }

    // 注册处理函数
    registerHandler(
        method: "GET" | "POST",
        path: string,
        inputSchema: z.ZodObject | null,
        outputSchema: z.ZodObject | null,
        cb: (req: express.Request, res: express.Response) => Promise<void>,
        isPersistent: boolean = false
    ) {
        doc.registerPath(method, path, inputSchema, outputSchema)
        routeMap.add(method, path, inputSchema || undefined)
        if (method === "POST") {
            return this.router.post(path, middlewareWrapper(cb, isPersistent, this.clientManager))
        } else {
            return this.router.get(path, middlewareWrapper(cb, isPersistent, this.clientManager))
        }
    }
}