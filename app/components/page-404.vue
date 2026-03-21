<script setup lang="ts">
defineProps({
  link: {
    type: String,
    default: '/'
  },
  linkTitle: {
    type: String,
    default: '返回首页',
  },
  title: {
    type: String,
    default: '404 您查找的页面走丢了'
  },
  description: {
    type: String,
    default: '也许是没有该页面，要不去别处看看？'
  }
})
</script>

<template>
  <div class="flex justify-center flex-col items-center text-center min-h-[calc(100vh-var(--ui-header-height))] px-3">
    <div class="flex flex-col items-center justify-center p-4 space-y-3">
      <div class="flex flex-col items-center space-y-1">
        <h1 class="text-2xl font-semibold">{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <u-button :to="link">{{ linkTitle }}</u-button>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>