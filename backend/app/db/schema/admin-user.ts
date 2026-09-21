import { mysqlTable, tinyint, varchar } from "drizzle-orm/mysql-core";
import { baseTable } from "./base.js";

export const AdminUserTable = mysqlTable("admin_user", {
    ...baseTable,
    // 工号
    employee_id: varchar({ length: 255 }).notNull(),
    // 权限 1: 普通员工 2: 管理员
    role: tinyint().notNull(),
    name: varchar({ length: 20 }).notNull(),
    password: varchar({ length: 255 }).notNull(),
})