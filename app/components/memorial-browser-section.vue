<script setup lang="ts">
import MemorialCreateModal from '~/components/memorial-create-modal.vue'
import MemorialListCard from '~/components/memorial-list-card.vue'
import MemorialManageModal from '~/components/memorial-manage-modal.vue'
import type { PublicMemorialListItem, MemorialSortField, SortDirection } from '~/types/Item'
import type { SearchMemorialAccessRequest } from '~/types/Request'
import type { ApiResponse, PublicMemorialListResponseData } from '~/types/Response'

type BrowserSortField = Exclude<MemorialSortField, 'tributeCount'>

type SearchAccessResponse = ApiResponse<{
  contactEmail: string
  accessToken: string
}>

const props = withDefaults(defineProps<{
  title?: string
  description?: string
}>(), {
  title: '祭扫列表',
  description: '可按名称搜索公开祭扫项，也可以切换为邮箱模式管理自己的祭扫项。'
})

const toast = useToast()
const createModalOpen = ref(false)
const manageModalOpen = ref(false)
const verifySearchOpen = ref(false)
const searchTurnstileRef = ref<{ reset?: () => void } | null>(null)
const selectedMemorial = ref<PublicMemorialListItem | null>(null)
const searchInput = ref('')
const appliedSearchValue = ref('')
const appliedSearchAccessToken = ref('')
const pendingMineEmail = ref('')
const searchVerifyToken = ref('')
const verifySearchPending = ref(false)
const page = ref(1)
const pageSize = ref(12)
const sortField = ref<BrowserSortField>('createdAt')
const sortDirection = ref<SortDirection>('desc')
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
const searchMine = ref(false)

const sortFieldOptions = [
  { label: '按名称', value: 'name' },
  { label: '按创建时间', value: 'createdAt' },
  { label: '按祭扫时间', value: 'updatedAt' }
] satisfies Array<{ label: string; value: BrowserSortField }>

const sortDirectionOptions = [
  { label: '倒序', value: 'desc' },
  { label: '正序', value: 'asc' }
] satisfies Array<{ label: string; value: SortDirection }>

const pageSizeOptions = [
  { label: '每页 12 条', value: 12 },
  { label: '每页 24 条', value: 24 },
  { label: '每页 36 条', value: 36 }
] satisfies Array<{ label: string; value: number }>

const trimmedSearchInput = computed(() => searchInput.value.trim())
const appliedMineEmail = computed(() => searchMine.value ? appliedSearchValue.value : '')
const isMineEmailValid = computed(() => !searchMine.value || !trimmedSearchInput.value || emailPattern.test(trimmedSearchInput.value))
const showManageAction = computed(() => searchMine.value && !!appliedMineEmail.value)
const searchPlaceholder = computed(() => searchMine.value
  ? '以自己的邮箱搜索可查看并管理自己的祭扫人'
  : '搜索姓名或简介关键词'
)

const query = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  sortField: sortField.value,
  sortDirection: sortDirection.value,
  keyword: searchMine.value ? undefined : appliedSearchValue.value || undefined,
  mine: searchMine.value,
  contactEmail: searchMine.value ? appliedMineEmail.value || undefined : undefined,
  accessToken: searchMine.value ? appliedSearchAccessToken.value || undefined : undefined
}))

const { data, error, execute, status } = useFetch<ApiResponse<PublicMemorialListResponseData>>('/api/memorials/public', {
  server: false,
  immediate: false,
  query,
  default: createEmptyResponse
})

const memorials = computed(() => data.value?.data.memorials ?? [])
const pagination = computed(() => data.value?.data.pagination ?? createEmptyResponse().data.pagination)
const isPending = computed(() => status.value === 'pending')
const hasMemorials = computed(() => memorials.value.length > 0)
const hasMultiplePages = computed(() => pagination.value.totalPages > 1)
const errorMessage = computed(() => getErrorMessage(error.value))
const currentRangeText = computed(() => {
  if (searchMine.value && !appliedMineEmail.value) {
    return ''
  }

  if (!pagination.value.total) {
    return searchMine.value ? '暂无符合条件的祭扫' : '暂无公开祭扫'
  }

  const start = (pagination.value.page - 1) * pagination.value.pageSize + 1
  const end = Math.min(pagination.value.page * pagination.value.pageSize, pagination.value.total)
  return `显示第 ${start} 到 ${end} 项，共 ${pagination.value.total} 项`
})

onMounted(() => {
  refreshList()
})

watch(page, (currentPage, previousPage) => {
  if (currentPage !== previousPage) {
    refreshList()
  }
})

watch(searchMine, (enabled) => {
  selectedMemorial.value = null
  manageModalOpen.value = false
  pendingMineEmail.value = ''
  searchVerifyToken.value = ''
  verifySearchOpen.value = false
  appliedSearchValue.value = ''
  appliedSearchAccessToken.value = ''
  page.value = 1

  if (!enabled) {
    refreshList()
    return
  }

  data.value = createEmptyResponse()
})

