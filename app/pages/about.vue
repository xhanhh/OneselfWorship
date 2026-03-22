<script setup lang="ts">
import { useTitleMeta } from '~/composables/useMeta'

useSeoMeta({
  title: useTitleMeta('关于我们'),
  ogTitle: useTitleMeta('关于我们'),
  description: '祭扫自己关于页，这个小网页是开源的，欢迎查看',
  ogDescription: '祭扫自己关于页，这个小网页是开源的，欢迎查看'
})
</script>

<template>
  <UContainer class="px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-3xl">
      <UCard class="rounded-3xl py-4 px-6 sm:p-8">
        <div class="space-y-4">
          <UBadge color="primary" variant="soft" label="关于我们" />

          <div class="space-y-3 px-0.5">
            <h1 class="text-3xl font-extrabold noto-serif text-highlighted sm:text-4xl">
              一个用于在线祭扫的开源小网页
            </h1>
            <p class="text-base leading-8 text-toned">
              这项目是一人加一Codex写的，本来想拿来清明节祭自己的，纯发癫没别的
            </p>
            <p class="text-base leading-8 text-toned">
              这玩意是开源的，你也可以加入我们一起发癫（贡献）
            </p>
          </div>

          <u-button
              to="https://github.com/xhanhh/OneselfWorship"
              target="_blank"
              icon="i-mdi-github"
          >查看GitHub</u-button>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>