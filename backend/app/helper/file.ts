import path from "path"
import { getEnv } from "./env.js"

// 获取文件完整路径
export const getFilePath = (p: string) => {
    return path.join(getEnv("UPLOAD_DIR"), p)
}

// 生成作品图片文件路径
export function getWorkImageFilePath(imageId: string, ext: string) {
    return `/work_images/${imageId}${ext}`
}