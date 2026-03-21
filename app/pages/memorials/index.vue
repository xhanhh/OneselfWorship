<script setup lang="ts">
import MemorialBrowserSection from '~/components/memorial-browser-section.vue'
import { useTitleMeta } from '~/composables/useMeta'

useSeoMeta({
  title: useTitleMeta('祭扫'),
  ogTitle: useTitleMeta('祭扫'),
  description: '可搜索公开祭扫项，也可以用邮箱查找管理自己的祭扫人。',
  ogDescription: '可搜索公开祭扫项，也可以用邮箱查找管理自己的祭扫人。'
})
</script>

<template>
  <UContainer class="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <MemorialBrowserSection
      title="祭扫"
      description="可搜索公开祭扫项，也可以用邮箱查找管理自己的祭扫人。"
    />
  </UContainer>
</template>