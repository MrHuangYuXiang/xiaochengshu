import type { FileExtEnum } from "../domain/model/enum/file.js"
import type { FormParser } from "../lib/framework-ext.js"

export interface FileStoragePort {
    // 通过表单解析器写入,并返回文件路径
    writeFileByParser: (fileNameWithoutExt: string, parser: FormParser, accept: FileExtEnum[]) => Promise<string>
    // 删除
    deleteFile: (fileName: string) => Promise<void>

    // mp4文件提取关键帧
    mp4ExtractKeyFrame: (inputFilePath: string, outputFilePath: string) => Promise<void>
}