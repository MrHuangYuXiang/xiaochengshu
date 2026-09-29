// 应用错误类
export class AppError extends Error {
    constructor(message: string) {
        super(message)
    }
}

export const throwServerBusy = () => {
    throw new AppError("服务器繁忙,请稍后重试")
}

export const throwServerError = () => {
    throw new AppError("服务器错误,请稍后重试")
}