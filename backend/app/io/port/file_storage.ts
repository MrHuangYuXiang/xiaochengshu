export interface FileStoragePort {
    getWritableStream: (fileName: string) => Promise<WritableStream>
    getFilePath: (fileName: string) => string
}