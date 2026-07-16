import type { Response } from "express";

// 获取分页参数
export function getPageParams(res: Response) {
    const page = res.locals.query.page ? Number(res.locals.query.page) : 1
    const pageSize = res.locals.query.pageSize ? Number(res.locals.query.pageSize) : 10
    return {
        limit: pageSize,
        offset: (page - 1) * pageSize,
    }
}