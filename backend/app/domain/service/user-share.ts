import { alias } from "drizzle-orm/mysql-core";
import { getCurrent } from "../../lib/local-stroage.js";
import { BaseShareService } from "./base.js";
import { FollowTable, UserTable } from "../model/db-schema/user.js";
import { and, eq, getTableColumns, sql } from "drizzle-orm";

export class UserShareService extends BaseShareService {
    // 当前用户关注关系子查询
    getFollowRelationSubQuery() {
        const current = getCurrent()
        const followTableAlias1 = alias(FollowTable, "followTable1")
        const followTableAlias2 = alias(FollowTable, "followTable2")

        return current.tx.
            select({
                user: {
                    ...getTableColumns(UserTable),
                    // 当前用户是否关注该用户标志位
                    is_follow: sql<number>`CASE WHEN followTable1.id IS NULL THEN 0 ELSE 1 END`.as("isFollow"),
                    // 当前用户是否被该用户关注标志位
                    is_followed: sql<number>`CASE WHEN followTable2.id IS NULL THEN 0 ELSE 1 END`.as("isFollowed"),
                },
            }).
            from(UserTable).
            leftJoin(followTableAlias1, and(
                eq(followTableAlias1.following_id, UserTable.id),
                eq(followTableAlias1.follower_id, current.payload.userId),
            )).
            leftJoin(followTableAlias2, and(
                eq(followTableAlias2.follower_id, UserTable.id),
                eq(followTableAlias2.following_id, current.payload.userId),
            )).
            as("followRelationSubQuery")
    }
}