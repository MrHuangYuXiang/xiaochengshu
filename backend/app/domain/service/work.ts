import { db } from "../../db/db.js";
import { getCurrent } from "../../local_stroage.js";
import { followTable, userTable } from "../../db/schema/user.js";
import { workTable, workCollectTable, workCommentTable, workLikeTable, workCommentLikeTable, workImageTable } from "../../db/schema/work.js";
import { and, eq, getTableColumns, count, inArray, not, sql, desc, like } from "drizzle-orm";
import type { EnhancedResponse } from "../dto/index.js";
import type { Request } from "express";
import {
  getWorkDetailInput,
  getWorkDetailOutput,
  createWorkCommentOutput,
  getWorkCommentsInput,
  getWorkCommentsOutput,
  getWorksInput,
  getWorksOutput,
  likeWorkInput,
  collectWorkInput,
  likeWorkCommentInput,
  createWorkCommentInput,
} from "../dto/work.js";
import { v4 as uuidv4 } from "uuid";
import { getPageParams } from "../../helper/http.js";
import { handleRawSqlRes } from "../../helper/sql.js";
import { FormParser, MemoryWritableStream } from "../../form_parser.js";
import { getEnv } from "../../helper/env.js";
import { getFollowRelationSubQuery } from "./common.js";
import type { FileStoragePort } from "../../io/port/file_storage.js";
import { newNginxFileStorage } from "../../io/adapter/file_storage.js";

export class WorkService {
  private fileStorage: FileStoragePort

  constructor(fileStorage: FileStoragePort) {
    this.fileStorage = fileStorage
  }

  /**
   * 获取作品详情
   * 对于sql查询,应尽量避免使用关联子查询,优先使用join连表,以提高查询效率
   */
  async getWorkDetail(req: Request, res: EnhancedResponse<typeof getWorkDetailInput, null>) {
    const current = getCurrent()
    const workId = res.locals.query!.workId
    const followRelationSubQuery = getFollowRelationSubQuery()

    const likeSubQuery = db.
      select({
        likeWorkId: workLikeTable.work_id,
        likeCount: sql<number>`COUNT(${workLikeTable.id})`.as("likeCount"),
        isLiked: sql<number>`MAX(CASE WHEN ${workLikeTable.user_id} = ${current.userId} THEN 1 ELSE 0 END)`.as("isLiked"),
      }).
      from(workLikeTable).
      where(eq(workLikeTable.work_id, workId)).
      as("likeSubQuery")

    const collectSubQuery = db.
      select({
        collectWorkId: workCollectTable.work_id,
        collectCount: sql<number>`COUNT(${workCollectTable.id})`.as("collectCount"),
        isCollected: sql<number>`MAX(CASE WHEN ${workCollectTable.user_id} = ${current.userId} THEN 1 ELSE 0 END)`.as("isCollected"),
      }).
      from(workCollectTable).
      where(eq(workCollectTable.work_id, workId)).
      as("collectSubQuery")

    const work = await db.select({
      user: followRelationSubQuery._.selectedFields,
      work: {
        ...getTableColumns(workTable),
      },
      likeCount: sql<number>`CASE WHEN likeSubQuery.likeCount IS NULL THEN 0 ELSE likeSubQuery.likeCount END`,
      isLiked: sql<number>`CASE WHEN likeSubQuery.isLiked IS NULL THEN 0 ELSE likeSubQuery.isLiked END`,
      collectCount: sql<number>`CASE WHEN collectSubQuery.collectCount IS NULL THEN 0 ELSE collectSubQuery.collectCount END`,
      isCollected: sql<number>`CASE WHEN collectSubQuery.isCollected IS NULL THEN 0 ELSE collectSubQuery.isCollected END`,
    }).
      from(workTable).
      where(eq(workTable.id, workId)).
      leftJoin(followRelationSubQuery, eq(workTable.user_id, followRelationSubQuery.id)).
      leftJoin(likeSubQuery, eq(workTable.id, likeSubQuery.likeWorkId)).
      leftJoin(collectSubQuery, eq(workTable.id, collectSubQuery.collectWorkId))

    if (work.length === 0) {
      throw new Error("作品不存在")
    }

    // 查询作品图片
    const images = await db.select().from(workImageTable).where(eq(workImageTable.work_id, workId)).orderBy(workImageTable.image_url)

    // 对于左连接,若无匹配项,相关字段用null填充,需要处理为0,下同
    res.json(getWorkDetailOutput.parse({
      ...work[0],
      images: images,
      isOwner: work[0]!.user?.id === current.userId ? 1 : 0,
    }))
  }

