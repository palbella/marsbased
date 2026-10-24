import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// 03 §1.2: primary actions are `--signal` fills with `--ink` text (contrast > 6:1); 2 px
// radius, no shadows. The focus ring comes from the base layer.
const variantClasses = {
  primary: 'bg-signal text-ink hover:bg-signal/85',
  secondary: 'border border-ink text-ink hover:bg-sheet',
  ghost: 'text-current hover:bg-current/10',
}

const sizeClasses = {
  default: 'h-10 px-4 text-sm',
  small: 'h-8 px-3 text-xs',
  icon: 'size-9',
}

export type ButtonVariant = keyof typeof variantClasses
export type ButtonSize = keyof typeof sizeClasses

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  asChild?: boolean
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'default') {
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-xs font-condensed font-semibold tracking-wider whitespace-nowrap uppercase',
    'disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0',
    variantClasses[variant],
    sizeClasses[size],
  )
}

export function Button({ variant, size, asChild = false, className, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button'
  return <Component className={cn(buttonClasses(variant, size), className)} {...props} />
}
