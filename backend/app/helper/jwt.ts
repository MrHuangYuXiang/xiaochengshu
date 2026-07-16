import jwt from "jsonwebtoken";
import { getEnv } from "./env.js";

export const genJWT = (userId: string) => {
    return "Bearer " + jwt.sign({ userId: userId }, getEnv("JWT_SECRET"), { expiresIn: "24h" })
}

export const verifyJWT = (token: string): { userId: string } => {
    return jwt.verify(token.replace("Bearer ", ""), getEnv("JWT_SECRET")) as { userId: string }
}