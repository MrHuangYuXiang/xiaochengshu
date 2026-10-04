import type { FileStoragePort } from "../../port/file-storage-port.js"
import type { ClientManagerPort } from "../../port/client-manager-port.js"
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