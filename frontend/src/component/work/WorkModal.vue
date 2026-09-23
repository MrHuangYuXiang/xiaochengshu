<!--
  所有弹窗相关组件使用v-if控制渲染,提供close事件,
  通过setup直接重置初始数据,防止手动控制各种复杂字
  段状态导致的问题
-->

<template>
  <BaseModal v-model:show="globalWorkModal.isShow.value">
    <div class="work-modal">
      <div class="left">
        <ImageSlider
          class="image"
          :src="work?.images[currentImageIndex]?.path || ''"
          :enable-preview="true"
          :enable-switch="true"
          :current-index="currentImageIndex"
          :total-count="work?.images.length"
          @switch="(index) => { currentImageIndex = index }"
        />
      </div>
      <div class="right">
        <div class="user">
          <UserCard
            :user-id="work?.user?.id || ''"
            :user-name="work?.user?.name || ''"
            :user-avatar-url="work?.user?.avatar_url || ''"
            :is-follow="work?.user?.is_follow || 0"
            :is-followed="work?.user?.is_followed || 0"
            :updateFollowCallback="updateFollowCallback"
          />
        </div>
        <div class="work">
          <ScrollContainer
            ref="scrollContainerRef"
            :loadMoreCallback="getTopComments"
            trigger-type="bottom"
          >
            <div class="work-body">
              <div class="title">{{ work?.work.title }}</div>
              <div class="content">{{ work?.work.content }}</div>
              <div class="info">{{ formatTime(work?.work.created_at || '') }}</div>
              <div style="border-top: 1px solid #d4d3d3;margin: 8px 0;" ></div>
              <div class="comment-list">
                <CommentCard
                  v-for="comment in comments" :key="comment.comment.id"
                  :userName="comment.user.name"
                  :avatarUrl="comment.user.avatar_url"
                  :content="comment.comment.content"
                  :createdAt="comment.comment.created_at"
                  :parentUserName="''"
                  :isLiked="comment.isLiked"
                  :likeCount="comment.likeCount"
                  class="item"
                  v-show="comments.list.length() > 0"
                  @clickReply="triggerFocus({
                    parentId: comment.comment.id,
                    rootCommentId: comment.comment.id,
                    replyContent: comment.comment.content,
                    replyUserName: comment.user.name
                  })">
                  <template #bottom>
                    <div class="reply" v-show="repliesMap.get(comment.comment.id)!.count() > 0">
                      <CommentCard
                      v-for="reply in repliesMap.get(comment.comment.id)!"
                      :key="reply.data.comment.id"
                      class="reply-item"
                      :parentUserName="reply.data.comment.parent_id === comment.comment.id ? '' : reply.parent!.data.user.name"
                      :userName="reply.data.user.name"
                      :avatarUrl="reply.data.user.avatar_url"
                      :content="reply.data.comment.content"
                      :createdAt="reply.data.comment.created_at"
                      :isLiked="reply.data.isLiked"
                      :likeCount="reply.data.likeCount"
                      @clickReply="triggerFocus({
                        parentId: reply.data.comment.id,
                        rootCommentId: comment.comment.id,
                        replyContent: reply.data.comment.content,
                        replyUserName: reply.data.user.name
                      })"
                      />
                    </div>
                    <div class="more" v-show="comment.replyCount > 0">
                      <div style="border-bottom: 1.5px solid #d4d3d3;width: 25px;margin-right: 6px;"></div>
                      <div class="more-item" @click="getReplies(comment.comment.id)" v-show="!repliesMap.get(comment.comment.id)!.isEnd">
                        <div v-show="repliesMap.get(comment.comment.id)!.count() === 0">展开 {{ comment.replyCount }} 条回复</div>
                        <div v-show="repliesMap.get(comment.comment.id)!.count() > 0">展开更多</div>
                        <div style="width: 0.8rem; height: 0.8rem;"><AppIcon type="arrow-down-outline" /></div>
                      </div>
                      <div class="more-item" @click="clearReplies(comment.comment.id)" v-show="repliesMap.get(comment.comment.id)!.count() > 0">
                        <div>收起</div>
                        <div style="width: 0.8rem; height: 0.8rem;"><AppIcon type="arrow-up-outline" /></div>
                      </div>
                    </div>
                  </template>
                </CommentCard>
              </div>
            </div>
          </ScrollContainer>
        </div>
        <div class="publish-form">
          <div :class="{'reply-content': true, 'focus': isInputFocus && replyTarget !== undefined}">回复{{ replyTarget?.replyUserName }} {{ replyTarget?.replyContent }} : </div>
          <div :class="{'publish-input': true, 'focus': isInputFocus}">
            <FormInput type="textarea"
            :rows="1"
            placeholder="请输入评论内容"
            ref="textareaRef"
            @click="triggerFocus()"
            v-model="inputContent"
            />
            <div :class="{'focus': isInputFocus, 'icons': true}">
              <div class="icon">
                <AppIcon v-if="work?.isLiked === 0" type="heart" />
                <AppIcon v-else type="heart-fill" fill="red" />
                <div>{{ work?.likeCount }}</div>
              </div>
              <div class="icon">
                <AppIcon v-if="work?.isCollected === 0" type="star" />
                <AppIcon v-else type="star-fill" fill="yellow" />
                <div>{{ work?.collectCount }}</div>
              </div>
            </div>
          </div>
          <div :class="{'bottom-btns': true, 'focus': isInputFocus}">
            <div><FormButton text="取消" @click="isInputFocus = false" /></div>
            <div><FormButton text="发布" @click="publish" /></div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
  import BaseModal from '../common/BaseModal.vue';
  import UserCard from '../user/UserCard.vue';
  import AppIcon from '../common/AppIcon.vue';
  import FormButton from '../form/form-button.vue';
  import CommentCard from './CommentCard.vue';
  import FormInput from '../form/form-input.vue';
  import ScrollContainer from '../common/ScrollContainer.vue';
  import ImageSlider from '../image/image-slider.vue';
  import { formatTime } from '@/helper/format';
  import { onMounted, ref, useTemplateRef } from 'vue';
  import type { paths } from '@/api/gen';
  import type { workCommentSchema, WorkSchema } from '@/api/type.ext'
  import { Forest } from '@/lib/tree';
  import { axiosProxy } from '@/api/axios.ts';
  import { EnhancedList } from '@/lib/list.ts';
  import { ElMessage } from 'element-plus';
  import { globalWorkModal } from '../global.ts';

  const textareaRef = useTemplateRef('textareaRef')
  const work = ref<WorkSchema>()
  const comments = ref(
    new EnhancedList<workCommentSchema>((item: workCommentSchema) => {
      return item.comment.id
    }, 6)
  )
  // 评论回复映射表
  const repliesMap = ref(new Map<string, Forest<workCommentSchema>>())
  // 当前图片索引
  const currentImageIndex = ref(0)

  // 输入框聚焦标志位及输入内容
  const isInputFocus = ref(false)
  const inputContent = ref('')

  // 回复的目标评论,仅当回复时有值,评论作品时为undefined
  const replyTarget = ref<{
    parentId: string,
    rootCommentId: string,
    replyContent: string,
    replyUserName: string,
  } | undefined>(undefined)

  // 初始化评论回复映射表
  const initRepliesMap = (commentId: string) => {
    repliesMap.value.set(commentId, new Forest<workCommentSchema>(
      3,
      (item: workCommentSchema) => item.comment.id,
      (item: workCommentSchema) => item.comment.parent_id,
    ))
  }

  // 封装获取顶层评论逻辑
  const getTopComments = async () => {
    await comments.value.pagePush(async (currentPage: number, pageSize: number) => {
      const res = await axiosProxy.get<
      paths["/work/comments"]["get"]["parameters"]["query"],
      paths["/work/comments"]["get"]["responses"]["200"]["content"]["application/json"]
      >(`/work/comments`, {
        page: currentPage,
        pageSize: pageSize,
        workId: globalWorkModal.workId.value,
        type: "top",
        rootCommentId: '',
      })

      // 更新回复映射表
      for (const comment of res.comments) {
        await initRepliesMap(comment.comment.id)
      }

      return res.comments
    })

    return comments.value.isEnd
  }

  // 点击评论下方回复按钮或评论作品时触发,设置相关变量
  const triggerFocus = (target?: typeof replyTarget.value) => {
    // 如果当前输入框聚焦,直接忽略这次点击,防止回复过程中被打断的情况
    if (target === undefined && isInputFocus.value) {
      return
    }

    replyTarget.value = target
    isInputFocus.value = true
    textareaRef.value?.focus()
  }

  // 发表作品评论/回复
  const publish = async () => {
    let rootCommentId = ''
    let parentId = ''
    if (replyTarget.value !== undefined) {
      rootCommentId = replyTarget.value.rootCommentId
      parentId = replyTarget.value.parentId
    }

    const comment = await axiosProxy.post<
      paths["/create/work/comment"]["post"]["requestBody"]["content"]["application/json"],
      paths["/create/work/comment"]["post"]["responses"]["200"]["content"]["application/json"]
    >("/create/work/comment", {
      content: inputContent.value,
      workId: work.value!.work.id,
      rootCommentId: rootCommentId,
      parentId: parentId,
    })

    // 添加评论
    if (replyTarget.value !== undefined) {
      repliesMap.value.get(replyTarget.value.rootCommentId)?.addChild(comment)
    } else {
      comments.value.unshift(comment)
      initRepliesMap(comment.comment.id)
    }

    // 清理相关资源并显示成功提示
    inputContent.value = ''
    isInputFocus.value = false
    ElMessage("评论成功")
  }

  // 获取评论回复
  const getReplies = (commentId: string) => {
    const reply = repliesMap.value.get(commentId)
    reply?.pageAddChildren(async (currentPage: number, pageSize: number) => {
      const res = await axiosProxy.get<
        paths["/work/comments"]["get"]["parameters"]["query"],
        paths["/work/comments"]["get"]["responses"]["200"]["content"]["application/json"]
      >(`/work/comments`, {
        page: currentPage,
        pageSize: pageSize,
        type: "reply",
        rootCommentId: commentId,
        workId: work.value!.work.id,
      })
      return res.comments
    })
  }

  // 收起评论回复
  const clearReplies = (commentId: string) => {
    const reply = repliesMap.value.get(commentId)
    reply?.clear()
  }

  // 更新用户关注状态回调
  const updateFollowCallback = (res: paths["/follow/user"]["post"]["responses"]["200"]["content"]["application/json"]) => {
    if (work.value) {
      work.value.user = res.user
    }
  }

  // 挂载后加载作品和评论信息
  onMounted(async () => {
    if (!globalWorkModal.isShow.value) return

    // 获取作品详情
    work.value = await axiosProxy.get<
      paths["/work"]["get"]["parameters"]["query"],
      paths["/work"]["get"]["responses"]["200"]["content"]["application/json"]
    >(`/work`, {
      workId: globalWorkModal.workId.value
    })

    // 获取评论
    await getTopComments()
  })
