<!-- 性别单选框 -->

<template>
  <div class="gender-radio" :style="{ width: props.width }">
    <div class="gender-box male" :class="{'active': gender === 1}" @click="gender = 1">
      <AppIcon type="male" :fill="gender === 1 ? 'var(--root-male-color)' : 'var(--root-gray)' " />
      <div>男生</div>
    </div>
    <div class="gender-box female" :class="{'active': gender === 2}" @click="gender = 2">
      <AppIcon type="female" :fill="gender === 2 ? 'var(--root-female-color)' : 'var(--root-gray)' " />
      <div>女生</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AppIcon from '../common/AppIcon.vue';
  const props = defineProps({
    width: {
      type: String,
      default: '100%',
    },
  })

  // 1:男 2:女
  const gender = defineModel<number>()
</script>

<style scoped lang="scss">
  .gender-radio {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 15px;
    .gender-box {
      transition: all 0.3s ease-in-out;
      text-wrap: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 25px;
      border-radius: 15px;
      background-color: var(--root-bg-gray);
      gap: 5px;
      border: 2px solid var(--root-border-gray);
      cursor: pointer;
    }
    .gender-box:hover {
      transform: translateY(-8%);
    }

    .gender-box.male.active {
      color: var(--root-male-color);
      border: 2px solid var(--root-male-color);
    }
    .gender-box.female.active {
      color: var(--root-female-color);
      border: 2px solid var(--root-female-color);
    }
  }
</style>
