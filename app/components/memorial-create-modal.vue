<script setup lang="ts">
import type { CreateMemorialRequest } from '~/types/Request'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  created: []
}>()

const toast = useToast()
const turnstileRef = ref<{ reset?: () => void } | null>(null)
const isSubmitting = ref(false)
const formState = reactive<CreateMemorialFormState>(createDefaultFormState())

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i

type CreateMemorialFormState = Pick<
  CreateMemorialRequest,
  'name' | 'description' | 'contactEmail' | 'turnstileToken'
>

function createDefaultFormState(): CreateMemorialFormState {
  return {
    name: '',
    description: '',
    contactEmail: '',
    turnstileToken: ''
  }
}

function validateForm(state: CreateMemorialFormState) {
  const errors: Array<{ name: keyof CreateMemorialFormState; message: string }> = []

  if (!state.name.trim()) {
    errors.push({ name: 'name', message: '请输入祭扫对象姓名' })
  }

  if (!state.description.trim()) {
    errors.push({ name: 'description', message: '请输入祭扫描述' })
  }

  if (!state.contactEmail.trim()) {
    errors.push({ name: 'contactEmail', message: '请输入联系邮箱' })
  } else if (!emailPattern.test(state.contactEmail.trim())) {
    errors.push({ name: 'contactEmail', message: '请输入有效的邮箱地址' })
  }

  if (!state.turnstileToken) {
    errors.push({ name: 'turnstileToken', message: '请先完成人机验证' })
  }

  return errors
}

async function submitForm() {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    await $fetch('/api/memorials', {
      method: 'POST',
      body: {
        name: formState.name,
        description: formState.description,
        contactEmail: formState.contactEmail,
        turnstileToken: formState.turnstileToken
      }
    })

    toast.add({
      title: '创建成功',
      description: '祭扫已创建成功',
      color: 'success',
      icon: 'i-lucide-circle-check-big'
    })

    emit('created')
    open.value = false
  } catch (error) {
    toast.add({
      title: '创建失败',
      description: getErrorMessage(error),
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    isSubmitting.value = false
  }
}

function handleAfterLeave() {
  Object.assign(formState, createDefaultFormState())
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
    title="新建祭扫"
    description="为ta祭扫，请注意遵守当地法律"
    :dismissible="!isSubmitting"
    :close="!isSubmitting"
    :ui="{ content: 'sm:max-w-2xl' }"
    @after:leave="handleAfterLeave"
  >
    <template #body>
      <UForm :state="formState" :validate="validateForm" class="space-y-5" @submit="submitForm">
        <UFormField label="姓名" name="name" required>
          <UInput
            v-model="formState.name"
            size="lg"
            maxlength="80"
            placeholder="如：张三或张三先人，可以填自己的名字"
            class="w-full"
          />
        </UFormField>

        <UFormField label="描述" name="description" required>
          <UTextarea
            v-model="formState.description"
            :rows="5"
            maxlength="2000"
            placeholder="写下一段介绍、追思或生平片段"
            class="w-full"
          />
        </UFormField>

        <UFormField label="联系邮箱" name="contactEmail" required>
          <UInput
            v-model="formState.contactEmail"
            size="lg"
            type="email"
            maxlength="254"
            placeholder="用于后续修改或删除祭扫"
            class="w-full"
          />
        </UFormField>

        <UFormField label="验证码" description="加载可能需要时间，请耐心等待" name="turnstileToken" required>
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

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            label="取消"
            :disabled="isSubmitting"
            @click="open = false"
          />
          <UButton
            type="submit"
            label="发布祭扫"
            icon="i-lucide-plus"
            :loading="isSubmitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>