</script>

<style scoped lang="scss">
  .work-modal {
    width: 100%;
    height: 100%;
    display: flex;
    .left {
      flex: 7;
      height: 100%;
      border-right: 1px solid #e5e5e5;
      .image {
        width: 100%;
        height: 100%;
        background-size: contain;
      }
    }
    .right {
      position: relative;
      flex: 4;
      height: 100%;
      padding: 20px;

      .user {
        height: 10%;
        border-bottom: 1px solid #e5e5e5;
      }

      .work {
        height: 90%;
        padding: 30px 0px;
        .work-body {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          .title {
            font-size: 1.2rem;
            font-weight: bold;
          }
          .content {
            font-size: 1rem;
            line-height: 1.5;
          }
          .info {
            margin-top: 20px;
            font-size: 0.9rem;
            opacity: 0.5;
          }
          .comment-list {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            .reply {
              display: flex;
              flex-direction: column;
              gap: 10px;
              padding-top: 20px;
            }
            .more {
              display: flex;
              align-items: center;
              margin-top: 10px;
              font-size: 0.8rem;
              color: var(--root-gray);
              .more-item {
                display: flex;
                align-items: center;
                margin-right: 5px;
              }
              .more-item:hover {
                cursor: pointer;
                color: var(--root-gray-light);
              }
              .more-item:active {
                color: var(--root-gray-dark);
              }
            }
          }
        }
      }

      .publish-form {
        position: absolute;
        bottom: 0;
        left: 0;
        padding: 0 20px;
        padding-top: 10px;
        width: 100%;
        border-top: 1px solid #e5e5e5;
        background-color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        .reply-content {
          margin: 0;
          font-size: 12px;
          color: var(--root-gray);
          height: 0px;
          transition: all 0.2s ease-in-out;
          visibility: hidden;
          opacity: 0;
        }
        .reply-content.focus {
          height: 20px;
          visibility: visible;
          opacity: 1;
          margin-bottom: 5px;
        }
        .publish-input {
          transition: all 0.2s ease-in-out;
          position: relative;
          width: 80%;
          .icons {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%) translateX(125%);
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.2s ease-in-out;
            opacity: 1;
            .icon {
              cursor: pointer;
              font-size: 12px;
              display: flex;
              align-items: center;
              gap: 4px;
            }
          }
          .icons.focus {
            opacity: 0;
            transform: translateX(200%) translateY(-50%);
          }
        }
        .publish-input.focus {
          width: 100%;
        }
        .bottom-btns {
          transition: all 0.2s ease-in-out;
          display: flex;
          justify-content: end;
          align-items: center;
          gap: 10px;
          height: 0px;
          visibility: hidden;
          overflow: hidden;
        }
        .bottom-btns.focus {
          height: 40px;
          visibility: visible;
          margin-bottom: 5px;
        }
      }
    }
  }
</style>
