/**
 * 互斥锁端口
 */
export interface MutexPort {
    withLock(key: string, cb: () => Promise<void>): Promise<void>;
}