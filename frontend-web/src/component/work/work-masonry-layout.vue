<template>
  <ScrollContainer
    v-if="worksType"
    :targetUserId="targetUserId"
    triggerType="bottom"
    :loadMoreCallback="getWorks"
    ref="scrollRef"
  >
    <div class="base-box">
      <slot name="header"></slot>
      <AppSegment
        :fields="props.fields"
        @changeField="changeWorksType"
      />
      <div class="masonry-box">
        <WorkCard
          v-for="work in works"
          :key="work.work.id"
          :workId="work.work.id"
          :workType="work.work.type"
          :workTitle="work.work.title"
          :workCoverUrl="work.cover_image.path"
          :userId="work.user.id"
          :userName="work.user.name"
          :userAvatarUrl="work.user.avatar_url"
          @deleteWork="deleteWork(work.work.id)"
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
  import { onMounted, ref, useTemplateRef } from 'vue';
  import type { paths } from '@/api/gen.ts';
  import { axiosProxy } from '@/api/axios.ts';
  import { ElMessage } from 'element-plus';

  const props = withDefaults(defineProps<{
    fields: {text: string, key: string}[]
    targetUserId?: string
  }>(), {
    targetUserId: ""
  })

  const works = ref(new EnhancedList<WorksSchema>((work) => work.work.id, 10))
  const targetUserId = ref(props.targetUserId)
  const worksType = ref("")
  const scrollRef = useTemplateRef("scrollRef")
  
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

  // 删除作品
  const deleteWork = async (workId: string) => {
      await axiosProxy.post<
          paths["/delete/work"]["post"]["requestBody"]["content"]["application/json"],
          paths["/delete/work"]["post"]["responses"]["200"]["content"]["application/json"]
      >("/delete/work", {
          workId: workId
      })
      works.value.delete(workId)
      ElMessage("删除成功")
  }

  // 切换作品类型
  const changeWorksType = (type: string) => {
    worksType.value = type
    works.value.clear()
    scrollRef.value?.reset()
  }

  onMounted(() => {
    if (props.fields[0]) {
      worksType.value = props.fields[0].key
    } else {
      throw new Error("props.fields为空")
    }
  })
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
