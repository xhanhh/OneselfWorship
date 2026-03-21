<script setup lang="ts">
import { useTitleMeta } from "~/composables/useMeta";
import Page404 from "~/components/page-404.vue";

useSeoMeta({
  title: useTitleMeta("404"),
  ogTitle: useTitleMeta("404"),
  description: "404 您访问的内容不存在",
  ogDescription: "404 您访问的内容不存在"
})

</script>

<template>
  <Page404 />
</template>

<style scoped lang="scss">

</style>