'use client'

import { useState } from 'react'
import { BookOpen, Plus, Trash2, Lock, Tag, User, MapPin, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import type { GlossaryEntry, GlossaryCategory } from '@/lib/types'
import { cn } from '@/lib/utils'

type Props = {
  projectId: string
  entries: GlossaryEntry[]
  onRefresh: () => void
}

const CATEGORIES: { id: GlossaryCategory; label: string; icon: typeof User }[] = [
  { id: 'character', label: 'Personnages', icon: User },
  { id: 'location', label: 'Lieux', icon: MapPin },
  { id: 'term', label: 'Termes / Techniques', icon: Tag },
  { id: 'sfx', label: 'SFX / Onomatopées', icon: Sparkles },
]

export function GlossaryPanel({ projectId, entries, onRefresh }: Props) {
  const [activeTab, setActiveTab] = useState<GlossaryCategory>('character')
  const [sourceTerm, setSourceTerm] = useState('')
  const [targetTerm, setTargetTerm] = useState('')
  const [notes, setNotes] = useState('')
  const [isLocked, setIsLocked] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = entries.filter((e) => e.category === activeTab)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!sourceTerm.trim() || !targetTerm.trim()) return

    setLoading(true)
    setError(null)
    try {
      await api.createGlossaryEntry(projectId, {
        category: activeTab,
        source_term: sourceTerm.trim(),
        target_term: targetTerm.trim(),
        is_locked: isLocked,
        notes: notes.trim() || null,
      })
      setSourceTerm('')
      setTargetTerm('')
      setNotes('')
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’ajout.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer ce terme du glossaire ?')) return
    try {
      await api.deleteGlossaryEntry(projectId, id)
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between border-b border-hairline pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <BookOpen className="size-5 text-seal" />
            Mémoire de Traduction & Glossaire Projet
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Définissez les noms et termes spécifiques. L’IA utilisera obligatoirement ces traductions verrouillées sur vos pages.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-ink-soft">
          <span className="rounded bg-sheet px-2.5 py-1">
            {entries.length} terme{entries.length > 1 ? 's' : ''} enregistré{entries.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Onglets catégories */}
      <div className="flex gap-2 border-b border-hairline pb-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const count = entries.filter((e) => e.category === cat.id).length
          const active = activeTab === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                'flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition-colors',
                active ? 'bg-ink text-paper' : 'hover:bg-sheet text-ink-soft'
              )}
            >
              <Icon className="size-3.5" />
              {cat.label}
              <span className={cn('rounded px-1.5 py-0.2 text-[10px]', active ? 'bg-paper/20' : 'bg-hairline')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Formulaire d'ajout rapide */}
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 rounded-lg border border-hairline bg-sheet p-4">
        <div className="flex flex-1 flex-col gap-1 min-w-[12rem]">
          <label className="text-xs font-medium text-ink-soft">Terme source (ex: Shadow Monarch)</label>
          <input
            type="text"
            required
            placeholder="Nom ou phrase dans la bulle..."
            value={sourceTerm}
            onChange={(e) => setSourceTerm(e.target.value)}
            className="rounded border border-hairline bg-paper px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1 min-w-[12rem]">
          <label className="text-xs font-medium text-ink-soft">Traduction imposée (ex: Monarque des Ombres)</label>
          <input
            type="text"
            required
            placeholder="Traduction officielle française..."
            value={targetTerm}
            onChange={(e) => setTargetTerm(e.target.value)}
            className="rounded border border-hairline bg-paper px-3 py-1.5 text-sm font-semibold"
          />
        </div>

        <div className="flex flex-col gap-1 min-w-[10rem]">
          <label className="text-xs font-medium text-ink-soft">Notes (optionnel)</label>
          <input
            type="text"
            placeholder="Registre, genre..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded border border-hairline bg-paper px-3 py-1.5 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 pb-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-ink">
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="size-4 accent-seal"
            />
            <Lock className="size-3 text-seal" />
            Verrouiller
          </label>
        </div>

        <Button type="submit" size="sm" variant="seal" disabled={loading}>
          <Plus className="size-4" />
          Ajouter
        </Button>
      </form>

      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Liste des entrées de la catégorie active */}
      <div className="flex flex-col rounded-lg border border-hairline bg-paper overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-soft">
            Aucun terme dans cette catégorie. Ajoutez-en un ci-dessus pour harmoniser les traductions de votre chapitre.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-hairline bg-sheet text-xs font-mono text-ink-soft">
              <tr>
                <th className="px-4 py-2.5">Terme Original</th>
                <th className="px-4 py-2.5">Traduction Verrouillée</th>
                <th className="px-4 py-2.5">Notes</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-sheet/50">
                  <td className="px-4 py-3 font-medium">{item.source_term}</td>
                  <td className="px-4 py-3 font-semibold text-seal flex items-center gap-1.5">
                    <Lock className="size-3" />
                    {item.target_term}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-soft">{item.notes || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded p-1 text-ink-soft hover:bg-danger-wash hover:text-danger"
                      title="Supprimer"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
