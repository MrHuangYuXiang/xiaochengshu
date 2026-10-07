import { db } from "../db.js";
import { BaseService } from "./base.js";
import { getCurrent } from "../../lib/local-stroage.js";
import { FollowTable, UserTable } from "../model/db-schema/user.js";
import { WorkTable, WorkCollectTable, WorkCommentTable, WorkLikeTable, WorkCommentLikeTable, WorkAttachmentTable } from "../model/db-schema/work.js";
import { and, eq, getTableColumns, count, inArray, not, sql, desc, like, asc } from "drizzle-orm";
import type { Request, Response } from "express";
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
  shareWorkInput,
  replyWorkCommentInput,
  replyWorkCommentOutput,
} from "../model/dto/work.js";
import { v4 as uuidv4 } from "uuid";
import { handleRawSqlRes } from "../../helper/sql.js";
import { FormParser, MemoryWritableStream, NumberWritableStream, StringWritableStream, type FormFieldHeader } from "../../lib/framework-ext.js";
import { AppError, throwServerError, throwServerBusy } from "../../lib/app-error.js";
import { WorkAttachmentPriorityEnum, WorkTypeEnum } from "../model/enum/work.js";
import { FileExtEnum } from "../model/enum/file.js";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { ClientChatMessageTypeEnum } from "../model/enum/chat.js";
import { getRequestBody, getRequestPage } from "../model/dto/index.js";

export class WorkService extends BaseService {
  /** 获取作品详情 */
  async getWorkDetail(req: Request, res: Response) {
    const current = getCurrent()
    const body = getRequestBody<typeof getWorkDetailInput>(res)

    const workId = body.workId
    const followRelationSubQuery = this.userShareService.getFollowRelationSubQuery()

    const likeSubQuery = this.workShareService.getLikeSubQuery()

    const collectSubQuery = db.
      select({
        collectWorkId: WorkCollectTable.work_id,
        collectCount: sql<number>`COUNT(${WorkCollectTable.id})`.as("collectCount"),
        isCollected: sql<number>`MAX(CASE WHEN ${WorkCollectTable.user_id} = ${current.payload.userId} THEN 1 ELSE 0 END)`.as("isCollected"),
      }).
      from(WorkCollectTable).
      groupBy(WorkCollectTable.work_id).
      as("collectSubQuery")

    const work = await db.select({
      user: followRelationSubQuery.user,
      work: {
        ...getTableColumns(WorkTable),
      },
      likeCount: sql<number>`CASE WHEN likeSubQuery.likeCount IS NULL THEN 0 ELSE likeSubQuery.likeCount END`,
      isLiked: sql<number>`CASE WHEN likeSubQuery.isLiked IS NULL THEN 0 ELSE likeSubQuery.isLiked END`,
      collectCount: sql<number>`CASE WHEN collectSubQuery.collectCount IS NULL THEN 0 ELSE collectSubQuery.collectCount END`,
      isCollected: sql<number>`CASE WHEN collectSubQuery.isCollected IS NULL THEN 0 ELSE collectSubQuery.isCollected END`,
    }).
      from(WorkTable).
      where(eq(WorkTable.id, workId)).
      leftJoin(followRelationSubQuery, eq(WorkTable.user_id, followRelationSubQuery.user.id)).
      leftJoin(likeSubQuery, eq(WorkTable.id, likeSubQuery.workId)).
      leftJoin(collectSubQuery, eq(WorkTable.id, collectSubQuery.collectWorkId))

    if (!work[0]) {
      res.json(getWorkDetailOutput.parse({
        work: undefined,
      }))
      return
    }

    // 查询作品图片
    const images = await db.
      select().
      from(WorkAttachmentTable).
      where(eq(WorkAttachmentTable.work_id, workId)).
      orderBy(asc(WorkAttachmentTable.priority))

    res.json(getWorkDetailOutput.parse({
      work: {
        ...work[0],
        images: images,
      },
    }))
  }

