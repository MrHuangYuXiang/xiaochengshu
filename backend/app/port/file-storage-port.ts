import type { FileExtEnum } from "../domain/model/enum/file.js"

export interface FileStoragePort {
    getWritableStream: (fileName: string) => Promise<WritableStream>
    deleteFile: (fileName: string) => Promise<void>
}