import type { FileStoragePort } from "./file-storage-port.js";
import fs from "fs"
import path from "path"
import { Writable } from "stream"
import { getEnv } from "../helper/env.js";
import { AppError } from "../lib/app-error.js";

class baseFileStorageAdapter {
    getFilePath(fileName: string) {
        const uploadDir = getEnv("UPLOAD_DIR")

        if (fileName.startsWith(uploadDir)) {
            return fileName
        }
        return path.join(uploadDir, fileName)
    }
}

export class LocalFileStorageAdapter extends baseFileStorageAdapter implements FileStoragePort {
    // 必须传入完整的文件路径
    async getWritableStream(filePath: string) {
        filePath = this.getFilePath(filePath)

        // 确保目录存在
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        return Writable.toWeb(fs.createWriteStream(filePath))
    }

    async deleteFile(filePath: string) {
        filePath = this.getFilePath(filePath)
        await fs.promises.rm(filePath, { recursive: true })
    }
}