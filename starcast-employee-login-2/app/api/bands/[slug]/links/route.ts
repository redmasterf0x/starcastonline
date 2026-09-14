import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { bandLinks, bands } from "@/lib/db/schema"
import { getViewerPermissions } from "@/lib/permissions"
import { asc, eq } from "drizzle-orm"

/** GET /api/bands/[slug]/links */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const band = await db
    .select()
    .from(bands)
    .where(eq(bands.slug, slug))
    .limit(1)
    .then((r) => r[0])
  if (!band) return NextResponse.json({ error: "Band not found" }, { status: 404 })

  const links = await db
    .select()
    .from(bandLinks)
    .where(eq(bandLinks.bandId, band.id))
    .orderBy(asc(bandLinks.position))

  return NextResponse.json(links)
}

/** POST /api/bands/[slug]/links */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const viewer = await getViewerPermissions()
  if (!viewer) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { slug } = await params
  const band = await db
    .select()
    .from(bands)
    .where(eq(bands.slug, slug))
    .limit(1)
    .then((r) => r[0])
  if (!band) return NextResponse.json({ error: "Band not found" }, { status: 404 })

  // Permissions: owner, admin or staff
  const canEdit = band.ownerUserId === viewer.userId || viewer.isAdmin || viewer.isStaff
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const { label, url, icon, position } = body
  const [newLink] = await db
    .insert(bandLinks)
    .values({
      bandId: band.id,
      label,
      url,
      icon: icon ?? null,
      position: position ?? 0,
    })
    .returning()

  return NextResponse.json(newLink, { status: 201 })
}

/** PUT /api/bands/[slug]/links */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string; id?: string }> }
) {
  const viewer = await getViewerPermissions()
  if (!viewer) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const resolvedParams = await params
  const { slug } = resolvedParams
  const band = await db
    .select()
    .from(bands)
    .where(eq(bands.slug, slug))
    .limit(1)
    .then((r) => r[0])
  if (!band) return NextResponse.json({ error: "Band not found" }, { status: 404 })

  const canEdit = band.ownerUserId === viewer.userId || viewer.isAdmin || viewer.isStaff
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const urlObj = new URL(request.url)
  const linkId = Number(body.id ?? urlObj.searchParams.get("id") ?? resolvedParams.id)
  if (!linkId || isNaN(linkId)) {
    return NextResponse.json({ error: "Missing link id" }, { status: 400 })
  }

  const { label, url, icon, position } = body
  await db
    .update(bandLinks)
    .set({
      ...(label !== undefined ? { label } : {}),
      ...(url !== undefined ? { url } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(position !== undefined ? { position } : {}),
    })
    .where(eq(bandLinks.id, linkId))

  const updated = await db
    .select()
    .from(bandLinks)
    .where(eq(bandLinks.id, linkId))
    .limit(1)
    .then((r) => r[0])

  return NextResponse.json(updated)
}

/** DELETE /api/bands/[slug]/links */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; id?: string }> }
) {
  const viewer = await getViewerPermissions()
  if (!viewer) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const resolvedParams = await params
  const { slug } = resolvedParams
  const band = await db
    .select()
    .from(bands)
    .where(eq(bands.slug, slug))
    .limit(1)
    .then((r) => r[0])
  if (!band) return NextResponse.json({ error: "Band not found" }, { status: 404 })

  const canEdit = band.ownerUserId === viewer.userId || viewer.isAdmin || viewer.isStaff
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const urlObj = new URL(request.url)
  let bodyId: any
  try {
    const body = await request.json()
    bodyId = body?.id
  } catch {
    // Body can be empty on DELETE
  }
  const linkId = Number(bodyId ?? urlObj.searchParams.get("id") ?? resolvedParams.id)
  if (!linkId || isNaN(linkId)) {
    return NextResponse.json({ error: "Missing link id" }, { status: 400 })
  }

  await db.delete(bandLinks).where(eq(bandLinks.id, linkId))
  return NextResponse.json({ success: true })
}
