import { expect, test } from 'vitest'
import { Forest } from "./tree";

test('test tree', () => {
  const tree = new Forest<{
    id: number,
    parentId: number,
  }>(
    10,
    (item: { id: number; parentId: number; }) => item.id.toString(),
    (item: { id: number; parentId: number; }) => item.parentId.toString(),
  )

  tree.pageAddChildren(async () => [
    { id: 1, parentId: 0 },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 1 },
    { id: 4, parentId: 0 },
    { id: 5, parentId: 4 },
    { id: 6, parentId: 4 },
  ])
})
