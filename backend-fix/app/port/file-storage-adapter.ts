import type { FileStoragePort } from "./file-storage-port.js";
import fs from "fs"
import path from "path"
import { Writable } from "stream"
import { getFilePath } from "../helper/file.js";

export class LocalFileStorageAdapter implements FileStoragePort {
    async getWritableStream(p: string) {
        const filePath = getFilePath(p)

        // 确保目录存在
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        return Writable.toWeb(fs.createWriteStream(filePath))
    }

    async deleteFile(p: string) {
        await fs.promises.rm(getFilePath(p), { recursive: true })
    }
}