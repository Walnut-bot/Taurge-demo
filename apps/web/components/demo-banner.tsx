import { IS_DEMO } from '@/lib/api'

export function DemoBanner() {
  if (!IS_DEMO) return null
  return (
    <div className="flex items-center justify-center gap-3 border-b border-hairline bg-ink px-4 py-1.5 text-center text-xs text-sheet">
      <span className="label-mono text-seal">Démo</span>
      <span className="text-sheet/80">
        {'Données fictives en mémoire, OCR et traduction simulés. Définissez NEXT_PUBLIC_API_URL pour brancher votre API FastAPI.'}
      </span>
    </div>
  )
}
