import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PipelineStep } from '@/lib/pipeline'
import { cn } from '@/lib/utils'

type Props = {
  steps: PipelineStep[]
  sourceLang: string
  targetLang: string
  canExport: boolean
  exporting: boolean
  disabled: boolean
  onExport: () => void
}

export function PipelineBar({ steps, sourceLang, targetLang, canExport, exporting, disabled, onExport }: Props) {
  return (
    <div className="flex flex-wrap items-stretch border-b-[1.5px] border-ink bg-sheet">
      <div className="flex items-center gap-1.5 border-r-[1.5px] border-ink px-4 font-mono text-sm font-semibold sm:px-6">
        {sourceLang.toUpperCase()}
        <span className="text-seal" aria-label="vers">
          →
        </span>
        {targetLang.toUpperCase()}
      </div>

      <ol aria-label="Avancement du projet" className="flex min-w-0 flex-1 overflow-x-auto">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className="flex shrink-0 items-center gap-2.5 border-r border-hairline px-4 py-2.5 last:border-r-0"
          >
            <StepMark index={i + 1} state={s.state} />
            <span className="flex flex-col leading-tight">
              <span className={cn('text-sm font-medium', s.state === 'todo' && 'text-ink-soft')}>{s.label}</span>
              {s.key !== 'import' && s.key !== 'export' && s.total > 0 && (
                <span className="font-mono text-[11px] text-ink-soft">
                  {s.done}/{s.total}
                </span>
              )}
            </span>
            <span className="sr-only">
              {s.state === 'done' ? 'terminé' : s.state === 'partial' ? 'en cours' : 'à faire'}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex items-center border-l-[1.5px] border-ink px-3 max-sm:w-full max-sm:border-t-[1.5px] max-sm:border-l-0 max-sm:py-2">
        <Button
          variant="seal"
          size="sm"
          onClick={onExport}
          disabled={!canExport || disabled}
          className="max-sm:w-full"
          title={canExport ? undefined : 'Importez des pages avant d’exporter'}
        >
          {exporting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
          Exporter le ZIP
        </Button>
      </div>
    </div>
  )
}

function StepMark({ index, state }: { index: number; state: PipelineStep['state'] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-6 place-items-center rounded-full border-[1.5px] font-mono text-[11px] font-bold',
        state === 'done' && 'border-ink bg-ink text-sheet',
        state === 'partial' && 'border-seal text-seal',
        state === 'todo' && 'border-hairline text-ink-soft',
      )}
    >
      {state === 'done' ? '✓' : index}
    </span>
  )
}
