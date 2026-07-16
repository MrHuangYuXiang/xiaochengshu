// 处理drizzle原生sql返回的多表结果
export function handleRawSqlRes(res: Record<string, any>[]): Record<string, any>[] {
    const resMap: any[] = []
    for (const item of res) {
        const resItem: Record<string, any> = {}
        for (const key in item) {
            const index = key.indexOf('$')

            // 如果字段属于单独字段而不是表字段,直接赋值
            if (index === -1) {
                resItem[key] = item[key]
                continue
            }

            const tableName = key.substring(0, index)
            const colName = key.substring(index + 1)
            if (!resItem[tableName]) {
                resItem[tableName] = {}
            }
            resItem[tableName][colName] = item[key]
        }
        resMap.push(resItem)
    }

    return resMap
}