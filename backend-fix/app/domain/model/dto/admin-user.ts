import { numberType, objectType, stringType } from "./index.js";
import { AdminUserRole } from "../enum/admin-user.js";

const adminUserRoleRefine = (value: number) => {
    if (!Object.values(AdminUserRole).includes(value)) return false
    else return true
}

// 登录输入
export const adminLoginInput = objectType({
    employee_id: stringType,
    password: stringType,
})

// 登录输出
export const adminLoginOutput = objectType({
    token: stringType,
})

// 添加新用户输入
export const adminAddUserInput = objectType({
    employee_id: stringType,
    role: numberType.refine(adminUserRoleRefine, { message: "不存在的角色" }),
    name: stringType,
    password: stringType,
})

// 修改员工信息输入
export const adminUpdateUserInput = objectType({
    user_id: stringType,
    name: stringType,
    role: numberType.refine(adminUserRoleRefine, { message: "不存在的角色" }),
    password: stringType,
})