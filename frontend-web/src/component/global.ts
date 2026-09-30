import { type Ref, ref } from "vue"

/**
 * 该文件定义全局组件类,导出唯一实例,全局组件类用于
 * 存储私有变量并暴露可调用方法给其他组件
 */

class GlobalBase {
  public isShow: Ref<boolean>

  constructor() {
    this.isShow = ref(false)
  }
}

class GlobalImagePreview extends GlobalBase {
  public url: Ref<string>

  constructor() {
    super()
    this.url = ref<string>("")
  }

  show(url: string): void {
    this.isShow.value = true
    this.url.value = url
  }

  close(): void {
    this.isShow.value = false
  }
}

class GlobalErrorDialog extends GlobalBase {
  public content: Ref<string>

  constructor() {
    super()
    this.content = ref("")
  }

  show(content: string): void {
    this.content.value = content
    this.isShow.value = true
  }

  close(): void {
    this.isShow.value = false
  }
}

class GlobalWorkModal extends GlobalBase {
  public workId: Ref<string>

  constructor() {
    super()
    this.workId = ref("")
  }

  show(workId: string) {
    this.workId.value = workId
    this.isShow.value = true
  }
}

// 举报详情弹窗
class GlobalReportModal extends GlobalBase {
  public reportId: Ref<string>

  constructor() {
    super()
    this.reportId = ref("")
  }

  show(reportId: string) {
    this.reportId.value = reportId
    this.isShow.value = true
  }
}

// 举报作品弹窗
class GlobalWorkReportModal extends GlobalBase {
  public workId: Ref<string>

  constructor() {
    super()
    this.workId = ref("")
  }

  show(workId: string) {
    this.workId.value = workId
    this.isShow.value = true
  }

  close() {
    this.isShow.value = false
    this.workId.value = ""
  }
}

// 关注/粉丝弹窗
class GlobalFollowModal extends GlobalBase {
  public type: Ref<string>
  public userId: Ref<string>

  constructor() {
    super()
    this.type = ref("following")
    this.userId = ref("")
  }

  show(type: "following" | "follower", userId: string) {
    this.isShow.value = true
    this.type.value = type
    this.userId.value = userId
  }
}

class GlobalUpdateUserModal extends GlobalBase {
}

export const globalUpdateUserModal = new GlobalUpdateUserModal()
export const globalImagePreview = new GlobalImagePreview()
export const globalErrorDialog = new GlobalErrorDialog()
export const globalWorkModal = new GlobalWorkModal()
export const globalReportModal = new GlobalReportModal()
export const globalWorkReportModal = new GlobalWorkReportModal()
export const globalFollowModal = new GlobalFollowModal()
