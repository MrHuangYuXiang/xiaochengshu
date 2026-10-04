import { corsMiddleware, middlewareWrapper } from "./middleware.js"
import { UserService } from "./domain/service/user.js"
import { ChatService } from "./domain/service/chat.js"
import { WorkService } from "./domain/service/work.js"
import { ReportService } from "./domain/service/report.js"
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
    shareWorkInput,
    replyWorkCommentInput,
    replyWorkCommentOutput,
} from "./domain/model/dto/work.js"
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
} from "./domain/model/dto/user.js"
import { 
    reportWorkInput, 
    getReportTypesOutput, 
    getReportDetailInput, 
    getReportDetailOutput
} from "./domain/model/dto/report.js"
import express from "express"
import { routeMap } from "./lib/framework-ext.js"
import { doc } from "./lib/framework-ext.js"
import { z } from "zod"
import { 
    createSessionInput, 
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
} from "./domain/model/dto/chat.js"
import { LocalFileStorageAdapter } from "./port/file-storage-adapter.js"
import { LocalClientManager } from "./port/client-manager-adapter.js"
import type { ClientManagerPort } from "./port/client-manager-port.js"
import { WorkShareService } from "./domain/service/work-share.js"
import { ReportShareService } from "./domain/service/report-share.js"
import { UserShareService } from "./domain/service/user-share.js"
import { ChatShareService } from "./domain/service/chat-share.js"

export interface ServerPort {
    Run(): void
}

export class Server implements ServerPort {
    // express相关变量
    private app: express.Express
    private router: express.Router
    private clientManager: ClientManagerPort

    constructor() {
        this.app = express()
        this.router = express.Router()
        this.clientManager = new LocalClientManager()
    }

    async Run() {
        // 端口实例
        const fileStorage = new LocalFileStorageAdapter()
        const clientManager = this.clientManager
        const reportShareService = new ReportShareService(fileStorage, clientManager)
        const workShareService = new WorkShareService(fileStorage, clientManager)
        const userShareService = new UserShareService(fileStorage, clientManager)
        const chatShareService = new ChatShareService(fileStorage, clientManager)

        // 服务实例
        const chatService = new ChatService(fileStorage, clientManager, chatShareService, workShareService, userShareService, reportShareService) 
        const reportService = new ReportService(fileStorage, clientManager,  chatShareService, workShareService, userShareService, reportShareService)
        const userService = new UserService(fileStorage, clientManager, chatShareService, workShareService, userShareService, reportShareService)
        const workService = new WorkService(fileStorage, clientManager, chatShareService, workShareService, userShareService, reportShareService)

        // express中间件注册
        this.app.use(express.json())
        this.app.use(corsMiddleware)

        /**
         * 下面为express路由注册
         * 注意: 必须显式绑定this防止this丢失
         */

        /** 以下为客户系统api,面向普通用户 */

        // 用户模块
        this.registerHandler('/user/connect', undefined, undefined, userService.connect.bind(userService), true)
        this.registerHandler('/user/init-data', undefined, getInitDataOutput, userService.getInitData.bind(userService))
        this.registerHandler('/sms/send', smsSendInput, undefined, userService.smsSend.bind(userService)) 
        this.registerHandler('/login', loginInput, loginOutput, userService.login.bind(userService))
        this.registerHandler('/user', getUserDetailInput, getUserDetailOutput, userService.getUserDetail.bind(userService))
        this.registerHandler('/upload/user/avatar', undefined, undefined, userService.uploadUserAvatar.bind(userService))
        this.registerHandler('/update/user/info', updateUserInfoInput, undefined, userService.updateUserInfo.bind(userService))
        this.registerHandler('/user/follows', getUserFollowsInput, getUserFollowsOutput, userService.getUserFollows.bind(userService))
        this.registerHandler('/follow/user', followUserInput, undefined, userService.followUser.bind(userService))
        this.registerHandler('/remove/follower', removeFollowerInput, undefined, userService.removeFollower.bind(userService))

        // 作品模块
        this.registerHandler('/work', getWorkDetailInput, getWorkDetailOutput, workService.getWorkDetail.bind(workService))
        this.registerHandler('/works', getWorksInput, getWorksOutput, workService.getWorks.bind(workService))
        this.registerHandler('/create/work', undefined, undefined, workService.createWork.bind(workService))
        this.registerHandler('/delete/work', deleteWorkInput, undefined, workService.deleteWork.bind(workService))
        this.registerHandler('/like/work', likeWorkInput, undefined, workService.likeWork.bind(workService))
        this.registerHandler('/collect/work', collectWorkInput, undefined, workService.collectWork.bind(workService))
        this.registerHandler('/share/work', shareWorkInput, undefined, workService.shareWork.bind(workService))
        this.registerHandler('/work/comments', getWorkCommentsInput, getWorkCommentsOutput, workService.getWorkComments.bind(workService))
        this.registerHandler('/create/work/comment', createWorkCommentInput, createWorkCommentOutput, workService.createWorkComment.bind(workService))
        this.registerHandler('/reply/work/comment', replyWorkCommentInput, replyWorkCommentOutput, workService.replyWorkComment.bind(workService))
        this.registerHandler('/like/work/comment', likeWorkCommentInput, undefined, workService.likeWorkComment.bind(workService))

        // 聊天模块
        this.registerHandler('/chat/create/session', createSessionInput, createSessionOutput, chatService.createSession.bind(chatService))
        this.registerHandler('/chat/get/sessions', getSessionsInput, getSessionsOutput, chatService.getSessions.bind(chatService))
        this.registerHandler('/chat/get/session', getSessionInput, getSessionOutput, chatService.getSession.bind(chatService))
        this.registerHandler('/chat/pin/session', pinSessionInput, undefined, chatService.pinSession.bind(chatService))
        this.registerHandler('/chat/send/message', sendMessageInput, sendMessageOutput, chatService.sendMessage.bind(chatService))
        this.registerHandler('/chat/get/messages', getMessagesInput, getMessagesOutput, chatService.getMessages.bind(chatService))
        this.registerHandler('/chat/clear/active/session', undefined, undefined, chatService.clearActiveSession.bind(chatService))

        // 举报模块
        this.registerHandler('/report', reportWorkInput, undefined, reportService.report.bind(reportService))
        this.registerHandler('/report/types', undefined, getReportTypesOutput, reportService.getReportTypes.bind(reportService))
        this.registerHandler('/report', getReportDetailInput, getReportDetailOutput, reportService.getReportDetail.bind(reportService))

        // 直播模块

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
        path: string,
        inputSchema: z.ZodObject | undefined,
        outputSchema: z.ZodObject | undefined,
        cb: (req: express.Request, res: express.Response) => Promise<void>,
        isPersistent: boolean = false
    ) {
        doc.registerPath(path, inputSchema, outputSchema)
        routeMap.add(path, inputSchema)
        return this.router.post(path, middlewareWrapper(cb, isPersistent, this.clientManager))
    }
}