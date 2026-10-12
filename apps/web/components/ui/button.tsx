import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color,transform] duration-150 ease-(--ease-ink) outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'border-ink bg-ink text-sheet hover:bg-ink/85',
        seal: 'border-seal bg-seal text-seal-ink hover:bg-seal/90',
        outline: 'border-ink bg-transparent text-ink hover:bg-ink hover:text-sheet',
        quiet: 'border-hairline bg-sheet text-ink hover:border-ink',
        ghost: 'border-transparent bg-transparent text-ink hover:bg-muted',
        danger: 'border-danger bg-transparent text-danger hover:bg-danger-wash',
        link: 'border-transparent px-0 text-ink underline decoration-1 underline-offset-4 hover:decoration-seal',
      },
      size: {
        sm: 'h-8 px-3 text-[0.8125rem]',
        default: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
