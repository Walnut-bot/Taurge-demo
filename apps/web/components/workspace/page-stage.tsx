'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Columns, Eye } from 'lucide-react'
import { PageCanvas } from '@/components/page-canvas'
import { Button } from '@/components/ui/button'
import { IS_DEMO, api } from '@/lib/api'
import { usePageImage } from '@/lib/hooks'
import { pageStage } from '@/lib/pipeline'
import type { Page } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { Runner } from './workspace'

type View = 'original' | 'cleaned'

type Props = {
  page: Page
  pageIndex: number
  pageCount: number
  projectId: string
  busy: string | null
  run: Runner
  activeBlockId: string | null
  hoverBlockId: string | null
  onSelectBlock: (id: string) => void
  onHoverBlock: (id: string | null) => void
  onNavigate: (dir: -1 | 1) => void
}

const NEXT_ACTION = {
  extracted: { key: 'ocr', label: 'Lire les bulles (OCR)', done: 'Bulles détectées.' },
  ocr: { key: 'translate', label: 'Traduire la page', done: 'Page traduite. Relisez chaque bulle.' },
  translated: { key: 'clean', label: 'Nettoyer les bulles', done: 'Bulles nettoyées.' },
} as const

export function PageStage(props: Props) {
  const { page, pageIndex, pageCount, projectId, busy, run } = props
  const stage = pageStage(page)
  const [view, setView] = useState<View>(page.cleaned_at ? 'cleaned' : 'original')
  const [lettering, setLettering] = useState(true)
  const [fontSizeScale, setFontSizeScale] = useState(1)
  const [isBold, setIsBold] = useState(true)
  const [isItalic, setIsItalic] = useState(false)
  const [isUppercase, setIsUppercase] = useState(false)
  const [fontFamily, setFontFamily] = useState<'sans' | 'comic' | 'serif' | 'mono'>('comic')
  const [textColor, setTextColor] = useState('#000000')
  const [strokeStyle, setStrokeStyle] = useState<'none' | 'white' | 'black'>('none')
  const [shadowStyle, setShadowStyle] = useState<'none' | 'soft' | 'strong'>('none')
  const [bubbleShape, setBubbleShape] = useState<'diamond' | 'rectangle'>('diamond')
  const [paddingRatio, setPaddingRatio] = useState<number>(0.20)
  const [isQcMode, setIsQcMode] = useState(false)
  const [splitPos, setSplitPos] = useState(50)
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const [isPeekingOriginal, setIsPeekingOriginal] = useState(false)
  const stageContainerRef = useRef<HTMLDivElement>(null)

  const effectiveView: View = page.cleaned_at ? view : 'original'
  const { url: originalUrl } = usePageImage(page.id, 'original', 'raw')
  const { url: cleanedUrl, error: cleanedError } = usePageImage(
    page.id,
    page.cleaned_at ? 'cleaned' : 'original',
    page.cleaned_at ?? 'raw',
  )
  const displayUrl = isPeekingOriginal ? originalUrl : (effectiveView === 'cleaned' ? cleanedUrl : originalUrl)
  const error = effectiveView === 'cleaned' ? cleanedError : false

  // Raccourci clavier de comparaison rapide : maintenir la touche C affiche temporairement la RAW
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.key === 'c' || e.key === 'C') {
        setIsPeekingOriginal(true)
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'c' || e.key === 'C') {
        setIsPeekingOriginal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Déplacement du curseur rideau QC à la souris
  useEffect(() => {
    if (!isDraggingSplit) return
    function handleMouseMove(e: MouseEvent) {
      if (!stageContainerRef.current) return
      const rect = stageContainerRef.current.getBoundingClientRect()
      const pct = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100))
      setSplitPos(Math.round(pct))
    }
    function handleMouseUp() {
      setIsDraggingSplit(false)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingSplit])

  const next = stage === 'cleaned' ? null : NEXT_ACTION[stage]
  const working = busy === `${next?.key}:${page.id}`

  async function runNext() {
    if (!next) return
    const fn =
      next.key === 'ocr'
        ? () => api.runOcr(projectId, page.id)
        : next.key === 'translate'
          ? () => api.translatePage(projectId, page.id)
          : () => api.cleanPage(projectId, page.id)
    const ok = await run(`${next.key}:${page.id}`, next.done, fn)
    if (ok && next.key === 'clean') setView('cleaned')
  }

  const handleUpdateBbox = async (blockId: string, bbox: { bbox_x: number; bbox_y: number; bbox_w: number; bbox_h: number }) => {
    try {
      await api.updateBlockBbox(blockId, bbox)
      const blk = page.ocr_blocks.find((b) => b.id === blockId)
      if (blk) {
        blk.bbox_x = bbox.bbox_x
        blk.bbox_y = bbox.bbox_y
        blk.bbox_w = bbox.bbox_w
        blk.bbox_h = bbox.bbox_h
      }
    } catch (err) {
      console.error('Failed to update block bbox', err)
    }
  }

  const hasTranslations = page.ocr_blocks.some((b) => b.translation)
  const totalBlocks = page.ocr_blocks.length
  const reviewedBlocks = page.ocr_blocks.filter((b) => b.translation?.edited_by_user).length
  const allReviewed = totalBlocks > 0 && reviewedBlocks === totalBlocks

  return (
    <section aria-label={`Page ${page.page_number}`} className="flex min-w-0 flex-col bg-paper">
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-3 py-2 sm:px-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => props.onNavigate(-1)}
            disabled={pageIndex === 0}
            aria-label="Page précédente"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="w-16 text-center font-mono text-sm">
            <span className="font-semibold">{String(page.page_number).padStart(2, '0')}</span>
            <span className="text-ink-soft"> / {String(pageCount).padStart(2, '0')}</span>
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => props.onNavigate(1)}
            disabled={pageIndex === pageCount - 1}
            aria-label="Page suivante"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>

        {page.cleaned_at && (
          <div role="group" aria-label="Affichage" className="flex items-center ring-1 ring-ink">
            {(['original', 'cleaned'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={!isQcMode && effectiveView === v}
                onClick={() => {
                  setIsQcMode(false)
                  setView(v)
                }}
                className={cn(
                  'h-8 px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal',
                  !isQcMode && effectiveView === v ? 'bg-ink text-sheet' : 'hover:bg-muted',
                )}
              >
                {v === 'original' ? 'Original' : 'Nettoyée'}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={isQcMode}
              onClick={() => setIsQcMode(!isQcMode)}
              className={cn(
                'h-8 px-3 text-xs font-semibold flex items-center gap-1.5 transition-colors border-l border-ink',
                isQcMode ? 'bg-seal text-seal-ink' : 'hover:bg-muted text-ink'
              )}
              title="Activer le comparateur rideau QC (RAW vs VF)"
            >
              <Columns className="size-3.5" />
              <span>Rideau QC</span>
            </button>
          </div>
        )}

        {totalBlocks > 0 && (
          <div className="hidden sm:flex items-center gap-2 border-l border-hairline pl-3 font-mono text-[11px]">
            <span
              className={cn(
                'px-2 py-0.5 rounded font-bold',
                allReviewed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              )}
              title="Concordance QC : bulles relues / total détecté"
            >
              QC : {reviewedBlocks}/{totalBlocks} relues
            </span>
            <span className="text-ink-soft hidden md:inline" title="Raccourci clavier de comparaison">
              Touche <kbd className="font-bold text-ink">C</kbd> = Peek RAW
            </span>
          </div>
        )}

        {hasTranslations && (
          <div className="flex flex-wrap items-center gap-2 border-l border-hairline pl-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium">
              <input
                type="checkbox"
                checked={lettering}
                onChange={(e) => setLettering(e.target.checked)}
                className="size-4 accent-seal"
              />
              Texte traduit
            </label>

            {lettering && (
              <div className="flex items-center gap-1 rounded bg-sheet px-1.5 py-0.5 text-xs">
                <span className="text-[11px] text-ink-soft">Taille :</span>
                <select
                  value={fontSizeScale}
                  onChange={(e) => setFontSizeScale(Number(e.target.value))}
                  className="rounded border border-hairline bg-paper px-1 py-0.5 text-xs font-medium"
                >
                  <option value={0.75}>Petite (75%)</option>
                  <option value={1}>Normale (100%)</option>
                  <option value={1.3}>Grande (130%)</option>
                  <option value={1.6}>Très grande (160%)</option>
                  <option value={2}>Double (200% - 2x)</option>
                  <option value={2.5}>Énorme (250% - 2.5x)</option>
                  <option value={3}>Maximale (300% - 3x)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className={cn(
                    'size-6 rounded font-bold transition-colors',
                    isBold ? 'bg-ink text-paper' : 'hover:bg-paper'
                  )}
                  title="Gras"
                >
                  G
                </button>

                <button
                  type="button"
                  onClick={() => setIsItalic(!isItalic)}
                  className={cn(
                    'size-6 rounded italic transition-colors',
                    isItalic ? 'bg-ink text-paper' : 'hover:bg-paper'
                  )}
                  title="Italique"
                >
                  I
                </button>

                <button
                  type="button"
                  onClick={() => setIsUppercase(!isUppercase)}
                  className={cn(
                    'size-6 rounded text-[10px] font-bold transition-colors',
                    isUppercase ? 'bg-ink text-paper' : 'hover:bg-paper'
                  )}
                  title="Majuscules"
                >
                  AA
                </button>

                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value as any)}
                  className="rounded border border-hairline bg-paper px-1 py-0.5 text-xs font-medium"
                  title="Style de police"
                >
                  <option value="comic">Manga / BD</option>
                  <option value="sans">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>

                <label className="flex items-center gap-1 cursor-pointer px-0.5" title="Couleur du texte">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="size-5 cursor-pointer rounded border border-hairline bg-transparent p-0"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        <div className="ml-auto">
          {next ? (
            <Button variant="default" size="sm" onClick={runNext} disabled={busy !== null}>
              {working && <Loader2 className="animate-spin" aria-hidden="true" />}
              {working ? 'Traitement…' : next.label}
            </Button>
          ) : (
            <span className="label-mono flex items-center gap-2 text-ok">
              <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
              Page prête
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-auto p-4 sm:p-8">
        <div ref={stageContainerRef} className="relative w-full max-w-[34rem]">
          <div className={cn('panel p-1.5 transition-opacity relative', working && 'opacity-80')}>
            {error ? (
              <div
                className="tone grid place-items-center p-6 text-center text-sm text-danger"
                style={{ aspectRatio: `${page.width ?? 1000} / ${page.height ?? 1414}` }}
              >
                Image indisponible pour cette page.
              </div>
            ) : (
              <>
                <PageCanvas
                  src={displayUrl}
                  alt={`Page ${page.page_number}${effectiveView === 'cleaned' ? ', nettoyée' : ''}`}
                  width={page.width ?? 1000}
                  height={page.height ?? 1414}
                  blocks={page.ocr_blocks}
                  activeId={props.activeBlockId}
                  hoverId={props.hoverBlockId}
                  onSelect={props.onSelectBlock}
                  onHover={props.onHoverBlock}
                  onUpdateBbox={handleUpdateBbox}
                  showZones={!lettering}
                  maskBubbles={IS_DEMO && effectiveView === 'cleaned'}
                  showLettering={lettering}
                  fontSizeScale={fontSizeScale}
                  isBold={isBold}
                  isItalic={isItalic}
                  isUppercase={isUppercase}
                  fontFamily={fontFamily}
                  textColor={textColor}
                />

                {/* Rideau QC interactif (RAW à gauche, Nettoyé/Traduit à droite) */}
                {isQcMode && originalUrl && (
                  <>
                    <div
                      className="absolute inset-1.5 pointer-events-none overflow-hidden select-none"
                      style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={originalUrl}
                        alt="RAW Originale"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                      <div className="absolute top-2 left-2 bg-black/80 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        RAW (Originale)
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 bg-seal text-seal-ink font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none">
                      VF (Traduite & Édit)
                    </div>

                    {/* Curseur vertical de séparation du rideau */}
                    <div
                      className="absolute top-1.5 bottom-1.5 -ml-px w-0.5 bg-seal cursor-ew-resize select-none z-20 group"
                      style={{ left: `${splitPos}%` }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        setIsDraggingSplit(true)
                      }}
                    >
                      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-7 rounded-full bg-seal text-seal-ink shadow-lg flex items-center justify-center font-bold text-xs group-hover:scale-110 active:scale-95 transition-transform">
                        ↔
                      </div>
                    </div>
                  </>
                )}

                {/* Indicateur flottant lors du Peek touche C */}
                {isPeekingOriginal && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/90 text-white font-mono text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none z-30">
                    <Eye className="size-3.5 text-seal" />
                    <span>Affichage RAW Originale (touche C)</span>
                  </div>
                )}
              </>
            )}
          </div>
          {working && (
            <div className="pointer-events-none absolute inset-1.5 overflow-hidden" aria-hidden="true">
              <div className="animate-scan h-1/4 w-full bg-gradient-to-b from-transparent via-seal/25 to-transparent" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
