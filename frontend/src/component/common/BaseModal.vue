<!-- 
  必看!!!
  基于BaseModel的组件,如果想实现setup逻辑随enableShow变化而重新执行,
  必须由父组件在对应组件中添加v-if,因为BaseModel中的v-if不会影响他们
  的setup执行 
-->

<template>
  <div @click.self="close"  class="modal-background" v-if="enableShow">
    <div
    class='modal'
    :style="{ width: props.width, height: props.height }"
    >
      <slot></slot>
      <div class="step" v-if="stepTotal > 0">
        <div class="step-item" v-for="item in stepTotal" :key="item" :class="{'active': item <= stepIndex}"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const props = defineProps({
    // 模态框是否可以关闭
    canClose: {
      type: Boolean,
      default: true
    },
    width: {
      type: String,
      default: '70vw'
    },
    height: {
      type: String,
      default: '90vh'
    },
    // 步骤条索引
    stepIndex: {
      type: Number,
      default: 1
    },
    // 总步骤数
    stepTotal: {
      type: Number,
      default: 0
    }
  })

  const enableShow = defineModel<boolean>("show")

  // 点击弹窗外部关闭弹窗
  const close = () => {
    if (props.canClose) enableShow.value = false
  }
</script>

<style scoped lang="scss">
  .modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
    transition: all 0.5s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    .modal {
      white-space: nowrap;
      position: relative;
      background-color: white;
      margin: 5vh auto;
      border-radius: 15px;
      height: 90vh;
      width: 70vw;
      max-height: 100vh;
      .step {
        position: absolute;
        bottom: 5%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        .step-item {
          transition: all 0.3s ease-in-out;
          width: 20px;
          height: 5px;
          border-radius: 5px;
          background-color: var(--root-gray-light);
          opacity: 0.3;
        }
        .step-item.active {
          background-color: var(--root-orange);
          transform: scale(1.2);
          opacity: 1;
        }
      }
    }
  }
</style>
