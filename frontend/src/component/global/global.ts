import { logger } from "@/logger"
import { type Ref, ref } from "vue"

/**
 * 该文件定义全局组件类,导出唯一实例,全局组件类用于
 * 存储私有变量并提供可调用方法给其他组件,注意该类
 * 尽量避免dom动态挂载,通过css的visibility属性控制
 * 组件显示,提高渲染性能
 */

class ImagePreviewCom {
  public url: Ref<string>

  constructor() {
    this.url = ref<string>("")
  }

  show(url: string): void {
    this.url.value = url
  }
}

class MsgTipCom {
  public data: Ref<{
    userAvatarUrl: string
    userName: string
    msgContent: string
  } | undefined>

  constructor() {
    this.data = ref(undefined)
  }

  show(userAvatarUrl: string, userName: string, msgContent: string): void {
    this.data.value = {
      userAvatarUrl,
      userName,
      msgContent
    }

    // 延时3秒自动隐藏
    setTimeout(() => {
      this.data.value = undefined
    }, 3000)
  }
}

class ErrorDialogCom {
  public content: Ref<string>

  constructor() {
    this.content = ref("")
  }

  show(content: string): void {
    this.content.value = content
  }

  close(): void {
    this.content.value = ""
  }
}

export const imagePreviewCom = new ImagePreviewCom()
export const msgTipCom = new MsgTipCom()
export const errorDialogCom = new ErrorDialogCom()