  /** 
   * 获取作品
   * 所有获取多作品都统一请求该接口,避免sql,作品权限过滤等重复逻辑
   * 散落在多个接口函数中
   */
  async getWorks(req: Request, res: EnhancedResponse<typeof getWorksInput, null>) {
    const current = getCurrent()
    const targetUserId = res.locals.query!.targetUserId as string
    const { offset, limit } = getPageParams(res)
    let whereStmt: any[] = []

    // 当目标用户不是当前用户时,过滤私密作品
    if (targetUserId !== current.userId) {
      whereStmt.push(eq(workTable.permission, 1))
    }

    switch (res.locals.query!.type) {
      /**
       * 获取推荐作品
       * TODO: 推荐系统未实现,返回作品按时间降序模拟 
       */
      case "recommend":
        break

      // 获取用户发布的作品
      case "self":
        whereStmt.push(eq(workTable.user_id, targetUserId))
        break

      // 获取用户点赞的作品
      case "like":
        const likedWorkIds = (await db.
          select({ workId: workLikeTable.work_id }).
          from(workLikeTable).
          where(eq(workLikeTable.user_id, targetUserId)).
          orderBy(desc(workLikeTable.created_at)).
          limit(res.locals.query!.pageSize).
          offset((res.locals.query!.page - 1) * res.locals.query!.pageSize)).
          map((item) => item.workId)
        whereStmt.push(inArray(workTable.id, likedWorkIds))
        break

      // 获取用户收藏的作品
      case "collect":
        const collectedWorkIds = (await db.
          select({ workId: workCollectTable.work_id }).
          from(workCollectTable).
          where(eq(workCollectTable.user_id, targetUserId)).
          orderBy(desc(workCollectTable.created_at)).
          limit(res.locals.query!.pageSize).
          offset((res.locals.query!.page - 1) * res.locals.query!.pageSize)).
          map((item) => item.workId)
        whereStmt.push(inArray(workTable.id, collectedWorkIds))
        break

      // 获取当前用户关注作者的作品
      case "following":
        const followingUserIds = (await db.
          select({ followingUserId: followTable.following_id }).
          from(followTable).
          where(eq(followTable.follower_id, current.userId)).
          limit(100)).
          map((item) => item.followingUserId)
        whereStmt.push(inArray(workTable.user_id, followingUserIds))
        break

      default:
        throw new Error("type参数非法")
    }

    const likeSubQuery = current.tx.
      select({
        workId: sql<string>`${workLikeTable.work_id}`.as("workId"),
        likeCount: sql<number>`COUNT(${workLikeTable.id})`.as("likeCount"),
        isLiked: sql<number>`MAX(CASE WHEN ${workLikeTable.user_id} = ${current.userId} THEN 1 ELSE 0 END)`.as("isLiked"),
      }).
      from(workLikeTable).
      groupBy(workLikeTable.work_id).
      as("likeSubQuery")

    const works = await current.tx.select({
      user: {
        ...getTableColumns(userTable),
      },
      work: {
        ...getTableColumns(workTable),
      },
      cover_image: {
        ...getTableColumns(workImageTable),
      },
      likeCount: sql<number>`CASE WHEN likeSubQuery.likeCount IS NULL THEN 0 ELSE likeSubQuery.likeCount END`,
      isLiked: sql<number>`CASE WHEN likeSubQuery.isLiked IS NULL THEN 0 ELSE likeSubQuery.isLiked END`,
    }).
      from(workTable).
      where(and(...whereStmt)).
      leftJoin(workImageTable, eq(workTable.cover_image_id, workImageTable.id)).
      leftJoin(userTable, eq(workTable.user_id, userTable.id)).
      leftJoin(likeSubQuery, eq(workTable.id, likeSubQuery.workId)).
      limit(limit).
      offset(offset).
      orderBy(desc(workTable.created_at))

    res.json(getWorksOutput.parse({
      workList: works.map((item) => ({
        ...item,
        isOwner: item.work.user_id === current.userId ? 1 : 0,
      }))
    }))
  }

