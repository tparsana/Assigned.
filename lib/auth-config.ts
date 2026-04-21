function normalizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  return trimmed.replace(/\/+$/, "")
}

function getConfiguredSiteUrl() {
  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
  )
}

export function buildAuthCallbackUrl(nextPath = "/app") {
  const encodedNext = encodeURIComponent(nextPath)

  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/confirm?next=${encodedNext}`
  }

  const siteUrl = getConfiguredSiteUrl()
  if (!siteUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL")
  }

  return `${siteUrl}/auth/confirm?next=${encodedNext}`
}

