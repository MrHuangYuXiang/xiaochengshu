import { storage } from "../storage";
import SharedWorker from "./share.ts?sharedworker"

/**
 * 客户端事件推送
 */
class ClientEvent {
  // 全局回调映射表
  globalCallbackMap: Map<string, (data: unknown) => Promise<void>>
  // 页面回调映射表
  pageCallbackMap: Map<string, (data: unknown) => Promise<void>>

  worker: SharedWorker | null = null

  constructor() {
    this.globalCallbackMap = new Map<string, (data: unknown) => Promise<void>>()
    this.pageCallbackMap = new Map<string, (data: unknown) => Promise<void>>()
  }

  // 建立事件推送连接
  public async connect() {

    // 连接SharedWorker
    this.worker = new SharedWorker()
    this.worker.port.start()
    this.worker.port.addEventListener("message", async (msg) => {
      const { type, data } = msg.data as { type: string, data: unknown }
      if (this.globalCallbackMap.has(type)) {
        await this.globalCallbackMap.get(type)!(data)
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
  public async registerCallback(
    callbackType: "global" | "page",
    eventType: string, 
    callback: (data: unknown) => Promise<void>
  ) {
    if (callbackType === "global") {
      this.globalCallbackMap.set(eventType, callback)
    } else {
      this.pageCallbackMap.set(eventType, callback)
    }
  }
}

export const clientEvent = new ClientEvent()