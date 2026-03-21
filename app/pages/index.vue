<script setup lang="ts">
import MemorialCreateModal from '~/components/memorial-create-modal.vue'
import MemorialListCard from '~/components/memorial-list-card.vue'
import { useTitleMeta } from '~/composables/useMeta'
import type { ApiResponse, PublicMemorialListResponseData } from '~/types/Response'

useSeoMeta({
  title: useTitleMeta('首页'),
  ogTitle: useTitleMeta('首页'),
  description: '可以在线为想要纪念的人创建祭扫，并使众人都能够纪念ta',
  ogDescription: '可以在线为想要纪念的人创建祭扫，并使众人都能够纪念ta'
})

const createModalOpen = ref(false)

const { data, error, refresh, status } = await useFetch<ApiResponse<PublicMemorialListResponseData>>('/api/memorials/public', {
  query: {
    page: 1,
    pageSize: 6,
    sortField: 'tributeCount',
    sortDirection: 'desc'
  },
  default: createEmptyResponse
})

const memorials = computed(() => data.value?.data.memorials ?? [])
const hasMemorials = computed(() => memorials.value.length > 0)
const isPending = computed(() => status.value === 'pending')
const errorMessage = computed(() => {
  const statusMessage = (error.value as { data?: { statusMessage?: string }; statusMessage?: string } | null)?.data?.statusMessage
    ?? (error.value as { statusMessage?: string } | null)?.statusMessage

  return statusMessage || ''
})

function createEmptyResponse(): ApiResponse<PublicMemorialListResponseData> {
  return {
    success: true,
    message: '',
    data: {
      memorials: [],
      pagination: {
        page: 1,
        pageSize: 6,
        total: 0,
        totalPages: 1,
        sortField: 'tributeCount',
        sortDirection: 'desc'
      }
    }
  }
}

function handleRefresh() {
  void refresh()
}

function handleCreated() {
  handleRefresh()
}
</script>

<template>
  <UContainer class="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <div class="space-y-8">
      <section class="space-y-4">
        <UCard class="flex flex-col gap-4 rounded-2xl from-primary/8 via-elevated to-secondary/15 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl space-y-2">
            <UBadge color="primary" variant="soft" label="清明祭扫" />
            <h1 class="text-3xl font-semibold sm:text-4xl">
              为思念留一处祭扫的缅怀空间
            </h1>
            <p class="text-sm text-muted sm:text-base">
              可建立祭扫追忆，与其他人共同缅怀先人，也可以是自己。
            </p>
          </div>

          <div class="flex flex-col gap-3 pt-4 sm:flex-row">
            <UButton
              to="/memorials"
              color="primary"
              size="xl"
              variant="solid"
              icon="i-lucide-search"
              label="前往祭扫"
            />
            <UButton
              color="neutral"
              size="xl"
              variant="subtle"
              icon="i-lucide-plus"
              label="新祭扫"
              @click="createModalOpen = true"
            />
          </div>
        </UCard>
      </section>

      <section class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">多人祭扫</h2>
            <p class="mt-1 text-sm text-muted sm:text-base">
              当前祭扫次数前六的祭奠
            </p>
          </div>

          <UButton
            to="/memorials"
            color="neutral"
            variant="ghost"
            icon="i-lucide-arrow-right"
            trailing
            label="查看更多"
            class="self-start sm:self-auto"
          />
        </div>

        <section v-if="errorMessage">
          <UCard>
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <p class="text-lg font-medium text-highlighted">列表加载失败</p>
                <p class="text-sm text-muted">{{ errorMessage }}</p>
              </div>

              <UButton color="primary" variant="soft" label="重新加载" :loading="isPending" @click="handleRefresh" />
            </div>
          </UCard>
        </section>

        <section v-else-if="isPending && !hasMemorials" class="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <UCard v-for="index in 6" :key="index">
            <div class="space-y-4">
              <USkeleton class="h-6 w-2/3" />
              <USkeleton class="h-20 w-full" />
              <USkeleton class="h-8 w-24" />
            </div>
          </UCard>
        </section>

        <section v-else-if="hasMemorials" class="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <MemorialListCard
            v-for="memorial in memorials"
            :key="memorial.id"
            :memorial="memorial"
          />
        </section>

        <section v-else>
          <UCard>
            <div class="flex flex-col gap-5 rounded-xl p-2 sm:flex-row sm:items-center sm:justify-between">
              <div class="space-y-1">
                <p class="text-lg font-medium text-highlighted">还没有公开的祭扫项</p>
                <p class="text-sm text-muted">
                  你可以成为第一个创建者，在清明时节为思念留下一处纪念。
                </p>
              </div>

              <UButton color="primary" variant="solid" icon="i-lucide-plus" label="立即新建" @click="createModalOpen = true" />
            </div>
          </UCard>
        </section>
      </section>
    </div>

    <MemorialCreateModal v-model:open="createModalOpen" @created="handleCreated" />
  </UContainer>
</template>