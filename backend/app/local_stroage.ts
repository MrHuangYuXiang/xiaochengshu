import { AsyncLocalStorage } from "async_hooks"
import type { MySqlTransaction } from "drizzle-orm/mysql-core"
import type { MySql2QueryResultHKT, MySql2PreparedQueryHKT } from "drizzle-orm/mysql2"
import type { ExtractTablesWithRelations } from "drizzle-orm"

export const localStorage = new AsyncLocalStorage<{
    userId: string,
    tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>
}>()

export const getCurrent = () => {
    const store = localStorage.getStore()
    if (!store) {
        throw new Error("AsyncLocalStorage 上下文未定义")
    }
    return store
}