<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import ColorModeButton from '~/components/ui/ColorModeButton.vue'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: '首页',
    to: '/',
    active: route.path === '/'
  },
  {
    label: '祭扫',
    to: '/memorials',
    active: route.path.startsWith('/memorials')
  },
  {
    label: '关于',
    to: '/about',
    active: route.path.startsWith('/about')
  }
])
</script>

<template>
  <UHeader>
    <template #title>
      <div class="flex items-center">
        <span>祭自己</span>
      </div>
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <ColorModeButton />
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
    </template>
  </UHeader>
</template>