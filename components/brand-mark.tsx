"use client"

import Link from "next/link"

import { appConfig } from "@/lib/app-config"
import { cn } from "@/lib/utils"

export function BrandMark({
  href = "/",
  className,
}: {
  href?: string
  className?: string
}) {
  return (
    <Link href={href} className={cn("font-semibold tracking-tight", className)}>
      {appConfig.productName}
    </Link>
  )
}

