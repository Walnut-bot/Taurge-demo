import { cn } from '@/lib/utils'

export const fieldClass =
  'w-full rounded-sm border border-hairline bg-sheet px-3 text-[0.9375rem] text-ink transition-colors placeholder:text-ink-soft/70 hover:border-ink-soft focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-seal aria-invalid:border-danger disabled:opacity-50'

export function Label({ className, ...props }: React.ComponentProps<'label'>) {
  return <label className={cn('label-mono block text-ink-soft', className)} {...props} />
}

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(fieldClass, 'h-11', className)} {...props} />
}

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(fieldClass, 'h-11 cursor-pointer pr-8', className)} {...props} />
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldClass, 'min-h-20 resize-y py-2 leading-relaxed', className)} {...props} />
}

export function FormError({ children, id }: { children?: React.ReactNode; id?: string }) {
  if (!children) return null
  return (
    <p
      id={id}
      role="alert"
      className="border-l-2 border-danger bg-danger-wash px-3 py-2 text-sm text-danger"
    >
      {children}
    </p>
  )
}
