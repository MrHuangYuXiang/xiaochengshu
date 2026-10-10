// 后端错误
export class BackendError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class AppError extends Error {
  constructor(message: string) {
    super(message)
  }
}
