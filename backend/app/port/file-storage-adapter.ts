import type { FileStoragePort } from "./file-storage-port.js";
import fs from "fs"
import path from "path"
import { Writable } from "stream"
import { getEnv } from "../helper/env.js";
import { AppError } from "../lib/app-error.js";
import { FileExtEnum } from "../domain/model/enum/file.js";
import type { FormFieldHeader, FormParser } from "../lib/framework-ext.js";
import { execCommandLineProgram } from "../lib/command-line.js";
import { getCurrent } from "../lib/local-stroage.js";

class baseFileStorageAdapter {
    protected getFilePath(fileName: string) {
        const uploadDir = getEnv("UPLOAD_DIR")

        if (fileName.startsWith(uploadDir)) {
            return fileName
        }
        return path.join(uploadDir, fileName)
    }
}

export class LocalFileStorageAdapter extends baseFileStorageAdapter implements FileStoragePort {
    // 已写入文件映射表
    private writtenFiles: Map<string, string[]> = new Map()

    async writeFileByParser(filePathWithoutExt: string, parser: FormParser, accept: FileExtEnum[]) {
        const current = getCurrent()
        let writer: WritableStreamDefaultWriter<Buffer> | undefined
        let fileExt: FileExtEnum | undefined
        let filePath = ""
        let realPath = ""

        await parser.exec(async (fieldHeader: FormFieldHeader) => {
            fileExt = fieldHeader.contentType
            filePath = `${filePathWithoutExt}${fileExt}`
            realPath = this.getFilePath(filePath)
            // 确保目录存在
            await fs.promises.mkdir(path.dirname(realPath), { recursive: true })
            writer = Writable.toWeb(fs.createWriteStream(realPath)).getWriter()
            return writer
        }, accept)

        await writer?.close()

        // 如果写入mp4文件,需要前置元数据(faststart)
        if (fileExt === FileExtEnum.MP4) {
            await execCommandLineProgram("ffmpeg", [
                "-y",
                "-i", realPath,
                "-c", "copy",
                "-movflags", "+faststart",
                `${realPath}.tmp.mp4`
            ])
            await fs.promises.rm(realPath)
            await fs.promises.rename(`${realPath}.tmp.mp4`, realPath)
        }

        // 保存本次写入的文件路径
        this.writtenFiles.set(current.requestId, [...this.writtenFiles.get(current.requestId) || [], filePath])

        return filePath
    }

    async deleteFile(filePath: string) {
        filePath = this.getFilePath(filePath)
        await fs.promises.rm(filePath)
    }

    async rollback() {
        const current = getCurrent()
        const files = this.writtenFiles.get(current.requestId) || []
        for (const file of files) {
            await this.deleteFile(file)
        }
    }

    async commit() {
        const current = getCurrent()
        this.writtenFiles.delete(current.requestId)
    }

    async mp4ExtractKeyFrame(inputFilePath: string, outputFilePath: string) {
        await execCommandLineProgram("ffmpeg", [
            "-y",
            "-skip_frame", "nokey",
            "-i", this.getFilePath(inputFilePath),
            "-frames:v", "1",
            "-update", "1",
            this.getFilePath(outputFilePath)
        ])
    }
}