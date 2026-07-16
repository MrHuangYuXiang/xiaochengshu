import { z } from "zod";
import type { Request, Response } from "express";

/** 规范:
 * 对于GET请求,只能够携带query参数,zod自动去校验req.query字段,并将校验结果添加到local.query字段
 * 对于POST请求,只能够携带body参数,zod自动去校验req.body字段,并将校验结果添加到local.body字段
 * 注意本项目只支持GET和POST请求,其他请求方法将被拒绝
 */

// // 增强express Response类型
// export type EnhancedResponse<QuerySchema extends z.ZodObject | null, BodySchema extends z.ZodObject | null> =
//     // 1. 先把 Response 里的 locals 删掉
//     Omit<Response, 'locals'> &
//     // 2. 再加上你自己的 locals 类型（这时候不会被 any 污染）
//     (QuerySchema extends z.ZodObject ? {
//         locals: {
//             query: z.infer<QuerySchema>
//             body: z.infer<BodySchema>
//         }
//     } : {
//         locals: {}
//     })

export interface EnhancedResponse<QuerySchema extends z.ZodObject | null, BodySchema extends z.ZodObject | null> extends Response {
    locals: {
        query?: QuerySchema extends z.ZodObject ? z.infer<QuerySchema> : undefined
        body?: BodySchema extends z.ZodObject ? z.infer<BodySchema> : undefined
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