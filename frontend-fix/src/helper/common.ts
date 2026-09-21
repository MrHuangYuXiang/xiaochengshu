/*
 * 判断是否滚动到底部
 * 注意由于精度问题，scrollHeight需要减去1像素
 */
export const isScrollToBottom = (e: Event) => {
  const target = e.target as HTMLElement
  const { scrollTop, clientHeight, scrollHeight } = target
  return scrollTop + clientHeight >= scrollHeight - 1
}
