<template>
    <div
        v-if="props.sessionType === 1 || props.sessionType === 2"
        class="normal-message"
        :class="{
            'normal-message-self': props.userId === storage.initData.value?.user.id,
            'normal-message-other': props.userId !== storage.initData.value?.user.id,
        }"
        @click="clickMessage"
    >
        <UserAvatar :user-id="props.userId" width="3rem" :img-url="props.userAvatarUrl" />
        
        <!-- 文本消息 -->
        <div
            v-if="props.messageType === 1"
            class="msg-content"
            :class="{
                'text-content-self': props.userId === storage.initData.value?.user.id,
                'text-content-other': props.userId !== storage.initData.value?.user.id,
            }"
        >
            {{ props.messageContent }}
        </div>
        
        <!-- 作品分享 -->
        <WorkCard
            v-if="props.messageType === 3"
            :work-id="props.messagePayload?.[3]?.work_id || ''"
            :work-title="props.messagePayload?.[3]?.work_title || ''"
            :work-cover-url="props.messagePayload?.[3]?.work_cover_url || ''"
            :user-id="props.messagePayload?.[3]?.user_id || ''"
            :user-name="props.messagePayload?.[3]?.user_name || ''"
            :user-avatar-url="props.messagePayload?.[3]?.user_avatar_url || ''"
        />
    </div>

    <div 
        v-if="props.sessionType === 3" 
        class="system-message"
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
</template>

<script lang="ts" setup>
    import { storage } from '@/storage';
    import UserAvatar from '../user/UserAvatar.vue';
    import AppIcon from '../common/AppIcon.vue';
    import WorkCard from '../work/work-card.vue';

    const props = defineProps<{
        userId: string;
        userAvatarUrl: string;
        messageContent: string;
        messageType: number;
        messagePayload?: {
            1?: Record<string, never> | undefined;
            2?: {
                report_id: string;
            };
            3?: {
                work_id: string;
                work_title: string;
                work_cover_url: string;
                user_id: string;
                user_name: string;
                user_avatar_url: string;
            };
        };
        sessionType?: number;
    }>()
    const emits = defineEmits<{
        (e: 'clickMessage'): void;
    } >()

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
    // 点击消息
    const clickMessage = () => {
        emits('clickMessage')
    }
</script>

<style scoped>
    .normal-message {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        .msg-content {
            font-size: 0.9rem;
            font-weight: 500;
            padding: 0.7rem 1.1rem;
            border-radius: 15px;
        }
    }

    /* 私聊会话类型css属性 */
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
        cursor: pointer;
        transition: transform 0.3s ease-in-out;
        display: flex;
        flex-direction: column;
        padding: 1.2rem;
        background-color: var(--root-bg-gray);
        width: 75%;
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
        transform: scale(1.03);
    }
</style>
