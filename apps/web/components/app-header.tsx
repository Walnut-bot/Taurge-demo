'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { clearToken } from '@/lib/api'
import { useMe } from '@/lib/hooks'

export function AppHeader({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const { data: me } = useMe(true)

  function logout() {
    clearToken()
    router.replace('/login')
  }

  return (
    <header className="w-full border-b-[1.5px] border-ink bg-paper">
      <div className="flex h-16 w-full items-center gap-4 px-6 lg:px-10">
        <Logo href="/dashboard" />
        <div className="flex min-w-0 flex-1 items-center">{children}</div>
        {me && (
          <span className="hidden truncate font-mono text-xs text-ink-soft sm:inline">{me.email}</span>
        )}
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Déconnexion</span>
        </Button>
      </div>
    </header>
  )
}
