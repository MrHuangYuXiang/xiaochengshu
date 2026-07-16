<template>
  <BaseModal ref="baseModalRef">
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
  import { ref, useTemplateRef } from 'vue';
  import BaseModal from '../modal/BaseModal.vue';
  import { axiosProxy } from '@/api/axios.ts';
  import type { paths } from '@/api/gen.ts';
  import { EnhancedList } from '@/lib/list.ts';

  const baseModalRef = useTemplateRef("baseModalRef")
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
  const type = ref("following")
  const userId = ref("")
  const allCount = ref(0)

  const getUserFollows = async () => {
    await users.value.pagePush(async (currentPage, pageSize) => {
      const res = await axiosProxy.get<
        paths["/user/follows"]["get"]["parameters"]["query"],
        paths["/user/follows"]["get"]["responses"]["200"]["content"]["application/json"]
      >(`/user/follows`, {
        page: currentPage,
        pageSize: pageSize,
        type: type.value,
        userId: userId.value,
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

  /** 以下为组件暴露方法 */
  const show = async (typeString: "following" | "follower", userIdString: string) => {
    type.value = typeString
    userId.value = userIdString
    users.value.clear()
    await getUserFollows()
    baseModalRef.value!.show()
  }

  defineExpose({
    show,
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
