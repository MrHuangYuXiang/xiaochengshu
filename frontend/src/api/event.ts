import { Config } from "@/config";
import { storage } from "../storage";
import SharedWorker from "./share.ts?sharedworker"
import { logger } from "@/logger";

/**
 * 后端事件推送类
 * TODO: 浏览器环境多标签页需要通过SharedWorker共享tcp连接
 */
class HttpEvent {
  // 回调映射表,该表用于存储所有事件类型的回调函数
  callbackMap: Map<string, (data: unknown) => Promise<void>>
  worker: SharedWorker | null = null

  constructor() {
    this.callbackMap = new Map<string, (data: unknown) => Promise<void>>()
  }

  // 建立事件推送连接
  public async connect() {
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
      url: Config.API_URL + "/user/connect"
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
}

export const httpEvent = new HttpEvent()
