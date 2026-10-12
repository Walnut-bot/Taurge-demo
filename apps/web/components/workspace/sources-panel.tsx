'use client'

import { useRef, useState } from 'react'
import { FileImage, FileText, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { ACCEPTED_UPLOAD, MAX_UPLOAD_BYTES, formatSize } from '@/lib/catalog'
import type { ProjectDetail } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { Runner } from './workspace'

const EXT_OK = /\.(pdf|png|jpe?g|webp)$/i

export function SourcesPanel({
  project,
  busy,
  run,
}: {
  project: ProjectDetail
  busy: string | null
  run: Runner
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  async function handleFiles(list: FileList | null) {
    const file = list?.[0]
    if (!file) return
    setLocalError(null)
    if (!EXT_OK.test(file.name)) return setLocalError('Format non pris en charge. PDF, PNG, JPG ou WEBP.')
    if (file.size > MAX_UPLOAD_BYTES) return setLocalError('Fichier trop lourd : 50 Mo maximum.')
    await run('upload', `« ${file.name} » importé. Extrayez maintenant les pages.`, () =>
      api.upload(project.id, file),
    )
    if (inputRef.current) inputRef.current.value = ''
  }

  const uploading = busy === 'upload'

  return (
    <section aria-labelledby="sources-title" className="border-b border-hairline p-4">
      <h2 id="sources-title" className="label-mono mb-3 text-ink-soft">
        Sources
      </h2>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1.5 border-[1.5px] border-dashed p-4 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-seal',
          dragging ? 'border-seal bg-seal-wash' : 'border-ink-soft hover:border-ink hover:bg-sheet',
          busy !== null && 'pointer-events-none opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_UPLOAD}
          className="sr-only"
          disabled={busy !== null}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="size-5 animate-spin text-seal" aria-hidden="true" />
        ) : (
          <Upload className="size-5" aria-hidden="true" />
        )}
        <span className="text-sm font-medium">{uploading ? 'Import en cours…' : 'Déposer un fichier'}</span>
        <span className="text-xs text-ink-soft">PDF ou image · 50 Mo</span>
      </label>
      {localError && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {localError}
        </p>
      )}

      {project.files.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {project.files.map((f) => {
            const extracted = project.pages.some((p) => p.source_file_id === f.id)
            const pageCount = project.pages.filter((p) => p.source_file_id === f.id).length
            const Icon = f.file_type === 'pdf' ? FileText : FileImage
            return (
              <li key={f.id} className="flex flex-col gap-2 bg-sheet p-2.5 ring-1 ring-hairline">
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={f.original_filename}>
                      {f.original_filename}
                    </p>
                    <p className="font-mono text-[11px] text-ink-soft">
                      {f.file_type.toUpperCase()} · {formatSize(f.size_bytes)}
                      {extracted && ` · ${pageCount} p.`}
                    </p>
                  </div>
                </div>
                {!extracted && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() =>
                      run(`extract:${f.id}`, 'Pages extraites.', () => api.extract(project.id, f.id))
                    }
                  >
                    {busy === `extract:${f.id}` && <Loader2 className="animate-spin" aria-hidden="true" />}
                    Extraire les pages
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
