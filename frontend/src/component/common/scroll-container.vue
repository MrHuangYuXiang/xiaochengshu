<template>
  <div class="scroll-container" @scroll="scrollToBottom">
    <slot></slot>
    <div class="tip" v-if="isEnd">没有更多了^^</div>
    <div class="tip" v-if="isLoading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';

  const props = defineProps<{
    // 触发类型 bottom: 底部触发 reverse-top: 逆顶部触发
    triggerType: 'bottom' | 'reverse-top',

    // 触发回调函数, 返回值为是否还有更多数据布尔值
    loadMoreCallback: () => Promise<boolean>
  }>()

  // 加载中标志位
  const isLoading = ref(false)
  // 无更多数据标志位
  const isEnd = ref(false)

  // 滚动底部加载更多
  const scrollToBottom = async (e: Event) => {
    const target = e.target as HTMLElement
    let diff = 0

    // 加载中或无更多数据时, 不触发
    if (isEnd.value || isLoading.value) return
    switch (props.triggerType) {
      case 'bottom':
        diff = (target.scrollHeight - target.clientHeight) - target.scrollTop
        if (diff <= 1 || diff >= -1) {
          scrollMain()
        }
        break

      // 该情况匹配flex-direction: column-reverse时滚动顶部触发,该情况scrollTop为负数
      case 'reverse-top':
        diff = -target.scrollTop
        if (diff <= 1 || diff >= -1) {
          scrollMain()
        }
        break
    }
  }

  // 加载主逻辑
  const scrollMain = async () => {
    isLoading.value = true
    isEnd.value = await props.loadMoreCallback()
    isLoading.value = false
  }

  // 挂载时自动执行一次回调
  onMounted(async () => {
    await scrollMain()
  })

  /**
   * 以下为组件暴露方法
   */

  // 设置无更多数据标志位
  const setEnd = (flag: boolean = true) => {
    isEnd.value = flag
  }

  // 重置状态
  const reset = () => {
    isEnd.value = false
    isLoading.value = false
  }

  defineExpose({
    setEnd,
    reset
  })
 </script>

<style scoped lang="scss">
  .scroll-container {
    overflow: auto;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    .tip {
      font-size: 0.9rem;
      color: var(--root-gray);
      padding: 1rem 0;
      justify-self: center;
    }
  }
</style>
