import type { FileStoragePort } from "./file-storage-port.js";
import fs from "fs"
import path from "path"
import { Writable } from "stream"
import { getEnv } from "../helper/env.js";
import type { FileExtEnum } from "../domain/model/enum/file.js";
import { AppError } from "../lib/app-error.js";

class baseFileStorageAdapter {
    getFilePath(fileName: string, ext: FileExtEnum) {
        const uploadDir = getEnv("UPLOAD_DIR")

        if (fileName.startsWith(uploadDir)) {
            return fileName
        }
        return path.join(uploadDir, `${fileName}${ext}`)
    }
}

export class LocalFileStorageAdapter extends baseFileStorageAdapter implements FileStoragePort {
    // 必须传入完整的文件路径
    async getWritableStream(filePath: string) {
        this.validateFilePath(filePath)

        // 确保目录存在
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        return Writable.toWeb(fs.createWriteStream(filePath))
    }

    async deleteFile(filePath: string) {
        this.validateFilePath(filePath)
        await fs.promises.rm(filePath, { recursive: true })
    }

    // 校验文件路径是否合法
    validateFilePath(filePath: string) {
        if (!filePath.startsWith(getEnv("UPLOAD_DIR"))) {
            throw new AppError("请传入完整的文件路径")
        }
    }
}