import { getEnv } from "../../helper/env.js";
import type { FileStoragePort } from "../port/file_storage.js";
import fs from "fs"
import path from "path"
import { Writable } from "stream"

class NginxFileStorage implements FileStoragePort {
    async getWritableStream(fileName: string) {
        const filePath = this.getFilePath(fileName)

        // 确保目录存在
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        return Writable.toWeb(fs.createWriteStream(filePath))
    }

    getFilePath(fileName: string) {
        return path.join(getEnv("UPLOAD_DIR"), fileName)
    }
}

export const newNginxFileStorage = () => new NginxFileStorage()
