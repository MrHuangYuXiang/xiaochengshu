<template>
  <BaseModal @close="emits('close')">
    <ScrollContainer ref="scrollContainerRef" :load-more-callback="getUserFollows">
      <div class="follows-modal">
        <div class="top">{{ type === "following" ? "关注" : "粉丝" }} {{ `(${allCount})` }}</div>
        <div v-for="user in users" :key="user.id">
          <UserCard
            :userId="user.id"
            :userName="user.name"
            :userAvatarUrl="user.avatar_url"
            :isFollow="user.is_follow"
            :isFollowed="user.is_followed"
            :updateFollowCallback="updateData"
          />
        </div>
      </div>
    </ScrollContainer>
  </BaseModal>
</template>

<script setup lang="ts">
  import UserCard from './UserCard.vue';
  import ScrollContainer from '../common/ScrollContainer.vue';
  import { onMounted, ref, useTemplateRef } from 'vue';
  import BaseModal from '../common/BaseModal.vue';
  import { axiosProxy } from '@/api/axios.ts';
  import type { paths } from '@/api/gen.ts';
  import { EnhancedList } from '@/lib/list.ts';

  const props = defineProps({
    /** 
     * 弹窗类型
     * following: 关注
     * follower: 粉丝
     */
    type: {
      type: String,
      default: "following",
    },
    userId: {
      type: String,
      default: "",
    }
  })

  const emits = defineEmits(["close"])

  const scrollContainerRef = useTemplateRef("scrollContainerRef")
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
        type: props.type,
        userId: props.userId,
      })
      allCount.value = res.count
      return res.users
    })
    scrollContainerRef.value!.setEnd(users.value.isEnd)
  }

  // UserCard组件更新用户信息
  const updateData = (res: paths["/follow/user"]["post"]["responses"]["200"]["content"]["application/json"]) => {
    users.value.update(res.user.id, res.user)
  }

  // 挂载后获取关注/粉丝信息
  onMounted(async () => {
    await getUserFollows()
  })
</script>

<style scoped lang="scss">
  .follows-modal {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 50px;
    gap: 10px;
    overflow-y: auto;
    overflow-x: hidden;
    .top {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 20px;
    }
  }
</style>
