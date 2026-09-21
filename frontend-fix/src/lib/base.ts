/**
 * 增强基类,用于实现分页,防抖等增强功能
 * 注意去重需要由子类实现
 */
export class EnhancedBase<T> {
  isLoading: boolean
  isEnd: boolean
  currentPage: number
  pageSize: number

  constructor(pageSize: number) {
    this.isLoading = false
    this.isEnd = false
    this.currentPage = 1
    this.pageSize = pageSize
  }

  clear() {
    this.currentPage = 1
    this.isEnd = false
    this.isLoading = false
  }

  /** 基类统一实现防抖策略 */
  async exec(cb: () => Promise<T[]>) {
    if (this.isEnd || this.isLoading) {
      return
    }

    this.isLoading = true
    const data = await cb()
    this.currentPage += 1
    this.isLoading = false

    if (data.length < this.pageSize) {
      this.isEnd = true
    }
  }
}