function handleSortFieldChange(value: BrowserSortField | undefined) {
  if (!value || value === sortField.value) {
    return
  }

  sortField.value = value
  resetToFirstPageAndRefresh()
}

function handleSortDirectionChange(value: SortDirection | undefined) {
  if (!value || value === sortDirection.value) {
    return
  }

  sortDirection.value = value
  resetToFirstPageAndRefresh()
}

function handlePageSizeChange(value: number | undefined) {
  if (!value || value === pageSize.value) {
    return
  }

  pageSize.value = value
  resetToFirstPageAndRefresh()
}

function handleCreated() {
  if (searchMine.value) {
    if (appliedMineEmail.value && appliedSearchAccessToken.value) {
      refreshList()
    }
    return
  }

  refreshList()
}

function handleManage(memorial: PublicMemorialListItem) {
  selectedMemorial.value = memorial
  manageModalOpen.value = true
}

function handleManaged() {
  manageModalOpen.value = false
  selectedMemorial.value = null
  refreshList()
}

function handleSearchClick() {
  if (searchMine.value) {
    if (!trimmedSearchInput.value) {
      toast.add({
        title: '请输入邮箱',
        description: '请输入邮箱后再查询',
        color: 'warning',
        icon: 'i-lucide-mail-warning'
      })
      return
    }

    if (!isMineEmailValid.value) {
      toast.add({
        title: '邮箱格式不正确',
        description: '请输入有效的邮箱地址',
        color: 'warning',
        icon: 'i-lucide-mail-x'
      })
      return
    }

    pendingMineEmail.value = trimmedSearchInput.value
    searchVerifyToken.value = ''
    verifySearchOpen.value = true
    nextTick(() => searchTurnstileRef.value?.reset?.())
    return
  }

  appliedSearchValue.value = trimmedSearchInput.value
  resetToFirstPageAndRefresh()
}

