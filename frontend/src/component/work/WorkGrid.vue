<template>
  <div class="work-grid" ref="workGridRef">
    <div
      class="card"
      v-for="work in works"
      :key="work.work.id"
      :style="{'grid-row-end': `span ${cssVarMap[work.work.id]}`}"
    >
      <div class="real-card" ref="cardContainerRefs" :id="work.work.id">
        <ImageSlider
          :src="`${work.cover_image.path}`"
          class="image"
          :enableHover="true"
          @click="globalWorkModal.show(work.work.id)"
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
            </div>
          </div>
        </div>
      </div>
      <SelectFloating 
        :options="[{ id: 1, text: '举报该作品' }]" 
        direction="right" 
        :enableShow="isShowFloatingMap[work.work.id] || false" 
        @clickOption="handleClickFloating"
      />
    </div>
  </div>

  <!-- 举报作品弹窗 -->
  <WorkReportModal v-model:show="enableReportShow" v-if="enableReportShow" />
</template>

<script setup lang="ts">
  import UserAvatar from '../user/UserAvatar.vue';
  import ImageSlider from '../image/image-slider.vue';
  import AppIcon from '../common/AppIcon.vue';
  import SelectFloating from '../common/select-floating.vue';
  import WorkReportModal from './WorkReportModal.vue';
  import { EnhancedList } from '@/lib/list';
  import type { WorksSchema } from '@/api/type.ext';
  import { onMounted, ref, useTemplateRef } from 'vue';
  import type { paths } from '@/api/gen.ts';
  import { axiosProxy } from '@/api/axios.ts';
  import { globalWorkModal } from '../global.ts';

  // 是否展示举报作品弹窗
  const enableReportShow = ref(false)

  const works = ref(new EnhancedList<WorksSchema>((work) => work.work.id, 10))
  const targetUserId = ref("")
  const worksType = ref("self")
  // 是否显示作品更多浮动框(值为对应的作品id)
  const isShowFloatingMap = ref<Record<string, boolean>>({})

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
        isShowFloatingMap.value[work.work.id] = false
      }

      return data
    })
  }

  // 点击作品下方显示更多浮动框
  const showFloating = (workId: string) => {
    if (workId in isShowFloatingMap.value) {
      isShowFloatingMap.value[workId] = !isShowFloatingMap.value[workId]
    }
  }

  // 点击浮动框处理函数
  const handleClickFloating = (id: number) => {
    if (id === 1) {
      enableReportShow.value = true
    }
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

  onMounted(async () => {
    // 监听子节点数量改变,实时计算dom元素高度
    mutationObserver.observe(workGridRef.value!, {
      childList: true,
      subtree:false,
      attributes: false,
      characterData: false,
    })
  })

  // 以下为组件暴露方法

  /** 切换作品类型 */
  const changeWorksType = async (newType: string, userId: string) => {
    works.value.clear()
    isShowFloatingMap.value = {}
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
      position: relative;
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
