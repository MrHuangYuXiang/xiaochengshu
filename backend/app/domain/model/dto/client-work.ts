import { userSchema, workDetailSchema, workSimpleSchema, workCommentSchema, page, workImageSchema, UserSchemaWithFollow } from "./common.js";
import {
    booleanType,
    numberType,
    arrayType,
    stringType,
    objectType,
} from "./index.js";

// 评论聚合模型
export const workCommentAggregate = {
    user: userSchema,
    comment: objectType(workCommentSchema),
    isLiked: numberType,
    likeCount: numberType,
    replyCount: numberType,
}

// 获取作品详情输入
export const getWorkDetailInput = objectType({
    workId: stringType,
})

// 获取作品详情输出
export const getWorkDetailOutput = objectType({
    user: UserSchemaWithFollow,
    work: workDetailSchema,
    images: arrayType(workImageSchema),
    likeCount: numberType,
    collectCount: numberType,
    isLiked: numberType,
    isCollected: numberType,
    isOwner: numberType,
})

// 获取用户作品列表输入
export const getWorksInput = objectType({
    ...page,

    // 类型枚举字段: 
    // "recommend": 推荐作品
    // "self": 获取用户发布的作品
    // "like": 获取用户点赞的作品
    // "collect": 获取用户收藏的作品
    // "following": 获取当前用户关注的作者的作品
    type: stringType,

    // 目标用户id,type为"self","like","collect"时必填
    targetUserId: stringType,
})

// 获取用户作品列表输出
export const getWorksOutput = objectType({
    workList: arrayType(objectType({
        user: userSchema,
        work: workSimpleSchema,
        cover_image: workImageSchema,
        likeCount: numberType,
        isLiked: numberType,
        isOwner: numberType,
    })),
})

// 发表作品输入
export const createWorkInput = objectType({
    title: stringType.min(1, "标题至少为1个字符").max(20, "标题最多为20个字符"),
    content: stringType.min(1, "内容至少为1个字符").max(200, "内容最多为200个字符"),
    permission: numberType.min(0, "permission字段非法").max(1, "permission字段非法"),
})

// 删除作品输入
export const deleteWorkInput = objectType({
    workId: stringType,
})

// 获取作品评论输入
export const getWorkCommentsInput = objectType({
    ...page,
    /**
     * 查询类型
     * "top": 查询作品评论
     * "reply": 查询作品评论回复
     */
    type: stringType,
    workId: stringType,
    rootCommentId: stringType,
})

// 获取作品评论输出
export const getWorkCommentsOutput = objectType({
    comments: arrayType(objectType(workCommentAggregate)),
})

// 创建评论输入
export const createWorkCommentInput = objectType({
    content: stringType.min(1, "内容至少为1个字符").max(200, "内容最多为200个字符"),
    workId: stringType,
    rootCommentId: stringType,
    parentId: stringType,
})

// 创建评论输出
export const createWorkCommentOutput = objectType(workCommentAggregate)

// 作品互动公共输入字段
export const workInteractInputFields = {
    workId: stringType,
    workTitle: stringType,
    workCoverImagePath: stringType,
    workUserId: stringType,
}

// 点赞作品输入
export const likeWorkInput = objectType({
    ...workInteractInputFields,
    isLike: numberType,
})

// 收藏作品输入
export const collectWorkInput = objectType({
    ...workInteractInputFields,
    isCollect: numberType,
})

// 分享作品输入
export const shareWorkInput = objectType({
    ...workInteractInputFields,
    workUserName: stringType,
    workUserAvatarPath: stringType,
    sessionId: stringType,
})

// 点赞/取消点赞作品评论输入
export const likeWorkCommentInput = objectType({
    commentId: stringType,
    workId: stringType,
    isLike: numberType,
})