import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Logo, Seal } from '@/components/brand/logo'
import { buttonVariants } from '@/components/ui/button'
import { LandingSpecimen } from '@/components/landing/specimen'

const STEPS = [
  { n: '01', title: 'Import', body: 'Un PDF de chapitre ou des images de pages. 50 Mo max.' },
  { n: '02', title: 'Pages', body: 'Le PDF est découpé en pages numérotées, prêtes à lire.' },
  { n: '03', title: 'OCR', body: 'Chaque bulle est repérée, son texte extrait avec un score de confiance.' },
  { n: '04', title: 'Traduction', body: 'Un premier jet automatique, bloc par bloc.' },
  { n: '05', title: 'Relecture', body: 'Vous corrigez l’original et la traduction, bulle par bulle.' },
  { n: '06', title: 'Nettoyage + export', body: 'Bulles effacées, ZIP prêt pour le lettrage.' },
]

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="w-full border-b-[1.5px] border-ink bg-sheet">
        <div className="flex h-16 w-full items-center justify-between px-6 lg:px-10">
          <Logo />
          <nav aria-label="Compte" className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Se connecter
            </Link>
            <Link href="/register" className={buttonVariants({ size: 'sm' })}>
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="label-mono mb-5 flex items-center gap-2 text-ink-soft">
              <span className="inline-block h-px w-6 bg-seal" aria-hidden="true" />
              Manga · Manhwa · Manhua · Webtoon
            </p>
            <h1 className="text-[2.6rem] leading-[1.02] font-bold tracking-[-0.03em] text-balance sm:text-6xl">
              Du raw à la page traduite.{' '}
              <span className="relative whitespace-nowrap">
                Bulle par bulle
                <span className="absolute inset-x-0 -bottom-1 h-[0.18em] bg-seal" aria-hidden="true" />
              </span>
              .
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-ink-soft">
              {
                'Taurge fait le travail répétitif — repérer les bulles, lire le texte, proposer une traduction, effacer — pour que vous passiez votre temps là où il compte : le ton, le rythme, la réplique juste.'
              }
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/register" className={buttonVariants({ variant: 'seal', size: 'lg' })}>
                Commencer un chapitre
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/login" className={buttonVariants({ variant: 'link', size: 'lg' })}>
                {'J’ai déjà un compte'}
              </Link>
            </div>
          </div>

          <LandingSpecimen />
        </section>

        <section aria-labelledby="chaine" className="border-y-[1.5px] border-ink bg-sheet">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 id="chaine" className="text-3xl font-bold tracking-tight">
                La chaîne de production
              </h2>
              <p className="max-w-sm text-ink-soft">
                {'Chaque étape est visible, réversible, et vous laisse la main avant de passer à la suivante.'}
              </p>
            </div>
            <ol className="grid border-t-[1.5px] border-l-[1.5px] border-ink sm:grid-cols-2 lg:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="border-r-[1.5px] border-b-[1.5px] border-ink p-6">
                  <span className="font-mono text-sm text-seal">{s.n}</span>
                  <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ce que fait cette version</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {[
                'OCR japonais, coréen, chinois, anglais (Tesseract)',
                'Traduction automatique, modifiable bloc par bloc',
                'Nettoyage des bulles par inpainting',
                'Export ZIP : pages nettoyées + textes en JSON',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Seal className="mt-0.5 size-5 text-[0.65rem]">✓</Seal>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="tone border-[1.5px] border-dashed border-ink-soft p-6">
            <h2 className="text-2xl font-bold tracking-tight">Pas encore</h2>
            <p className="mt-3 leading-relaxed text-ink-soft">
              {
                'Le lettrage automatique, la détection des onomatopées dessinées et le travail en équipe arriveront plus tard. Taurge prépare la page ; le lettrage final reste dans votre outil habituel.'
              }
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-soft sm:px-6">
          <span className="font-mono text-xs">Taurge · MVP-0</span>
          <span>{'Pensé pour les traducteurs, pas pour les remplacer.'}</span>
        </div>
      </footer>
    </div>
  )
}

export const metadata = {
  title: { absolute: 'Taurge — Du raw à la page traduite, bulle par bulle' },
}
