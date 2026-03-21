<script setup lang="ts">
import type { PublicMemorialListItem } from '~/types/Item'
import { useTime } from '~/composables/useTime'

const props = withDefaults(defineProps<{
  memorial: PublicMemorialListItem
  showManageAction?: boolean
}>(), {
  showManageAction: false
})

const emit = defineEmits<{
  manage: [memorial: PublicMemorialListItem]
}>()

const time = useTime()
</script>

<template>
  <UCard
    class="h-full overflow-hidden rounded-xl"
  >
    <template #header>
      <NuxtLink :to="`/memorials/${props.memorial.id}`" class="block transition-transform duration-200 hover:-translate-y-0.5">
        <div class="flex items-start justify-between gap-2">
          <h2 class="min-w-0 flex-1 truncate pr-2 text-lg font-semibold leading-tight text-highlighted sm:text-base">
            {{ props.memorial.name }}
          </h2>

          <UBadge color="primary" variant="soft" class="shrink-0 whitespace-nowrap px-2.5 py-1 text-xs sm:text-xs">
            已祭扫 {{ props.memorial.tributeCount }} 次
          </UBadge>
        </div>
      </NuxtLink>
    </template>

    <NuxtLink :to="`/memorials/${props.memorial.id}`" class="block transition-transform duration-200">
      <p class="line-clamp-2 min-h-14 text-base leading-7 text-toned sm:min-h-12 sm:text-sm sm:leading-6">
        {{ props.memorial.description }}
      </p>
    </NuxtLink>

    <template #footer>
      <div class="flex items-center justify-between gap-3 text-sm text-muted sm:text-xs">
        <span class="truncate">发起于 {{ time.formatDate(props.memorial.createdAt) }}</span>

        <UButton
          v-if="props.showManageAction"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-settings-2"
          label="管理"
          @click.stop="emit('manage', props.memorial)"
        />
      </div>
    </template>
  </UCard>
</template>