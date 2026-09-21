<template>
  <div class="comment-card">
    <div class="avatar">
      <UserAvatar :img-url="props.avatarUrl" />
    </div>
    <div class="text">
      <div class="top">
        <div> {{ props.userName }} </div>
      </div>
      <div class="content"> <span class="reply-user" v-show="props.parentUserName !== ''">回复 {{ props.parentUserName }} : </span> {{ props.content }}</div>
      <div class="time">{{ formatTime(props.createdAt) }}</div>
      <div class="bottom">
        <div class="bottom-item" @click="emits('clickReply')">
          <AppIcon type="chat" text="回复" />
          <div>回复</div>
        </div>
        <div class="bottom-item">
          <AppIcon v-if="props.isLiked === 0" type="heart" />
          <AppIcon v-else type="heart-fill" :fill="'red'" />
          <div>{{ props.likeCount }}</div>
        </div>
      </div>
      <slot name="bottom"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import UserAvatar from '../user/UserAvatar.vue';
  import AppIcon from '../common/AppIcon.vue';
  import { formatTime } from '@/helper/format';

  const emits = defineEmits(["clickReply"])

  const props = withDefaults(defineProps<
    {
      userName: string;
      parentUserName: string;
      avatarUrl: string;
      content: string;
      createdAt: string;
      isLiked: number;
      likeCount: number;
    }
  >(), {})

  // const emits = defineEmits(['reply', 'like'])
</script>

<style scoped lang="scss">
  .comment-card {
    display: flex;
    gap: 10px;
    .avatar {
      width: 40px;
      height: 40px;
    }
    .text {
      width: 100%;
      .top {
        color: var(--root-gray-dark);
        font-size: 0.95rem;
      }
      .time {
        margin-top: 2px;
        font-size: 0.8rem;
        color: var(--root-gray);
      }
      .content {
        font-size: 0.95rem;
        margin-top: 2px;
        line-height: 1.5;
        white-space: normal;
        word-break: break-all;
        overflow: auto;
        .reply-user {
          font-size: 0.9rem;
          color: var(--root-gray-dark);
          margin-right: 3px;
        }
      }
      .bottom {
        margin-top: 7px;
        display: flex;
        align-items: center;
        gap: 10px;
        .bottom-item {
          transition: all 0.3s ease-in-out;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: var(--root-gray);
        }
        .bottom-item:hover {
          transform: scale(1.1);
        }
      }
    }
  }
</style>
