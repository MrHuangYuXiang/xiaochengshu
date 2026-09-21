// 举报对象枚举
export const ReportObjectEnum = {
    Work: 1,
}

// 举报类型枚举
export const ReportTypeEnum = {
    "侵犯权益": 1,
    "抄袭/搬运作品": 2,
    "涉嫌欺诈": 3,
    "色情低俗": 4,
    "违法犯罪": 5,
    "政治敏感": 6,
    "违规营销": 7,
    "不实信息": 8,
    "网络暴力": 9,
    "危害人生安全": 10,
    "未成年相关": 11,
    "以上没有我想举报的类型": 12,
}

export const ReportStatusEnum = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
}