import { eq } from "drizzle-orm";
import { AdminUserTable } from "../../db/schema/admin-user.js";
import { getCurrent } from "../../lib/local-stroage.js";
import type { adminAddUserInput, adminLoginInput, adminUpdateUserInput } from "../model/dto/admin-user.js";
import type { EnhancedResponse } from "../model/dto/index.js";
import { AppError } from "../../lib/app-error.js";
import e, { type Request } from "express";
import { genClientJWT } from "../../helper/jwt.js";
import { BaseService } from "./base.js";

export class AdminUserService extends BaseService {
    // 登录
    async login(req: Request, res: EnhancedResponse<null, typeof adminLoginInput>) {
        const current = getCurrent()
        const exist = await current.tx.
            select().
            from(AdminUserTable).
            where(eq(AdminUserTable.employee_id, res.locals.body!.employee_id))
        if (exist[0]) {
            if (exist[0].password !== res.locals.body!.password) {
                throw new AppError("密码错误")
            }
            res.json({
                token: genClientJWT(
                    { userId: exist[0].id },
                    undefined,
                    { adminEmployeeId: exist[0].employee_id, adminRole: exist[0].role })
            })

        } else {
            throw new AppError("员工不存在")
        }
    }

    /**
     * 添加新员工
     * 后台系统不存在注册功能,任何新员工需要由管理员添加
     */
    async addUser(req: Request, res: EnhancedResponse<null, typeof adminAddUserInput>) {
        const current = getCurrent()
        const exist = await current.tx.
            select().
            from(AdminUserTable).
            where(eq(AdminUserTable.employee_id, res.locals.body!.employee_id))
        if (exist[0]) {
            throw new AppError("工号已存在")
        }

        await current.tx.insert(AdminUserTable).values({
            employee_id: res.locals.body!.employee_id,
            role: res.locals.body!.role,
            name: res.locals.body!.name,
            password: res.locals.body!.password,
        })
    }

    /**
     * 修改员工信息
     */
    async updateUser(req: Request, res: EnhancedResponse<null, typeof adminUpdateUserInput>) {
        const current = getCurrent()
        await current.tx.update(AdminUserTable).
            set({
                name: res.locals.body!.name,
                role: res.locals.body!.role,
                password: res.locals.body!.password,
            }).
            where(eq(AdminUserTable.id, res.locals.body!.user_id))
    }
} 