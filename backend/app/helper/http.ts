// 拼接sse字符串格式
export const getSsePattern = (event: string, data: any) => {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}