import { demo } from './demo-store'
import type {
  ExportRecord,
  PageImageVariant,
  Project,
  ProjectCreate,
  ProjectDetail,
  SourceFile,
  User,
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1' || !API_URL

const TOKEN_KEY = 'taurge_token'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}))
  const detail = Array.isArray(body.detail)
    ? body.detail.map((d: { msg?: string }) => d.msg).join(' ')
    : body.detail
  if (res.status === 401) clearToken()
  return new ApiError(detail || `Erreur ${res.status}`, res.status)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    })
  } catch {
    throw new ApiError('Impossible de joindre le serveur Taurge. Vérifiez que l’API tourne.', 0)
  }
  if (!res.ok) throw await parseError(res)
  return res.json()
}

async function requestBlob(path: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() })
  if (!res.ok) throw await parseError(res)
  return res.blob()
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const post = <T = unknown>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })

const patch = <T = unknown>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

export const api = {
  async login(email: string, password: string) {
    const token = IS_DEMO
      ? await demo.login(email, password)
      : (await post<{ access_token: string }>('/auth/login', { email, password })).access_token
    saveToken(token)
  },
  register(email: string, password: string) {
    return IS_DEMO ? demo.register(email, password) : post('/auth/register', { email, password })
  },
  me(): Promise<User> {
    return IS_DEMO ? demo.me() : request('/auth/me')
  },
  listProjects(): Promise<Project[]> {
    return IS_DEMO ? demo.listProjects() : request('/projects')
  },
  getProject(id: string): Promise<ProjectDetail> {
    return IS_DEMO ? demo.getProject(id) : request(`/projects/${id}`)
  },
  createProject(payload: ProjectCreate): Promise<Project> {
    return IS_DEMO ? demo.createProject(payload) : post('/projects', payload)
  },
  async upload(projectId: string, file: File): Promise<SourceFile> {
    if (IS_DEMO) return demo.upload(projectId, file)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_URL}/projects/${projectId}/upload`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    })
    if (!res.ok) throw await parseError(res)
    return res.json()
  },
  extract(projectId: string, fileId: string) {
    return IS_DEMO
      ? demo.extract(projectId, fileId)
      : post(`/projects/${projectId}/files/${fileId}/extract`)
  },
  runOcr(projectId: string, pageId: string) {
    return IS_DEMO ? demo.runOcr(projectId, pageId) : post(`/projects/${projectId}/pages/${pageId}/ocr`)
  },
  translatePage(projectId: string, pageId: string) {
    return IS_DEMO
      ? demo.translatePage(projectId, pageId)
      : post(`/projects/${projectId}/pages/${pageId}/translate`)
  },
  cleanPage(projectId: string, pageId: string) {
    return IS_DEMO
      ? demo.cleanPage(projectId, pageId)
      : post(`/projects/${projectId}/pages/${pageId}/clean`)
  },
  updateBlockText(blockId: string, text: string) {
    return IS_DEMO ? demo.updateBlockText(blockId, text) : patch(`/ocr-blocks/${blockId}`, { text })
  },
  updateTranslation(translationId: string, text: string) {
    return IS_DEMO
      ? demo.updateTranslation(translationId, text)
      : patch(`/translations/${translationId}`, { translated_text: text })
  },
  retranslate(blockId: string) {
    return IS_DEMO ? demo.retranslate(blockId) : post(`/ocr-blocks/${blockId}/retranslate`)
  },
  exportProject(projectId: string): Promise<ExportRecord> {
    return IS_DEMO ? demo.exportProject(projectId) : post(`/projects/${projectId}/export`)
  },
  async downloadExport(projectId: string, exportId: string, filename: string) {
    if (IS_DEMO) {
      const { blob, filename: name } = await demo.downloadExport(projectId, filename)
      return triggerDownload(blob, name)
    }
    triggerDownload(await requestBlob(`/exports/${exportId}/download`), filename)
  },
  /** Returns a displayable URL. In API mode the caller must revoke it when done. */
  async pageImage(pageId: string, variant: PageImageVariant) {
    if (IS_DEMO) return { url: await demo.pageImage(pageId, variant), revocable: false }
    const path = variant === 'cleaned' ? `/pages/${pageId}/cleaned-image` : `/pages/${pageId}/image`
    return { url: URL.createObjectURL(await requestBlob(path)), revocable: true }
  },
}
