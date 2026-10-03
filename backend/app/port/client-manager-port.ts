export interface ClientManagerPort {
    // 添加客户端连接
    addClient(userId: string, instance: any): void;
    // 移除客户端连接
    removeClient(userId: string): void;
    // 推送消息
    push<T>(userId: string, eventType: string, data: T): void;
    // 通过实例直接推送
    pushByInstance<T>(instance: any, eventType: string, data: T): void;
    // 更新客户端元数据
    updateMetadata(userId: string, metadata: Partial<ClientMetadata>): void;
    // 获取客户端元数据
    getMetadata(userId: string): ClientMetadata | undefined;
}

// 客户端元数据
export type ClientMetadata = {
    activeSessionId: string;
}