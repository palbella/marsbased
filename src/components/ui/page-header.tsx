import type { ReactNode } from 'react'

// 03 §1.4: every page opens with a condensed title, a field-label subtitle and its actions.
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-rule px-4 pt-6 pb-4 md:px-8">
      <div className="min-w-0">
        <h1 className="font-condensed text-2xl leading-tight font-semibold tracking-wide uppercase">
          {title}
        </h1>
        {subtitle && <p className="field-label mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
