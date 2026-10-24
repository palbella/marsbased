import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { MockProvider } from './mock-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Corvane Control Tower',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <MockProvider>{children}</MockProvider>
      </body>
    </html>
  )
}
