import type { IncGeneratorPort } from "../port/IncGenerator.js";


// 基于内存的自增数生成器,node环境不必考虑并发问题
export class MemIncGenerator implements IncGeneratorPort {
    private nbMap: Map<string, number>

    constructor() {
        this.nbMap = new Map();
    }

    async gen(key: string): Promise<number> {
        const nb = this.nbMap.get(key) || 1;
        this.nbMap.set(key, nb + 1);
        return nb + 1;
    }
}