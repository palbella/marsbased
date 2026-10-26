import type { PropsWithChildren } from 'react'

// CP-11: a titled block of the detail page.
export function DetailSection({ title, children }: PropsWithChildren<{ title: string }>) {
  const id = `section-${title.toLowerCase().replaceAll(' ', '-')}`
  return (
    <section aria-labelledby={id} className="min-w-0">
      <h2 id={id} className="field-label mb-2 px-4 md:px-0">
        {title}
      </h2>
      {children}
    </section>
  )
}
