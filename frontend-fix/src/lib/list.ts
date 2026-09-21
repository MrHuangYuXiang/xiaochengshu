import { EnhancedBase } from "./base";

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
  async unshift(el: T) {
    this.list.unshift(el)
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
