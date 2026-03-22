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
      <div class="mobile-nav-sheet">
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </div>
    </template>
  </UHeader>
</template>

<style lang="scss" scoped>
@media (max-width: 1023px) {
  .mobile-nav-sheet {
    transform-origin: top center;
    animation: mobile-nav-sheet-in 0.22s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .mobile-nav-sheet :deep(li) {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
    animation: mobile-nav-item-in 0.24s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .mobile-nav-sheet :deep(li:nth-child(1)) {
    animation-delay: 0.02s;
  }

  .mobile-nav-sheet :deep(li:nth-child(2)) {
    animation-delay: 0.05s;
  }

  .mobile-nav-sheet :deep(li:nth-child(3)) {
    animation-delay: 0.08s;
  }
}

@keyframes mobile-nav-sheet-in {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes mobile-nav-item-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-sheet,
  .mobile-nav-sheet :deep(li) {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>