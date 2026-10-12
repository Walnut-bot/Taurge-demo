'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useProject, useRequireAuth } from '@/lib/hooks'
import { projectPipeline, safeFilename } from '@/lib/pipeline'
import { BlockList } from './block-list'
import { PageStage } from './page-stage'
import { PipelineBar } from './pipeline-bar'
import { PageStrip } from './page-strip'
import { SourcesPanel } from './sources-panel'
import { GlossaryPanel } from './glossary-panel'
import type { GlossaryEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

export type Runner = (key: string, success: string, fn: () => Promise<unknown>) => Promise<boolean>

export function Workspace({ projectId }: { projectId: string }) {
  const authed = useRequireAuth()
  const { data: project, error, isLoading, mutate } = useProject(projectId, authed)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [hoverBlockId, setHoverBlockId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [viewMode, setViewMode] = useState<'editor' | 'glossary'>('editor')
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([])

  const loadGlossary = async () => {
    try {
      const data = await api.listGlossary(projectId)
      setGlossaryEntries(data)
    } catch {
      // Ignorer si non disponible
    }
  }

  if (!authed) return null

  const run: Runner = async (key, success, fn) => {
    setBusy(key)
    setNotice(null)
    try {
      await fn()
      await mutate()
      setNotice({ tone: 'ok', text: success })
      return true
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Une erreur est survenue.' })
      return false
    } finally {
      setBusy(null)
    }
  }

  const pages = project?.pages ?? []
  const page = pages.find((p) => p.id === selectedPageId) ?? pages[0] ?? null

  function selectPage(id: string) {
    setSelectedPageId(id)
    setActiveBlockId(null)
  }

  async function exportProject() {
    if (!project) return
    let exportRecord: { id: string; format: string } | null = null
    const ok = await run('export', 'Export prêt, téléchargement lancé.', async () => {
      exportRecord = await api.exportProject(project.id)
    })
    if (ok && exportRecord) {
      const ext = exportRecord.format || (project.files?.some((f) => f.file_type.toLowerCase() === 'pdf') ? 'pdf' : 'zip')
      await api.downloadExport(project.id, exportRecord.id, `${safeFilename(project.name)}.${ext}`)
    }
  }

  return (
    <>
      <AppHeader>
        <div className="flex items-center justify-between gap-4 w-full">
          <nav aria-label="Fil d’Ariane" className="flex min-w-0 items-center gap-1.5 text-sm">
            <Link href="/dashboard" className="shrink-0 text-ink-soft hover:text-ink">
              Projets
            </Link>
            <ChevronRight className="size-3.5 shrink-0 text-ink-soft" aria-hidden="true" />
            <span className="truncate font-semibold" aria-current="page">
              {project?.name ?? '…'}
            </span>
          </nav>
          <div className="flex items-center gap-1 bg-sheet rounded p-1 border border-hairline">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded transition-colors',
                viewMode === 'editor' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
              )}
            >
              Atelier des pages
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('glossary')
                loadGlossary()
              }}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded transition-colors',
                viewMode === 'glossary' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
              )}
            >
              Glossaire & Mémoire ({glossaryEntries.length})
            </button>
          </div>
        </div>
      </AppHeader>

      {isLoading && <WorkspaceSkeleton />}

      {error && (
        <main id="contenu" className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Projet indisponible</h1>
          <p className="mt-2 text-ink-soft">{error.message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => mutate()}>
              Réessayer
            </Button>
            <Link href="/dashboard" className={buttonVariants({ variant: 'ghost' })}>
              Retour aux projets
            </Link>
          </div>
        </main>
      )}

      {project && (
        <main id="contenu" className="flex flex-col">
          <h1 className="sr-only">{project.name}</h1>
          <PipelineBar
            steps={projectPipeline(project)}
            sourceLang={project.source_lang}
            targetLang={project.target_lang}
            canExport={pages.length > 0}
            exporting={busy === 'export'}
            disabled={busy !== null}
            onExport={exportProject}
          />

          <div
            role={notice?.tone === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className="empty:hidden"
          >
            {notice && (
              <p
                className={
                  notice.tone === 'error'
                    ? 'border-b border-danger bg-danger-wash px-4 py-2 text-sm text-danger sm:px-6'
                    : 'border-b border-ok/40 bg-ok-wash px-4 py-2 text-sm text-ok sm:px-6'
                }
              >
                {notice.text}
              </p>
            )}
          </div>

          {viewMode === 'glossary' ? (
            <div className="flex-1 bg-sheet/40 min-h-[70vh]">
              <div className="mx-auto max-w-5xl">
                <GlossaryPanel
                  projectId={project.id}
                  entries={glossaryEntries}
                  onRefresh={loadGlossary}
                />
              </div>
            </div>
          ) : (
            <div className="grid flex-1 lg:grid-cols-[15rem_minmax(0,1fr)_23rem]">
              <aside className="flex flex-col border-b-[1.5px] border-ink lg:border-r-[1.5px] lg:border-b-0">
                <SourcesPanel project={project} busy={busy} run={run} />
                <PageStrip pages={pages} selectedId={page?.id ?? null} onSelect={selectPage} />
              </aside>

              {page ? (
                <>
                  <PageStage
                    key={page.id}
                    page={page}
                    pageIndex={pages.indexOf(page)}
                    pageCount={pages.length}
                    projectId={project.id}
                    busy={busy}
                    run={run}
                    activeBlockId={activeBlockId}
                    hoverBlockId={hoverBlockId}
                    onSelectBlock={setActiveBlockId}
                    onHoverBlock={setHoverBlockId}
                    onNavigate={(dir) => {
                      const next = pages[pages.indexOf(page) + dir]
                      if (next) selectPage(next.id)
                    }}
                  />
                  <BlockList
                    page={page}
                    sourceLang={project.source_lang}
                    targetLang={project.target_lang}
                    activeId={activeBlockId}
                    hoverId={hoverBlockId}
                    onActivate={setActiveBlockId}
                    onHover={setHoverBlockId}
                    busy={busy}
                    run={run}
                  />
                </>
              ) : (
                <EmptyStage hasFiles={project.files.length > 0} />
              )}
            </div>
          )}
        </main>
      )}
    </>
  )
}

function EmptyStage({ hasFiles }: { hasFiles: boolean }) {
  return (
    <section className="tone flex min-h-[50dvh] flex-col items-center justify-center gap-3 p-10 text-center lg:col-span-2">
      <span className="font-mono text-sm text-seal">{hasFiles ? '02' : '01'}</span>
      <h2 className="text-2xl font-semibold">{hasFiles ? 'Extrayez les pages' : 'Importez un chapitre'}</h2>
      <p className="max-w-sm text-ink-soft">
        {hasFiles
          ? 'Votre fichier est en place. Lancez l’extraction dans le panneau Sources pour découper les pages.'
          : 'Déposez un PDF ou des images dans le panneau Sources. Les pages apparaîtront ici.'}
      </p>
    </section>
  )
}

function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement du projet" className="grid lg:grid-cols-[15rem_1fr_23rem]">
      <div className="h-14 border-b-[1.5px] border-ink lg:col-span-3" />
      <div className="hidden h-[70dvh] border-r-[1.5px] border-ink lg:block" />
      <div className="tone h-[70dvh] animate-pulse" />
      <div className="hidden border-l-[1.5px] border-ink lg:block" />
    </div>
  )
}
