import { objectType, stringType, numberType, arrayType } from "./index.js"
import { ReportTypeEnum, ReportObjectEnum } from "../enum/admin-report.js"
import { reportSchema } from "./common.js"

// 举报输入
export const reportWorkInput = objectType({
    workId: stringType,
    reportObject: numberType,
    reportType: numberType,
    reason: stringType.min(1, "举报原因至少为1个字符").max(200, "举报原因最多为200个字符"),
}).refine((data) => {
    return Object.values(ReportObjectEnum).includes(data.reportObject) && Object.values(ReportTypeEnum).includes(data.reportType)
}, { message: "不存在的举报对象/类型" })

// 查询举报类型输出
export const getReportTypesOutput = objectType({
    types: arrayType(objectType({
        text: stringType,
        id: numberType,
    }))
})

// 查询举报详情输入
export const getReportDetailInput = objectType({
    reportId: stringType,
})

// 查询举报详情输出
export const getReportDetailOutput = objectType({
    report: reportSchema,
})