/**
 * 浏览器环境下,需要借助SharedWorker实现多标签页共享tcp连接
 */

import { genErrorMessage } from "./type.ext"

const ports: MessagePort[] = []
// 是否已经和后端建立长连接标志位
let isConnected = false

self.addEventListener("connect", (e: any) => {
  const port = e.ports[0]!
  port.start()
  ports.push(port)

  /**
   * 监听任意端口发来的消息,如果未连接则建立长连接
   * 由于worker无法访问localStorage以及vite的环境
   * 变量,页面线程需要携带jwt和接口url
   */
  port.onmessage = async (e: any) => {
    switch (e.data.type) {
      case "connect":
        if (!isConnected) {
          isConnected = true
          try {
            console.log(e.data.jwt, e.data.url)
            await connect(e.data.jwt, e.data.url)
          } catch (error: unknown) {
            if (error instanceof Error) {
              port.postMessage(genErrorMessage("服务器连接失败"))
              // 设置3秒延时销毁worker防止直接没了其他页面收不到消息,下同
              setInterval(() => {
                self.close()
              }, 3000)
            }
          }
        }
        break
      case "disconnect":
        for (const port of ports) {
          port.postMessage(genErrorMessage("用户已登出,请重新登录"))
        }
        setInterval(() => {
          controller.abort()
          self.close()
        }, 3000)
        break
    }
  }
})

/**
 * 建立http长连接以及响应体解析逻辑
 */
const controller = new AbortController()
let buffer = new Uint8Array(0)
const connect = async (jwt: string, url: string) => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": jwt
      },
      signal: controller.signal
    })

    const reader = res.body?.getReader()
    if (reader === undefined) {
      throw new Error()
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      let isEnd = false
      let combined = new Uint8Array(buffer.length + value.length)
      combined.set(buffer, 0)
      combined.set(value, buffer.length)

      // 循环解析拼接后的二进制数据
      while (!isEnd) {
        let i
        for (i = 0; i < combined.length - 1; i++) {

          // 寻找\n\n
          if (combined[i] === 0x0A && combined[i + 1] === 0x0A) {
            const decoder = new TextDecoder();
            const eventBlob = combined.slice(0, i)
            const event = decoder.decode(eventBlob)
            const lines = event.split("\n")
            const type = lines[0]!.split(": ")[1]!
            const data = JSON.parse(lines[1]!.split(": ")[1]!)

            // 给所有页面广播事件
            for (const port of ports) {
              port.postMessage({ type, data })
            }

            combined = combined.slice(i + 2)
            break
          }
        }
        if (i >= combined.length - 2) {
          isEnd = true
        }
      }

      // 将未解析的二进制碎片存入内存缓冲中
      buffer = combined
    }
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case "AbortError":
          break
        default:
          throw error
      }
    }
  }
}
