import type { Page, ProjectDetail } from './types'

export type PageStage = 'extracted' | 'ocr' | 'translated' | 'cleaned'

export function pageStage(page: Page): PageStage {
  if (page.ocr_blocks.length === 0) return 'extracted'
  const allTranslated = page.ocr_blocks.every((b) => b.translation !== null)
  if (!allTranslated) return 'ocr'
  if (!page.cleaned_at) return 'translated'
  return 'cleaned'
}

export const PAGE_STAGE_LABEL: Record<PageStage, string> = {
  extracted: 'À lire',
  ocr: 'À traduire',
  translated: 'À nettoyer',
  cleaned: 'Prête',
}

export type StepState = 'done' | 'partial' | 'todo'

export type PipelineStep = {
  key: string
  label: string
  done: number
  total: number
  state: StepState
}

function stateOf(done: number, total: number): StepState {
  if (total === 0 || done === 0) return 'todo'
  if (done >= total) return 'done'
  return 'partial'
}

export function projectPipeline(project: ProjectDetail): PipelineStep[] {
  const pages = project.pages
  const pageCount = pages.length
  const filesWithPages = project.files.filter((f) =>
    pages.some((p) => p.source_file_id === f.id),
  ).length
  const ocrDone = pages.filter((p) => p.ocr_blocks.length > 0).length
  const blocks = pages.flatMap((p) => p.ocr_blocks)
  const translated = blocks.filter((b) => b.translation).length
  const cleaned = pages.filter((p) => p.cleaned_at).length

  return [
    {
      key: 'import',
      label: 'Import',
      done: project.files.length,
      total: Math.max(project.files.length, 1),
      state: project.files.length > 0 ? 'done' : 'todo',
    },
    {
      key: 'pages',
      label: 'Pages',
      done: filesWithPages,
      total: project.files.length,
      state: stateOf(filesWithPages, project.files.length),
    },
    { key: 'ocr', label: 'OCR', done: ocrDone, total: pageCount, state: stateOf(ocrDone, pageCount) },
    {
      key: 'translate',
      label: 'Traduction',
      done: translated,
      total: blocks.length,
      state: stateOf(translated, blocks.length),
    },
    { key: 'clean', label: 'Nettoyage', done: cleaned, total: pageCount, state: stateOf(cleaned, pageCount) },
    {
      key: 'export',
      label: 'Export',
      done: project.exports.length,
      total: Math.max(project.exports.length, 1),
      state: project.exports.length > 0 ? 'done' : 'todo',
    },
  ]
}

export function safeFilename(name: string) {
  return name.replace(/[^A-Za-z0-9_-]+/g, '_')
}
