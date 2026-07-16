import { drizzle } from "drizzle-orm/mysql2";
import type { MySqlTable, MySqlTransaction, MySqlUpdateSetSource } from "drizzle-orm/mysql-core";
import type { MySql2QueryResultHKT, MySql2PreparedQueryHKT } from "drizzle-orm/mysql2";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { getEnv } from "../helper/env.js";

const rawDb = drizzle({
    connection: {
        host: getEnv('DB_HOST'),
        port: Number(getEnv('DB_PORT')),
        user: getEnv('DB_USER'),
        password: getEnv('DB_PASSWORD'),
        database: getEnv('DB_DATABASE'),
    }
});

// 获取事务实例,封装钩子逻辑
export const getTx = async (cb: (tx: MySqlTransaction<MySql2QueryResultHKT, MySql2PreparedQueryHKT, Record<string, never>, ExtractTablesWithRelations<Record<string, never>>>) => Promise<void>) => {
    return await rawDb.transaction(async (tx) => {
        tx = new Proxy(tx, {
            get: (target, prop) => {
                // 拦截insert方法
                if (prop === 'insert') {
                    return (table: MySqlTable) => {
                        const raw = target[prop](table)
                        const originalValues = raw.values.bind(raw)
                        raw.values = (value: Record<string, any> | Record<string, any>[]) => {
                            let array = []
                            if (!Array.isArray(value)) {
                                array = [value]
                            } else {
                                array = value
                            }

                            for (let i = 0; i < array.length; i++) {
                                if (!('id' in array[i])) {
                                    array[i].id = uuidv4()
                                }
                                if (!('created_at' in array[i])) {
                                    array[i].created_at = new Date()
                                }
                                if (!('updated_at' in array[i])) {
                                    array[i].updated_at = new Date()
                                }
                            }

                            return originalValues(array)
                        }
                        return raw
                    }
                }

                // 拦截update方法
                if (prop === 'update') {
                    return (table: MySqlTable) => {
                        const raw = target[prop](table)
                        const originalSet = raw.set.bind(raw)
                        raw.set = (value: MySqlUpdateSetSource<MySqlTable>) => {
                            return originalSet({
                                ...value,
                                updated_at: new Date(),
                            })
                        }
                        return raw
                    }
                }

                return Reflect.get(target, prop)
            }
        })
        await cb(tx)
    })
}

// 由于Drizzle未提供原生钩子, 此处需通过Proxy代理实现钩子逻辑 
export const db = new Proxy(rawDb, {
    get: (target, prop) => {
        // 拦截insert方法
        if (prop === 'insert') {
            return (table: MySqlTable) => {
                const raw = target[prop](table)
                const originalValues = raw.values.bind(raw)
                raw.values = (value: Record<string, any> | Record<string, any>[]) => {
                    let array = []
                    if (!Array.isArray(value)) {
                        array = [value]
                    } else {
                        array = value
                    }

                    for (let i = 0; i < array.length; i++) {
                        if (!('id' in array[i])) {
                            array[i].id = uuidv4()
                        }
                        if (!('created_at' in array[i])) {
                            array[i].created_at = new Date()
                        }
                        if (!('updated_at' in array[i])) {
                            array[i].updated_at = new Date()
                        }
                    }

                    return originalValues(array)
                }
                return raw
            }
        }

        // 拦截update方法
        if (prop === 'update') {
            return (table: MySqlTable) => {
                const raw = target[prop](table)
                const originalSet = raw.set.bind(raw)
                raw.set = (value: MySqlUpdateSetSource<MySqlTable>) => {
                    return originalSet({
                        ...value,
                        updated_at: new Date(),
                    })
                }
                return raw
            }
        }

        return Reflect.get(target, prop)
    }
})