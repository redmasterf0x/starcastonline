import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest, NextResponse } from "next/server"

const handler = toNextJsHandler(auth.handler)

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  // Log every auth request for debugging OAuth flow
  if (url.pathname.includes("callback")) {
    console.log("[AUTH DEBUG] Callback hit:", {
      fullUrl: req.url,
      pathname: url.pathname,
      searchParams: Object.fromEntries(url.searchParams),
      hasCode: url.searchParams.has("code"),
      hasState: url.searchParams.has("state"),
      hasError: url.searchParams.has("error"),
      host: req.headers.get("host"),
      origin: req.headers.get("origin"),
      referer: req.headers.get("referer"),
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    })
  }
  return handler.GET!(req)
}

export async function POST(req: NextRequest) {
  return handler.POST!(req)
}
