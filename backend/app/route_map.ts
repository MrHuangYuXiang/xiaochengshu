import z from 'zod';

// 路由映射表
export class RouteMap {
    map: Map<string, z.ZodObject | undefined>

    constructor() {
        this.map = new Map();
    }

    add(method: "GET" | "POST", url: string, schema: z.ZodObject | undefined) {
        if (this.map.has(method + url)) {
            throw new Error('url路径已存在');
        }
        this.map.set(method + url, schema);
    }

    get(method: "GET" | "POST", url: string) {
        if (!this.map.has(method + url)) {
            throw new Error('url路径不存在');
        }
        return this.map.get(method + url);
    }
}

export const routeMap = new RouteMap();