<script setup lang="ts">

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

    <div class="flex justify-center items-center">
      <p class="text-sm">该页面上的内容可能为虚构，我们不对其负责</p>
    </div>

    <template #right>
      <div class="flex justify-center items-center space-x-1">
        <UButton
            icon="i-mdi-github"
            color="neutral"
            variant="ghost"
            to="https://github.com/xhanhh/OneselfWorship"
            target="_blank"
            aria-label="Github"
        />
        <p>
          By
          <a href="https://i.ilov.top/" target="_blank" class="text-green cursor-pointer">Myxhan</a>
        </p>
      </div>

    </template>

  </u-footer>
</template>

<style scoped lang="scss">

</style>