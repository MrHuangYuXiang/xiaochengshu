<template>
  <button
    :class="{'default': props.color === 'default', 'orange': props.color === 'orange'}"
  >
    {{ props.text }}
  </button>
</template>

<script setup lang="ts">
    const props = defineProps<{
        text: string,
        color: 'default' | 'orange',
    }>()
</script>

<style scoped lang="scss">
  button {
    border: none;
    padding: 0.5rem 1rem;
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
