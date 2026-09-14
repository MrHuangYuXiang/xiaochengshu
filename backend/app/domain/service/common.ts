/**
 * 公共服务文件,抽离各个服务公共逻辑
 */

import { and, eq, getTableColumns, sql } from "drizzle-orm"
import { followTable, userTable } from "../../db/schema/user.js"
import { getCurrent } from "../../local_stroage.js"
import { alias } from "drizzle-orm/mysql-core"

// 当前用户关注关系子查询
export const getFollowRelationSubQuery = () => {
    const current = getCurrent()
    const followTableAlias1 = alias(followTable, "followTable1")
    const followTableAlias2 = alias(followTable, "followTable2")

    return current.tx.
        select({
            ...getTableColumns(userTable),
            // 当前用户是否关注该用户标志位
            is_follow: sql<number>`CASE WHEN followTable1.id IS NULL THEN 0 ELSE 1 END`.as("isFollow"),
            // 当前用户是否被该用户关注标志位
            is_followed: sql<number>`CASE WHEN followTable2.id IS NULL THEN 0 ELSE 1 END`.as("isFollowed"),
        }).
        from(userTable).
        leftJoin(followTableAlias1, and(
            eq(followTableAlias1.following_id, userTable.id),
            eq(followTableAlias1.follower_id, current.userId),
        )).
        leftJoin(followTableAlias2, and(
            eq(followTableAlias2.follower_id, userTable.id),
            eq(followTableAlias2.following_id, current.userId),
        )).
        as("followRelationSubQuery")
}