  /** 
   * 获取作品
   * 所有获取多作品都统一请求该接口,避免sql,作品权限过滤等重复逻辑
   * 散落在多个接口函数中
   */
  async getWorks(req: Request, res: Response) {
    const current = getCurrent()
    const body = getRequestBody<typeof getWorksInput>(res)
    const targetUserId = body.targetUserId
    const { offset, limit } = getRequestPage(res)
    let whereStmt: any[] = []

    // 当目标用户不是当前用户时,过滤私密作品
    if (targetUserId !== current.payload.userId) {
      whereStmt.push(eq(WorkTable.permission, 1))
    }

    switch (body.type) {
      /**
       * 获取推荐作品
       * TODO: 推荐系统未实现,返回作品按时间降序模拟 
       */
      case "recommend":
        break

      // 获取用户发布的作品
      case "self":
        whereStmt.push(eq(WorkTable.user_id, targetUserId))
        break

      // 获取用户点赞的作品
      case "like":
        const likedWorkIds = (await db.
          select({ workId: WorkLikeTable.work_id }).
          from(WorkLikeTable).
          where(eq(WorkLikeTable.user_id, targetUserId)).
          orderBy(desc(WorkLikeTable.created_at)).
          limit(limit).
          offset(offset)).
          map((item) => item.workId)
        whereStmt.push(inArray(WorkTable.id, likedWorkIds))
        break

      // 获取用户收藏的作品
      case "collect":
        const collectedWorkIds = (await db.
          select({ workId: WorkCollectTable.work_id }).
          from(WorkCollectTable).
          where(eq(WorkCollectTable.user_id, targetUserId)).
          orderBy(desc(WorkCollectTable.created_at)).
          limit(limit).
          offset(offset)).
          map((item) => item.workId)
        whereStmt.push(inArray(WorkTable.id, collectedWorkIds))
        break

      // 获取当前用户关注作者的作品
      case "following":
        const followingUserIds = (await db.
          select({ followingUserId: FollowTable.following_id }).
          from(FollowTable).
          where(eq(FollowTable.follower_id, current.payload.userId)).
          orderBy(desc(FollowTable.created_at)).
          limit(limit).
          offset(offset)).
          map((item) => item.followingUserId)
        whereStmt.push(inArray(WorkTable.user_id, followingUserIds))
        break

      default:
        throw new Error("type参数非法")
    }

    const likeSubQuery = this.workShareService.getLikeSubQuery()

    const works = await current.tx.select({
      user: UserTable,
      work: WorkTable,
      cover_image: WorkAttachmentTable,
      likeCount: sql<number>`CASE WHEN likeSubQuery.likeCount IS NULL THEN 0 ELSE likeSubQuery.likeCount END`,
      isLiked: sql<number>`CASE WHEN likeSubQuery.isLiked IS NULL THEN 0 ELSE likeSubQuery.isLiked END`,
    }).
      from(WorkTable).
      where(and(...whereStmt)).
      leftJoin(WorkAttachmentTable, and(
        eq(WorkTable.id, WorkAttachmentTable.work_id),
        eq(WorkAttachmentTable.priority, WorkAttachmentPriorityEnum.COVER),
      )).
      leftJoin(UserTable, eq(WorkTable.user_id, UserTable.id)).
      leftJoin(likeSubQuery, eq(WorkTable.id, likeSubQuery.workId)).
      limit(limit).
      offset(offset).
      orderBy(desc(WorkTable.created_at))

    res.json(getWorksOutput.parse({
      workList: works.map((item) => ({
        ...item,
      }))
    }))
  }

