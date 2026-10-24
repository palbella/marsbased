import type { NextConfig } from 'next'
import { version } from './package.json'

const SHORT_SHA_LENGTH = 7

// 02 §5.8: the app version attached to every monitoring event. On Vercel it is the package
// version plus the short commit SHA; `dev` everywhere else.
function appVersion(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
  return sha ? `${version}+${sha.slice(0, SHORT_SHA_LENGTH)}` : 'dev'
}

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: appVersion() },
}

export default nextConfig
