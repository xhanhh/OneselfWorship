import { getRouterParam } from 'h3'
import { Resvg } from '@resvg/resvg-js'
import prisma from '~~/server/utils/prisma'
import { notFound, requireIntegerRouteParam } from '#server/utils/api'
import { memorialSelect, toMemorialDetailItem } from '#server/utils/memorial'

export default defineEventHandler(async (event) => {
  const id = requireIntegerRouteParam(getRouterParam(event, 'id'), 'id')

  const memorialRecord = await prisma.memorial.findFirst({
    where: {
      id,
      status: 'PUBLISHED',
      is_del: false
    },
    select: memorialSelect
  })

  if (!memorialRecord) {
    notFound('Memorial not found')
  }

  const memorial = toMemorialDetailItem(memorialRecord)
  const qrSvg = await renderQrSvg(`/memorials/${memorial.id}`)
  const posterSvg = createPosterSvg({
    memorial,
    qrSvg
  })

  const pngData = new Resvg(posterSvg, {
    fitTo: {
      mode: 'width',
      value: 1200
    }
  }).render().asPng()

  setHeader(event, 'content-type', 'image/png')
  setHeader(event, 'cache-control', 'public, max-age=300')
  return pngData
})

async function renderQrSvg(value: string) {
  const uqr = await import('uqr')

  return uqr.renderSVG(value, {
    pixelSize: 10,
    border: 1,
    whiteColor: '#ffffff',
    blackColor: '#000000'
  }) as string
}

function createPosterSvg(input: {
  memorial: {
    name: string
    description: string
    tributeCount: number
  }
  qrSvg: string
}) {
  const escapedName = escapeXml(input.memorial.name)
  const preDesc = escapeXml(formatDescription(input.memorial.description))
  const escapedDescription = preDesc.length > 26 ? preDesc.substring(0, 26) + '...' : preDesc
  const badgeText = escapeXml(`已祭扫 ${input.memorial.tributeCount} 次`)
  const qrInner = input.qrSvg
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '')

  return `
  <svg width="1200" height="880" viewBox="0 0 1200 880" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      text {
        font-family: serif;
        fill: #000000;
      }
    </style>

    <rect width="1200" height="900" fill="#FFFFFF"/>

    <rect x="844" y="96" width="260" height="64" rx="32" fill="#FFFFFF" stroke="#000000" stroke-width="3"/>
    <text x="974" y="137" text-anchor="middle" font-size="30" font-weight="700">${badgeText}</text>

    <text x="96" y="150" font-size="58" font-weight="700">沉重祭奠：</text>
    <text x="96" y="254" font-size="86" font-weight="700">${escapedName}</text>
    <text x="96" y="360" font-size="38" font-weight="400">${escapedDescription}</text>

    <g transform="translate(96 452)">
      ${qrInner}
    </g>

    <text x="392" y="632" font-size="42" font-weight="700">扫描二维码祭扫</text>
  </svg>`
}

function formatDescription(value: string) {
  const normalizedValue = value.replace(/\s+/g, ' ').trim()
  const shortenedValue = normalizedValue.length > 84
    ? `${normalizedValue.slice(0, 84)}...`
    : normalizedValue

  return `　${shortenedValue}`
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}