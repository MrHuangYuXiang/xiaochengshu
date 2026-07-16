// 应用错误类
export class AppError extends Error {
    constructor(message: string) {
        super(message)
    }
}