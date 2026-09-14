import type { NextFunction, Request, Response } from "express";
import { routeMap } from "./route_map.js";
import { verifyJWT } from "./helper/jwt.js";
import { getEnv } from "./helper/env.js";
import { localStorage } from "./local_stroage.js";
import { getTx } from "./db/db.js";
import { clientResponseMap } from "./client.js";
import { errorClientEvent, ClientEventType } from "./domain/model/dto/client.js";
import { AppError } from "./error.js";

/**
 * 中间件包装器
 * express的中间件系统不支持async/await,需要手写必要中间件编排逻辑
 * 对于浏览器OPTIONS以及json序列化请求参数,由原生express中间件处理
 * 简化复杂度
 */
export const middlewareWrapper = (handler: (req: Request, res: Response) => Promise<void>, isPersistent: boolean = false) => {
    return async function (req: Request, res: Response) {
        try {
            if (!isPersistent) {
                res.setHeader("app-success", "1")
                res.setHeader("app-error-msg", "")
            }

            // 调用各个中间件
            authMiddleware(req, res)
            validateMiddleware(req, res)

            // drizzle事务回调会吞错误,所有需要手动捕获
            await getTx(async (tx) => {
                await localStorage.run({
                    userId: res.locals.userId as string,
                    tx,
                }, async () => {
                    await handler(req, res)
                })
            })

            if (!isPersistent) {
                res.end()
            }
        } catch (error) {
            let msg = ""

            console.log("捕捉到错误: ", error)
            if (error instanceof AppError) {
                msg = error.message
            } else if (error instanceof Error) {
                msg = "服务器错误,请稍后重试"
            }

            // 长连接通过推送错误信息并关闭连接
            if (isPersistent) {
                clientResponseMap.pushByResponse(res, ClientEventType.error, errorClientEvent.parse({ msg: msg }))
            }
            // 非长连接设置响应头
            else {
                // http header仅支持ASCII编码,需要将中文转换为base64
                res.setHeader("app-success", "0")
                res.setHeader("app-error-msg", Buffer.from(msg, "utf8").toString("base64"))
            }
            res.end()
        }
    }
}

// 认证中间件
const authMiddleware = (req: Request, res: Response) => {
    // 允许不认证的访问路径
    const noAuthPaths = ["/login"]
    if (noAuthPaths.includes(req.path)) {
        return
    }

    // OPTIONS直接跳过
    if (req.method === "OPTIONS") {
        return
    }

    if (!req.headers.authorization) {
        throw new Error("请携带Authorization头")
    }

    // 开发环境运行test请求头,默认userId为1
    if (getEnv("ENV") === "development" && req.headers.authorization === "Bearer test") {
        res.locals.userId = "1"
        return
    }

    const payload = verifyJWT(req.headers.authorization)
    res.locals.userId = payload.userId
}

// 参数验证中间件
const validateMiddleware = (req: Request, res: Response) => {
    // 允许浏览器OPTIONS请求
    if (req.method === "OPTIONS") {
        return
    }

    if (req.method !== "POST" && req.method !== "GET") {
        throw new AppError("请求方法仅支持POST和GET")
    }

    const schema = routeMap.get(req.method, req.path)

    // 如果节点没有schema,则直接跳过
    if (schema == undefined) {
        return
    }

    // POST请求解析请求体
    if (req.method === "POST") {
        res.locals.body = schema.parse(req.body)
    }

    // GET请求解析查询参数
    if (req.method === "GET") {
        const queryParams: Record<string, any> = {}
        // 转换查询参数中的boolean字符串为boolean类型,其他类型保持字符串
        // 目的为解决zod转换"false"为true的问题
        for (const key in req.query) {
            if (req.query[key] === "true" || req.query[key] === "false") {
                queryParams[key] = req.query[key] === "true"
            } else {
                queryParams[key] = req.query[key]
            }
        }
        // 由于express的req.query只读,所有需要将查询参数解析到res.locals.query中
        res.locals.query = schema.parse(queryParams)
    }
}

// 跨域中间件
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "*")
    res.setHeader("Access-Control-Expose-Headers", "*")
    next()
}