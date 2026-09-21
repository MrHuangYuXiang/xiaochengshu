import { db } from "../../db/db.js";
import { BaseService } from "./base.js";
import { getCurrent } from "../../lib/local-stroage.js";
import { ClientFollowTable, ClientUserTable } from "../model/db-schema/client-user.js";
import { ClientWorkTable, ClientWorkCollectTable, ClientWorkCommentTable, ClientWorkLikeTable, ClientWorkCommentLikeTable, ClientWorkImageTable } from "../model/db-schema/client-work.js";
import { and, eq, getTableColumns, count, inArray, not, sql, desc, like, asc } from "drizzle-orm";
import type { EnhancedResponse } from "../model/dto/index.js";
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
  deleteWorkInput,
} from "../model/dto/client-work.js";
import { v4 as uuidv4 } from "uuid";
import { getImageExt, getPageParams } from "../../helper/http.js";
import { handleRawSqlRes } from "../../helper/sql.js";
import { FormParser, MemoryWritableStream, type FormFieldHeader } from "../../lib/framework-ext.js";
import type { FileStoragePort } from "../../port/file-storage-port.js";
import { AppError } from "../../lib/app-error.js";
import { getWorkImageFilePath } from "../../helper/file.js";
import { WorkImageTypeEnum } from "../model/enum/client-work.js";
import type { ClientManagerPort } from "../../port/client-manager-port.js";

