import { eq } from "drizzle-orm";
import { getCurrent } from "../../lib/local-stroage.js";
import { AdminReportTable } from "../model/db-schema/admin-report.js";
import { BaseShareService } from "./base.js";
import { AppError } from "../../lib/app-error.js";

export class ReportShareService extends BaseShareService {
    // 查询举报详情
    async getReportDetail(
        reportId: string,
    ) {
        const current = getCurrent()

        const data = await current.tx.
            select().
            from(AdminReportTable).
            where(eq(AdminReportTable.id, reportId))

        if (!data[0]) {
            throw new AppError("举报不存在")
        }

        return data[0]
    }
}