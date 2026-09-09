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
    userId: string
    userName: string
    sessionId: string
    msgContent: string
  }>
  // 是否显示标志位
  public showFlag: Ref<boolean>

  constructor() {
    this.data = ref({
      userAvatarUrl: "",
      userId: "",
      userName: "",
      sessionId: "",
      msgContent: ""
    })
    this.showFlag = ref(false)
  }

  show(
    userAvatarUrl: string,
    userId: string,
    userName: string,
    sessionId: string,
    msgContent: string
  ): void {
    if (this.showFlag.value) return

    this.data.value = {
      userAvatarUrl,
      userId,
      userName,
      sessionId,
      msgContent
    }
    this.showFlag.value = true

    // 延时3秒自动隐藏
    setTimeout(() => {
      this.showFlag.value = false
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
