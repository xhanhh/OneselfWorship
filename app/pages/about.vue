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
    <div class="mx-auto max-w-3xl space-y-4">
      <UCard class="rounded-2xl py-4 px-6 sm:p-8">
        <div class="space-y-4 pb-4">
          <UBadge color="primary" variant="soft" label="关于" />

          <div class="space-y-3 px-0.5">
            <h1 class="text-3xl font-extrabold noto-serif text-highlighted sm:text-4xl">
              一个用于在线祭扫的开源小网页
            </h1>
            <p class="text-base leading-8 text-toned">
              这项目是一人加一Codex写的，本来想拿来清明节祭自己的，纯发癫没别的。
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

        <div class="space-y-4 pt-4">
          <UBadge color="primary" variant="soft" label="免责声明" />

          <div class="space-y-3 px-0.5">
            <p class="text-base leading-8 text-toned">
              我们不为该网站上的任何信息负责，它们可能纯属虚构，我们也不保证其的真实性，祭奠对象的名字可能会有重合，请勿强行加以关联。
            </p>
            <p class="text-base leading-8 text-toned">
              如果您认为相关内容侵犯到了您的权益，请您为我们发送邮件，我们将协助您解决问题<a>myxhan@lunawiki.org</a>。
            </p>
          </div>

        </div>
      </UCard>
    </div>
  </UContainer>
</template>