<template>
  <ScrollContainer
    :targetUserId="targetUserId"
    triggerType="bottom"
    :loadMoreCallback="getWorks"
    ref="scrollRef"
  >
    <div class="base-box">
      <slot name="header"></slot>
      <AppSegment
        :fields="props.fields"
        @changeField="changeParentType"
      />
      <AppSegment
        :fields="subSegmentFields"
        type="background"
        @changeField="changeType"
      />
      <div class="masonry-box">
        <WorkCard
          class="work-card"
          v-for="work in works"
          :key="work.work.id"
          :workId="work.work.id"
          :workType="work.work.type"
          :workTitle="work.work.title"
          :workCoverUrl="work.cover_image.path"
          :workPermission="work.work.permission"
          :userId="work.user.id"
          :userName="work.user.name"
          :userAvatarUrl="work.user.avatar_path"
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
  import { ref, useTemplateRef } from 'vue';
  import type { paths } from '@/api/gen.ts';
  import { axiosProxy } from '@/api/axios.ts';
  import { ElMessage } from 'element-plus';
  import { storage } from '@/storage.ts';

  const props = withDefaults(defineProps<{
    fields: {text: string, key: string}[]
    targetUserId?: string
  }>(), {
    targetUserId: ""
  })

  const works = ref(new EnhancedList<WorksSchema>((work) => work.work.id, 10))
  const targetUserId = ref(props.targetUserId)
  const worksType = ref<string>()
  const scrollRef = useTemplateRef("scrollRef")
  // 子分段器字段
  const subSegmentFields = ref<{text: string, key: string}[]>([])

  // 获取作品
  const getWorks = async () => {
    await works.value.pagePush(async (current: number, size: number) => {
      if (!worksType.value) return []

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
      >(
        "/delete/work",
        {
          workId: workId
        },
        {
          showLoading: 'circle'
        }
      )
      works.value.delete(workId)
      ElMessage("删除成功")
  }

  // 更换作品父类型
  const changeParentType = (type: string) => {
    subSegmentFields.value = []
    switch (type) {
      case "self":
        subSegmentFields.value  = [
          {text: '作品', key: 'self-public'},
        ]
        // 当前用户为自己时，显示私密作品
        if (targetUserId.value === storage.initData.value?.user.id) {
          subSegmentFields.value.push({text: '私密作品', key: 'self-private'})
        }
        break
      default:
        changeType(type)
        break
      }
  }

  // 更换作品查询类型
  const changeType = (type: string) => {
    worksType.value = type
    works.value.clear()
    scrollRef.value?.reset()
  }
</script>

<style scoped lang="scss">
  .base-box {
    display: grid;
    grid-template-columns: 100%;
    row-gap: 1rem;
    .masonry-box {
      display: grid;
      grid-template-columns: repeat(auto-fill, 13rem);
      grid-auto-rows: auto;
      align-items: start;
      align-content: start;
      gap: 0.5rem;
    }
    .work-card {
      width: 100%;
    }
  }
</style>
