import { z } from "zod";
import type { Response } from "express";

// 获取请求体
export const getRequestBody = <T extends z.ZodObject>(res: Response) => {
    return res.locals.body as z.infer<T>;
}

// 获取分页参数
export function getRequestPage(res: Response) {
    const page = res.locals.body.page ? Number(res.locals.body.page) : 1
    const pageSize = res.locals.body.pageSize ? Number(res.locals.body.pageSize) : 10
    return {
        limit: pageSize,
        offset: (page - 1) * pageSize,
    }
}

// 增强zod对象,添加openapi相关元数据
// 注意zod中"false"会被解析成true,项目中使用该自定义解析器
export const booleanType = z.boolean().meta({ openapiType: "boolean" })
export const stringType = z.string().meta({ openapiType: "string" })
export const numberType = z.number().meta({ openapiType: "integer" })
export const dateType = z.coerce.date().meta({ openapiType: "string" })
export const arrayType = (element: z.ZodType) => z.array(element).meta({ openapiType: "array" })
export const objectType = <T extends Record<string, z.ZodType>>(shape: T) => {
    return z.object(shape).meta({ openapiType: "object" })
}