export interface FileStoragePort {
    getWritableStream: (fileName: string) => Promise<WritableStream>
    deleteFile: (fileName: string) => Promise<void>
}