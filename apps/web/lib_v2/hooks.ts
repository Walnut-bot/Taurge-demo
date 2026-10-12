'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ApiError, api, getToken } from './api'
import type { PageImageVariant } from './types'

const subscribe = (cb: () => void) => {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}

/** Redirects to /login when no session token is present. Returns true once authorized. */
export function useRequireAuth() {
  const router = useRouter()
  const token = useSyncExternalStore(subscribe, getToken, () => undefined)
  const ready = token !== undefined
  useEffect(() => {
    if (ready && !token) router.replace('/login')
  }, [ready, token, router])
  return Boolean(token)
}

function onAuthError(err: unknown, router: ReturnType<typeof useRouter>) {
  if (err instanceof ApiError && err.status === 401) router.replace('/login')
}

export function useMe(enabled: boolean) {
  return useSWR(enabled ? 'me' : null, () => api.me())
}

export function useProjects(enabled: boolean) {
  const router = useRouter()
  return useSWR(enabled ? 'projects' : null, () => api.listProjects(), {
    onError: (e) => onAuthError(e, router),
  })
}

export function useProject(id: string, enabled: boolean) {
  const router = useRouter()
  return useSWR(enabled ? ['project', id] : null, () => api.getProject(id), {
    onError: (e) => onAuthError(e, router),
    revalidateOnFocus: false,
  })
}

/** Loads an (authenticated) page image and manages object-URL lifetime. */
export function usePageImage(pageId: string, variant: PageImageVariant, version: string) {
  const [state, setState] = useState<{ key: string; url: string | null; error: boolean }>({
    key: '',
    url: null,
    error: false,
  })
  const key = `${pageId}:${variant}:${version}`

  useEffect(() => {
    let cancelled = false
    let revoke: string | null = null
    api
      .pageImage(pageId, variant)
      .then(({ url, revocable }) => {
        if (revocable) revoke = url
        if (!cancelled) setState({ key, url, error: false })
      })
      .catch(() => {
        if (!cancelled) setState({ key, url: null, error: true })
      })
    return () => {
      cancelled = true
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [pageId, variant, key])

  const current = state.key === key
  return { url: current ? state.url : null, error: current && state.error }
}
