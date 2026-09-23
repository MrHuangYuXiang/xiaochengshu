<template>
  <ScrollContainer
    trigger-type="bottom"
    :loadMoreCallback="loadMore"
    ref="scrollContainerRef"
  >
    <div class="discover-page">
      <AppSegment
        :fields="[{text: '推荐', key: 'recommend'}, {text: '关注', key: 'following'}]"
        @changeField="changeWorksType"
      >
        <WorkGrid ref="workGridRef" />
      </AppSegment>
    </div>
  </ScrollContainer>
</template>

<script setup lang="ts">
  import WorkGrid from '@/component/work/WorkGrid.vue';
  import AppSegment from '@/component/common/AppSegment.vue';
  import ScrollContainer from '@/component/common/ScrollContainer.vue';
  import { onMounted, useTemplateRef } from 'vue';

  const scrollContainerRef = useTemplateRef("scrollContainerRef")
  const workGridRef = useTemplateRef("workGridRef")
  onMounted(async () => {
    await changeWorksType("recommend")
  })

  // TODO: 注意这里的两个函数和user里面完全相同,需要把分段器部分合并到workGrid里面
  // 作品类别分段器切换
  const changeWorksType = async (key: string) => {
    const isEnd = await workGridRef.value!.changeWorksType(key, "")
    scrollContainerRef.value!.reset()
    if (isEnd) scrollContainerRef.value!.setEnd()
  }

  // 加载更多回调
  const loadMore = async () => {
    return await workGridRef.value!.getMore()
  }
</script>

<style scoped lang="scss">
  .discover-page {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
    overflow-x: hidden;
  }
</style>
