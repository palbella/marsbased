import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { fontVariables } from './fonts'
import { MockProvider } from './mock-provider'
import { AppProviders } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Corvane Control Tower',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <MockProvider>
          <AppProviders>{children}</AppProviders>
        </MockProvider>
      </body>
    </html>
  )
}
