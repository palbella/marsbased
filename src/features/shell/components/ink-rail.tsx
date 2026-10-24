'use client'

import { FlaskConicalIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/domain'
import { IS_NON_PRODUCTION } from '@/lib/environment'
import { cn } from '@/lib/utils'
import { useRailCounters } from '../hooks/use-rail-counters'
import { activeHref, navigation, type NavItem } from '../navigation'

const itemClasses =
  'relative flex h-11 w-full items-center justify-between gap-3 px-5 font-condensed text-sm font-semibold tracking-wider uppercase text-paper/70 hover:text-paper'

interface InkRailProps {
  role: Role
  // The drawer closes when an item is chosen (UI-02).
  onNavigate?: () => void
  onOpenSimulator: () => void
}

// DS-02, UI-05: the dark rail; the current item has `aria-current` and a 3 px `--signal` bar.
export function InkRail({ role, onNavigate, onOpenSimulator }: InkRailProps) {
  const pathname = usePathname()
  const items = navigation[role]
  const counters = useRailCounters(items)
  const current = activeHref(items, pathname)

  return (
    <nav aria-label="Main" className="flex h-full flex-col bg-ink py-3 text-paper">
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <RailLink
              item={item}
              current={item.href === current}
              count={item.counter && counters[item.counter.id]}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
      {IS_NON_PRODUCTION && (
        <div className="mt-auto border-t border-paper/15 pt-3">
          <button type="button" className={itemClasses} onClick={onOpenSimulator}>
            Simulator
            <FlaskConicalIcon className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      )}
    </nav>
  )
}

interface RailLinkProps {
  item: NavItem
  current: boolean
  count: number | undefined
  onNavigate?: () => void
}

function RailLink({ item, current, count, onNavigate }: RailLinkProps) {
  return (
    <Link
      href={item.href}
      aria-current={current ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(itemClasses, current && 'text-paper')}
    >
      {current && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] bg-signal" />}
      {item.label}
      {item.counter && count !== undefined && (
        <span className={cn('font-mono text-sm', count > 0 ? 'text-signal' : 'text-paper/50')}>
          {count}
          <span className="sr-only"> {item.counter.label}</span>
        </span>
      )}
    </Link>
  )
}
