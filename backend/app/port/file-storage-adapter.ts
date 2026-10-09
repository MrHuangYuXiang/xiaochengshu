import type { FileStoragePort } from "./file-storage-port.js";
import fs from "fs"
import path from "path"
import { Writable } from "stream"
import { getEnv } from "../helper/env.js";
import { AppError } from "../lib/app-error.js";
import { FileExtEnum } from "../domain/model/enum/file.js";
import type { FormFieldHeader, FormParser } from "../lib/framework-ext.js";
import { execCommandLineProgram } from "../lib/command-line.js";

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
    async writeFileByParser(filePathWithoutExt: string, parser: FormParser, accept: FileExtEnum[]) {
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
        return filePath
    }

    async deleteFile(filePath: string) {
        filePath = this.getFilePath(filePath)
        await fs.promises.rm(filePath, { recursive: true })
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