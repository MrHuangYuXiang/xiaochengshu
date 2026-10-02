<template>
  <BaseModal
    width="auto"
    height="90vh"
    v-model:show="globalFollowModal.isShow.value"
  >
    <ScrollContainer
      ref="scrollContainerRef"
      :load-more-callback="getUserFollows"
      trigger-type="bottom"
      class="scroll"
    >
      <div class="follows-modal">
        <div class="top">{{ globalFollowModal.type.value === "following" ? "关注" : "粉丝" }} {{ `(${allCount})` }}</div>
        <div v-for="user in users" :key="user.id">
          <UserFollowCard
            v-if="globalFollowModal.type.value === 'following' || globalFollowModal.userId.value !== storage.initData.value?.user.id"
            :userId="user.id"
            :userName="user.name"
            :userAvatarUrl="user.avatar_url"
            avatarSize="2rem"
            :isFollow="user.is_follow"
            :isFollowed="user.is_followed"
            :followCallback="followUser"
          />
          <UserCard
            v-else
            :userId="user.id"
            :userName="user.name"
            :userAvatarUrl="user.avatar_url"
            btn-text="移除粉丝"
            @click-btn="removeFollower(user.id)"
          />
        </div>
      </div>
    </ScrollContainer>
  </BaseModal>
</template>

<script setup lang="ts">
  import UserFollowCard from './user-follow-card.vue';
  import UserCard from './user-card.vue';
  import ScrollContainer from '../common/scroll-container.vue';
  import { ref } from 'vue';
  import BaseModal from '../common/BaseModal.vue';
  import { axiosProxy } from '@/api/axios.ts';
  import type { paths } from '@/api/gen.ts';
  import { EnhancedList } from '@/lib/structure.ts';
  import { globalFollowModal } from '../global.ts';
import { ElMessage } from 'element-plus';
import { storage } from '@/storage.ts';

  const users = ref<EnhancedList<
    paths["/user/follows"]["get"]["responses"]["200"]["content"]["application/json"]["users"][number]
    >>(
    new EnhancedList(
      (data) => {
        return data.id
      },
      10,
    )
  )
  const allCount = ref(0)

  const getUserFollows = async () => {
    await users.value.pagePush(async (currentPage, pageSize) => {
      const res = await axiosProxy.get<
        paths["/user/follows"]["get"]["parameters"]["query"],
        paths["/user/follows"]["get"]["responses"]["200"]["content"]["application/json"]
      >(`/user/follows`, {
        page: currentPage,
        pageSize: pageSize,
        type: globalFollowModal.type.value,
        userId: globalFollowModal.userId.value,
      })
      allCount.value = res.count
      return res.users
    })
    return users.value.isEnd
  }

  // 关注用户
  const followUser = (userId: string) => {
    const user = users.value.get(userId)
    if (user) {
      user.is_follow = user.is_follow === 0 ? 1 : 0
      return user.is_follow
    }
    return 0
  }

  // 移除粉丝
  const removeFollower = async (userId: string) => {
    await axiosProxy.get<
      paths["/remove/follower"]["post"]["requestBody"]["content"]["application/json"],
      undefined
    >(`/user/follows`, {
      userId: userId,
    })
    users.value.delete(userId)
    ElMessage("移除成功")
  }
</script>

<style scoped lang="scss">
  .scroll {
    height: 100%;
    .follows-modal {
      display: grid;
      padding: 2rem;
      grid-template-columns: minmax(15vw, auto);
      grid-template-rows: auto;
      .top {
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 1rem;
      }
    }
  }
</style>
