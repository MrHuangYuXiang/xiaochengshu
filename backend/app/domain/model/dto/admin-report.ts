import { arrayType, numberType, objectType, stringType } from "./index.js";
import { page, reportSchema, userSchema, workDetailSchema } from "./common.js";
import { ReportStatusEnum } from "../enum/admin-report.js";

// 获取举报列表输入
export const getReportsInput = objectType({
    ...page,
})

// 获取举报列表输出
export const getReportsOutput = objectType({
    reports: arrayType(objectType({
        report: reportSchema,
        // 发起举报的用户
        reporter: userSchema,
    })),
})

// 处理举报输入
export const handleReportInput = objectType({
    reportId: stringType,
    status: numberType.refine(
        (val) => Object.values(ReportStatusEnum).filter((item) => item !== ReportStatusEnum.PENDING).includes(val),
        { message: "非法的举报状态" }
    ),
})