import type { components, paths } from "./gen"

export type workCommentSchema = paths["/work/comments"]["get"]["responses"]["200"]["content"]["application/json"]["comments"][number]
export type WorksSchema = paths["/works"]["get"]["responses"]["200"]["content"]["application/json"]["workList"][number]
export type WorkSchema = paths["/work"]["get"]["responses"]["200"]["content"]["application/json"]
export type SessionSchema = paths["/chat/get/sessions"]["get"]["responses"]["200"]["content"]["application/json"]["sessions"][number]
export type MessageSchema = paths["/chat/get/messages"]["get"]["responses"]["200"]["content"]["application/json"]["messages"][number]

type MessageType<T> = {
  type: string,
  data: T
}

export function genErrorMessage(msg: string): MessageType<components["schemas"]["errorClientEvent"]> {
  return {
    type: "error",
    data: { msg }
  }
}
