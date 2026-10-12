'use client'

import { usePageImage } from '@/lib/hooks'
import { PAGE_STAGE_LABEL, pageStage, type PageStage } from '@/lib/pipeline'
import type { Page } from '@/lib/types'
import { cn } from '@/lib/utils'

const STAGE_DOT: Record<PageStage, string> = {
  extracted: 'bg-hairline',
  ocr: 'bg-caution',
  translated: 'bg-seal',
  cleaned: 'bg-ok',
}

export function PageStrip({
  pages,
  selectedId,
  onSelect,
}: {
  pages: Page[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (pages.length === 0) return null
  return (
    <nav aria-label="Pages" className="p-4">
      <h2 className="label-mono mb-3 text-ink-soft">
        Pages <span className="text-ink">{pages.length}</span>
      </h2>
      <ol className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {pages.map((p) => (
          <li key={p.id} className="shrink-0">
            <Thumb page={p} selected={p.id === selectedId} onSelect={() => onSelect(p.id)} />
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Thumb({ page, selected, onSelect }: { page: Page; selected: boolean; onSelect: () => void }) {
  const { url } = usePageImage(page.id, 'original', 'thumb')
  const stage = pageStage(page)
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'group flex w-28 items-center gap-3 p-1.5 text-left transition-colors lg:w-full',
        selected ? 'bg-ink text-sheet' : 'hover:bg-sheet',
      )}
    >
      <span className="relative block w-12 shrink-0 overflow-hidden bg-white ring-1 ring-hairline" style={{ aspectRatio: `${page.width ?? 1000} / ${page.height ?? 1414}` }}>
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover grayscale" />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-sm font-semibold">p.{String(page.page_number).padStart(2, '0')}</span>
        <span className={cn('flex items-center gap-1.5 text-[11px]', selected ? 'text-sheet/75' : 'text-ink-soft')}>
          <span className={cn('size-1.5 rounded-full', STAGE_DOT[stage])} aria-hidden="true" />
          {PAGE_STAGE_LABEL[stage]}
        </span>
      </span>
    </button>
  )
}
