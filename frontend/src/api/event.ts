import { errorDialogCom, msgTipCom } from "@/component/global/global";
import { storage } from "../storage";
import type { components } from "./gen";
import SharedWorker from "./share.ts?sharedworker"

/**
 * 以下为各个客户端事件处理函数
 */

/** 服务器错误 */
const errorCallback = async (data: unknown) => {
  // 接收到错误,清理相关资源,由于后端主动断开tcp连接,客户端不需要主动断
  errorDialogCom.show((data as components["schemas"]["errorClientEvent"]).msg)
  storage.clear()
}

/** 心跳续约 */
const heartbeatCallback = async (data: unknown) => {
  // jwt续约
  storage.setToken((data as components["schemas"]["heartbeatClientEvent"]).jwt)
}

/** 聊天消息推送 */
const chatMessagePushCallback = async (data: unknown) => {
  const message = data as components["schemas"]["pushChatMessageEvent"]
  msgTipCom.show(
    message.user.id,
    message.user.name,
    message.message.session_id,
    message.message.content)
}

/**
 * 后端事件推送类
 * TODO: 浏览器环境多标签页需要通过SharedWorker共享tcp连接
 */
class ClientEvent {
  // 回调映射表,该表用于存储所有事件类型的回调函数
  callbackMap: Map<string, (data: unknown) => Promise<void>>
  worker: SharedWorker | null = null

  constructor() {
    this.callbackMap = new Map<string, (data: unknown) => Promise<void>>()
  }

  // 建立事件推送连接
  public async connect() {
    // 注册全部回调函数
    this.registerAllCallbacks()

    // 连接SharedWorker
    this.worker = new SharedWorker()
    this.worker.port.start()
    this.worker.port.addEventListener("message", async (msg) => {
      const { type, data } = msg.data as { type: string, data: unknown }
      if (this.callbackMap.has(type)) {
        await this.callbackMap.get(type)!(data)
      }
    })
    this.worker.port.postMessage({
      type: "connect",
      jwt: storage.token.value,
      url: import.meta.env.VITE_API_URL + "/user/connect"
    })
  }

  // 主动断开连接
  public disconnect() {
    this.worker?.port.postMessage({
      type: "disconnect",
    })
  }

  // 注册回调函数
  public async registerCallback(eventType: string, callback: (data: unknown) => Promise<void>) {
    this.callbackMap.set(eventType, callback)
  }

  // 注册全部回调函数
  public registerAllCallbacks() {
    this.registerCallback("error", errorCallback)
    this.registerCallback("heartbeat", heartbeatCallback)
    this.registerCallback("pushChatMessage", chatMessagePushCallback)
  }
}

export const clientEvent = new ClientEvent()