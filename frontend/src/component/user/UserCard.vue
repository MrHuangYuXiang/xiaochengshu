<template>
  <div class="user-card">
    <div class="left">
      <div class="avatar"><UserAvatar :userId="props.userId" :imgUrl="props.userAvatarUrl" /></div>
      <div class="info">
        <div class="name">{{ props.userName }}</div>
      </div>
    </div>
    <div class="right">
      <AppButton
      v-if="props.userId !== storage.initData.value?.user.id"
      :text="formatFollowStatus(props.isFollow, props.isFollowed)"
      :color="props.isFollow === 0 ? 'orange' : 'default'"
      @click="clickButton" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import UserAvatar from './UserAvatar.vue';
  import AppButton from '../form/form-button.vue';
  import { axiosProxy } from '@/api/axios.ts';
  import type { paths } from '@/api/gen.ts';
  import { formatFollowStatus } from '@/helper/format.ts';
  import { storage } from '@/storage.ts';

  const props = defineProps<{
    userId: string,
    userName: string,
    userAvatarUrl: string,
    isFollow: number,
    isFollowed: number,
    updateFollowCallback: (res: paths["/follow/user"]["post"]["responses"]["200"]["content"]["application/json"]) => void,
  }>()

  const clickButton = async  () => {
    const res = await axiosProxy.post<
      paths["/follow/user"]["post"]["requestBody"]["content"]["application/json"],
      paths["/follow/user"]["post"]["responses"]["200"]["content"]["application/json"]
    >(`/follow/user`, {
      userId: props.userId,
      isFollow: props.isFollow,
    })
    props.updateFollowCallback(res)
  }
</script>

<style scoped lang="scss">
  .user-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    .left {
      flex: 3;
      display: flex;
      align-items: center;
      gap: 20px;
      .avatar {
        width: 50px;
        padding: 0;
      }
      .info {
        display: flex;
        flex-direction: column;
        gap: 3px;
        .name {
          font-size: 1rem;
        }
        .desc {
          font-size: 0.75rem;
          opacity: 0.6;
        }
      }
    }
    .right {
      flex: 1;
    }
  }
</style>
