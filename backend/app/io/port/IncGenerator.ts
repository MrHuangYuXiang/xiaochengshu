// 自增数生成器端口
export interface IncGeneratorPort {
    gen(key: string): Promise<number>;
}