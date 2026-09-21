import { mysqlTable, varchar, tinyint } from 'drizzle-orm/mysql-core';
import { baseTable } from './base.js';

// 举报表
export const AdminReportTable = mysqlTable('admin_report', {
    ...baseTable,
    work_id: varchar({ length: 255 }).notNull(),
    // 举报人(发起举报的用户)id
    reporter_id: varchar({ length: 255 }).notNull(),
    // 举报对象
    report_object: tinyint().notNull(),
    // 举报类型
    report_type: tinyint().notNull(),
    // 举报原因
    reason: varchar({ length: 200 }).notNull(),
    // 举报状态
    status: tinyint().notNull(),
});