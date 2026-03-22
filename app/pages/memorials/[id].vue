<script setup lang="ts">
import type { ApiResponse, CreateTributeResponseData, GetMemorialDetailResponseData } from '~/types/Response'
import { useTitleMeta } from '~/composables/useMeta'
import { useTime } from '~/composables/useTime'
import { useCopyText, useCurrentPageLink } from '~/composables/useVue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const tributePending = ref(false)
const posterPending = ref(false)
const posterPreviewOpen = ref(false)
const posterPreviewUrl = ref('')
const posterFile = ref<File | null>(null)
const time = useTime()
const { copy, isSupported: copySupported } = useCopyText()
const isCopied = ref(false)
const copyResetTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const id = computed(() => Number(route.params.id || 0))
const currentLink = useCurrentPageLink(computed(() => `/memorials/${id.value}`))
const canNativeSharePoster = computed(() => import.meta.client && !!posterFile.value && !!navigator.share && !!navigator.canShare?.({ files: [posterFile.value] }))
const posterWidth = 1200
const posterHeight = 880

const { data, error } = await useFetch<ApiResponse<GetMemorialDetailResponseData>>(
  `/api/memorials/${id.value}`,
  {
    key: `memorial-detail:${id.value}`
  }
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 500,
    statusMessage: error.value.statusMessage || '该祭扫详情获取失败'
  })
}

if (!data.value?.data.memorial) {
  throw createError({
    statusCode: 404,
    statusMessage: '该祭扫不存在'
  })
}

const memorial = ref(data.value.data.memorial)

useSeoMeta({
  title: useTitleMeta(memorial.value.name),
  ogTitle: useTitleMeta(memorial.value.name),
  description: memorial.value.description,
  ogDescription: memorial.value.description
})

const tributeMilestones = computed(() => [
  {
    label: '祭扫次数',
    value: `${memorial.value.tributeCount} 次`,
    icon: 'i-lucide-flame'
  },
  {
    label: '发起于',
    value: time.formatDate(memorial.value.createdAt),
    icon: 'i-lucide-calendar-days'
  },
  {
    label: '上一次祭扫',
    value: time.fromNow(memorial.value.updatedAt),
    icon: 'i-lucide-history'
  }
])

onBeforeUnmount(() => {
  if (posterPreviewUrl.value) {
    URL.revokeObjectURL(posterPreviewUrl.value)
  }

  if (copyResetTimer.value) {
    clearTimeout(copyResetTimer.value)
  }
})

async function handleCopyLink() {
  if (!copySupported.value) {
    toast.add({
      title: '当前环境不支持复制',
      description: currentLink.value,
      color: 'warning',
      icon: 'i-lucide-copy-x'
    })
    return
  }

  await copy(`我正在祭扫【${memorial.value.name}】，你也快来看看吧！\n${currentLink.value}`)

  isCopied.value = true

  if (copyResetTimer.value) {
    clearTimeout(copyResetTimer.value)
  }

  copyResetTimer.value = setTimeout(() => {
    isCopied.value = false
    copyResetTimer.value = null
  }, 2000)
}

async function handlePreviewMemorialCard() {
  if (posterPending.value) {
    return
  }

  posterPending.value = true

  try {
    const blob = await createPosterBlob()
    const fileName = `memorial-${memorial.value.id}.png`
    const file = new File([blob], fileName, { type: 'image/png' })

    if (posterPreviewUrl.value) {
      URL.revokeObjectURL(posterPreviewUrl.value)
    }

    posterFile.value = file
    posterPreviewUrl.value = URL.createObjectURL(blob)
    posterPreviewOpen.value = true
  } catch (currentError) {
    const statusMessage = (currentError as { data?: { statusMessage?: string }; statusMessage?: string } | null)?.data?.statusMessage
      ?? (currentError as { statusMessage?: string } | null)?.statusMessage

    toast.add({
      title: '生成祭念帖失败',
      description: statusMessage || '请稍后重试。',
      color: 'error',
      icon: 'i-lucide-image-off'
    })
  } finally {
    posterPending.value = false
  }
}

