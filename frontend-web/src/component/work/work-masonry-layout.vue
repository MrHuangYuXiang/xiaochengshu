<template>
  <ScrollContainer
    triggerType="bottom"
    :loadMoreCallback="getWorks"
    ref="scrollRef"
  >
    <div class="base-box">
      <AppSegment
        :fields="worksTypeFields"
        @changeField="changeWorksType"
      />
      <div class="masonry-box">
        <WorkCard
          v-for="work in works"
          :key="work.work.id"
          :workId="work.work.id"
          :workTitle="work.work.title"
          :workCoverUrl="work.cover_image.path"
          :userId="work.user.id"
          :userName="work.user.name"
          :userAvatarUrl="work.user.avatar_url"
        />
      </div>
    </div>
  </ScrollContainer>
</template>

<script setup lang="ts">
  import WorkCard from './work-card.vue';
  import ScrollContainer from '../common/scroll-container.vue';
  import AppSegment from '../common/app-segment.vue';
  import { EnhancedList } from '@/lib/structure.ts';
  import type { WorksSchema } from '@/api/type.ext';
  import { ref, useTemplateRef } from 'vue';
  import type { paths } from '@/api/gen.ts';
  import { axiosProxy } from '@/api/axios.ts';

  const works = ref(new EnhancedList<WorksSchema>((work) => work.work.id, 10))
  const targetUserId = ref("")
  const worksType = ref("recommend")
  const scrollRef = useTemplateRef("scrollRef")
  const worksTypeFields = ref([
    {text: '推荐', key: 'recommend'},
    {text: '关注', key: 'following'},
  ])
  
  // 获取作品
  const getWorks = async () => {
    await works.value.pagePush(async (current: number, size: number) => {
      const data = (await axiosProxy.post<
        paths["/get/works"]["post"]["requestBody"]["content"]["application/json"],
        paths["/get/works"]["post"]["responses"]["200"]["content"]["application/json"]
      >(`/get/works`,{
        page: current,
        pageSize: size,
        type: worksType.value,
        targetUserId: targetUserId.value,
      })).workList
      return data
    })
    return works.value.isEnd
  }

  // 切换作品类型
  const changeWorksType = (type: string) => {
    worksType.value = type
    works.value.clear()
    scrollRef.value?.reset()
  }
</script>

<style scoped lang="scss">
  .base-box {
    display: grid;
    grid-template-columns: 100%;
    .masonry-box {
      display: grid;
      grid-template-columns: repeat(auto-fill, 270px);
      gap: 0.5rem;
    }
  }
</style>
