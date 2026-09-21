import type { MutexPort } from "./mutex-port.js"

/**
 * 本地互斥锁,仅适用于单机场景
 * js本身单线程,直接用标志位实现,不存在同时写入情况
 */
export class LocalMutexAdapter implements MutexPort {
    // promise队列,用于解锁是唤醒等待的协程
    private queueMap: Map<string, (() => void)[]>

    // flag映射表,标记关键字对应的锁是否被占用
    private flagMap: Map<string, boolean>

    constructor() {
        this.queueMap = new Map()
        this.flagMap = new Map()
    }

    private lock(key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.queueMap.has(key)) {
                this.queueMap.set(key, [])
            }
            if (!this.flagMap.has(key)) {
                this.flagMap.set(key, false)
            }

            // 如果锁已被占用,则加入队列,反之直接设置true并resolve
            if (this.flagMap.get(key)!) {
                this.queueMap.get(key)!.push(resolve)
            } else {
                this.flagMap.set(key, true)
                resolve()
            }
        })
    }

    private unlock(key: string) {
        this.flagMap.set(key, false)
        if (this.queueMap.has(key)) {
            const resolve = this.queueMap.get(key)?.shift()
            if (resolve) {
                resolve?.()
            }
        }
    }

    // 对外只暴露withLock方法,自动处理异常解锁
    async withLock(key: string, cb: () => Promise<void>) {
        try {
            await this.lock(key)
            await cb()
        } finally {
            // 无论是否有异常必须解锁,否则会死锁
            this.unlock(key)
        }
    }
}