import { PageCanvas } from '@/components/page-canvas'
import type { OcrBlock } from '@/lib/types'

const BLOCKS: OcrBlock[] = [
  {
    id: 'a',
    text: '…やっぱり、この街は寂しいな。',
    bbox_x: 140,
    bbox_y: 90,
    bbox_w: 175,
    bbox_h: 245,
    confidence: 0.91,
    provider: 'tesseract',
    translation: { id: 'ta', translated_text: '… Décidément, cette ville est bien triste.', provider: 'google', edited_by_user: true },
  },
  {
    id: 'b',
    text: 'えっ、きみ…⁉',
    bbox_x: 600,
    bbox_y: 630,
    bbox_w: 135,
    bbox_h: 175,
    confidence: 0.84,
    provider: 'tesseract',
    translation: { id: 'tb', translated_text: 'Hein, toi… !?', provider: 'google', edited_by_user: false },
  },
  {
    id: 'c',
    text: '傘、一緒に入りなよ。',
    bbox_x: 625,
    bbox_y: 895,
    bbox_w: 140,
    bbox_h: 195,
    confidence: 0.88,
    provider: 'tesseract',
    translation: { id: 'tc', translated_text: 'Viens sous le parapluie avec moi.', provider: 'google', edited_by_user: false },
  },
]

export function LandingSpecimen() {
  return (
    <figure className="relative grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="panel self-center p-1.5">
        <PageCanvas
          src="/demo/page-01.png"
          alt="Page de manga en japonais, trois bulles repérées et numérotées"
          width={848}
          height={1264}
          blocks={BLOCKS}
        />
      </div>
      <ol className="flex flex-col gap-3 self-center" aria-label="Bulles détectées">
        {BLOCKS.map((b, i) => (
          <li key={b.id} className="panel p-3">
            <div className="label-mono mb-2 flex items-center justify-between text-ink-soft">
              <span className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-seal font-bold text-seal-ink">
                  {i + 1}
                </span>
                JA
              </span>
              <span>{Math.round(b.confidence * 100)}%</span>
            </div>
            <p lang="ja" className="text-sm text-ink-soft">
              {b.text}
            </p>
            <p className="mt-1.5 border-t border-hairline pt-1.5 leading-snug font-medium">
              {b.translation?.translated_text}
            </p>
          </li>
        ))}
      </ol>
      <figcaption className="sr-only">
        Exemple : une page de manga avec ses bulles repérées, le texte japonais extrait et sa traduction française.
      </figcaption>
    </figure>
  )
}
