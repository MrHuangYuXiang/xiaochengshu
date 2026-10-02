/**
 * 增强基类,用于实现分页,防抖等增强功能
 * 注意去重需要由子类实现
 */
export class EnhancedBase<T> {
  isLoading: boolean
  isEnd: boolean
  currentPage: number
  pageSize: number

  constructor(pageSize: number) {
    this.isLoading = false
    this.isEnd = false
    this.currentPage = 1
    this.pageSize = pageSize
  }

  clear() {
    this.currentPage = 1
    this.isEnd = false
    this.isLoading = false
  }

  /** 基类统一实现防抖策略 */
  async exec(cb: () => Promise<T[]>) {
    if (this.isEnd || this.isLoading) {
      return
    }

    this.isLoading = true
    const data = await cb()
    this.currentPage += 1
    this.isLoading = false

    if (data.length < this.pageSize) {
      this.isEnd = true
    }
  }
}


/**
 * 链表
 */
export class List<T> {
  head: ListNode<T>;
  tail: ListNode<T>;
  map: Map<string, ListNode<T>> = new Map()
  getId: (item: T) => string

  constructor(getId: (item: T) => string) {
    this.head = new ListNode<T>(undefined);
    this.tail = new ListNode<T>(undefined);
    this.getId = getId

    this.head.next = this.tail;
    this.head.prev = undefined
    this.tail.prev = this.head;
    this.tail.next = undefined
  }

  // 去重函数
  unique(data: T[], callback: (item: T) => void) {
    for (const item of data) {
      if (!this.map.has(this.getId(item))) {
        callback(item)
      }
    }
  }

  // 插入
  insert(data: T, callback: (item: T) => boolean) {
    let current = this.head.next!
    const node = new ListNode<T>(data)
    while (current !== this.tail) {
      if (callback(current.data!)) {
        node.next = current
        node.prev = current.prev
        current.prev!.next = node
        current.prev = node
        this.map.set(this.getId(data), node)
        break
      }
      current = current.next!
    }
  }

  // 尾插
  push(...data: T[]) {
    this.unique(data, (item) => {
      const node = new ListNode<T>(item);
      const lastNode = this.tail.prev!
      this.tail.prev = node
      lastNode.next = node
      node.next = this.tail
      node.prev = lastNode
      this.map.set(this.getId(item), node)
    })
  }

  // 头插
  unshift(...data: T[]) {
    this.unique(data, (item) => {
      const node = new ListNode<T>(item);
      const firstNode = this.head.next!
      this.head.next = node
      firstNode.prev = node
      node.next = firstNode
      node.prev = this.head
      this.map.set(this.getId(item), node)
    })
  }

  delete(id: string) {
    const node = this.map.get(id)

    if (node) {
      node.prev!.next = node.next!
      node.next!.prev = node.prev!
      this.map.delete(id)
    }
  }

  get(id: string) {
    return this.map.get(id)?.data
  }

  getIndex(index: number) {
    if (index < 0 || index >= this.length()) {
      return null
    }
    let current: ListNode<T> = this.head
    for (let i = 0; i < index + 1; i++) {
      current = current.next!
    }
    return current.data
  }

  length() {
    return this.map.size
  }

  clear() {
    this.map.clear()
    this.head.next = this.tail
    this.tail.prev = this.head
  }

  isExist(id: string) {
    return this.map.has(id)
  }

  *[Symbol.iterator](): Iterator<T> {
    let current = this.head.next;
    while (current && current !== this.tail) {
      yield current.data!
      current = current.next
    }
  }
}

class ListNode<T> {
  data: T | undefined;
  next: ListNode<T> | undefined;
  prev: ListNode<T> | undefined;

  constructor(data: T | undefined) {
    this.data = data;
    this.next = undefined;
    this.prev = undefined;
  }
}

/**
 * 增强链表
 */
export class EnhancedList<T> extends EnhancedBase<T> {
  // 底层链表
  list: List<T>

  constructor(getId: (item: T) => string, pageSize: number) {
    super(pageSize)
    this.list = new List(getId)
  }

  async pagePush(cb: (currentPage: number, pageSize: number) => Promise<T[]>) {
    await this.exec(async () => {
      const items = await cb(this.currentPage, this.pageSize)
      this.list.push(...items)
      return items
    })
  }

  // 链表头插入元素
  unshift(el: T) {
    this.list.unshift(el)
  }
  
  // 插入
  insert(data: T, callback: (item: T) => boolean) {
    this.list.insert(data, callback)
  }

  delete(id: string) {
    this.list.delete(id)
  }

  clear() {
    this.list.clear()
    super.clear()
  }

  isExist(id: string) {
    return this.list.isExist(id)
  }

  get(id: string) {
    return this.list.get(id)
  }

  update(id: string, el: T) {
    const node = this.list.map.get(id)
    if (node) {
      node.data = el
    }
  }

  *[Symbol.iterator](): Iterator<T> {
    let current = this.list.head.next;
    while (current && current !== this.list.tail) {
      yield current.data!
      current = current.next
    }
  }
}


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
