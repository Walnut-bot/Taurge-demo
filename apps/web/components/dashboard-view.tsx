'use client'

import Link from 'next/link'
import { ArrowUpRight, Plus } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { contentTypeLabel, formatDate } from '@/lib/catalog'
import { useProjects, useRequireAuth } from '@/lib/hooks'
import { api } from '@/lib/api'

export function DashboardView() {
  const authed = useRequireAuth()
  const { data: projects, error, isLoading, mutate } = useProjects(authed)

  if (!authed) return null

  return (
    <>
      <AppHeader />
      <main id="contenu" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-ink pb-5">
          <div>
            <p className="label-mono text-ink-soft">Atelier</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              Vos projets
              {projects && projects.length > 0 && (
                <span className="ml-3 font-mono text-lg font-normal text-ink-soft">
                  {String(projects.length).padStart(2, '0')}
                </span>
              )}
            </h1>
          </div>
          <Link href="/projects/new" className={buttonVariants({ variant: 'seal' })}>
            <Plus aria-hidden="true" />
            Nouveau projet
          </Link>
        </div>

        {isLoading && <ListSkeleton />}

        {error && (
          <div role="alert" className="mt-8 flex flex-wrap items-center gap-4 border-l-2 border-danger bg-danger-wash p-4">
            <p className="text-danger">{error.message}</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              Réessayer
            </Button>
          </div>
        )}

        {projects && projects.length === 0 && (
          <div className="tone mt-8 flex flex-col items-start gap-4 border-[1.5px] border-dashed border-ink-soft p-10">
            <h2 className="text-2xl font-semibold">Aucun projet pour l’instant</h2>
            <p className="max-w-md text-ink-soft">
              {'Un projet = un chapitre, une langue source, une langue cible. Créez-en un pour importer vos premières pages.'}
            </p>
            <Link href="/projects/new" className={buttonVariants()}>
              Créer mon premier projet
            </Link>
          </div>
        )}

        {projects && projects.length > 0 && (
          <ul className="mt-2">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between border-b border-hairline py-2 transition-colors hover:bg-sheet sm:px-3">
                <Link
                  href={`/projects/${p.id}`}
                  className="group grid flex-1 grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-3 sm:grid-cols-[1fr_7rem_6rem_7rem_1.5rem]"
                >
                  <span className="text-lg font-semibold group-hover:underline group-hover:decoration-seal group-hover:underline-offset-4">
                    {p.name}
                  </span>
                  <span className="font-mono text-sm text-ink sm:order-none">
                    {p.source_lang.toUpperCase()}
                    <span className="mx-1.5 text-seal" aria-label="vers">
                      →
                    </span>
                    {p.target_lang.toUpperCase()}
                  </span>
                  <span className="text-sm text-ink-soft max-sm:col-span-2 max-sm:row-start-2">
                    {contentTypeLabel(p.content_type)}
                    <span className="sm:hidden"> · {formatDate(p.created_at)}</span>
                  </span>
                  <span className="hidden font-mono text-xs text-ink-soft sm:block">{formatDate(p.created_at)}</span>
                  <ArrowUpRight
                    className="hidden size-5 text-ink-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-seal sm:block"
                    aria-hidden="true"
                  />
                </Link>
                <div className="ml-4 flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-ink-soft hover:bg-danger-wash hover:text-danger"
                    title="Supprimer ce projet"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (window.confirm(`Voulez-vous vraiment supprimer le projet "${p.name}" ? Cette action est irréversible.`)) {
                        await api.deleteProject(p.id)
                        mutate()
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}

function ListSkeleton() {
  return (
    <ul className="mt-2" aria-label="Chargement des projets" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-6 border-b border-hairline py-6">
          <span className="h-4 w-1/3 animate-pulse bg-muted" />
          <span className="ml-auto h-3 w-16 animate-pulse bg-muted" />
        </li>
      ))}
    </ul>
  )
}
