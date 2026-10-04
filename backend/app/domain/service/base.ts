import { and, eq, getTableColumns, SQL, sql } from "drizzle-orm"
import { FollowTable, UserTable } from "../model/db-schema/user.js"
import { getCurrent } from "../../lib/local-stroage.js"
import { alias } from "drizzle-orm/mysql-core"
import { WorkCollectTable, WorkCommentLikeTable, WorkCommentTable, WorkImageTable, WorkLikeTable, WorkTable } from "../model/db-schema/work.js"
import type { FileStoragePort } from "../../port/file-storage-port.js"
import type { ClientManagerPort } from "../../port/client-manager-port.js"
import { ChatMessageTable, ChatSessionMemberTable, ChatSessionTable, DbChatMessagePayload } from "../model/db-schema/chat.js"
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../../lib/app-error.js"
import type z from "zod"
import { AdminReportTable } from "../model/db-schema/admin-report.js"
import type { ChatShareService } from "./chat-share.js"
import type { WorkShareService } from "./work-share.js"
import type { UserShareService } from "./user-share.js"
import type { ReportShareService } from "./report-share.js"

// 公共服务基类
export class BaseShareService {
    protected readonly fileStorage: FileStoragePort
    protected readonly clientManager: ClientManagerPort

    constructor(fileStorage: FileStoragePort, clientManager: ClientManagerPort) {
        this.fileStorage = fileStorage
        this.clientManager = clientManager
    }
}

// 服务基类
export class BaseService extends BaseShareService {
    protected readonly chatShareService: ChatShareService
    protected readonly workShareService: WorkShareService
    protected readonly userShareService: UserShareService
    protected readonly reportShareService: ReportShareService

    constructor(
        fileStorage: FileStoragePort, 
        clientManager: ClientManagerPort,
        chatShareService: ChatShareService,
        workShareService: WorkShareService,
        userShareService: UserShareService,
        reportShareService: ReportShareService,
    ) {
        super(fileStorage, clientManager)
        this.chatShareService = chatShareService
        this.workShareService = workShareService
        this.userShareService = userShareService
        this.reportShareService = reportShareService
    }
}