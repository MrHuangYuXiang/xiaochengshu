import jwt from "jsonwebtoken";
import { getEnv } from "../helper/env.js";

type BasePayload = {
    userId: string,
}

type ClientPayload = {
}

type AdminPayload = {
    adminEmployeeId: string,
    adminRole: number
}

export type Payload = BasePayload & ClientPayload & AdminPayload

export const genClientJWT = (
    basePayload: BasePayload,
    clientPayload?: ClientPayload,
    adminPayload?: AdminPayload
) => {
    if (!adminPayload) {
        adminPayload = { adminEmployeeId: "", adminRole: 0 }
    }

    if (!clientPayload) {
        clientPayload = {}
    }

    return "Bearer " + jwt.sign({
        ...basePayload,
        ...adminPayload,
        ...clientPayload
    }, getEnv("JWT_SECRET"), { expiresIn: "24h" })
}

export const verifyJWT = (token: string): Payload => {
    return jwt.verify(
        token.replace("Bearer ", ""),
        getEnv("JWT_SECRET")
    ) as Payload
}