function handleDownloadPoster() {
  if (!posterFile.value || !posterPreviewUrl.value) {
    return
  }

  const link = document.createElement('a')
  link.href = posterPreviewUrl.value
  link.download = posterFile.value.name
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function handleSharePoster() {
  if (!posterFile.value || !canNativeSharePoster.value) {
    handleDownloadPoster()
    return
  }

  await navigator.share({
    title: `${memorial.value.name} · 清明祭扫`,
    text: '分享这张祭念帖给亲友',
    files: [posterFile.value]
  })
}

async function submitTribute() {
  if (tributePending.value) {
    return
  }

  tributePending.value = true

  try {
    const response = await $fetch<ApiResponse<CreateTributeResponseData>>(
      `/api/memorials/${id.value}/tribute`,
      {
        method: 'POST'
      }
    )

    memorial.value = response.data.memorial

    toast.add({
      title: '祭扫已完成',
      description: '愿思念常在，清明安宁',
      color: 'success',
      icon: 'i-lucide-heart-handshake'
    })
  } catch (currentError) {
    const statusMessage = (currentError as { data?: { statusMessage?: string }; statusMessage?: string } | null)?.data?.statusMessage
      ?? (currentError as { statusMessage?: string } | null)?.statusMessage

    toast.add({
      title: '祭扫失败',
      description: statusMessage || '请稍后重试。',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    tributePending.value = false
  }
}

function onlyCopyLink() {

  if (!copySupported.value) {
    toast.add({
      title: '当前环境不支持复制',
      description: currentLink.value,
      color: 'warning',
      icon: 'i-lucide-copy-x'
    })
    return
  }

  copy(currentLink.value)
  toast.add(
      {
        title: '复制成功',
        description: '复制链接成功',
        color: 'success',
        icon: 'i-lucide-copy-check'
      }
  )
}

async function createPosterBlob() {
  if (!import.meta.client) {
    throw new Error('Poster generation is only available in the browser')
  }

  await document.fonts?.ready

  const canvas = document.createElement('canvas')
  canvas.width = posterWidth
  canvas.height = posterHeight

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Canvas context is unavailable')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, posterWidth, posterHeight)

  drawRoundedRect(context, 844, 96, 260, 64, 32, '#ffffff', '#000000', 3)

  context.fillStyle = '#000000'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `700 30px ${getPosterFontFamily()}`
  context.fillText(`已祭扫 ${memorial.value.tributeCount} 次`, 974, 130)

  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.font = `700 58px ${getPosterFontFamily()}`
  context.fillText('祭念扫墓', 96, 150)

  context.font = `700 86px ${getPosterFontFamily()}`
  context.fillText(limitText(context, memorial.value.name, 700), 96, 254)

  context.font = `400 38px ${getPosterFontFamily()}`
  const descriptionLines = wrapPosterText(
    context,
    formatPosterDescription(memorial.value.description),
    700,
    2
  )

  descriptionLines.forEach((line, index) => {
    context.fillText(line, 96, 360 + index * 52)
  })

  const qrImage = await loadImage(await renderQrDataUrl(currentLink.value))
  context.drawImage(qrImage, 96, 480, 310, 310)

  context.font = `700 40px ${getPosterFontFamily()}`
  context.fillText('扫描二维码祭扫', 450, 654)

  const blob = await canvasToBlob(canvas)

  if (!blob) {
    throw new Error('Failed to export poster image')
  }

  return blob
}

async function renderQrDataUrl(value: string) {
  const uqr = await import('uqr')
  const qrSvg = uqr.renderSVG(value, {
    pixelSize: 10,
    border: 1,
    whiteColor: '#ffffff',
    blackColor: '#000000'
  }) as string

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image loading failed'))
    image.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string,
  strokeStyle: string,
  lineWidth: number
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
  context.fillStyle = fillStyle
  context.fill()
  context.lineWidth = lineWidth
  context.strokeStyle = strokeStyle
  context.stroke()
}

function wrapPosterText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const lines: string[] = []
  let currentLine = ''
  let cursor = 0

  while (cursor < text.length && lines.length < maxLines) {
    const character = text[cursor]
    const nextLine = currentLine + character

    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      cursor += 1
      continue
    }

    if (!currentLine) {
      currentLine = character
      cursor += 1
    }

    lines.push(currentLine)
    currentLine = ''
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine)
  }

  if (cursor < text.length && lines.length) {
    lines[lines.length - 1] = appendEllipsis(context, lines[lines.length - 1], maxWidth)
  }

  return lines
}

function appendEllipsis(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  let output = text
  const ellipsis = '...'

  while (output && context.measureText(output + ellipsis).width > maxWidth) {
    output = output.slice(0, -1)
  }

  return `${output}${ellipsis}`
}

function limitText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) {
    return text
  }

  return appendEllipsis(context, text, maxWidth)
}

function formatPosterDescription(value: string) {
  const normalizedValue = value.replace(/\s+/g, ' ').trim()
  return normalizedValue ? `“${normalizedValue}”` : ''
}

function getPosterFontFamily() {
  return '"Noto Serif SC","Source Han Serif SC","Songti SC","STSong","SimSun","Microsoft YaHei","PingFang SC",serif'
}
</script>

