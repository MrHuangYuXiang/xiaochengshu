import type { Response } from "express";
import type { FormFieldHeader } from "..//form_parser.js"
import { AppError } from "../error.js";

// 获取分页参数
export function getPageParams(res: Response) {
    const page = res.locals.query.page ? Number(res.locals.query.page) : 1
    const pageSize = res.locals.query.pageSize ? Number(res.locals.query.pageSize) : 10
    return {
        limit: pageSize,
        offset: (page - 1) * pageSize,
    }
}

// 判断http表单请求体并获取图片扩展名
export function getImageExt(formFieldType: FormFieldHeader) {
    if (!formFieldType.filename || !formFieldType.contentType) {
        throw new AppError(`字段${formFieldType.name}类型错误`)
    }
    if (formFieldType.contentType !== "image/jpeg"
        && formFieldType.contentType !== "image/png"
    ) {
        throw new AppError(`字段${formFieldType.name}必须为jpeg或png格式`)
    }
    return `.${formFieldType.contentType.split("/")[1]}`
}