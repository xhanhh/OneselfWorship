<script setup lang="ts">
import type { PublicMemorialListItem } from '~/types/Item'
import type { DeleteMemorialRequest, UpdateMemorialRequest } from '~/types/Request'
import type { ApiResponse, DeleteMemorialResponseData, UpdateMemorialResponseData } from '~/types/Response'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  memorial: PublicMemorialListItem | null
  contactEmail: string
}>()

const emit = defineEmits<{
  updated: []
  deleted: []
}>()

const toast = useToast()
const turnstileRef = ref<{ reset?: () => void } | null>(null)
const confirmDeleteOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

const formState = reactive<UpdateMemorialFormState>(createDefaultFormState())

type UpdateMemorialFormState = {
  name: string
  description: string
  contactEmail: string
  turnstileToken: string
}

watch(
  () => [open.value, props.memorial, props.contactEmail],
  () => {
    if (!open.value || !props.memorial) {
      return
    }

    formState.name = props.memorial.name
    formState.description = props.memorial.description
    formState.contactEmail = props.contactEmail
    formState.turnstileToken = ''
    confirmDeleteOpen.value = false
    nextTick(() => turnstileRef.value?.reset?.())
  },
  { immediate: true }
)

function createDefaultFormState(): UpdateMemorialFormState {
  return {
    name: '',
    description: '',
    contactEmail: '',
    turnstileToken: ''
  }
}

function validateForm(state: UpdateMemorialFormState) {
  const errors: Array<{ name: keyof UpdateMemorialFormState; message: string }> = []

  if (!state.name.trim()) {
    errors.push({ name: 'name', message: '请输入祭扫姓名' })
  }

  if (!state.description.trim()) {
    errors.push({ name: 'description', message: '请输入祭扫项简介' })
  }

  if (!state.contactEmail.trim()) {
    errors.push({ name: 'contactEmail', message: '请输入邮箱' })
  } else if (!emailPattern.test(state.contactEmail.trim())) {
    errors.push({ name: 'contactEmail', message: '请输入有效的邮箱地址' })
  }

  if (!state.turnstileToken) {
    errors.push({ name: 'turnstileToken', message: '请先完成人机验证' })
  }

  return errors
}

async function submitForm() {
  if (!props.memorial || isSubmitting.value || isDeleting.value) {
    return
  }

  isSubmitting.value = true

  try {
    await $fetch<ApiResponse<UpdateMemorialResponseData>>(`/api/memorials/${props.memorial.id}`, {
      method: 'PATCH',
      body: {
        name: formState.name,
        description: formState.description,
        contactEmail: formState.contactEmail,
        turnstileToken: formState.turnstileToken
      } satisfies UpdateMemorialRequest
    })

    toast.add({
      title: '修改成功',
      description: '该祭扫已经更新。',
      color: 'success',
      icon: 'i-lucide-pencil-line'
    })

    emit('updated')
    open.value = false
  } catch (error) {
    toast.add({
      title: '修改失败',
      description: getErrorMessage(error),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isSubmitting.value = false
  }
}

function requestDeleteConfirmation() {
  if (!props.memorial || isSubmitting.value || isDeleting.value) {
    return
  }

  if (!formState.turnstileToken) {
    toast.add({
      title: '请先完成人机验证',
      description: '删除需要先完成 Cloudflare 验证',
      color: 'warning',
      icon: 'i-lucide-shield-alert'
    })
    return
  }

  confirmDeleteOpen.value = true
}

async function handleDelete() {
  if (!props.memorial || isSubmitting.value || isDeleting.value) {
    return
  }

  isDeleting.value = true

  try {
    await $fetch<ApiResponse<DeleteMemorialResponseData>>(`/api/memorials/${props.memorial.id}`, {
      method: 'DELETE',
      body: {
        contactEmail: formState.contactEmail,
        turnstileToken: formState.turnstileToken
      } satisfies DeleteMemorialRequest
    })

    toast.add({
      title: '删除成功',
      description: '该祭扫已被删除',
      color: 'success',
      icon: 'i-lucide-trash-2'
    })

    confirmDeleteOpen.value = false
    emit('deleted')
    open.value = false
  } catch (error) {
    toast.add({
      title: '删除失败',
      description: getErrorMessage(error),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isDeleting.value = false
  }
}

function handleAfterLeave() {
  Object.assign(formState, createDefaultFormState())
  confirmDeleteOpen.value = false
  nextTick(() => turnstileRef.value?.reset?.())
}

function getErrorMessage(error: unknown) {
  const statusMessage = (error as { data?: { statusMessage?: string }; statusMessage?: string } | null)?.data?.statusMessage
    ?? (error as { statusMessage?: string } | null)?.statusMessage

  return statusMessage || '请稍后重试。'
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="管理祭扫项"
    description="默认是修改，若确认不再保留，也可以直接删除。"
    :dismissible="!isSubmitting && !isDeleting"
    :close="!isSubmitting && !isDeleting"
    :ui="{ content: 'sm:max-w-2xl' }"
    @after:leave="handleAfterLeave"
  >
    <template #body>
      <UForm :state="formState" :validate="validateForm" class="space-y-5" @submit="submitForm">
        <UFormField label="姓名" name="name" required>
          <UInput v-model="formState.name" size="lg" maxlength="80" placeholder="请输入祭扫项姓名" class="w-full" />
        </UFormField>

        <UFormField label="简介" name="description" required>
          <UTextarea v-model="formState.description" :rows="5" maxlength="2000" placeholder="请输入祭扫项简介" class="w-full" />
        </UFormField>

        <UFormField label="凭证邮箱" name="contactEmail" required>
          <UInput v-model="formState.contactEmail" size="lg" type="email" maxlength="254" placeholder="请输入创建时填写的邮箱或管理员邮箱" class="w-full" />
        </UFormField>

        <UFormField label="人机验证" name="turnstileToken" required>
          <div class="rounded-2xl border border-default bg-elevated/50 p-4">
            <ClientOnly>
              <NuxtTurnstile ref="turnstileRef" v-model="formState.turnstileToken" />

              <template #fallback>
                <div class="text-sm text-muted">
                  正在加载 Cloudflare Turnstile 验证...
                </div>
              </template>
            </ClientOnly>
          </div>
        </UFormField>

        <div class="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <UButton
            type="button"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            label="删除祭扫"
            :disabled="isSubmitting"
            @click="requestDeleteConfirmation"
          />

          <div class="flex flex-col-reverse gap-3 sm:flex-row">
            <UButton type="button" color="neutral" variant="ghost" label="取消" :disabled="isSubmitting || isDeleting" @click="open = false" />
            <UButton type="submit" label="保存修改" icon="i-lucide-save" :loading="isSubmitting" :disabled="isDeleting" />
          </div>
        </div>
      </UForm>
    </template>
  </UModal>

  <UModal
    v-model:open="confirmDeleteOpen"
    title="确认删除祭扫"
    description="删除后将无法在公开列表中查看"
    :dismissible="!isDeleting"
    :close="!isDeleting"
    :ui="{ content: 'sm:max-w-md' }"
  >
    <template #body>
      <div class="space-y-3 text-sm text-muted">
        <p>将要删除：{{ props.memorial?.name || '当前祭扫项' }}</p>
        <p>请确认删除，此操作会永久移除该祭扫</p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <UButton type="button" color="neutral" variant="ghost" label="返回" :disabled="isDeleting" @click="confirmDeleteOpen = false" />
        <UButton type="button" color="error" variant="solid" icon="i-lucide-trash-2" label="确认删除" :loading="isDeleting" @click="handleDelete" />
      </div>
    </template>
  </UModal>
</template>