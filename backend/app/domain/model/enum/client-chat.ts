// 会话类型枚举
export enum ClientChatSessionTypeEnum {
    PRIVATE = 1, // 私聊
    GROUP = 2, // 群聊
    SYSTEM = 3, // 系统消息
}

// 消息类型
export enum ClientChatMessageTypeEnum {
    TEXT = 1, // 文本消息
    REPORT_NOTIFICATION = 2, // 举报通知
    WORK_SHARE = 3, // 作品分享
}