'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { FormError, Input, Label } from '@/components/ui/field'
import { IS_DEMO, api } from '@/lib/api'

type Mode = 'login' | 'register'

const COPY = {
  login: {
    title: 'Reprendre le travail',
    sub: 'Vos chapitres vous attendent là où vous les avez laissés.',
    submit: 'Se connecter',
    alt: { text: 'Pas encore de compte ?', link: 'Créer un compte', href: '/register' },
  },
  register: {
    title: 'Ouvrir votre atelier',
    sub: 'Un compte, des projets illimités. Aucune carte bancaire.',
    submit: 'Créer le compte',
    alt: { text: 'Déjà inscrit ?', link: 'Se connecter', href: '/login' },
  },
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const params = useSearchParams()
  const justRegistered = mode === 'login' && params.get('registered') === '1'
  const [email, setEmail] = useState(IS_DEMO && mode === 'login' ? 'demo@taurge.app' : '')
  const [password, setPassword] = useState(IS_DEMO && mode === 'login' ? 'demodemo' : '')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const copy = COPY[mode]

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (mode === 'register' && password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setPending(true)
    try {
      if (mode === 'login') {
        await api.login(email.trim(), password)
        router.push('/dashboard')
      } else {
        await api.register(email.trim(), password)
        router.push('/login?registered=1')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setPending(false)
    }
  }

  return (
    <div className="grid min-h-[calc(100dvh-2rem)] lg:grid-cols-[1fr_minmax(0,0.85fr)]">
      <main id="contenu" className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold tracking-tight">{copy.title}</h1>
          <p className="mt-2 text-ink-soft">{copy.sub}</p>

          {justRegistered && (
            <p role="status" className="mt-6 border-l-2 border-ok bg-ok-wash px-3 py-2 text-sm text-ok">
              Compte créé. Connectez-vous pour commencer.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? 'auth-error' : undefined}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={mode === 'register' ? 'pw-hint' : undefined}
              />
              {mode === 'register' && (
                <p id="pw-hint" className="text-xs text-ink-soft">
                  8 caractères minimum.
                </p>
              )}
            </div>
            <FormError id="auth-error">{error}</FormError>
            <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
              {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {copy.submit}
            </Button>
          </form>

          <p className="mt-8 text-sm text-ink-soft">
            {copy.alt.text}{' '}
            <Link href={copy.alt.href} className="font-medium text-ink underline underline-offset-4 hover:decoration-seal">
              {copy.alt.link}
            </Link>
          </p>
        </div>
      </main>

      <aside aria-hidden="true" className="relative hidden overflow-hidden border-l-[1.5px] border-ink bg-ink lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/demo/page-02.png" alt="" className="absolute inset-0 size-full object-cover object-top opacity-90 grayscale" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-10 pt-32 text-sheet">
          <p lang="ja" className="text-sm text-sheet/60">
            らっしゃい！特製醤油、お待たせしました！
          </p>
          <p className="mt-2 max-w-sm text-2xl leading-snug font-semibold text-balance">
            « Bienvenue ! Et voilà, un shoyu maison ! »
          </p>
        </div>
      </aside>
    </div>
  )
}
