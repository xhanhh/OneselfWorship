<script setup lang="ts">
const themeStore = useThemeStore();

const themeIcon = computed(() => {
  switch (themeStore.themeName) {
    case 'light': return 'i-lucide-sun'
    case 'dark': return 'i-lucide-moon-star'
    case 'auto': return 'i-lucide-sun-moon'
    default: return 'i-lucide-sun-moon'
  }
})
</script>

<template>
  <u-button variant="ghost" :icon="themeIcon" @click="themeStore.toggleTheme()" />
</template>

<style lang="scss" scoped>

</style>