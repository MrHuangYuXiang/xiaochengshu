import type { components, paths } from "./gen"

export type workCommentSchema = paths["/get/work/comments"]["post"]["responses"]["200"]["content"]["application/json"]["comments"][number]
export type WorksSchema = paths["/get/works"]["post"]["responses"]["200"]["content"]["application/json"]["workList"][number]
export type WorkSchema = paths["/get/work"]["post"]["responses"]["200"]["content"]["application/json"]["work"]
export type SessionSchema = paths["/get/chat/sessions"]["post"]["responses"]["200"]["content"]["application/json"]["sessions"][number]
export type MessageSchema = paths["/get/chat/messages"]["post"]["responses"]["200"]["content"]["application/json"]["messages"][number]

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
