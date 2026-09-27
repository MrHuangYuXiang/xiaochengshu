<template>
  <ScrollContainer
    triggerType="bottom"
    :loadMoreCallback="getWorks"
  >
    <div class="work-grid">
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
  </ScrollContainer>
</template>

<script setup lang="ts">
  import WorkCard from './work-card.vue';
  import ScrollContainer from '../common/scroll-container.vue';
  import { EnhancedList } from '@/lib/list';
  import type { WorksSchema } from '@/api/type.ext';
  import { ref } from 'vue';
  import type { paths } from '@/api/gen.ts';
  import { axiosProxy } from '@/api/axios.ts';

  const works = ref(new EnhancedList<WorksSchema>((work) => work.work.id, 10))
  const targetUserId = ref("")
  const worksType = ref("self")
  // 获取作品
  const getWorks = async () => {
    await works.value.pagePush(async (current: number, size: number) => {
      const data = (await axiosProxy.get<
        paths["/works"]["get"]["parameters"]["query"],
        paths["/works"]["get"]["responses"]["200"]["content"]["application/json"]
      >(`/works`,{
        page: current,
        pageSize: size,
        type: worksType.value,
        targetUserId: targetUserId.value,
      })).workList
      return data
    })
    return works.value.isEnd
  }
</script>

<style scoped lang="scss">
  .work-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 15rem));    
  }
</style>
