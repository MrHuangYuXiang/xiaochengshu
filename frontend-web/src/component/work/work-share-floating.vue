<template>
    <FloatingWindow 
        class="share-floating"
        :class="{'show': isShow}"
        v-model:show="isShow"
    >
        <div class="title">分享给</div>
        <ScrollContainer 
            trigger-type="bottom"
            :load-more-callback="getSessions"
        >
        <div class="sessions">
            <UserCard
                v-for="session in sessions" 
                :key="session.session.id"
                :userId="session.user.id"
                :userName="session.user.name"
                :userAvatarUrl="session.user.avatar_url"
                avatarSize="2rem"
                btnText="分享"
                @clickBtn="shareWork(session.session.id)"
            >
            </UserCard>
        </div>
        </ScrollContainer>
    </FloatingWindow>
</template>

<script lang="ts" setup>
    import FloatingWindow from '../common/floating-window.vue';
    import ScrollContainer from '../common/scroll-container.vue';
    import UserCard from '../user/user-card.vue';
    import { EnhancedList } from '@/lib/structure.ts';
    import { ref } from 'vue';
    import type { SessionSchema } from '@/api/type.ext.ts';
    import { axiosProxy } from '@/api/axios.ts';
    import type { paths } from '@/api/gen.ts';
    import { ElMessage } from 'element-plus';

    const props = defineProps<{
        workId: string;
        workTitle: string;
        workCoverUrl: string;
        userId: string;
        userName: string;
        userAvatarUrl: string;
    }>()

    const sessions = ref<EnhancedList<SessionSchema>>(new EnhancedList(
        (item) => item.session.id,
        5,
    ))
    const isShow = defineModel<boolean>('show');

    // 获取当前用户会话
    const getSessions = async() => {
        await sessions.value.pagePush(async (currentPage, pageSize) => {
            return (await axiosProxy.get<
            paths["/chat/get/sessions"]["get"]["parameters"]["query"],
            paths["/chat/get/sessions"]["get"]["responses"]["200"]["content"]["application/json"]
            >("/chat/get/sessions", {
                page: currentPage,
                pageSize: pageSize,
            })).sessions.filter((item) => item.session.type === 1)
        })
        return sessions.value.isEnd
    }

    // 分享作品
    const shareWork = async (sessionId: string) => {
        await axiosProxy.post<
            paths["/share/work"]["post"]["requestBody"]["content"]["application/json"],
            paths["/share/work"]["post"]["responses"]["200"]["content"]["application/json"]
        >("/share/work", {
            sessionId: sessionId,
            workId: props.workId,
            workTitle: props.workTitle,
            workCoverImagePath: props.workCoverUrl,
            workUserId: props.userId,
            workUserName: props.userName,
            workUserAvatarPath: props.userAvatarUrl,
        })

        ElMessage('分享成功');
    }
</script>

<style scoped lang="scss">
    .share-floating {
        transition: all 0.3s ease-in-out;
        overflow: hidden;
        height: 0;
        opacity: 0;
        width: 100%;
        padding: 0.8rem;
        padding-bottom: 0;
        top: 0;
        left: 0;
        transform: translateY(-100%);
        display: grid;
        grid-template-rows: auto 1fr;
        grid-template-columns: 1fr;
        .title {
            font-weight: bold;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        .sessions {
            padding-top: 1rem;
            display: grid;
            grid-template-columns: 1fr;
            row-gap: 1rem;
            padding-bottom: 0.5rem;
        }
    }
    .show {
        height: 20rem;
        opacity: 1;
    }
</style>
