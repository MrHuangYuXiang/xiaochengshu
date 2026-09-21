import { EnhancedBase } from "./base";
import { List } from "./list";

/**
 * 树结构,用来存储树状数据,如评论回复树等
 * 实现Symbol.iterator接口,支持v-for迭代
 * 对于节点的父节点相关数据由后端返回,前端
 * 不做处理
 */

// 需要继承EnhancedBase
export class Forest<T> extends EnhancedBase<T> {
  children: ForestNode<T>[]
  map: Map<string, ForestNode<T>>

  getId: (item: T) => string;
  getParentId: (item: T) => string;

  constructor(pageSize: number, getId: (item: T) => string, getParentId: (item: T) => string) {
    super(pageSize)
    // 初始化成员属性
    this.getId = getId;
    this.getParentId = getParentId;
    this.children = []
    this.map = new Map()
  }

  /**
   * 批量添加子节点
   * @param children 子节点数据数组
   */
  async pageAddChildren(cb: (currentPage: number, pageSize: number) => Promise<T[]>) {
    this.exec(async () => {
      const children = await cb(this.currentPage, this.pageSize)
      for (const child of children) {
        // 去重
        if (this.map.has(this.getId(child))) {
          continue
        }
        await this.addChild(child)
      }
      return children
    })
  }

  /**
   * 添加子节点,参数同上
   * @param id 父节点id,当id为0时,则添加到根节点
   * @param child 子节点数据
   */
  async addChild(child: T) {
    const id = this.getParentId(child)
    const parent = this.map.get(id)

    // 如果不存在parent,则作为森林根节点
    if (!parent) {
      const node = new ForestNode<T>(child, null, this.getId);
      this.children.push(node)
      this.map.set(this.getId(child!), node);
    } else {
      const node = new ForestNode<T>(child, parent, this.getId);
      parent.children.push(node);
      this.map.set(this.getId(child!), node);
    }
  }

  get(id: string) {
    return this.map.get(id)?.data
  }

  clear() {
    this.map.clear()
    this.children.length = 0
    super.clear()
  }

  count() {
    return this.map.size
  }

  /**
   * 迭代器方法,默认采用深度优先遍历
   */
  *[Symbol.iterator]() {
    // 需要手动维护栈,注意该栈左进左出保证遍历顺序
    const stack: Array<ForestNode<T>> = []
    for (const item of this.children) {
      stack.push(item)
    }
    let current: ForestNode<T> | undefined

    while (true) {
      current = stack.shift()

      // 如果栈为空说明遍历结束
      if (!current) {
        break
      }

      stack.unshift(...current.children)
      yield current
    }
  }
}

class ForestNode<T> {
  data: T;
  children: List<ForestNode<T>>;
  parent: ForestNode<T> | null;

  constructor(data: T, parent: ForestNode<T> | null, getId: (item: T) => string) {
    this.data = data;
    this.children = new List<ForestNode<T>>(item => getId(item.data));
    this.parent = parent;
  }
}
