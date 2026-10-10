<template>
    <div class="card" ref="cardContainerRefs" :id="props.workId">
        <ImageSlider
            :src="`${props.workCoverUrl}`"
            :canHover="true"
            @click="globalWorkModal.show(props.workId)"
            class="image"
        >
            <AppIcon
                v-if="props.workType === 2"
                class="play-icon"
                type="play"
                fill="white"
            />
        </ImageSlider>
        <div class="info" ref="textRefs">
            <div class="title">{{ props.workTitle }}</div>
            <div class="bottom">
                <UserAvatar width="1.2rem" :userId="props.userId" :imgUrl="props.userAvatarUrl" />
                <div>{{ props.userName }}</div>
                <AppIcon
                    class="more-icon"
                    type="more"
                    :canAnimate="true"
                    size="1rem"
                    @click="isShowFloating = true"
                />
            </div>
        </div>
        <SelectFloating
            class="floating"
            :options="getFloatingOptions"
            @clickOption="clickFloatingHandler"
            v-model:show="isShowFloating"
        />
    </div>
</template>

<script setup lang="ts">
    import UserAvatar from '../user/UserAvatar.vue';
    import ImageSlider from '../file/image-slider.vue';
    import AppIcon from '../common/AppIcon.vue';
    import SelectFloating from '../common/select-floating.vue';
    import { storage } from '@/storage.ts';
    import { globalWorkModal, globalWorkReportModal } from '../global.ts';
    import { computed, ref } from 'vue';

    const props = defineProps<{
        workId: string
        workTitle: string
        workType: number
        workCoverUrl: string
        userId: string
        userName: string
        userAvatarUrl: string
    }>()

    const emits = defineEmits<{
        (e: 'deleteWork'): void;
    }>()

    const isShowFloating = ref(false)

    // 获取浮动框选项数组
    const getFloatingOptions = computed(() => {
        const options = [{ id: 3, text: '举报' }]
        if (props.userId === storage.initData.value?.user.id) {
            options.push({ id: 2, text: '删除' })
        }
        options.push({ id: 1, text: '关闭' })
        return options
    })

    // 点击浮动框处理函数
    const clickFloatingHandler = async (id: number) => {
        
        switch (id) {
            // 举报作品
            case 3:
                globalWorkReportModal.show(props.workId)
                break;
            
            // 删除作品
            case 2:
                emits('deleteWork')
                break;

            // 关闭浮动框
            case 1:
                isShowFloating.value = false
                break;
        }
    }
</script>

<style scoped lang="scss">
    .card {
        position: relative;
        display: grid;
        grid-template-columns: 100%;
        background-color: var(--root-bg-gray);
        border-radius: 15px;
        row-gap: 0.25rem;
        .image {
            .play-icon {
                position: absolute;
                top: 0;
                right: 0;
                transform: translate(-50%, 50%);
                backdrop-filter: blur(5px);
                border-radius: 50%;
                background-color: rgba(white, 0.3);
            }
        }
        .info {
          padding: 0.5rem;
          display: grid;
          grid-template-columns: 100%;
          .title {
            font-size: 0.9rem;
          }
          .bottom {
            margin-top: 5px;
            display: grid;
            grid-template-columns: auto auto 1fr auto;
            align-items: center;
            font-size: 0.8rem;
            column-gap: 0.5rem;
            .more-icon {
                grid-column: 4;
            }
          }
        }
        .floating {
            width: 100%;
            height: 100%;
            top: 0;
            right: 0;
        }
    }
</style>
