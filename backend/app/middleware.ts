import type { NextFunction, Request, Response } from "express";
import { routeMap } from "./lib/framework-ext.js";
import { verifyJWT, type Payload } from "./helper/jwt.js";
import { localStorage } from "./lib/local-stroage.js";
import { getTx } from "./domain/db.js";
import { errorClientEvent, ClientEventType } from "./domain/model/dto/client-event.js";
import { AppError } from "./lib/app-error.js";
import type { ClientManagerPort } from "./port/client-manager-port.js";
import { AdminUserRole } from "./domain/model/enum/admin-user.js";
import { ZodError } from "zod";

/**
 * 中间件包装器
 * express的中间件系统不支持async/await,需要手写必要中间件编排逻辑
 * 对于浏览器OPTIONS以及json序列化请求参数,由原生express中间件处理
 * 简化复杂度
 */
export const middlewareWrapper = (
    handler: (req: Request, res: Response) => Promise<void>,
    // 是否为长连接,默认false
    isPersistent: boolean = false,
    // 注入客户端管理器实例
    clientManager: ClientManagerPort
) => {
    return async function (req: Request, res: Response) {
        try {
            if (!isPersistent) {
                res.setHeader("app-success", "1")
                res.setHeader("app-error-msg", "")
            }

            // 调用各个中间件
            const payload = authMiddleware(req, res)
            validateMiddleware(req, res)
            permissionMiddleware(req, res, payload)

            // drizzle事务回调会吞错误,所有需要手动捕获
            await getTx(async (tx) => {
                await localStorage.run({
                    payload,
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
            // 应用错误
            if (error instanceof AppError) {
                msg = error.message
            }
            // zod错误(参数校验)
            else if (error instanceof ZodError) {
                msg = error.message
            }
            // 未知错误
            else if (error instanceof Error) {
                msg = "服务器错误,请稍后重试"
            }

            // 长连接通过推送错误信息并关闭连接
            if (isPersistent) {
                clientManager.pushByInstance(res, ClientEventType.error, errorClientEvent.parse({ msg: msg }))
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
const authMiddleware = (req: Request, res: Response): Payload => {
    const defaultPayload: Payload = {
        userId: "",
        adminEmployeeId: "",
        adminRole: 0
    }

    // 允许不认证的访问路径
    const noAuthPaths = ["/login"]
    if (noAuthPaths.includes(req.path)) {
        return defaultPayload
    }

    // OPTIONS直接跳过
    if (req.method === "OPTIONS") {
        return defaultPayload
    }

    if (!req.headers.authorization) {
        throw new Error("请携带Authorization头")
    }

    return verifyJWT(req.headers.authorization)
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

// 后台系统需要管理员权限的路径
const AdminManagerPaths: string[] = []

// 权限校验中间件()
const permissionMiddleware = (req: Request, res: Response, payload: Payload) => {
    if (payload.adminRole !== AdminUserRole.Manager && AdminManagerPaths.includes(req.path)) {
        throw new AppError("您没有权限执行此操作")
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