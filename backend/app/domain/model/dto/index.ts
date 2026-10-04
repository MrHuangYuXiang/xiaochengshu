import { z } from "zod";
import type { Request, Response } from "express";

/**
 * 增强express Response类型,添加locals.body字段
 */
export interface EnhancedResponse<BodyObject extends z.ZodObject | undefined> extends Response {
    locals: {
        body: z.infer<BodyObject>
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