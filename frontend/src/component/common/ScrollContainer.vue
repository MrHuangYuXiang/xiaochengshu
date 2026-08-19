<template>
  <div class="scroll-container" @scroll="scrollToBottom">
    <slot></slot>
    <div class="tip" v-if="isEnd">没有更多了^^</div>
    <div class="tip" v-if="isLoading">加载中...</div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const props = defineProps<{
    // 滚动到底部触发回调函数, 返回是否还有更多数据
    loadMoreCallback: () => Promise<boolean>
  }>()

  // 加载中标志位
  const isLoading = ref(false)
  // 无更多数据标志位
  const isEnd = ref(false)

  // 滚动底部加载更多
  const scrollToBottom = async (e: Event) => {
    if (isEnd.value || isLoading.value) return

    const target = e.target as HTMLElement
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 1) {
      isLoading.value = true
      isEnd.value = await props.loadMoreCallback()
      isLoading.value = false
    }
  }

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
    width: 100%;
    height: 100%;
    overflow: auto;
    .tip {
      font-size: 0.9rem;
      color: var(--root-gray);
      padding: 30px 0;
      width: 100%;
      text-align: center;
    }
  }
</style>
