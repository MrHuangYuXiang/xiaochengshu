import jwt from "jsonwebtoken";
import { getEnv } from "../helper/env.js";
import type { Payload } from "../lib/local-stroage.js";

export const genJWT = (
    payload: Payload,
) => {
    return "Bearer " + jwt.sign(payload, getEnv("JWT_SECRET"), { expiresIn: "24h" })
}

export const verifyJWT = (token: string): Payload => {
    return jwt.verify(
        token.replace("Bearer ", ""),
        getEnv("JWT_SECRET")
    ) as Payload
}