  /**
   * 发表作品, 前端上传的第一张图片默认设置为封面图片
   * 字段顺序: title, content, permission, workImageCount, workImage1, workImage2, ...
   */
  async createWork(req: Request, res: EnhancedResponse<null, null>) {
    const current = getCurrent()
    const formParser = new FormParser(req)
    const workId = uuidv4()
    const coverImageId = uuidv4()
    const titleStream = new MemoryWritableStream()
    const contentStream = new MemoryWritableStream()
    const permissionStream = new MemoryWritableStream()
    const workImageCountStream = new MemoryWritableStream()

    await formParser.exec(titleStream)
    await formParser.exec(contentStream)
    await formParser.exec(permissionStream)
    await formParser.exec(workImageCountStream)
    const workImageCount = workImageCountStream.getNumber()

    if (workImageCount === 0) {
      throw new Error("至少上传一张图片")
    }

    // 解析图片流并写入文件
    for (let i = 0; i < workImageCount; i++) {
      const imagePath = `/work_images/${workId}_${i}.jpg`
      const workImageStream = await this.fileStorage.getWritableStream(imagePath)
      await formParser.exec(workImageStream)
    }

    // 数据库插入图片信息
    const images = []
    for (let i = 0; i < workImageCount; i++) {
      const image = {
        id: uuidv4(),
        work_id: workId,
        image_url: this.fileStorage.getFilePath(`/work_images/${workId}_${i}.jpg`),
      }

      if (i === 0) {
        image.id = coverImageId
      }
      images.push(image)
    }
    await current.tx.insert(workImageTable).values(images)

    // 数据库插入作品
    await current.tx.insert(workTable).values({
      id: workId,
      user_id: current.userId,
      title: titleStream.getString(),
      content: contentStream.getString(),
      permission: permissionStream.getNumber(),
      cover_image_id: coverImageId,
    })

    res.json()
  }

  /**
   * 获取作品评论
   * 该接口将查询评论和回复合并为一个接口,通过type参数区分查询类型
   */
  async getWorkComments(req: Request, res: EnhancedResponse<typeof getWorkCommentsInput, null>) {
    const page = getPageParams(res)
    let result: any

    switch (res.locals.query!.type) {
      case "top":
        result = await this.queryWorkComments(res.locals.query!.workId, page)
        break
      case "reply":
        result = await this.queryWorkCommentReplies(res.locals.query!.rootCommentId, page)
        break
      default:
        throw new Error("type参数非法")
    }

    res.json(getWorkCommentsOutput.parse({
      comments: result,
    }))
  }

