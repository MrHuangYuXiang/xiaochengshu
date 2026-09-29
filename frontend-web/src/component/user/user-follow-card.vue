<template>
    <UserCard
        :userId="props.userId"
        :userName="props.userName"
        :userAvatarUrl="props.userAvatarUrl"
        :avatarSize="props.avatarSize"
        :btnText="getBtnText()"
        :btnColor="getBtnColor()"
        :isShowBtn="storage.initData.value?.user.id !== props.userId"
        @clickBtn="clickFollow"
    >
    </UserCard>
</template>

<script lang="ts" setup>
    import type { paths } from '@/api/gen.ts';
    import UserCard from './user-card.vue';
    import { axiosProxy } from '@/api/axios.ts';
    import { ElMessage } from 'element-plus';
    import { storage } from '@/storage.ts';

    const props = defineProps<{
        userId: string,
        userName: string,
        userAvatarUrl: string,
        avatarSize: string,
        isFollow: number,
        isFollowed: number,
        // 父组件需要传入回调函数去修改关注状态并返回新值
        followCallback: (userId: string) => number,
    }>()

    const clickFollow = async  () => {
        const isFollow = props.followCallback(props.userId);

        await axiosProxy.post<
            paths["/follow/user"]["post"]["requestBody"]["content"]["application/json"],
            paths["/follow/user"]["post"]["responses"]["200"]["content"]["application/json"]
        >(`/follow/user`, {
            userId: props.userId,
            isFollow: isFollow,
        })

        ElMessage(isFollow === 1 ? "关注成功" : "取消关注成功");
    }

    // 获取按钮文本
    const getBtnText = () => {
        if (props.isFollow === 0 && props.isFollowed === 0) {
            return "关注";
        } else if (props.isFollow === 0 && props.isFollowed === 1) {
            return "回关";
        } else if (props.isFollow === 1 && props.isFollowed === 0) {
            return "已关注"
        } else {
            return "互相关注";
        }
    }

    // 获取按钮颜色
    const getBtnColor = () => {
        return props.isFollow === 0 ? "orange" : "default"
    }
</script>

<style scoped lang="scss">
</style>
