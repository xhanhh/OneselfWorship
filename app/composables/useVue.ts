import { breakpointsTailwind, useBreakpoints, useClipboard } from '@vueuse/core'
import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

export function useIsMobile(): ComputedRef<boolean> {
    const breakpoints = useBreakpoints(breakpointsTailwind)
    return breakpoints.smallerOrEqual("sm")
}

export function useIsDesktop(): ComputedRef<boolean> {
    const breakpoints = useBreakpoints(breakpointsTailwind)
    return breakpoints.greaterOrEqual("lg")
}

export function useCurrentPageLink(path: MaybeRefOrGetter<string>): ComputedRef<string> {
  const requestURL = useRequestURL()

  return computed(() => {
    const resolvedPath = toValue(path)
    const origin = import.meta.client ? window.location.origin : requestURL.origin

    return new URL(resolvedPath, origin).toString()
  })
}

export function useCopyText() {
  const { copy, copied, isSupported } = useClipboard()

  return {
    copy,
    copied,
    isSupported
  }
}