import { int, mysqlTable, varchar, date, datetime, tinyint } from 'drizzle-orm/mysql-core';

// 基础表字段
export const baseTable = {
    id: varchar({ length: 255 }).default("0").notNull(),
    created_at: datetime().default(new Date()).notNull(),
    updated_at: datetime().default(new Date()).notNull(),
}

// id字段
export const idType = () => {
    return varchar({ length: 255 }).notNull()
}
