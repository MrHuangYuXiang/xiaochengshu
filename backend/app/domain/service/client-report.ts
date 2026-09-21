import type { EnhancedResponse } from "../model/dto/index.js"
import { getReportTypesOutput, reportWorkInput } from "../model/dto/client-report.js"
import { getCurrent } from "../../lib/local-stroage.js"
import { ReportObjectEnum, ReportStatusEnum, ReportTypeEnum } from "../model/enum/admin-report.js"
import { AppError } from "../../lib/app-error.js"
import { AdminReportTable } from "../../db/schema/admin-report.js"
import type { Request } from "express"
import { extend } from "zod/mini"
import { BaseService } from "./base.js"


export class ClientReportService extends BaseService {
    // 举报
    async report(req: Request, res: EnhancedResponse<null, typeof reportWorkInput>) {
        const current = getCurrent()

        await current.tx.insert(AdminReportTable).values({
            work_id: res.locals.body!.workId,
            reporter_id: current.payload.userId,
            report_object: res.locals.body!.reportObject,
            report_type: res.locals.body!.reportType,
            reason: res.locals.body!.reason,
            status: ReportStatusEnum.PENDING,
        })
    }

    // 查询举报类型
    async getReportTypes(req: Request, res: EnhancedResponse<null, null>) {
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