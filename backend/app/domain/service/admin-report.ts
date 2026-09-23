import type { Request } from "express";
import type { EnhancedResponse } from "../model/dto/index.js";
import { AdminReportTable } from "../model/db-schema/admin-report.js";
import { getCurrent } from "../../lib/local-stroage.js";
import { ClientWorkImageTable, ClientWorkTable } from "../model/db-schema/client-work.js";
import { and, eq, getTableColumns } from "drizzle-orm";
import { ClientUserTable } from "../model/db-schema/client-user.js";
import { getReportsOutput, handleReportInput, type getReportsInput } from "../model/dto/admin-report.js";
import { AppError, throwServerBusy } from "../../lib/app-error.js";
import { ReportStatusEnum } from "../model/enum/admin-report.js";
import { BaseService } from "./base.js";

export class AdminReportService extends BaseService {

    // 获取举报列表
    async getReports(req: Request, res: EnhancedResponse<typeof getReportsInput, null>) {
        const current = getCurrent()

        const data = await current.tx.
            select({
                report: AdminReportTable,
                reporter: ClientUserTable,
            }).
            from(AdminReportTable).
            innerJoin(ClientUserTable, eq(AdminReportTable.reporter_id, ClientUserTable.id))

        res.json(getReportsOutput.parse({
            reports: data,
        }))
    }


    // 处理举报
    async handleReport(req: Request, res: EnhancedResponse<null, typeof handleReportInput>) {
        const current = getCurrent()

        // 乐观锁更新举报状态,避免高并发重复处理
        const result = await current.tx.
            update(AdminReportTable).
            set({ status: res.locals.body!.status }).
            where(and(
                eq(AdminReportTable.id, res.locals.body!.reportId),
                eq(AdminReportTable.status, ReportStatusEnum.PENDING)
            ))
        if (result[0].affectedRows === 0) {
            throwServerBusy()
        }

        const report = await current.tx.
            select().
            from(AdminReportTable).
            where(eq(AdminReportTable.id, res.locals.body!.reportId))
        if (!report[0]) {
            throw new AppError("举报不存在")
        }

        switch (res.locals.body!.status) {
            case ReportStatusEnum.APPROVED:
                await this.baseDeleteWork(report[0].work_id)
                break;
            case ReportStatusEnum.REJECTED:
                break;
            default:
                throw new AppError("未知的举报状态")
        }
    }
}