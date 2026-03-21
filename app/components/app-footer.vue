<script setup lang="ts">

import {useTime} from "~/composables/useTime";

const time = useTime();

</script>

<template>
  <u-footer>
    <template #left>
      <div class="flex justify-center items-center space-x-1.5">
        <Icon name="i-lineicons-nuxt" />
        <p class="text-sm">This project is
          <NuxtLink to="/about" class="text-green">
            open source
          </NuxtLink>
        </p>
      </div>
    </template>

    <p>
      Copyright © {{ time.getCurrentYear() }}
      <a href="https://i.ilov.top/" target="_blank" class="text-green cursor-pointer">Myxhan</a>
      all rights reserved.
    </p>

    <template #right>
      <UButton
          icon="i-mdi-github"
          color="neutral"
          variant="ghost"
          to="https://github.com/xhanhh/OneselfWorship"
          target="_blank"
          aria-label="Github"
      />
    </template>

  </u-footer>
</template>

<style scoped lang="scss">

</style>