  /**
   * 查询作品评论子逻辑
   */
  async queryWorkComments(workId: string, page: { limit: number, offset: number }) {
    const current = getCurrent()

    // 点赞子查询
    const likeSubQuery = current.tx.
      select({
        commentId: workCommentLikeTable.comment_id,
        likeCount: sql<number>`COUNT(${workCommentLikeTable.id})`.as("likeCount"),
        isLiked: sql<number>`MAX(CASE WHEN ${workCommentLikeTable.user_id} = ${current.userId} THEN 1 ELSE 0 END)`.as("isLiked"),
      }).
      from(workCommentLikeTable).
      groupBy(workCommentLikeTable.comment_id).
      as("likeSubQuery")

    // 回复数子查询
    const replySubQuery = current.tx.
      select({
        rootCommentId: workCommentTable.root_comment_id,
        replyCount: sql<number>`COUNT(${workCommentTable.id})`.as("replyCount"),
      }).
      from(workCommentTable).
      groupBy(workCommentTable.root_comment_id).
      as("replySubQuery")

    // 查询主逻辑
    const comments = await current.tx.
      select({
        user: {
          ...getTableColumns(userTable),
        },
        comment: {
          ...getTableColumns(workCommentTable),
        },
        likeCount: likeSubQuery.likeCount,
        isLiked: likeSubQuery.isLiked,
        replyCount: replySubQuery.replyCount,
      }).
      from(workCommentTable).
      innerJoin(userTable, eq(workCommentTable.user_id, userTable.id)).
      leftJoin(likeSubQuery, eq(workCommentTable.id, likeSubQuery.commentId)).
      leftJoin(replySubQuery, eq(workCommentTable.id, replySubQuery.rootCommentId)).
      where(and(
        eq(workCommentTable.work_id, workId),
        eq(workCommentTable.parent_id, ""),
      )).
      orderBy(desc(workCommentTable.created_at)).
      limit(page.limit).
      offset(page.offset)

    return comments.map((item) => ({
      ...item,
      likeCount: item.likeCount || 0,
      isLiked: item.isLiked || 0,
      replyCount: item.replyCount || 0,
    }))
  }

  /* 
   * 查询作品评论回复子逻辑
   * 通过mysql CTE递归查询评论树,避免在应用层递归查询
   */
  async queryWorkCommentReplies(rootCommentId: string, page: { limit: number, offset: number }) {
    const current = getCurrent()

    // 注意不同表的字段,需要用comment_和user_前缀区分
    const commentTreeCol = Object.
      keys(getTableColumns(workCommentTable)).
      map((key) => `ct.${key} AS comment$${key}`).
      join(', ')

    const userCol = Object.
      keys(getTableColumns(userTable)).
      map((key) => `user.${key} AS user$${key}`).
      join(', ')

    // 用户是否点赞评论子查询
    const isLikedSubQuery = sql`
      (SELECT COUNT(*)
      FROM work_comment_like
      WHERE comment_id = ct.id
      AND user_id = ${current.userId})
    `

    // 评论点赞数子查询
    const likeCountSubQuery = sql`
      (SELECT COUNT(*)
      FROM work_comment_like
      WHERE comment_id = ct.id)
    `

    /* CTE默认广度遍历, 需要用path字段模拟深度遍历结果
     * sql.raw防止框架转义
    */
    const execRes = await current.tx.execute(sql
      `
        WITH RECURSIVE comment_tree AS (
          SELECT *, 1 AS level, work_comment.id AS path
          FROM work_comment
          WHERE id = ${rootCommentId}
          UNION ALL

          SELECT wc.*, comment_tree.level + 1 AS level, CONCAT(comment_tree.path, '.', wc.id) AS path
          FROM work_comment AS wc
          INNER JOIN comment_tree
          ON wc.parent_id = comment_tree.id
        )

        SELECT ${sql.raw(commentTreeCol)}, ${sql.raw(userCol)}, ${isLikedSubQuery} AS isLiked, ${likeCountSubQuery} AS likeCount, 0 AS replyCount
        FROM comment_tree AS ct
        INNER JOIN \`user\`
        ON ct.user_id = \`user\`.id
        WHERE ct.parent_id != ''
        ORDER BY ct.path
        LIMIT ${page.limit}
        OFFSET ${page.offset}
      `
    )

    return handleRawSqlRes(execRes[0] as unknown as Record<string, any>[])
  }

