import { page, userSchema, UserSchemaWithFollow } from "./common.js";
import {
    booleanType,
    stringType,
    numberType,
    dateType,
    arrayType,
    objectType,
} from "./index.js";

// 获取用户详情输入
export const getUserDetailInput = objectType({
    userId: stringType
})

// 获取用户详情输出
export const getUserDetailOutput = objectType({
    user: objectType({
        user: UserSchemaWithFollow,
        // 关注数量
        followingCount: numberType,
        // 粉丝数量
        followerCount: numberType,
        // 作品数量
        workCount: numberType,
        // 点赞作品数量
        likeCount: numberType,
        // 收藏作品数量
        collectCount: numberType,
    }).optional(),
}
)

// 更新用户信息输入
export const updateUserInfoInput = objectType({
    name: stringType.min(1, "昵称至少为1个字符").max(20, "昵称最多为20个字符"),
    desc: stringType.max(200, "个人介绍最多为200个字符"),
    birthday: dateType,
    gender: numberType.gte(1, "性别必须为1或2").max(2, "性别必须为1或2"),
})

// 获取验证码输入
export const smsSendInput = objectType({
    phoneNumber: stringType.min(11, "手机号至少为11个字符").max(11, "手机号最多为11个字符"),
})

// 登录输入
export const loginInput = objectType({
    phoneNumber: stringType.min(11, "手机号至少为11个字符").max(11, "手机号最多为11个字符"),
    code: stringType.min(6, "验证码至少为6个字符").max(6, "验证码最多为6个字符"),
})

// 登录输出
export const loginOutput = objectType({
    token: stringType,
})

// 获取初始化数据输出
export const getInitDataOutput = objectType({
    user: userSchema,
    unreadMessageCount: numberType,
})

// 获取用户的关注/粉丝输入
export const getUserFollowsInput = objectType({
    ...page,
    type: stringType.refine((val) => ["following", "follower"].includes(val), { message: "非法的查询类型" }),
    userId: stringType
})

// 获取用户的关注/粉丝输出
export const getUserFollowsOutput = objectType({
    users: arrayType(UserSchemaWithFollow),
    count: numberType,
})

// 关注/取关用户输入
export const followUserInput = objectType({
    userId: stringType,
    isFollow: numberType,
})

// 移除粉丝输入
export const removeFollowerInput = objectType({
    userId: stringType,
})