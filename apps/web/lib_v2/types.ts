export type ContentType = 'manga' | 'manhwa' | 'manhua' | 'webtoon' | 'comic' | 'autre'

export type Translation = {
  id: string
  translated_text: string
  provider: string
  edited_by_user: boolean
}

export type OcrBlock = {
  id: string
  text: string
  bbox_x: number
  bbox_y: number
  bbox_w: number
  bbox_h: number
  confidence: number
  provider: string
  translation: Translation | null
}

export type Page = {
  id: string
  source_file_id: string
  page_number: number
  width: number | null
  height: number | null
  created_at: string
  ocr_blocks: OcrBlock[]
  cleaned_at: string | null
}

export type SourceFile = {
  id: string
  original_filename: string
  file_type: string
  size_bytes: number
  created_at: string
}

export type ExportRecord = {
  id: string
  format: string
  created_at: string
}

export type Project = {
  id: string
  name: string
  source_lang: string
  target_lang: string
  content_type: string
  created_at: string
}

export type ProjectDetail = Project & {
  files: SourceFile[]
  pages: Page[]
  exports: ExportRecord[]
}

export type User = {
  id: string
  email: string
}

export type ProjectCreate = {
  name: string
  source_lang: string
  target_lang: string
  content_type: string
}

export type PageImageVariant = 'original' | 'cleaned'