<template>
  <UContainer class="py-8 sm:py-10">
    <div class="space-y-6">
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          @click="router.back"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          label="返回"
        />
        <UBadge color="primary" variant="soft">
          祭奠详情
        </UBadge>
      </div>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <UCard
          :ui="{
            header: 'space-y-5',
            body: 'space-y-6'
          }"
        >
          <template #header>
            <div class="space-y-4">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0 space-y-3">
                  <UBadge color="primary" variant="subtle">
                    祭奠扫墓
                  </UBadge>

                  <div class="min-w-0 space-y-2">
                    <h1 class="truncate text-3xl noto-serif font-extrabold tracking-tight text-highlighted sm:text-4xl">
                      {{ memorial.name }}
                    </h1>
                    <p class="block max-w-full truncate text-sm text-muted underline underline-offset-4 cursor-pointer" @click="onlyCopyLink">
                      {{ currentLink }}
                    </p>
                  </div>
                </div>

                <div class="min-w-36 rounded-3xl border border-primary/20 bg-primary/6 px-5 py-4 text-center">
                  <p class="text-sm text-muted">当前祭扫次数</p>
                  <p class="mt-2 text-3xl font-semibold text-highlighted">
                    {{ memorial.tributeCount }}
                  </p>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <div
                  v-for="item in tributeMilestones"
                  :key="item.label"
                  class="rounded-2xl border border-default bg-elevated/70 p-4"
                >
                  <div class="flex items-center gap-2 text-sm text-muted">
                    <UIcon :name="item.icon" class="size-4" />
                    <span>{{ item.label }}</span>
                  </div>
                  <p class="mt-3 text-base font-medium text-highlighted">
                    {{ item.value }}
                  </p>
                </div>
              </div>
            </div>
          </template>

          <div class="rounded-3xl border border-default bg-elevated/40 p-5 sm:p-6">
            <p class="text-sm font-medium tracking-wide text-muted">
              生平与简介
            </p>
            <div class="mt-4 whitespace-pre-line text-base leading-8 text-toned">
              {{ memorial.description }}
            </div>
          </div>
        </UCard>

        <div class="space-y-6">
          <UCard>
            <template #header>
              <div class="space-y-2">
                <h2 class="text-xl font-semibold text-highlighted">
                  为 ta 祭扫
                </h2>
                <p class="text-sm leading-6 text-muted">
                  所有人都可以为 ta 祭扫，并会计入到总祭扫次数中。
                </p>
              </div>
            </template>

            <div class="space-y-5">
              <div class="rounded-2xl border bg-linear-to-br p-5">
                <div class="flex items-center gap-3">
                  <div class="flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <UIcon name="i-lucide-candlestick-chart" class="size-6 text-primary" />
                  </div>

                  <div>
                    <p class="text-sm text-muted">温馨提示</p>
                    <p class="text-base font-medium text-highlighted">
                      一次祭扫，寄托一份思念
                    </p>
                  </div>
                </div>
              </div>

              <UButton
                block
                size="xl"
                color="primary"
                variant="solid"
                icon="i-lucide-flame"
                :loading="tributePending"
                label="祭扫"
                @click="submitTribute"
              />
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="space-y-2">
                <h2 class="text-lg font-semibold text-highlighted">
                  相关信息
                </h2>
                <p class="text-sm text-muted">
                  这是一份可公开访问的祭奠，可分享给亲朋好友共同祭扫。
                </p>
              </div>
            </template>

            <div class="space-y-4 text-sm">
              <div class="flex flex-wrap gap-3 pb-2">
                <UButton
                  color="primary"
                  :icon="isCopied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                  :label="isCopied ? '已复制' : '复制分享'"
                  @click="handleCopyLink"
                />
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-scroll-text"
                  :loading="posterPending"
                  label="查看祭念帖"
                  @click="handlePreviewMemorialCard"
                />
              </div>

              <div class="flex items-center justify-between gap-4 border-t border-default pt-4">
                <span class="text-muted">纪念 ID</span>
                <code class="rounded-lg bg-elevated px-2 py-1 text-highlighted">{{ memorial.id }}</code>
              </div>
            </div>
          </UCard>
        </div>
      </section>
    </div>

    <UModal v-model:open="posterPreviewOpen" title="祭念帖预览" description="生成的图片祭念贴">
      <template #body>
        <div class="space-y-4">
          <div class="overflow-hidden rounded-2xl border border-default bg-elevated/40 p-2">
            <img v-if="posterPreviewUrl" :src="posterPreviewUrl" alt="祭念帖预览" class="w-full rounded-xl" >
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            label="下载祭念帖"
            icon="i-lucide-download"
            @click="handleDownloadPoster"
          />
          <UButton
            color="primary"
            variant="solid"
            :label="canNativeSharePoster ? '分享祭念帖' : '下载后分享'"
            icon="i-lucide-share-2"
            @click="handleSharePoster"
          />
        </div>
      </template>
    </UModal>
  </UContainer>
</template>