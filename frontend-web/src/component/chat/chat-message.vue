<template>
    <div
        v-if="props.sessionType === 1 || props.sessionType === 2"
        :class="[
            'normal-message',
            'message',
            {
                'normal-message-self': props.userId === storage.initData.value?.user.id,
                'normal-message-other': props.userId !== storage.initData.value?.user.id
            },
            attrs.class
        ]"
        @click="clickMessage"
    >
        <UserAvatar :user-id="props.userId" width="3rem" :img-url="props.userAvatarUrl" />
        
        <!-- 文本消息 -->
        <div
            v-if="props.messageType === 1"
            class="text-content"
            :class="{
                'text-content-self': props.userId === storage.initData.value?.user.id,
                'text-content-other': props.userId !== storage.initData.value?.user.id,
            }"
        >
            {{ props.messageContent }}
        </div>
        
        <!-- 作品分享 -->
        <WorkCard
            class="work-share-content"
            v-if="props.messageType === 3 && props.messagePayload[3]"
            :work-id="props.messagePayload[3].work_id"
            :work-title="props.messagePayload[3].work_title"
            :work-cover-url="props.messagePayload[3].work_cover_image_path"
            :user-id="props.messagePayload[3].work_user_id"
            :user-name="props.messagePayload[3].work_user_name"
            :user-avatar-url="props.messagePayload[3].work_user_avatar_path"
        />
    </div>

    <!-- 系统会话 -->
    <div 
        v-if="props.sessionType === 3" 
        :class="['system-message', 'message', attrs.class]"
        @click="clickMessage"
    >
        <div class="system-title">{{ getSystemTitle(props.messageType) }}</div>
        <div class="system-content">{{ props.messageContent }}</div>
        <div style="height: 1px;background-color: rgba(0, 0, 0, 0.1);"></div>
        <div class="system-detail">
            <div>查看详情</div>
            <AppIcon type="chevron-right"></AppIcon>
        </div>
    </div>

    <!-- 互动会话 -->
    <div
        v-if="props.sessionType === 4 && interactionPayload"
        :class="['interaction-message', 'message', attrs.class]"
        @click="clickMessage"
    >
        <UserAvatar 
            :user-id="interactionPayload.user_id" 
            width="3rem" 
            :img-url="interactionPayload.user_avatar_path" 
        />
        <div class="interaction-content">
            <div>{{ interactionPayload.user_name }}</div>
            <div>{{ getInteractionContent() }}</div>
            <div>{{ formatTime(props.messageCreatedAt) }}</div>
        </div>
        <imageSlider
            class="interaction-work"
            :src="interactionPayload.work_cover_image_path"
            :height="'4rem'"
        />
    </div>
</template>

<script lang="ts" setup>
    import { storage } from '@/storage';
    import UserAvatar from '../user/UserAvatar.vue';
    import AppIcon from '../common/AppIcon.vue';
    import WorkCard from '../work/work-card.vue';
    import imageSlider from '../image/image-slider.vue';
    import type { paths } from '@/api/gen.ts';
    import { useAttrs } from 'vue';
    import { formatTime } from '@/helper/format.ts';
import { computed } from 'vue';

    const props = defineProps<{
        userId: string;
        userAvatarUrl: string;
        messageContent: string;
        messageType: number;
        messagePayload: paths["/get/chat/messages"]["post"]["responses"]["200"]["content"]["application/json"]["messages"][number]["message"]["payload"];
        messageCreatedAt: string;
        sessionType?: number;
    }>()
    const emits = defineEmits<{
        (e: 'clickMessage'): void;
    } >()
    const attrs = useAttrs()

    // 互动消息payload
    const interactionPayload = computed(() => props.messagePayload[props.messageType as 4 | 5 | 6])

    // 获取系统消息标题
    const getSystemTitle = (type: number) => {
        switch (type) {
            case 1:
                return '系统通知';
            case 2:
                return '举报通知';
            default:
                return '系统通知';
        }
    }

    // 获取互动消息内容
    const getInteractionContent = () => {
        switch (props.messageType) {
            case 4:
                return '点赞了你的作品';
            case 5:
                return '收藏了你的作品';
            case 6:
                return '转发了你的作品';
            default:
                return '';
        }
    }

    // 点击消息
    const clickMessage = () => {
        emits('clickMessage')
    }
</script>

<style scoped>
    .message {
        cursor: pointer;
    }

    .normal-message {
        display: flex;
        align-items: start;
        gap: 0.6rem;
        .text-content {
            white-space: nowrap;
            font-size: 0.9rem;
            font-weight: 500;
            padding: 0.7rem 1.1rem;
            border-radius: 15px;
        }
        .work-share-content {
            width: 10rem;
        }
    }

    /* 普通会话类型css属性 */
    .normal-message-self {
        align-self: end;
        flex-direction: row-reverse;
    }
    .normal-message-other {
        align-self: start;
        flex-direction: row;
    }
    .text-content-self {
        color: white;
        background-color: #0084ff;
    }
    .text-content-other {
        color: black;
        background-color: var(--root-bg-gray);
    }

    /* 系统会话类型css属性 */
    .system-message {
        transition: transform 0.3s ease-in-out;
        display: grid;
        grid-template-columns: 100%;
        padding: 1.2rem;
        border-radius: 15px;
        gap: 0.8rem;
        .system-title {
            font-size: 1.05rem;
            font-weight: bold;
        }
        .system-content {
            font-size: 1rem;
        }
        .system-detail {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.8rem;
            color: var(--root-gray);
        }
    }
    .system-message:hover {
        background-color: var(--root-bg-gray);
    }

    /* 互动会话类型css属性 */
    .interaction-message {
        display: grid;
        grid-template-columns: auto auto 1fr auto;
        column-gap: 1rem;
        padding: 2rem;
        border-radius: 15px;
        border-bottom: 1px solid rgba(0,0,0,0.1);
               .interaction-content {
            display: grid;
            grid-template-columns: auto;
        }
        .interaction-work {
            height: 4rem;
            grid-column: 4;
            align-self: start;
        }
    }

    .interaction-message:hover {
        background-color: var(--root-bg-gray);
    }
</style>