  /**
   * 发布图片作品, 前端上传的第一张图片默认设置为封面图片
   * 字段顺序: title, content, permission, workImageCount, workImage1, workImage2, ...
   */
  async createImageWork(req: Request, res: Response) {
    const current = getCurrent()
    const formParser = new FormParser(req)
    const workId = uuidv4()
    const titleStream = new StringWritableStream()
    const contentStream = new StringWritableStream()
    const permissionStream = new NumberWritableStream()
    const workImageCountStream = new NumberWritableStream()
    const images: Array<typeof WorkAttachmentTable.$inferInsert> = []

    await formParser.exec(async () => titleStream, [FileExtEnum.UNKNOWN])
    await formParser.exec(async () => contentStream, [FileExtEnum.UNKNOWN])
    await formParser.exec(async () => permissionStream, [FileExtEnum.UNKNOWN])
    await formParser.exec(async () => workImageCountStream, [FileExtEnum.UNKNOWN])
    const workImageCount = workImageCountStream.getNumber()

    if (workImageCount === 0) {
      throw new AppError("请至少上传一张图片")
    }

    // 解析图片流并写入文件
    for (let i = 0; i < workImageCount; i++) {
      await formParser.exec(async (fieldHeader: FormFieldHeader) => {
        const imageId = uuidv4()
        const filePath = `/work-attachments/${imageId}${fieldHeader.contentType}`
        images.push({
          id: imageId,
          work_id: workId,
          path: filePath,
          // 第一张图片默认为封面图片
          priority: i === 0 ? WorkAttachmentPriorityEnum.COVER : WorkAttachmentPriorityEnum.NORMAL,
        })
        return await this.fileStorage.getWritableStream(filePath)
      }, [FileExtEnum.JPG, FileExtEnum.PNG])
    }

    // 数据库插入图片信息
    await current.tx.insert(WorkAttachmentTable).values(images)

    // 数据库插入作品信息
    await current.tx.insert(WorkTable).values({
      id: workId,
      user_id: current.payload.userId,
      title: titleStream.getString(),
      content: contentStream.getString(),
      type: WorkTypeEnum.IMAGE,
      permission: permissionStream.getNumber(),
    })
  }

  // 发布视频作品
  async createVideoWork(req: Request, res: Response) {
    const current = getCurrent()
    const formParser = new FormParser(req)
    const workId = uuidv4()
    const titleStream = new StringWritableStream()
    const contentStream = new StringWritableStream()
    const permissionStream = new NumberWritableStream()
    let videos: typeof WorkAttachmentTable.$inferInsert[] = []

    await formParser.exec(async () => titleStream, [FileExtEnum.UNKNOWN])
    await formParser.exec(async () => contentStream, [FileExtEnum.UNKNOWN])
    await formParser.exec(async () => permissionStream, [FileExtEnum.UNKNOWN])

    await formParser.exec(async (fieldHeader: FormFieldHeader) => {
      const videoId = uuidv4()
      const video = {
        id: videoId,
        work_id: workId,
        path: `/work-attachments/${videoId}${fieldHeader.contentType}`,
        priority: WorkAttachmentPriorityEnum.NORMAL,
      }
      videos.push(video)
      return await this.fileStorage.getWritableStream(video.path)
    }, [FileExtEnum.MP4])

    // 数据库插入视频信息
    await current.tx.insert(WorkAttachmentTable).values(videos)
    // 数据库插入作品信息
    await current.tx.insert(WorkTable).values({
      id: workId,
      user_id: current.payload.userId,
      title: titleStream.getString(),
      content: contentStream.getString(),
      type: WorkTypeEnum.VIDEO,
      permission: permissionStream.getNumber(),
    })
  }

  /** 删除作品(级联删除相关资源) */
  async deleteWork(req: Request, res: Response) {
    const body = getRequestBody<typeof deleteWorkInput>(res)
    await this.workShareService.deleteWork(body.workId)
  }

