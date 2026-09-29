<template>
    <UserCard
        :userId="props.userId"
        :userName="props.userName"
        :userAvatarUrl="props.userAvatarUrl"
        :avatarSize="props.avatarSize"
        :btnText="'关注'"
        color="default"
    >
    </UserCard>
</template>

<script lang="ts" setup>
    import UserCard from './user-card.vue';

    const props = defineProps<{
        userId: string,
        userName: string,
        userAvatarUrl: string,
        avatarSize: string,
        isFollow: number,
        isFollowed: number,
    }>()

    // const clickButton = async  () => {
    //     await axiosProxy.post<
    //         paths["/follow/user"]["post"]["requestBody"]["content"]["application/json"],
    //         paths["/follow/user"]["post"]["responses"]["200"]["content"]["application/json"]
    //     >(`/follow/user`, {
    //     userId: props.userId,
    //     isFollow: props.isFollow,
    // })
    //}
</script>

<style scoped lang="scss">
</style>
