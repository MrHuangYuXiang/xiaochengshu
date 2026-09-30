// 会话类型枚举
export enum ClientChatSessionTypeEnum {
    PRIVATE = 1, // 私聊
    GROUP = 2, // 群聊
    SYSTEM = 3, // 系统消息
    INTERACTION = 4, // 互动消息
}

// 消息类型
export enum ClientChatMessageTypeEnum {
    TEXT = 1, // 文本消息
    WORK_SHARE = 3, // 作品分享

    REPORT_NOTICE = 2, // 举报通知

    WORK_LIKE_NOTICE = 4, // 作品点赞通知
    WORK_COLLECT_NOTICE = 5, // 作品收藏通知
    WORK_FORWARD_NOTICE = 6, // 作品转发通知
}