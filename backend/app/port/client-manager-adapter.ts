import type { Response } from "express";
import type { ClientManagerPort } from "./client-manager-port.js";
import { AppError } from "../lib/app-error.js";
import { getSsePattern } from "../helper/http.js";

export class LocalClientManagerAdapter implements ClientManagerPort {
    public map: Map<string, Response>;

    constructor() {
        this.map = new Map();
    }

    // // 获取响应实例
    // public get(userId: string) {
    //     return this.map.get(userId);
    // }

    // 添加客户端连接
    public addClient(userId: string, instance: any) {
        if (this.map.has(userId)) throw new AppError("用户已在线");
        this.map.set(userId, instance as Response);
    }

    // 移除客户端连接
    public removeClient(userId: string) {
        this.map.delete(userId);
    }

    // 推送消息
    public push<T>(userId: string, httpEventType: string, data: T) {
        const res = this.map.get(userId);
        if (res) {
            res.write(getSsePattern(httpEventType, data))
        }
    }

    // 通过传递Response实例直接推送
    public pushByInstance<T>(instance: any, httpEventType: string, data: T) {
        const response = instance as Response
        response.write(getSsePattern(httpEventType, data))
    }
}