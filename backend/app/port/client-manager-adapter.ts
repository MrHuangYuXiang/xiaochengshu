import type { Response } from "express";
import type { ClientManagerPort, ClientMetadata } from "./client-manager-port.js";
import { AppError } from "../lib/app-error.js";
import { getSsePattern } from "../helper/http.js";

export class LocalClientManager implements ClientManagerPort {
    public map: Map<string, {
        response: Response;
        metadata: ClientMetadata;
    }>;

    constructor() {
        this.map = new Map();
    }

    // 添加客户端连接
    public addClient(userId: string, instance: any) {
        if (this.map.has(userId)) throw new AppError("用户已在线");
        this.map.set(userId, {
            response: instance as Response,
            metadata: {
                activeSessionId: "",
            },
        });
    }

    // 移除客户端连接
    public removeClient(userId: string) {
        this.map.delete(userId);
    }

    // 推送消息
    public push<T>(userId: string, httpEventType: string, data: T) {
        const res = this.map.get(userId);
        if (res) {
            res.response.write(getSsePattern(httpEventType, data))
        }
    }

    // 通过传递Response实例直接推送
    public pushByInstance<T>(instance: any, httpEventType: string, data: T) {
        const response = instance as Response
        response.write(getSsePattern(httpEventType, data))
    }

    // 更新客户端元数据
    public updateMetadata(userId: string, metadata: Partial<ClientMetadata>) {
        const res = this.map.get(userId);
        if (!res) return
        for (const key of Object.keys(metadata)) {
            res.metadata[key as keyof ClientMetadata] = metadata[key as keyof ClientMetadata]!;
        }
    }

    // 获取客户端元数据
    public getMetadata(userId: string): ClientMetadata | undefined {
        return this.map.get(userId)?.metadata
    }
}