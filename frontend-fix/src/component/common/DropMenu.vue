<template>
  <div class="drop-menu" @mouseenter="showMenu('hover')" @click="showMenu('click')" @mouseleave="mouseLeave">
    <div>
      <slot></slot>
    </div>
    <div
    :class="{'menu': true, 'menu-fade': isShowMenu, 'menu-bottom': props.direction === 'bottom', 'menu-top': props.direction === 'top'}"
    @mouseenter="mouseEnter"
    @mouseleave="mouseLeave"
    >
      <slot name="menu"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const props = defineProps({
    direction: {
      type: String,
      default: 'bottom'
    },
    trigger: {
      type: String,
      default: "hover"
    }
  })

  const isShowMenu = ref(false)
  let timeoutId: number | null = null

  const showMenu = (type: string) => {
    if (type === props.trigger) {
      isShowMenu.value = true
    }
  }

  /**
   * 由于采用position,menu和插槽之间有空隙,导致鼠标
   * 离开插槽会触发mouseleave事件,导致菜单隐藏,通过
   * 延迟关闭解决该问题
   */
  const mouseLeave = () => {
    if (!isShowMenu.value) {
      return
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
        isShowMenu.value = false
    }, 200)
  }

  const mouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
</script>

<style scoped lang="scss">
  .drop-menu {
    position: relative;
    .menu {
      position: absolute;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      opacity: 0;
      visibility: hidden;
      background-color: white;
      transition: all 0.3s ease-in-out;
      border-radius: 10px;
    }
    .menu-fade {
      opacity: 1;
      visibility: visible;
    }
    .menu-bottom {
      top: calc(100% + 10px);
    }
    .menu-top {
      bottom: calc(100% + 10px);
    }
}
</style>
