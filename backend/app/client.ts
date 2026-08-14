/*
该文件用来定义客户端事件推送相关,包括消息类型枚举和express响应实例映射表
*/

import type { Response } from "express"

class ClientResponseMap {
    public map: Map<string, Response>;

    constructor() {
        this.map = new Map();
    }

    // 获取响应实例
    public get(userId: string) {
        return this.map.get(userId);
    }

    // 添加
    public add(userId: string, res: Response) {
        this.map.set(userId, res);
    }

    // 推送消息
    public push<T>(userId: string, httpEventType: string, data: T) {
        const res = this.map.get(userId);
        if (res) {
            // \n\n作为分隔符
            res.write(`event: ${httpEventType}\ndata: ${JSON.stringify(data)}\n\n`)
        }
    }

    // 通过传递Response实例直接推送
    public pushByResponse<T>(res: Response, httpEventType: string, data: T) {
        res.write(`event: ${httpEventType}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    // 移除
    public del(userId: string) {
        this.map.delete(userId);
    }
}

export const clientResponseMap = new ClientResponseMap();