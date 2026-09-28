<template>
  <!-- 关注/粉丝列表弹窗 -->
  <FollowModal
    v-if="enableFollowsModalShow"
    width="30vw"
    :type="followsModalType"
    :userId="user?.user.id"
    @close="enableFollowsModalShow = false"
  />

  <div class="page-box">
    <div class="top">
      <div class="avatar"><UserAvatar width="10rem" :userId="user?.user.id" :imgUrl="user?.user.avatar_url"/></div>
      <div class="info">
        <div class="name">
          <div class="text">{{ user?.user.name }}</div>
          <div class="btn-group" v-if="user?.user.id !== storage.initData.value?.user.id">
            <FormButton color="orange" :text="formatFollowStatus(user?.user.is_follow || 0, user?.user.is_followed || 0)" @click="follow"/>
            <FormButton color="default" text="私信" @click="redirectToChatPage" />
          </div>
        </div>
        <div class="tag">
          <div>{{ user?.user.gender === 1 ? "男" : "女" }}</div>
          <div>{{ formatBirthday(user?.user.birthday || "") }}</div>
        </div>
        <div style="opacity: 0.5;font-size: 0.95rem;">{{ user?.user.desc }}</div>
        <div class="follow">
          <div @click="showFollowsModal('following', user!.user.id)">关注 {{ user?.followingCount }}</div>
          <div @click="showFollowsModal('follower', user!.user.id)">粉丝 {{ user?.followerCount }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRoute } from 'vue-router';
  import UserAvatar from '@/component/user/UserAvatar.vue'
  import FormButton from '@/component/form/form-button.vue';
  import FollowModal from '@/component/user/follow-modal.vue';
  import { onMounted } from 'vue';
  import { axiosProxy } from '@/api/axios';
  import { formatBirthday, formatFollowStatus } from '@/helper/format'
  import type { paths } from '@/api/gen'
  import { storage } from '@/storage';
  import { ElMessage } from 'element-plus';
  import router from '@/router';

  const route = useRoute();
  const user = ref<paths["/user"]["get"]["responses"]["200"]["content"]["application/json"]>()
  const enableFollowsModalShow = ref(false)
  // 关注/粉丝弹窗类型
  const followsModalType = ref("following")

  // 挂载钩子
  onMounted(async () => {
    // 获取用户数据
    const currentUserId = ref(route.params.userId as string);
    user.value = await axiosProxy.get<
    paths["/user"]["get"]["parameters"]["query"],
    paths["/user"]["get"]["responses"]["200"]["content"]["application/json"]
    >(`/user`, {
      userId: currentUserId.value,
    })
  })

  // 展示关注/粉丝列表弹窗
  const showFollowsModal = async (type: "following" | "follower", userId: string) => {
    followsModalType.value = type
    enableFollowsModalShow.value = true
  }

  // 关注用户
  const follow = async () => {
    await axiosProxy.post<
    paths["/follow/user"]["post"]["requestBody"]["content"]["application/json"],
    null
    >(`/follow/user`, {
      userId: user.value?.user.id!,
      isFollow: user.value?.user.is_follow!,
    })

    user.value = await axiosProxy.get<
    paths["/user"]["get"]["parameters"]["query"],
    paths["/user"]["get"]["responses"]["200"]["content"]["application/json"]
    >(`/user`, {
      userId: user.value?.user.id!,
    })

    ElMessage("操作成功")
  }

  /**
   * 私信用户,重定向到聊天页面
   * 通过url参数传递用户id,由聊天页面调用后端api
   */
  const redirectToChatPage = async () => {
    if (!user.value) return

    // 重定向聊天页面
    router.push({ 
      name: "ChatPage",
      query: {
        // 该参数用于在聊天页面创建会话时对应的用户id
        createOptionUserId: user.value?.user.id,
      }
    })
  }

 </script>

<style scoped lang="scss">
  .page-box {
    margin-top: 5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: start;
    padding: 25px 0px;
    .top {
      width: 45%;
      display: flex;
      align-items: center;
      gap: 60px;
      .avatar {
        width: 170px;
      }
      .info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        .name {
          display: flex;
          justify-content: space-between;
          .text {
            font-size: 30px;
            font-weight: 600;
          }
          .btn-group {
            display: flex;
            gap: 10px;
          }
        }
        .tag {
          margin-left: 3px;
          font-size: 12px;
          display: flex;
          justify-content: start;
          gap: 10px;
          margin-bottom: 1rem;
        }
        .follow {
          font-size: 0.95rem;
          margin-top: 0.8rem;
          display: flex;
          gap: 1rem;
          div:hover {
            cursor: pointer;
            color: var(--root-orange-light);
          }
          div:active {
            color: var(--root-orange-dark);
          }
        }
      }
    }
    .category {
      margin-top: 6rem;
      width: 100%;
    }
  }

  .follow-modal {
    padding: 30px 50px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .edit-user-modal {
    padding: 50px;
    .avatar {
      width: 120px;
      margin: 0 auto
    }
    .avatar:hover {
      cursor: pointer;
    }
    .form {
      width: 50%;
      margin: 0 auto;
      margin-top: 30px;
    }
  }
</style>
