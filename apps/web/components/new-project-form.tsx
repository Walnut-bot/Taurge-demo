'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ArrowLeftRight, Loader2 } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { FormError, Input, Label, Select } from '@/components/ui/field'
import { api } from '@/lib/api'
import { CONTENT_TYPES, LANGUAGES, languageLabel } from '@/lib/catalog'
import { useRequireAuth } from '@/lib/hooks'
import { cn } from '@/lib/utils'

export function NewProjectForm() {
  const authed = useRequireAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [contentType, setContentType] = useState('manga')
  const [sourceLang, setSourceLang] = useState('ja')
  const [targetLang, setTargetLang] = useState('fr')
  const [sourceTouched, setSourceTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!authed) return null

  function pickType(value: string) {
    setContentType(value)
    if (!sourceTouched) {
      const lang = CONTENT_TYPES.find((c) => c.value === value)?.defaultLang
      if (lang && lang !== targetLang) setSourceLang(lang)
    }
  }

  function swap() {
    setSourceLang(targetLang)
    setTargetLang(sourceLang)
    setSourceTouched(true)
  }

  const sameLang = sourceLang === targetLang

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Donnez un nom au projet.')
    if (sameLang) return setError('La langue source et la langue cible doivent être différentes.')
    setError(null)
    setPending(true)
    try {
      const project = await api.createProject({
        name: name.trim(),
        content_type: contentType,
        source_lang: sourceLang,
        target_lang: targetLang,
      })
      router.push(`/projects/${project.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible.')
      setPending(false)
    }
  }

  return (
    <>
      <AppHeader />
      <main id="contenu" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'mb-6')}>
          <ArrowLeft aria-hidden="true" />
          Projets
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">Nouveau projet</h1>
        <p className="mt-2 text-ink-soft">Un projet correspond en général à un chapitre ou un one-shot.</p>

        <form onSubmit={onSubmit} className="mt-10 flex flex-col gap-9" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom du projet</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Pluie sur Kōenji — Chapitre 2"
              maxLength={200}
              required
              autoFocus
            />
          </div>

          <fieldset>
            <legend className="label-mono mb-3 text-ink-soft">Type de contenu</legend>
            <div className="grid grid-cols-2 border-t-[1.5px] border-l-[1.5px] border-ink sm:grid-cols-3">
              {CONTENT_TYPES.map((c) => {
                const checked = contentType === c.value
                return (
                  <label
                    key={c.value}
                    className={cn(
                      'relative cursor-pointer border-r-[1.5px] border-b-[1.5px] border-ink p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:-outline-offset-4 has-focus-visible:outline-seal',
                      checked ? 'bg-ink text-sheet' : 'bg-sheet hover:bg-muted',
                    )}
                  >
                    <input
                      type="radio"
                      name="content_type"
                      value={c.value}
                      checked={checked}
                      onChange={() => pickType(c.value)}
                      className="sr-only"
                    />
                    <span className="block font-semibold">{c.label}</span>
                    <span className={cn('mt-0.5 block text-xs', checked ? 'text-sheet/70' : 'text-ink-soft')}>
                      {c.hint}
                    </span>
                    {checked && (
                      <span aria-hidden="true" className="absolute top-3 right-3 size-2 rounded-full bg-seal" />
                    )}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label-mono mb-3 text-ink-soft">Paire de langues</legend>
            <div className="flex items-end gap-3">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="source" className="normal-case">
                  Depuis
                </Label>
                <Select
                  id="source"
                  value={sourceLang}
                  onChange={(e) => {
                    setSourceLang(e.target.value)
                    setSourceTouched(true)
                  }}
                  aria-invalid={sameLang || undefined}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} — {l.native}
                    </option>
                  ))}
                </Select>
              </div>
              <Button type="button" variant="quiet" size="icon" onClick={swap} aria-label="Inverser les langues" className="mb-0.5 h-11">
                <ArrowLeftRight aria-hidden="true" />
              </Button>
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="target" className="normal-case">
                  Vers
                </Label>
                <Select
                  id="target"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  aria-invalid={sameLang || undefined}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label} — {l.native}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <p className={cn('mt-3 text-sm', sameLang ? 'text-danger' : 'text-ink-soft')} aria-live="polite">
              {sameLang
                ? 'Choisissez deux langues différentes.'
                : `L’OCR lira du ${languageLabel(sourceLang).toLowerCase()}, la traduction produira du ${languageLabel(targetLang).toLowerCase()}.`}
            </p>
          </fieldset>

          <FormError>{error}</FormError>

          <div className="flex items-center gap-3 border-t-[1.5px] border-ink pt-6">
            <Button type="submit" variant="seal" size="lg" disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Créer et importer des pages
            </Button>
            <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
              Annuler
            </Link>
          </div>
        </form>
      </main>
    </>
  )
}
