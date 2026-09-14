<template>
  <div class="work-grid" ref="workGridRef">
    <div
    class="card"
    v-for="work in works"
    :key="work.work.id"
    :style="{'grid-row-end': `span ${cssVarMap[work.work.id]}`}"
    >
      <div class="real-card" ref="cardContainerRefs" :id="work.work.id">
        <ImageContainer
          :src="`${work.cover_image.image_url}`"
          class="image"
          :enableHover="true"
          @click="currentWorkId = work.work.id; showWorkModal = true"
        />
        <div class="text" ref="textRefs">
          <div class="title">{{ work.work.title }}</div>
          <div class="bottom">
            <div class="user">
              <UserAvatar :width="'25px'" :userId="work.user.id" :imgUrl="work.user.avatar_url" />
              <div>{{ work.user.name }}</div>
            </div>
            <div class="more">
              <AppIcon 
                :style="{cursor: 'pointer'}"
                type="more" 
                size="1rem" 
                @click="showFloating(work.work.id)"
              />
              <SelectPanel :options="['举报该作品']" direction="right" :enableShow="enablePanelShowMap[work.work.id] || false" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 作品弹窗 -->
  <WorkModal v-if="showWorkModal" :workId="currentWorkId" @close="showWorkModal = false" />
</template>

<script setup lang="ts">
  import UserAvatar from '../user/UserAvatar.vue';
  import WorkModal from '../work/WorkModal.vue';
  import ImageContainer from '../common/ImageContainer.vue';
  import AppIcon from '../common/AppIcon.vue';
  import SelectPanel from '../common/SelectPanel.vue';
  import { EnhancedList } from '@/lib/list';
  import type { WorksSchema } from '@/api/type.ext';
  import { onMounted, ref, useTemplateRef } from 'vue';
  import type { paths } from '@/api/gen.ts';
  import { axiosProxy } from '@/api/axios.ts';

  const works = ref(new EnhancedList<WorksSchema>((work) => work.work.id, 10))
  const reportTypes = ref<paths["/report/types"]["get"]["responses"]["200"]["content"]["application/json"]>({
    types: []
  })
  const targetUserId = ref("")
  const worksType = ref("self")
  const showWorkModal = ref(false)
  // 是否显示作品更多浮动框(值为对应的作品id)
  const enablePanelShowMap = ref<Record<string, boolean>>({})
  const currentWorkId = ref("")

  onMounted(async () => {
    // 监听子节点数量改变,实时计算dom元素高度
    mutationObserver.observe(workGridRef.value!, {
      childList: true,
      subtree:false,
      attributes: false,
      characterData: false,
    })
  })

  // 获取作品
  const getWorks = async () => {
    return await works.value.pagePush(async (current: number, size: number) => {
      const data = (await axiosProxy.get<
        paths["/works"]["get"]["parameters"]["query"],
        paths["/works"]["get"]["responses"]["200"]["content"]["application/json"]
      >(`/works`,{
        page: current,
        pageSize: size,
        type: worksType.value,
        targetUserId: targetUserId.value,
      })).workList
      for (const work of data) {
        enablePanelShowMap.value[work.work.id] = false
      }

      return data
    })
  }

  // 获取举报类型
  const getReportTypes = async () => {
    reportTypes.value = await axiosProxy.get<
      undefined,  
      paths["/report/types"]["get"]["responses"]["200"]["content"]["application/json"]
    >("/report/types", undefined)
  }

  // 点击作品下方显示更多
  const showFloating = (workId: string) => {
    if (workId in enablePanelShowMap.value) {
      enablePanelShowMap.value[workId] = !enablePanelShowMap.value[workId]
    }
  }

  // 举报作品
  const reportWork = (workId: string, reason: string, type: number) => {

  }

  /**
   * 以下为实现瀑布流相关js逻辑
   */
  const cardContainerRefs = useTemplateRef("cardContainerRefs")
  const workGridRef = useTemplateRef("workGridRef")
  const cssVarMap = ref<Record<string, number>>({})
  const gridGap = 10
  const gridAutoRows = 10
  const calculateRowSpan = () => {
    for (let index = 0; index < cardContainerRefs.value!.length; index++) {
      const item = cardContainerRefs.value![index]!
      const height = item.getBoundingClientRect().height;
      const rowSpan = Math.ceil((height + gridGap) / (gridAutoRows + gridGap));
      cssVarMap.value[item.id] = rowSpan
    }
  }

  /**
   * MutationObserver监听子节点数量变化,实时添加
   * ResizeObserver监听dom元素高度变化
   */
  const resizeObserver = new ResizeObserver(() => {
    calculateRowSpan()
  })
  const mutationObserver = new MutationObserver(() => {
    resizeObserver.disconnect()
    for (const item of cardContainerRefs.value!) {
      resizeObserver.observe(item)
    }
  })

  // 挂载钩子
  onMounted(async () => {
    await getReportTypes()
  })

  // 以下为组件暴露方法

  /** 切换作品类型 */
  const changeWorksType = async (newType: string, userId: string) => {
    works.value.clear()
    enablePanelShowMap.value = {}
    worksType.value = newType
    targetUserId.value = userId
    await getWorks()
    return works.value.isEnd
  }

  /** 获取更多作品 */
  const getMore = async () => {
    await getWorks()
    return works.value.isEnd
  }

  defineExpose({
    changeWorksType,
    getMore
  })
</script>

<style scoped lang="scss">
  .work-grid {
    width: 100%;
    display: grid;
    justify-content: center;
    grid-template-columns: repeat(auto-fill, 230px);
    grid-auto-flow: dense;
    grid-auto-rows: 10px;
    gap: 10px;
    .card {
      border-radius: 15px;
      border: 1.5px solid var(--root-bg-gray);
      .real-card {
        display: flex;
        flex-direction: column;
        .image {
          width: 100%;
          max-height: 280px;
          min-height: 160px;
          background-size: cover;
        }
        .text {
          padding: 10px 15px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
          .title {
            font-size: 0.9rem;
          }
          .bottom {
            margin-top: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            .user {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .more {
              position: relative;
            }
          }
        }
      }
    }
  }

  .menu {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-width: 80px;
    font-size: 12px;
    color: var(--root-gray);
    .menu-item {
      width: 100%;
      text-align: center;
      padding: 10px 10px;
      transition: all 0.3s ease-in-out;
    }
    .menu-item:hover {
      cursor: pointer;
      background-color: var(--root-bg-gray);
    }
  }
</style>
