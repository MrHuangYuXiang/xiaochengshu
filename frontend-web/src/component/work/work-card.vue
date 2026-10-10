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
                    class="more"
                    type="more"
                    size="1rem"
                    @click="isShowFloating = true"
                />
            </div>
        </div>
        <SelectFloating
            :options="[{ id: 1, text: '举报该作品' }]"
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
    import { globalWorkModal, globalWorkReportModal } from '../global.ts';
    import { ref } from 'vue';

    const props = defineProps<{
        workId: string
        workTitle: string
        workType: number
        workCoverUrl: string
        userId: string
        userName: string
        userAvatarUrl: string
    }>()

    const isShowFloating = ref(false)

    // 点击浮动框处理函数
    const clickFloatingHandler = (id: number) => {
        if (id === 1) {
            globalWorkReportModal.show(props.workId)
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
            .more {
                cursor: pointer;
                grid-column: 4;
            }
          }
        }
      }
</style>
