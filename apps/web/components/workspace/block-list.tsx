'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/field'
import { api } from '@/lib/api'
import type { OcrBlock, Page } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { Runner } from './workspace'

type Props = {
  page: Page
  sourceLang: string
  targetLang: string
  activeId: string | null
  hoverId: string | null
  onActivate: (id: string | null) => void
  onHover: (id: string | null) => void
  busy: string | null
  run: Runner
}

export function BlockList(props: Props) {
  const { page } = props
  const reviewed = page.ocr_blocks.filter((b) => b.translation?.edited_by_user).length

  return (
    <section
      aria-labelledby="blocks-title"
      className="flex flex-col border-t-[1.5px] border-ink bg-sheet lg:border-t-0 lg:border-l-[1.5px]"
    >
      <div className="flex items-baseline justify-between border-b border-hairline px-4 py-3">
        <h2 id="blocks-title" className="label-mono text-ink-soft">
          Bulles <span className="text-ink">{page.ocr_blocks.length}</span>
        </h2>
        {page.ocr_blocks.length > 0 && (
          <span className="font-mono text-[11px] text-ink-soft">
            {reviewed}/{page.ocr_blocks.length} relues
          </span>
        )}
      </div>

      {page.ocr_blocks.length === 0 ? (
        <div className="flex flex-col gap-2 p-6 text-sm text-ink-soft">
          <p className="font-medium text-ink">Aucune bulle détectée pour l’instant.</p>
          <p>{'Lancez l’OCR sur cette page : chaque bulle repérée apparaîtra ici avec son texte, prêt à être traduit.'}</p>
        </div>
      ) : (
        <ol className="flex flex-col">
          {page.ocr_blocks.map((b, i) => (
            <BlockItem
              key={`${b.id}:${b.text}:${b.translation?.id}:${b.translation?.translated_text}`}
              block={b}
              index={i}
              {...props}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

function BlockItem({
  block,
  index,
  sourceLang,
  targetLang,
  activeId,
  hoverId,
  onActivate,
  onHover,
  busy,
  run,
}: Props & { block: OcrBlock; index: number }) {
  const active = activeId === block.id
  const ref = useRef<HTMLLIElement>(null)
  const [original, setOriginal] = useState(block.text)
  const [translation, setTranslation] = useState(block.translation?.translated_text ?? '')
  const [bubbleType, setBubbleType] = useState(block.bubble_type || 'B')
  const lowConfidence = block.confidence < 0.7
  const dirtyOriginal = original.trim() !== block.text
  const dirtyTranslation = Boolean(block.translation) && translation.trim() !== block.translation!.translated_text
  const dirty = dirtyOriginal || dirtyTranslation
  const saving = busy === `save:${block.id}`
  const retranslating = busy === `retranslate:${block.id}`

  const TYPE_CONFIG = {
    B: { label: 'B', fullName: 'Bulle standard', color: 'bg-muted text-ink' },
    DB: { label: 'DB', fullName: 'Double bulle (//)', color: 'bg-blue-100 text-blue-900 border border-blue-300' },
    C: { label: 'C', fullName: 'Case de narration', color: 'bg-indigo-100 text-indigo-900 border border-indigo-300' },
    HB: { label: 'HB', fullName: 'Hors-bulle (flottant)', color: 'bg-amber-100 text-amber-900 border border-amber-300' },
    SFX: { label: 'SFX', fullName: 'Effet sonore', color: 'bg-rose-100 text-rose-900 border border-rose-300' },
  } as const

  async function handleTypeChange(newType: string) {
    setBubbleType(newType)
    block.bubble_type = newType
    try {
      await api.updateBlockType(block.id, newType)
    } catch (err) {
      console.error('Failed to update bubble type', err)
    }
  }

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [active])

  async function save() {
    await run(`save:${block.id}`, `Bulle ${index + 1} enregistrée.`, async () => {
      if (dirtyOriginal) await api.updateBlockText(block.id, original.trim())
      if (dirtyTranslation && block.translation) await api.updateTranslation(block.translation.id, translation.trim())
    })
  }

  return (
    <li
      ref={ref}
      onMouseEnter={() => onHover(block.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        'border-b border-hairline transition-colors',
        active ? 'bg-paper shadow-[inset_3px_0_0_var(--seal)]' : hoverId === block.id && 'bg-paper/60',
      )}
    >
      <button
        type="button"
        onClick={() => onActivate(active ? null : block.id)}
        aria-expanded={active}
        className="flex w-full items-start gap-3 px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-seal"
      >
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full font-mono text-[11px] font-bold',
            active ? 'bg-seal text-seal-ink' : 'bg-ink text-sheet',
          )}
        >
          {index + 1}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="sr-only">Bulle {index + 1}.</span>
          <span lang={sourceLang} className="line-clamp-2 text-sm text-ink-soft">
            {block.text}
          </span>
          {block.translation ? (
            <span lang={targetLang} className="line-clamp-2 leading-snug font-medium">
              {block.translation.translated_text}
            </span>
          ) : (
            <span className="text-sm text-ink-soft italic">Pas encore traduite</span>
          )}
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-tight',
                TYPE_CONFIG[bubbleType as keyof typeof TYPE_CONFIG]?.color || 'bg-muted text-ink'
              )}
              title={TYPE_CONFIG[bubbleType as keyof typeof TYPE_CONFIG]?.fullName}
            >
              {bubbleType}
            </span>
            <span
              className={cn('font-mono text-[11px]', lowConfidence ? 'font-semibold text-caution' : 'text-ink-soft')}
              title="Confiance de l’OCR"
            >
              {Math.round(block.confidence * 100)}%
            </span>
          </div>
          {block.translation?.edited_by_user && (
            <span className="label-mono -rotate-3 border border-seal px-1 text-[9px] text-seal">Relu</span>
          )}
        </span>
      </button>

      {active && (
        <div className="flex flex-col gap-4 px-4 pb-4 pl-13">
          {/* Sélecteur de Classification Scanlation (FlameScans / Poséidon) */}
          <div className="flex flex-col gap-1.5 rounded border border-hairline bg-paper/60 p-2.5">
            <div className="flex items-center justify-between">
              <span className="label-mono text-ink-soft">Classification Scanlation</span>
              <span className="font-mono text-[11px] font-medium text-seal">
                {TYPE_CONFIG[bubbleType as keyof typeof TYPE_CONFIG]?.fullName}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {(['B', 'DB', 'C', 'HB', 'SFX'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={cn(
                    'rounded px-2.5 py-1 text-xs font-mono font-bold transition-all',
                    bubbleType === t
                      ? 'bg-seal text-seal-ink ring-1 ring-seal shadow-sm'
                      : 'border border-hairline bg-sheet text-ink-soft hover:bg-muted hover:text-ink'
                  )}
                  title={TYPE_CONFIG[t].fullName}
                >
                  {t}
                </button>
              ))}
            </div>
            {bubbleType === 'DB' && (
              <p className="mt-1 text-[11px] text-seal italic">
                💡 Règle Scanlation : Séparez les deux morceaux de phrases par un double slash <strong>//</strong>
              </p>
            )}
            {bubbleType === 'HB' && (
              <p className="mt-1 text-[11px] text-amber-800 italic">
                💡 Texte hors-bulle sur dessin : appliquez un contour (stroke) pour assurer la lisibilité.
              </p>
            )}
            {bubbleType === 'SFX' && (
              <p className="mt-1 text-[11px] text-rose-800 italic">
                💡 Effet sonore / Onomatopée : adaptez ou préservez selon les consignes de la team.
              </p>
            )}
          </div>
          {lowConfidence && (
            <p className="border-l-2 border-caution bg-caution-wash px-2.5 py-1.5 text-xs text-caution">
              {'Lecture incertaine : vérifiez le texte original avant de traduire.'}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`orig-${block.id}`} className="label-mono text-ink-soft">
              Original · {sourceLang.toUpperCase()}
            </label>
            <Textarea
              id={`orig-${block.id}`}
              lang={sourceLang}
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              rows={2}
            />
          </div>

          {block.translation ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor={`tr-${block.id}`} className="label-mono text-ink-soft">
                  Traduction · {targetLang.toUpperCase()}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2 h-7 text-xs"
                  disabled={busy !== null}
                  onClick={() => run(`retranslate:${block.id}`, `Bulle ${index + 1} retraduite.`, () => api.retranslate(block.id))}
                >
                  {retranslating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
                  Retraduire
                </Button>
              </div>
              <Textarea
                id={`tr-${block.id}`}
                lang={targetLang}
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                rows={3}
                className="font-medium"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && dirty) {
                    e.preventDefault()
                    save()
                  }
                }}
              />
              {dirtyOriginal && (
                <p className="text-xs text-ink-soft">
                  {'Original modifié : pensez à « Retraduire » après l’enregistrement.'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink-soft">{'Traduisez la page pour éditer la traduction de cette bulle.'}</p>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={!dirty || busy !== null}>
              {saving && <Loader2 className="animate-spin" aria-hidden="true" />}
              Enregistrer
            </Button>
            {dirty && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setOriginal(block.text)
                  setTranslation(block.translation?.translated_text ?? '')
                }}
              >
                Annuler
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-danger hover:bg-danger-wash"
              title="Ignorer cette bulle (ne pas la nettoyer ni la traduire)"
              onClick={async () => {
                if (window.confirm('Voulez-vous exclure cette bulle ? Elle ne sera pas nettoyée lors du traitement de la page.')) {
                  await run(`delete:${block.id}`, 'Bulle exclue du nettoyage.', () => api.deleteBlock(block.id))
                }
              }}
            >
              Ignorer bulle
            </Button>
            <kbd className="ml-auto hidden font-mono text-[10px] text-ink-soft sm:block">⌘/Ctrl + Entrée</kbd>
          </div>
        </div>
      )}
    </li>
  )
}
