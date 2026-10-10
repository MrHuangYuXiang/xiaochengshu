import { AsyncLocalStorage } from "async_hooks"
import type { MySqlTransaction } from "drizzle-orm/mysql-core"
import type { MySql2QueryResultHKT, MySql2PreparedQueryHKT } from "drizzle-orm/mysql2"
import type { ExtractTablesWithRelations } from "drizzle-orm"

// 载荷数据
export type Payload = {
    // 用户相关数据
    userId: string,
    userName: string,
    userAvatarPath: string,
}

// 异步上下文结构
type localStorageStruct = {
    // 请求id
    requestId: string,
    // 载荷数据
    payload: Payload,
    // drizzle事务对象
    tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>,
}

export const localStorage = new AsyncLocalStorage<localStorageStruct>()

export const getCurrent = () => {
    const store = localStorage.getStore()
    if (!store) {
        throw new Error("AsyncLocalStorage 上下文未定义")
    }
    return store
}