import Link from 'next/link'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Wordmark } from '@/components/ui/wordmark'

// UI-10, 02 §5.6: unknown routes. Home redirects to the user's own area.
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex h-14 items-center bg-ink px-4 text-paper md:px-5">
        <Wordmark />
      </header>
      <EmptyState
        stamp="NOT FOUND"
        message="This page does not exist or is not available to you."
        action={
          <Link href="/" className={buttonClasses('secondary')}>
            Go home
          </Link>
        }
      />
    </div>
  )
}