  /**
   * 创建评论/回复
   * 将评论和回复合并为一个接口,前端需要传入完整的rootCommentId和parentId字段
   */
  async createWorkComment(req: Request, res: EnhancedResponse<null, typeof createWorkCommentInput>) {
    const current = getCurrent()
    const commentId = uuidv4()

    await current.tx.insert(workCommentTable).values({
      id: commentId,
      work_id: res.locals.body!.workId,
      root_comment_id: res.locals.body!.rootCommentId,
      parent_id: res.locals.body!.parentId,
      content: res.locals.body!.content,
      user_id: current.userId,
    })

    // 查询刚刚发布的评论
    const comment = await current.tx.
      select({
        user: {
          ...getTableColumns(userTable),
        },
        comment: {
          ...getTableColumns(workCommentTable),
        },
      }).
      from(workCommentTable).
      innerJoin(userTable, eq(workCommentTable.user_id, userTable.id)).
      where(eq(workCommentTable.id, commentId))

    res.json(createWorkCommentOutput.parse({
      ...comment[0],
      isLiked: 0,
      likeCount: 0,
      replyCount: 0,
    }))
  }

  // 点赞/取消点赞作品评论
  async likeWorkComment(req: Request, res: EnhancedResponse<null, typeof likeWorkCommentInput>) {
    const current = getCurrent()
    const commentId = req.params.commentId as string

    const isExist = await db.select({ count: count().as("count") }).
      from(workCommentLikeTable).
      where(and(
        eq(workCommentLikeTable.user_id, current.userId),
        eq(workCommentLikeTable.comment_id, commentId)
      ))

    if (res.locals.body!.isLiked === 1) {
      if (isExist[0]!.count === 0) {
        throw new Error("用户未点赞")
      }
      await db.delete(workCommentLikeTable).where(and(
        eq(workCommentLikeTable.user_id, current.userId),
        eq(workCommentLikeTable.comment_id, commentId)
      ))
    } else {
      if (isExist[0]!.count !== 0) {
        throw new Error("用户已点赞")
      }
      await db.insert(workCommentLikeTable).values({
        comment_id: commentId,
        user_id: current.userId,
      })
    }
    res.json()
  }

  // 点赞/取消点赞作品
  async likeWork(req: Request, res: EnhancedResponse<null, typeof likeWorkInput>) {
    const current = getCurrent()
    const workId = req.params.workId as string

    const isExist = await db.select({ count: count().as("count") }).from(workLikeTable).where(and(eq(workLikeTable.user_id, current.userId), eq(workLikeTable.work_id, workId)))

    // 判断用户是否点赞过该作品,如果已点赞尝试取消点赞,如果未点赞尝试点赞该作品,下同
    if (res.locals.body!.isLiked === 1) {
      if (isExist[0]!.count === 0) {
        throw new Error("用户未点赞该作品")
      }
      await db.delete(workLikeTable).where(eq(workLikeTable.user_id, current.userId))
    } else {
      if (isExist[0]!.count !== 0) {
        throw new Error("用户已点赞该作品")
      }
      await db.insert(workLikeTable).values({
        user_id: current.userId,
        work_id: workId,
      })
    }

    res.json(null)
  }

  // 收藏/取消收藏作品
  async collectWork(req: Request, res: EnhancedResponse<null, typeof collectWorkInput>) {
    const current = getCurrent()
    const workId = req.params.workId as string

    const isExist = await db.select({ count: count().as("count") }).from(workCollectTable).where(and(eq(workCollectTable.user_id, current.userId), eq(workCollectTable.work_id, workId)))

    if (res.locals.body!.isCollected === 1) {
      if (isExist[0]!.count === 0) {
        throw new Error("用户未收藏该作品")
      }
      await db.delete(workCollectTable).where(and(eq(workCollectTable.user_id, current.userId), eq(workCollectTable.work_id, workId)))
    } else {
      if (isExist[0]!.count !== 0) {
        throw new Error("用户已收藏该作品")
      }
      await db.insert(workCollectTable).values({
        user_id: current.userId,
        work_id: workId,
      })
    }

    res.json(null)
  }
}

export async function newWorkService(fileStorage: FileStoragePort) {
  const workService = new WorkService(fileStorage)
  return workService
}