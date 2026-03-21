<script setup lang="ts">
import AppHeader from "~/components/app-header.vue";
import AppFooter from "~/components/app-footer.vue";
</script>

<template>
  <u-app>

    <app-header />

    <u-main>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </u-main>

    <app-footer />

  </u-app>
</template>
