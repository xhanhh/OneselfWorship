import type { MemorialDetailItem } from '~/types/Item'

const posterWidth = 1200
const posterHeight = 880

export function useMemorialPoster() {
  async function createPosterBlob(memorial: MemorialDetailItem, link: string) {
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
    context.fillText(`已祭扫 ${memorial.tributeCount} 次`, 974, 130)

    context.textAlign = 'left'
    context.textBaseline = 'alphabetic'
    context.font = `700 58px ${getPosterFontFamily()}`
    context.fillText('祭念扫墓', 96, 150)

    context.font = `700 86px ${getPosterFontFamily()}`
    context.fillText(limitText(context, memorial.name, 700), 96, 254)

    context.font = `400 38px ${getPosterFontFamily()}`
    const descriptionLines = wrapPosterText(
      context,
      formatPosterDescription(memorial.description),
      700,
      2
    )

    descriptionLines.forEach((line, index) => {
      context.fillText(line, 96, 360 + index * 52)
    })

    const qrImage = await loadImage(await renderQrDataUrl(link))
    context.drawImage(qrImage, 96, 480, 310, 310)

    context.font = `700 40px ${getPosterFontFamily()}`
    context.fillText('扫描二维码祭扫', 450, 654)

    const blob = await canvasToBlob(canvas)

    if (!blob) {
      throw new Error('Failed to export poster image')
    }

    return blob
  }

  return {
    createPosterBlob
  }
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
    const character = text[cursor] ?? ''
    const nextLine = currentLine + character

    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      cursor += 1
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
      currentLine = ''
      continue
    }

    lines.push(character)
    cursor += 1
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine)
  }

  if (cursor < text.length && lines.length > 0) {
    const lastLineIndex = lines.length - 1
    const lastLine = lines[lastLineIndex] ?? ''
    lines[lastLineIndex] = appendEllipsis(context, lastLine, maxWidth)
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
