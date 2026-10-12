export const LANGUAGES = [
  { code: 'ja', label: 'Japonais', native: '日本語' },
  { code: 'ko', label: 'Coréen', native: '한국어' },
  { code: 'zh', label: 'Chinois', native: '中文' },
  { code: 'en', label: 'Anglais', native: 'English' },
  { code: 'es', label: 'Espagnol', native: 'Español' },
  { code: 'pt', label: 'Portugais', native: 'Português' },
  { code: 'fr', label: 'Français', native: 'Français' },
  { code: 'de', label: 'Allemand', native: 'Deutsch' },
] as const

export const CONTENT_TYPES = [
  { value: 'manga', label: 'Manga', hint: 'Lecture droite → gauche', defaultLang: 'ja' },
  { value: 'manhwa', label: 'Manhwa', hint: 'Coréen, souvent vertical', defaultLang: 'ko' },
  { value: 'manhua', label: 'Manhua', hint: 'Chinois', defaultLang: 'zh' },
  { value: 'webtoon', label: 'Webtoon', hint: 'Défilement vertical', defaultLang: 'ko' },
  { value: 'comic', label: 'Comic', hint: 'Gauche → droite', defaultLang: 'en' },
  { value: 'autre', label: 'Autre', hint: 'Tout le reste', defaultLang: 'en' },
] as const

export function languageLabel(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code
}

export function contentTypeLabel(value: string) {
  return CONTENT_TYPES.find((c) => c.value === value)?.label ?? value
}

export const ACCEPTED_UPLOAD = '.pdf,.png,.jpg,.jpeg,.webp'
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}
