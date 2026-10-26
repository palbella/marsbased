import type { PropsWithChildren, ReactNode } from 'react'

interface PanelSectionProps {
  title: string
  // Shown on the title line, right-aligned (e.g. the clock offset).
  aside?: ReactNode
}

// 06 §6: a titled block of the simulator panel.
export function PanelSection({ title, aside, children }: PropsWithChildren<PanelSectionProps>) {
  const id = `simulator-${title.toLowerCase().replaceAll(' ', '-')}`
  return (
    <section aria-labelledby={id} className="space-y-2 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={id} className="field-label">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}
