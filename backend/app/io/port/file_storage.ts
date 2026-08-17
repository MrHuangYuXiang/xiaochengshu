export interface FileStoragePort {
    getWritableStream: (fileName: string) => Promise<WritableStream>
}