export class ClientWorkService extends BaseService {
  /**
   * 获取作品详情
   * 对于sql查询,应尽量避免使用关联子查询,优先使用join连表,以提高查询效率
   */
  async getWorkDetail(req: Request, res: EnhancedResponse<typeof getWorkDetailInput, null>) {
    const current = getCurrent()
    const workId = res.locals.query!.workId
    const followRelationSubQuery = this.getFollowRelationSubQuery()

    const likeSubQuery = db.
      select({
        likeWorkId: ClientWorkLikeTable.work_id,
        likeCount: sql<number>`COUNT(${ClientWorkLikeTable.id})`.as("likeCount"),
        isLiked: sql<number>`MAX(CASE WHEN ${ClientWorkLikeTable.user_id} = ${current.payload.userId} THEN 1 ELSE 0 END)`.as("isLiked"),
      }).
      from(ClientWorkLikeTable).
      where(eq(ClientWorkLikeTable.work_id, workId)).
      as("likeSubQuery")

    const collectSubQuery = db.
      select({
        collectWorkId: ClientWorkCollectTable.work_id,
        collectCount: sql<number>`COUNT(${ClientWorkCollectTable.id})`.as("collectCount"),
        isCollected: sql<number>`MAX(CASE WHEN ${ClientWorkCollectTable.user_id} = ${current.payload.userId} THEN 1 ELSE 0 END)`.as("isCollected"),
      }).
      from(ClientWorkCollectTable).
      where(eq(ClientWorkCollectTable.work_id, workId)).
      as("collectSubQuery")

    const work = await db.select({
      user: followRelationSubQuery._.selectedFields,
      work: {
        ...getTableColumns(ClientWorkTable),
      },
      likeCount: sql<number>`CASE WHEN likeSubQuery.likeCount IS NULL THEN 0 ELSE likeSubQuery.likeCount END`,
      isLiked: sql<number>`CASE WHEN likeSubQuery.isLiked IS NULL THEN 0 ELSE likeSubQuery.isLiked END`,
      collectCount: sql<number>`CASE WHEN collectSubQuery.collectCount IS NULL THEN 0 ELSE collectSubQuery.collectCount END`,
      isCollected: sql<number>`CASE WHEN collectSubQuery.isCollected IS NULL THEN 0 ELSE collectSubQuery.isCollected END`,
    }).
      from(ClientWorkTable).
      where(eq(ClientWorkTable.id, workId)).
      leftJoin(followRelationSubQuery, eq(ClientWorkTable.user_id, followRelationSubQuery.id)).
      leftJoin(likeSubQuery, eq(ClientWorkTable.id, likeSubQuery.likeWorkId)).
      leftJoin(collectSubQuery, eq(ClientWorkTable.id, collectSubQuery.collectWorkId))

    if (work.length === 0) {
      throw new AppError("作品不存在")
    }

    // 查询作品图片
    const images = await db.
      select().
      from(ClientWorkImageTable).
      where(eq(ClientWorkImageTable.work_id, workId)).
      orderBy(asc(ClientWorkImageTable.type))

    // 对于左连接,若无匹配项,相关字段用null填充,需要处理为0,下同
    res.json(getWorkDetailOutput.parse({
      ...work[0],
      images: images,
      isOwner: work[0]!.user?.id === current.payload.userId ? 1 : 0,
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
    if (targetUserId !== current.payload.userId) {
      whereStmt.push(eq(ClientWorkTable.permission, 1))
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
        whereStmt.push(eq(ClientWorkTable.user_id, targetUserId))
        break

      // 获取用户点赞的作品
      case "like":
        const likedWorkIds = (await db.
          select({ workId: ClientWorkLikeTable.work_id }).
          from(ClientWorkLikeTable).
          where(eq(ClientWorkLikeTable.user_id, targetUserId)).
          orderBy(desc(ClientWorkLikeTable.created_at)).
          limit(res.locals.query!.pageSize).
          offset((res.locals.query!.page - 1) * res.locals.query!.pageSize)).
          map((item) => item.workId)
        whereStmt.push(inArray(ClientWorkTable.id, likedWorkIds))
        break

      // 获取用户收藏的作品
      case "collect":
        const collectedWorkIds = (await db.
          select({ workId: ClientWorkCollectTable.work_id }).
          from(ClientWorkCollectTable).
          where(eq(ClientWorkCollectTable.user_id, targetUserId)).
          orderBy(desc(ClientWorkCollectTable.created_at)).
          limit(res.locals.query!.pageSize).
          offset((res.locals.query!.page - 1) * res.locals.query!.pageSize)).
          map((item) => item.workId)
        whereStmt.push(inArray(ClientWorkTable.id, collectedWorkIds))
        break

      // 获取当前用户关注作者的作品
      case "following":
        const followingUserIds = (await db.
          select({ followingUserId: ClientFollowTable.following_id }).
          from(ClientFollowTable).
          where(eq(ClientFollowTable.follower_id, current.payload.userId)).
          limit(100)).
          map((item) => item.followingUserId)
        whereStmt.push(inArray(ClientWorkTable.user_id, followingUserIds))
        break

      default:
        throw new Error("type参数非法")
    }

    const likeSubQuery = current.tx.
      select({
        workId: sql<string>`${ClientWorkLikeTable.work_id}`.as("workId"),
        likeCount: sql<number>`COUNT(${ClientWorkLikeTable.id})`.as("likeCount"),
        isLiked: sql<number>`MAX(CASE WHEN ${ClientWorkLikeTable.user_id} = ${current.payload.userId} THEN 1 ELSE 0 END)`.as("isLiked"),
      }).
      from(ClientWorkLikeTable).
      groupBy(ClientWorkLikeTable.work_id).
      as("likeSubQuery")

    const works = await current.tx.select({
      user: ClientUserTable,
      work: ClientWorkTable,
      cover_image: ClientWorkImageTable,
      likeCount: sql<number>`CASE WHEN likeSubQuery.likeCount IS NULL THEN 0 ELSE likeSubQuery.likeCount END`,
      isLiked: sql<number>`CASE WHEN likeSubQuery.isLiked IS NULL THEN 0 ELSE likeSubQuery.isLiked END`,
    }).
      from(ClientWorkTable).
      where(and(...whereStmt)).
      leftJoin(ClientWorkImageTable, and(
        eq(ClientWorkTable.id, ClientWorkImageTable.work_id),
        eq(ClientWorkImageTable.type, WorkImageTypeEnum.Cover),
      )).
      leftJoin(ClientUserTable, eq(ClientWorkTable.user_id, ClientUserTable.id)).
      leftJoin(likeSubQuery, eq(ClientWorkTable.id, likeSubQuery.workId)).
      limit(limit).
      offset(offset).
      orderBy(desc(ClientWorkTable.created_at))

    res.json(getWorksOutput.parse({
      workList: works.map((item) => ({
        ...item,
        isOwner: item.work.user_id === current.payload.userId ? 1 : 0,
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
    const titleStream = new MemoryWritableStream()
    const contentStream = new MemoryWritableStream()
    const permissionStream = new MemoryWritableStream()
    const workImageCountStream = new MemoryWritableStream()
    const images: Array<typeof ClientWorkImageTable.$inferInsert> = []

    await formParser.exec(async () => titleStream)
    await formParser.exec(async () => contentStream)
    await formParser.exec(async () => permissionStream)
    await formParser.exec(async () => workImageCountStream)
    const workImageCount = workImageCountStream.getNumber()

    if (workImageCount === 0) {
      throw new AppError("请至少上传一张图片")
    }

    // 解析图片流并写入文件
    for (let i = 0; i < workImageCount; i++) {
      await formParser.exec(async (fieldHeader: FormFieldHeader) => {
        const path = getWorkImageFilePath(workId, getImageExt(fieldHeader))
        images.push({
          work_id: workId,
          path: path,
          // 第一张图片默认为封面图片
          type: i === 0 ? WorkImageTypeEnum.Cover : WorkImageTypeEnum.Normal,
        })
        return await this.fileStorage.getWritableStream(path)
      })
    }

    // 数据库插入图片信息
    await current.tx.insert(ClientWorkImageTable).values(images)

    // 数据库插入作品
    await current.tx.insert(ClientWorkTable).values({
      id: workId,
      user_id: current.payload.userId,
      title: titleStream.getString(),
      content: contentStream.getString(),
      permission: permissionStream.getNumber(),
    })

    res.json()
  }

  /** 删除作品(级联删除相关资源) */
  async deleteWork(req: Request, res: EnhancedResponse<null, typeof deleteWorkInput>) {
    await this.baseDeleteWork(res.locals.body!.workId)
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
        commentId: ClientWorkCommentLikeTable.comment_id,
        likeCount: sql<number>`COUNT(${ClientWorkCommentLikeTable.id})`.as("likeCount"),
        isLiked: sql<number>`MAX(CASE WHEN ${ClientWorkCommentLikeTable.user_id} = ${current.payload.userId} THEN 1 ELSE 0 END)`.as("isLiked"),
      }).
      from(ClientWorkCommentLikeTable).
      groupBy(ClientWorkCommentLikeTable.comment_id).
      as("likeSubQuery")

    // 回复数子查询
    const replySubQuery = current.tx.
      select({
        rootCommentId: ClientWorkCommentTable.root_comment_id,
        replyCount: sql<number>`COUNT(${ClientWorkCommentTable.id})`.as("replyCount"),
      }).
      from(ClientWorkCommentTable).
      groupBy(ClientWorkCommentTable.root_comment_id).
      as("replySubQuery")

    // 查询主逻辑
    const comments = await current.tx.
      select({
        user: {
          ...getTableColumns(ClientUserTable),
        },
        comment: {
          ...getTableColumns(ClientWorkCommentTable),
        },
        likeCount: likeSubQuery.likeCount,
        isLiked: likeSubQuery.isLiked,
        replyCount: replySubQuery.replyCount,
      }).
      from(ClientWorkCommentTable).
      innerJoin(ClientUserTable, eq(ClientWorkCommentTable.user_id, ClientUserTable.id)).
      leftJoin(likeSubQuery, eq(ClientWorkCommentTable.id, likeSubQuery.commentId)).
      leftJoin(replySubQuery, eq(ClientWorkCommentTable.id, replySubQuery.rootCommentId)).
      where(and(
        eq(ClientWorkCommentTable.work_id, workId),
        eq(ClientWorkCommentTable.parent_id, ""),
      )).
      orderBy(desc(ClientWorkCommentTable.created_at)).
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
      keys(getTableColumns(ClientWorkCommentTable)).
      map((key) => `ct.${key} AS comment$${key}`).
      join(', ')

    const userCol = Object.
      keys(getTableColumns(ClientUserTable)).
      map((key) => `user.${key} AS user$${key}`).
      join(', ')

    // 用户是否点赞评论子查询
    const isLikedSubQuery = sql`
      (SELECT COUNT(*)
      FROM work_comment_like
      WHERE comment_id = ct.id
      AND user_id = ${current.payload.userId})
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

    await current.tx.insert(ClientWorkCommentTable).values({
      id: commentId,
      work_id: res.locals.body!.workId,
      root_comment_id: res.locals.body!.rootCommentId,
      parent_id: res.locals.body!.parentId,
      content: res.locals.body!.content,
      user_id: current.payload.userId,
    })

    // 查询刚刚发布的评论
    const comment = await current.tx.
      select({
        user: {
          ...getTableColumns(ClientUserTable),
        },
        comment: {
          ...getTableColumns(ClientWorkCommentTable),
        },
      }).
      from(ClientWorkCommentTable).
      innerJoin(ClientUserTable, eq(ClientWorkCommentTable.user_id, ClientUserTable.id)).
      where(eq(ClientWorkCommentTable.id, commentId))

    res.json(createWorkCommentOutput.parse({
      ...comment[0],
      isLiked: 0,
      likeCount: 0,
      replyCount: 0,
    }))
  }
}