async function handleConfirmMineSearch() {
  if (verifySearchPending.value) {
    return
  }

  if (!searchVerifyToken.value) {
    toast.add({
      title: '请先完成人机验证',
      description: '请先完成 Cloudflare 验证后再查询。',
      color: 'warning',
      icon: 'i-lucide-shield-alert'
    })
    return
  }

  verifySearchPending.value = true

  try {
    const response = await $fetch<SearchAccessResponse>('/api/memorials/search-access', {
      method: 'POST',
      body: {
        contactEmail: pendingMineEmail.value,
        turnstileToken: searchVerifyToken.value
      } satisfies SearchMemorialAccessRequest
    })

    appliedSearchValue.value = response.data.contactEmail
    appliedSearchAccessToken.value = response.data.accessToken
    verifySearchOpen.value = false
    searchVerifyToken.value = ''
    nextTick(() => searchTurnstileRef.value?.reset?.())
    resetToFirstPageAndRefresh()
  } catch (currentError) {
    toast.add({
      title: '验证失败',
      description: getErrorMessage(currentError),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    verifySearchPending.value = false
  }
}

function resetToFirstPageAndRefresh() {
  const shouldRefreshImmediately = page.value === 1
  page.value = 1

  if (shouldRefreshImmediately) {
    refreshList()
  }
}

function refreshList() {
  if (searchMine.value && (!appliedMineEmail.value || !appliedSearchAccessToken.value)) {
    data.value = createEmptyResponse()
    return
  }

  void execute()
}

function handleReloadClick() {
  refreshList()
}

function createEmptyResponse(): ApiResponse<PublicMemorialListResponseData> {
  return {
    success: true,
    message: '',
    data: {
      memorials: [],
      pagination: {
        page: 1,
        pageSize: pageSize.value,
        total: 0,
        totalPages: 1,
        sortField: 'createdAt',
        sortDirection: 'desc'
      }
    }
  }
}

function getErrorMessage(currentError: unknown) {
  if (!currentError) {
    return ''
  }

  const statusMessage = (currentError as { data?: { statusMessage?: string }; statusMessage?: string } | null)?.data?.statusMessage
    ?? (currentError as { statusMessage?: string } | null)?.statusMessage

  return statusMessage || '列表加载失败，请稍后重试。'
}
</script>

<template>
  <div class="space-y-6">
    <UCard class="rounded-2xl p-3 sm:p-4">
      <div class="space-y-4">
        <div class="space-y-2">
          <h2 class="text-2xl font-semibold text-highlighted sm:text-3xl">
            {{ props.title }}
          </h2>
          <p class="text-sm leading-6 text-muted sm:text-base">
            {{ props.description }}
          </p>
        </div>

        <div class="space-y-3">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <UInput
              v-model="searchInput"
              size="xl"
              icon="i-lucide-search"
              variant="outline"
              :ui="{
                root: 'w-full',
                base: 'rounded-xl',
                leadingIcon: 'text-muted'
              }"
              :placeholder="searchPlaceholder"
              class="w-full flex-1"
            />

            <div class="flex w-full gap-3 sm:w-auto lg:self-stretch">
              <UButton
                color="neutral"
                size="lg"
                variant="outline"
                icon="i-lucide-search"
                label="搜索"
                class="flex-1 sm:flex-none"
                :loading="isPending"
                @click="handleSearchClick"
              />
              <UButton
                color="primary"
                size="lg"
                icon="i-lucide-plus"
                label="新建祭扫"
                class="flex-1 sm:flex-none"
                @click="createModalOpen = true"
              />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-sm">
            <UCheckbox v-model="searchMine" label="以邮箱搜索我的祭扫" />
            <span v-if="searchMine && !isMineEmailValid" class="text-error">
              请输入有效邮箱
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-3 border-t border-default pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap gap-3">
            <div class="min-w-30 rounded-xl border border-default bg-default p-3">
              <p class="mb-1 text-xs font-medium tracking-wide text-muted">排序方式</p>
              <USelect
                :model-value="sortField"
                :items="sortFieldOptions"
                variant="none"
                size="md"
                class="w-full"
                :ui="{ base: 'px-0 text-base font-medium text-highlighted' }"
                @update:model-value="handleSortFieldChange"
              />
            </div>

            <div class="min-w-28 rounded-xl border border-default bg-default p-3">
              <p class="mb-1 text-xs font-medium tracking-wide text-muted">顺序</p>
              <USelect
                :model-value="sortDirection"
                :items="sortDirectionOptions"
                variant="none"
                size="md"
                class="w-full"
                :ui="{ base: 'px-0 text-base font-medium text-highlighted' }"
                @update:model-value="handleSortDirectionChange"
              />
            </div>

            <div class="min-w-32 rounded-xl border border-default bg-default p-3">
              <p class="mb-1 text-xs font-medium tracking-wide text-muted">分页</p>
              <USelect
                :model-value="pageSize"
                :items="pageSizeOptions"
                variant="none"
                size="md"
                class="w-full"
                :ui="{ base: 'px-0 text-base font-medium text-highlighted' }"
                @update:model-value="handlePageSizeChange"
              />
            </div>
          </div>

          <div class="flex flex-col gap-3 lg:items-end">
            <div class="flex items-center gap-3 text-sm text-muted">
              <span>{{ currentRangeText }}</span>
              <span v-if="isPending">正在同步...</span>
            </div>

            <UPagination
              v-if="hasMultiplePages"
              :page="page"
              :items-per-page="pageSize"
              :total="pagination.total"
              show-edges
              @update:page="page = $event"
            />
          </div>
        </div>
      </div>
    </UCard>

    <section v-if="errorMessage" class="space-y-4">
      <UCard>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <p class="text-lg font-medium text-highlighted">列表加载失败</p>
            <p class="text-sm text-muted">{{ errorMessage }}</p>
          </div>

          <UButton color="primary" variant="soft" label="重新加载" @click="handleReloadClick" />
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
        :show-manage-action="showManageAction"
        @manage="handleManage"
      />
    </section>

    <section v-else>
      <UCard>
        <div class="flex flex-col gap-5 rounded-xl p-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <p class="text-lg font-medium text-highlighted">
              {{ searchMine ? '未匹配到祭扫项' : '还没有公开的祭扫项' }}
            </p>
            <p class="text-sm text-muted">
              {{ searchMine ? '搜索查询自己的祭扫项' : '你可以成为第一个创建者，在清明时节为思念留下一处线上纪念页。' }}
            </p>
          </div>

          <UButton color="primary" variant="solid" icon="i-lucide-plus" label="立即新建" @click="createModalOpen = true" />
        </div>
      </UCard>
    </section>
  </div>

  <MemorialCreateModal v-model:open="createModalOpen" @created="handleCreated" />
  <MemorialManageModal
    v-model:open="manageModalOpen"
    :memorial="selectedMemorial"
    :contact-email="appliedSearchValue"
    @updated="handleManaged"
    @deleted="handleManaged"
  />

  <UModal
    v-model:open="verifySearchOpen"
    title="请完成验证以查询祭扫"
    description="在查询前，请先完成 Cloudflare 验证以确保您是人。加载可能需要时间，请耐心等待。"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="rounded-2xl border border-default bg-elevated/30 p-4 text-sm text-muted">
          查询邮箱：{{ pendingMineEmail }}
        </div>

        <div class="rounded-2xl border border-default bg-elevated/50 p-4">
          <ClientOnly>
            <NuxtTurnstile ref="searchTurnstileRef" v-model="searchVerifyToken" />

            <template #fallback>
              <div class="text-sm text-muted">
                正在加载 Cloudflare Turnstile 验证...
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <UButton color="neutral" variant="ghost" label="取消" :disabled="verifySearchPending" @click="verifySearchOpen = false" />
        <UButton color="primary" icon="i-lucide-search" label="验证并搜索" :loading="verifySearchPending" @click="handleConfirmMineSearch" />
      </div>
    </template>
  </UModal>
</template>
