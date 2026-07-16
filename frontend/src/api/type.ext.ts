import type { components, paths } from "./gen"

export type workCommentSchema = paths["/work/comments"]["get"]["responses"]["200"]["content"]["application/json"]["comments"][number]
export type WorksSchema = paths["/works"]["get"]["responses"]["200"]["content"]["application/json"]["workList"][number]
export type WorkSchema = paths["/work"]["get"]["responses"]["200"]["content"]["application/json"]

type MessageType<T> = {
  type: string,
  data: T
}

export function genErrorMessage(msg: string): MessageType<components["schemas"]["errorHttpEvent"]> {
  return {
    type: "error",
    data: { msg }
  }
}
