'use client'

import { useState, useRef, useEffect } from 'react'
import { Move, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OcrBlock } from '@/lib/types'

export type FontStyle = 'sans' | 'comic' | 'serif' | 'mono'
export type StrokeStyle = 'none' | 'white' | 'black'
export type ShadowStyle = 'none' | 'soft' | 'strong'
export type BubbleShape = 'diamond' | 'rectangle'

type Props = {
  src: string | null
  alt: string
  width: number
  height: number
  blocks: OcrBlock[]
  activeId?: string | null
  hoverId?: string | null
  onSelect?: (id: string) => void
  onHover?: (id: string | null) => void
  onUpdateBbox?: (id: string, bbox: { bbox_x: number; bbox_y: number; bbox_w: number; bbox_h: number }) => void
  showZones?: boolean
  maskBubbles?: boolean
  showLettering?: boolean
  fontSizeScale?: number
  isBold?: boolean
  isItalic?: boolean
  isUppercase?: boolean
  fontFamily?: FontStyle
  textColor?: string
  strokeStyle?: StrokeStyle
  shadowStyle?: ShadowStyle
  bubbleShape?: BubbleShape
  paddingRatio?: number
  className?: string
}

export function PageCanvas({
  src,
  alt,
  width,
  height,
  blocks,
  activeId,
  hoverId,
  onSelect,
  onHover,
  onUpdateBbox,
  showZones = true,
  maskBubbles = false,
  showLettering = false,
  fontSizeScale = 1,
  isBold = true,
  isItalic = false,
  isUppercase = false,
  fontFamily = 'comic',
  textColor = '#000000',
  strokeStyle = 'none',
  shadowStyle = 'none',
  bubbleShape = 'diamond',
  paddingRatio = 0.20,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null)
  const [resizingBlockId, setResizingBlockId] = useState<string | null>(null)
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number; origW: number; origH: number }>({
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    origW: 0,
    origH: 0,
  })

  // Gestion du glisser-déposer interactif à la souris
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const scaleX = width / rect.width
      const scaleY = height / rect.height

      const deltaX = (e.clientX - dragStartRef.current.startX) * scaleX
      const deltaY = (e.clientY - dragStartRef.current.startY) * scaleY

      if (draggingBlockId) {
        const newX = Math.max(0, Math.min(width - dragStartRef.current.origW, Math.round(dragStartRef.current.origX + deltaX)))
        const newY = Math.max(0, Math.min(height - dragStartRef.current.origH, Math.round(dragStartRef.current.origY + deltaY)))

        onUpdateBbox?.(draggingBlockId, {
          bbox_x: newX,
          bbox_y: newY,
          bbox_w: dragStartRef.current.origW,
          bbox_h: dragStartRef.current.origH,
        })
      } else if (resizingBlockId) {
        const newW = Math.max(30, Math.round(dragStartRef.current.origW + deltaX))
        const newH = Math.max(20, Math.round(dragStartRef.current.origH + deltaY))

        onUpdateBbox?.(resizingBlockId, {
          bbox_x: dragStartRef.current.origX,
          bbox_y: dragStartRef.current.origY,
          bbox_w: newW,
          bbox_h: newH,
        })
      }
    }

    function handleMouseUp() {
      setDraggingBlockId(null)
      setResizingBlockId(null)
    }

    if (draggingBlockId || resizingBlockId) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [draggingBlockId, resizingBlockId, width, height, onUpdateBbox])

  const fontClasses: Record<FontStyle, string> = {
    sans: 'font-sans',
    comic: 'font-sans tracking-wide font-extrabold', // Style BD percutant
    serif: 'font-serif',
    mono: 'font-mono',
  }

  // Effets de texte (Règles FlameScans : Contours & Ombres)
  const strokeShadows: string[] = []
  if (strokeStyle === 'white') {
    strokeShadows.push('-1.5px -1.5px 0 #ffffff', '1.5px -1.5px 0 #ffffff', '-1.5px 1.5px 0 #ffffff', '1.5px 1.5px 0 #ffffff')
  } else if (strokeStyle === 'black') {
    strokeShadows.push('-1.5px -1.5px 0 #000000', '1.5px -1.5px 0 #000000', '-1.5px 1.5px 0 #000000', '1.5px 1.5px 0 #000000')
  }

  if (shadowStyle === 'soft') {
    strokeShadows.push('2px 2px 3px rgba(0,0,0,0.5)')
  } else if (shadowStyle === 'strong') {
    strokeShadows.push('3px 3px 6px rgba(0,0,0,0.85)')
  } else if (textColor === '#ffffff' && strokeStyle === 'none') {
    strokeShadows.push('1px 1px 2px #000000')
  }

  const computedTextShadow = strokeShadows.length > 0 ? strokeShadows.join(', ') : 'none'
  const paddingPercent = `${Math.round(paddingRatio * 100)}%`

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden bg-white tone select-none', className)}
      style={{ aspectRatio: `${width} / ${height}`, containerType: 'inline-size' }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="absolute inset-0 size-full object-contain pointer-events-none" draggable={false} />
      ) : (
        <div className="absolute inset-0 overflow-hidden" aria-label="Chargement de la page" role="img">
          <div className="animate-scan h-1/3 w-full bg-gradient-to-b from-transparent via-seal/15 to-transparent" />
        </div>
      )}

      {blocks.map((b, i) => {
        const active = activeId === b.id
        const hovered = hoverId === b.id
        const style = {
          left: `${(b.bbox_x / width) * 100}%`,
          top: `${(b.bbox_y / height) * 100}%`,
          width: `${(b.bbox_w / width) * 100}%`,
          height: `${(b.bbox_h / height) * 100}%`,
        }
        const lettering = showLettering && b.translation?.translated_text

        return (
          <div key={b.id} className="absolute group" style={style}>
            {(maskBubbles || lettering) && (
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center text-center pointer-events-none',
                  maskBubbles && (bubbleShape === 'diamond' ? 'rounded-[45%] bg-white' : 'rounded bg-white'),
                )}
                style={{ padding: paddingPercent }}
              >
                {lettering && (
                  <span
                    className={cn(
                      fontClasses[fontFamily],
                      'leading-tight',
                      bubbleShape === 'diamond' ? 'text-balance' : 'text-pretty',
                      isBold ? 'font-bold' : 'font-normal',
                      isItalic && 'italic',
                      isUppercase && 'uppercase',
                    )}
                    style={{
                      color: textColor,
                      fontSize: `calc(clamp(9px, 2.8cqi, 36px) * ${fontSizeScale})`,
                      textShadow: computedTextShadow,
                      WebkitTextStroke:
                        strokeStyle === 'white'
                          ? '1px #ffffff'
                          : strokeStyle === 'black'
                            ? '1px #000000'
                            : undefined,
                      paintOrder: 'stroke fill',
                    }}
                  >
                    {b.translation!.translated_text}
                  </span>
                )}
              </div>
            )}

            {showZones && (
              <div
                onClick={() => onSelect?.(b.id)}
                onMouseEnter={() => onHover?.(b.id)}
                onMouseLeave={() => onHover?.(null)}
                aria-label={`Bulle ${i + 1} : ${b.text}`}
                className={cn(
                  'absolute inset-0 cursor-pointer border-[1.5px] transition-colors duration-150',
                  active
                    ? 'border-seal bg-seal/10 ring-2 ring-seal/40'
                    : hovered
                      ? 'border-seal/80 bg-seal/5'
                      : 'border-dashed border-black/40 hover:border-seal',
                )}
              >
                <Marker n={i + 1} tag={b.bubble_type} active={active || hovered} />

                {/* Poignée de déplacement direct (Move Handle) */}
                {active && onUpdateBbox && (
                  <>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setDraggingBlockId(b.id)
                        dragStartRef.current = {
                          startX: e.clientX,
                          startY: e.clientY,
                          origX: b.bbox_x,
                          origY: b.bbox_y,
                          origW: b.bbox_w,
                          origH: b.bbox_h,
                        }
                      }}
                      className="absolute -top-3 -right-3 size-6 rounded bg-seal text-white shadow-md flex items-center justify-center cursor-move hover:scale-110 active:scale-95 transition-transform"
                      title="Glisser pour déplacer la bulle"
                    >
                      <Move className="size-3.5" />
                    </button>

                    {/* Poignée de redimensionnement direct (Resize Handle) */}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        setResizingBlockId(b.id)
                        dragStartRef.current = {
                          startX: e.clientX,
                          startY: e.clientY,
                          origX: b.bbox_x,
                          origY: b.bbox_y,
                          origW: b.bbox_w,
                          origH: b.bbox_h,
                        }
                      }}
                      className="absolute -bottom-2 -right-2 size-5 rounded-full bg-ink text-paper shadow-md flex items-center justify-center cursor-nwse-resize hover:scale-110 active:scale-95 transition-transform"
                      title="Redimensionner la boîte"
                    >
                      <Maximize2 className="size-2.5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Marker({ n, tag, active }: { n: number; tag?: string; active: boolean }) {
  return (
    <span
      className={cn(
        'absolute -top-2.5 -left-2.5 flex items-center justify-center gap-0.5 px-1 min-w-5 h-5 rounded-full font-mono text-[10px] font-bold transition-colors shadow-sm',
        active ? 'bg-seal text-white' : 'bg-black text-white',
      )}
    >
      <span>{n}</span>
      {tag && tag !== 'B' && (
        <span className="text-[8px] bg-white/25 px-0.5 rounded leading-none">{tag}</span>
      )}
    </span>
  )
}
