import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code") || ""

  // When Google checks file verification, it expects:
  // google-site-verification: google<code_or_hash>.html
  const content = code ? `google-site-verification: google${code}.html\n` : "google-site-verification\n"

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}

