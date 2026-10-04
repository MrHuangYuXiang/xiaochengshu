import { getRequestBody, getRequestPage } from "../model/dto/index.js"
import { getReportDetailInput, getReportDetailOutput, getReportTypesOutput, reportWorkInput } from "../model/dto/report.js"
import { getCurrent } from "../../lib/local-stroage.js"
import { ReportStatusEnum, ReportTypeEnum } from "../model/enum/admin-report.js"
import { AppError } from "../../lib/app-error.js"
import { AdminReportTable } from "../model/db-schema/admin-report.js"
import type { Request, Response } from "express"
import { BaseService } from "./base.js"
import { ChatSessionMemberTable, ChatSessionTable } from "../model/db-schema/chat.js"
import { and, eq } from "drizzle-orm"
import { ClientChatMessageTypeEnum, ClientChatSessionTypeEnum } from "../model/enum/chat.js"
import { v4 as uuidv4 } from "uuid";

export class ReportService extends BaseService {
    // 举报
    async report(req: Request, res: Response) {
        const current = getCurrent()
        const body = getRequestBody<typeof reportWorkInput>(res)
        const reportId = uuidv4()

        await current.tx.insert(AdminReportTable).values({
            id: reportId,
            work_id: body.workId,
            reporter_id: current.payload.userId,
            report_type: body.reportType,
            reason: body.reason,
            status: ReportStatusEnum.PENDING,
        })

        // 发送举报通知消息
        const sessionId = await current.tx.
            select().
            from(ChatSessionMemberTable).
            innerJoin(ChatSessionTable, eq(ChatSessionMemberTable.session_id, ChatSessionTable.id)).
            where(and(
                eq(ChatSessionMemberTable.user_id, current.payload.userId),
                eq(ChatSessionTable.type, ClientChatSessionTypeEnum.SYSTEM),
            ))
        if (sessionId[0]) {
            await this.chatShareService.sendChatMessage({
                type: ClientChatMessageTypeEnum.REPORT_NOTICE,
                user_id: sessionId[0].chat_session_member.other_user_id,
                session_id: sessionId[0].chat_session.id,
                content: "你的举报已受理,预计将在3个工作日内处理完毕,谢谢你对维护社区环境做出的贡献!",
            }, {
                [ClientChatMessageTypeEnum.REPORT_NOTICE]: {
                    report_id: reportId,
                }
            })
        }
    }

    // 查询举报详情
    async getReportDetail(req: Request, res: Response) {
        const body = getRequestBody<typeof getReportDetailInput>(res)
        const data = await this.reportShareService.getReportDetail(body.reportId)
        res.json(getReportDetailOutput.parse({
            report: data,
        }))
    }

    // 查询举报类型
    async getReportTypes(req: Request, res: Response) {
        const data = Object.entries(ReportTypeEnum).map(([key, value]) => {
            return {
                text: key,
                id: value,
            }
        })
        res.json(getReportTypesOutput.parse({
            types: data,
        }))
    }
}