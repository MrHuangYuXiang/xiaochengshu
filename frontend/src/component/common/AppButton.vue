<template>
  <button
    :class="{'default': props.color === 'default', 'orange': props.color === 'orange'}"
    :style="{ width: props.width }"
    @click="handleClick">
    {{ props.text }}
  </button>
</template>

<script setup lang="ts">
    const props = defineProps({
      text: {
          type: String,
          default: '发送'
      },
      color: {
        type: String,
        default: 'default'
      },
      width: {
        type: String,
        default: '100%'
      }
    })

    const emits = defineEmits(['click'])
    const handleClick = () => {
        emits('click')
    }
</script>

<style scoped lang="scss">
  button {
    width: 3rem;
    border: none;
    padding: 0.7rem 1rem;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    font-weight: bold;
    white-space: nowrap;
  }

  button.default {
    background-color: var(--root-bg-gray);
    color: black;
  }
  button.default:hover {
    background-color: var(--root-bg-gray-dark);
  }
  button.orange {
    background-color: var(--root-orange);
    color: white;
  }
  button.orange:hover {
    background-color: var(--root-orange-light);
  }
</style>