  /**
   * 获取作品评论
   * 该接口将查询评论和回复合并为一个接口,通过type参数区分查询类型
   */
  async getWorkComments(req: Request, res: Response) {
    const body = getRequestBody<typeof getWorkCommentsInput>(res)
    const page = getRequestPage(res)
    let result: any

    switch (body.type) {
      case "top":
        result = await this.queryWorkComments(body.workId, page)
        break
      case "reply":
        result = await this.queryWorkCommentReplies(body.rootCommentId, page)
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
        commentId: WorkCommentLikeTable.comment_id,
        likeCount: sql<number>`COUNT(${WorkCommentLikeTable.id})`.as("likeCount"),
        isLiked: sql<number>`MAX(CASE WHEN ${WorkCommentLikeTable.user_id} = ${current.payload.userId} THEN 1 ELSE 0 END)`.as("isLiked"),
      }).
      from(WorkCommentLikeTable).
      groupBy(WorkCommentLikeTable.comment_id).
      as("likeSubQuery")

    // 回复数子查询
    const replySubQuery = current.tx.
      select({
        rootCommentId: WorkCommentTable.root_comment_id,
        replyCount: sql<number>`COUNT(${WorkCommentTable.id})`.as("replyCount"),
      }).
      from(WorkCommentTable).
      groupBy(WorkCommentTable.root_comment_id).
      as("replySubQuery")

    // 查询主逻辑
    const comments = await current.tx.
      select({
        user: {
          ...getTableColumns(UserTable),
        },
        comment: {
          ...getTableColumns(WorkCommentTable),
        },
        likeCount: likeSubQuery.likeCount,
        isLiked: likeSubQuery.isLiked,
        replyCount: replySubQuery.replyCount,
      }).
      from(WorkCommentTable).
      innerJoin(UserTable, eq(WorkCommentTable.user_id, UserTable.id)).
      leftJoin(likeSubQuery, eq(WorkCommentTable.id, likeSubQuery.commentId)).
      leftJoin(replySubQuery, eq(WorkCommentTable.id, replySubQuery.rootCommentId)).
      where(and(
        eq(WorkCommentTable.work_id, workId),
        eq(WorkCommentTable.parent_id, ""),
      )).
      orderBy(desc(WorkCommentTable.created_at)).
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
      keys(getTableColumns(WorkCommentTable)).
      map((key) => `ct.${key} AS comment$${key}`).
      join(', ')

    const userCol = Object.
      keys(getTableColumns(UserTable)).
      map((key) => `${getTableConfig(UserTable).name}.${key} AS user$${key}`).
      join(', ')

    // 用户是否点赞评论子查询
    const isLikedSubQuery = sql`
      (SELECT COUNT(*)
      FROM ${WorkCommentLikeTable}
      WHERE ${WorkCommentLikeTable.comment_id} = ct.id
      AND ${WorkCommentLikeTable.user_id} = ${current.payload.userId})
    `

    // 评论点赞数子查询
    const likeCountSubQuery = sql`
      (SELECT COUNT(*)
      FROM ${WorkCommentLikeTable}
      WHERE ${WorkCommentLikeTable.comment_id} = ct.id)
    `

    /* CTE默认广度遍历, 需要用path字段模拟深度遍历结果
     * sql.raw防止框架转义
    */
    const execRes = await current.tx.execute(sql
      `
        WITH RECURSIVE comment_tree AS (
          SELECT *, 1 AS level, ${WorkCommentTable.id} AS path
          FROM ${WorkCommentTable}
          WHERE ${WorkCommentTable.id} = ${rootCommentId}
          UNION ALL

          SELECT wc.*, comment_tree.level + 1 AS level, CONCAT(comment_tree.path, '.', wc.id) AS path
          FROM ${WorkCommentTable} AS wc
          INNER JOIN comment_tree
          ON wc.parent_id = comment_tree.id
        )

        SELECT ${sql.raw(commentTreeCol)}, ${sql.raw(userCol)}, ${isLikedSubQuery} AS isLiked, ${likeCountSubQuery} AS likeCount, 0 AS replyCount
        FROM comment_tree AS ct
        INNER JOIN ${UserTable}
        ON ct.user_id = ${UserTable.id}
        WHERE ct.parent_id != ''
        ORDER BY ct.path
        LIMIT ${page.limit}
        OFFSET ${page.offset}
      `
    )

