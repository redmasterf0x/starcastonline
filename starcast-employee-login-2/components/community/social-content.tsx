import React from "react"
import Link from "next/link"

interface SocialContentProps {
  text: string
  className?: string
}

export function SocialContent({ text, className = "" }: SocialContentProps) {
  if (!text) return null

  // Regex matches @username with word boundaries
  const mentionRegex = /@([a-zA-Z0-9_-]{2,30})/g

  // Split text while preserving delimiters
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mentionRegex.exec(text)) !== null) {
    const matchStart = match.index
    const matchEnd = mentionRegex.lastIndex
    const username = match[1]

    // Preceding text
    if (matchStart > lastIndex) {
      parts.push(text.substring(lastIndex, matchStart))
    }

    // Mention tag
    parts.push(
      <Link
        key={`${matchStart}-${username}`}
        href={`/u/${username}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center text-[#20efe0] hover:text-[#72fff6] font-semibold bg-[#20efe0]/10 hover:bg-[#20efe0]/20 px-1.5 py-0.5 rounded-md border border-[#20efe0]/30 transition-all text-inherit mx-0.5"
      >
        @{username}
      </Link>
    )

    lastIndex = matchEnd
  }

  // Trailing text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return (
    <span className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {parts}
    </span>
  )
}
