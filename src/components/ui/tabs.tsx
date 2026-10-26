'use client'

import { Tabs as TabsPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// shadcn/ui tabs restyled with the tokens (03 §1.4): condensed uppercase labels on a rule,
// the active tab marked with a `--signal` underline. Radix gives the arrow-key navigation
// and the tab/tabpanel roles (NFR-04).
export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('flex overflow-x-auto border-b border-rule px-2 md:px-6', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-px shrink-0 border-b-[3px] border-transparent px-3 py-2.5 font-condensed text-sm font-semibold tracking-wider text-ink-muted uppercase hover:text-ink data-[state=active]:border-signal data-[state=active]:text-ink',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('min-w-0', className)} {...props} />
}