    return handleRawSqlRes(execRes[0] as unknown as Record<string, any>[])
  }

  // 创建作品顶层评论
  async createWorkComment(req: Request, res: Response) {
    const body = getRequestBody<typeof createWorkCommentInput>(res)
    const current = getCurrent()

    const comment = await this.workShareService.createWorkComment({
      work_id: body.workId,
      root_comment_id: "",
      parent_id: "",
      content: body.content,
      user_id: current.payload.userId,
    })

    res.json(createWorkCommentOutput.parse({
      comment: comment[0],
    }))
  }

  // 回复评论
  async replyWorkComment(req: Request, res: Response) {
    const body = getRequestBody<typeof replyWorkCommentInput>(res)
    const current = getCurrent()

    const comment = await this.workShareService.createWorkComment({
      work_id: body.workId,
      root_comment_id: body.rootCommentId,
      parent_id: body.parentId,
      content: body.content,
      user_id: current.payload.userId,
    })

    res.json(replyWorkCommentOutput.parse({
      comment: comment[0],
    }))
  }

  // 点赞作品
  async likeWork(req: Request, res: Response) {
    const body = getRequestBody<typeof likeWorkInput>(res)
    const current = getCurrent()

    // 点赞作品
    if (body.isLike) {
      await current.tx.insert(WorkLikeTable).values({
        work_id: body.workId,
        user_id: current.payload.userId,
      })

      // 发送互动消息
      await this.chatShareService.sendInteractionMessage(body, ClientChatMessageTypeEnum.WORK_LIKE_NOTICE)
    }

    // 取消点赞作品
    else {
      await current.tx.delete(WorkLikeTable).where(and(
        eq(WorkLikeTable.work_id, body.workId),
        eq(WorkLikeTable.user_id, current.payload.userId),
      ))
    }
  }

  // 收藏作品
  async collectWork(req: Request, res: Response) {
    const body = getRequestBody<typeof collectWorkInput>(res)
    const current = getCurrent()
    if (body.isCollect) {
      await current.tx.insert(WorkCollectTable).values({
        work_id: body.workId,
        user_id: current.payload.userId,
      })

      // 发送互动消息
      await this.chatShareService.sendInteractionMessage(body, ClientChatMessageTypeEnum.WORK_COLLECT_NOTICE)
    } else {
      await current.tx.delete(WorkCollectTable).where(and(
        eq(WorkCollectTable.work_id, body.workId),
        eq(WorkCollectTable.user_id, current.payload.userId),
      ))
    }
  }

  // 分享作品
  async shareWork(req: Request, res: Response) {
    const body = getRequestBody<typeof shareWorkInput>(res)
    const current = getCurrent()

    // 向目标会话发送分享消息
    await this.chatShareService.sendChatMessage({
      session_id: body.sessionId,
      user_id: current.payload.userId,
      type: ClientChatMessageTypeEnum.WORK_SHARE,
      content: "",
    }, {
      [ClientChatMessageTypeEnum.WORK_SHARE]: {
        work_id: body.workId,
        work_title: body.workTitle,
        work_cover_image_path: body.workCoverImagePath,
        work_user_id: body.workUserId,
        work_user_name: body.workUserName,
        work_user_avatar_path: body.workUserAvatarPath,
      }
    })

    // 向作品作者发送互动消息
    await this.chatShareService.sendInteractionMessage(
      body,
      ClientChatMessageTypeEnum.WORK_FORWARD_NOTICE,
    )
  }

  // 点赞评论
  async likeWorkComment(req: Request, res: Response) {
    const body = getRequestBody<typeof likeWorkCommentInput>(res)
    const current = getCurrent()
    if (body.isLike) {
      await current.tx.insert(WorkCommentLikeTable).values({
        comment_id: body.commentId,
        user_id: current.payload.userId,
        work_id: body.workId,
      })
    } else {
      await current.tx.delete(WorkCommentLikeTable).where(and(
        eq(WorkCommentLikeTable.comment_id, body.commentId),
        eq(WorkCommentLikeTable.user_id, current.payload.userId),
      ))
    }
  }
}