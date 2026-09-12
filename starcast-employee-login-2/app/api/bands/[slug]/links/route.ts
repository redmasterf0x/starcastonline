import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bandLinks, bands } from '@/lib/db/schema';
import { getSession } from '@/app/actions/auth'; // assumes existing auth helper

/** GET /api/bands/[slug]/links */
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const band = await db.select().from(bands).where(bands.slug.eq(params.slug)).limit(1).then(r=>r[0]);
  if (!band) return NextResponse.json({ error: 'Band not found' }, { status: 404 });
  const links = await db.select().from(bandLinks).where(bandLinks.bandId.eq(band.id));
  return NextResponse.json(links);
}

/** POST /api/bands/[slug]/links */
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const band = await db.select().from(bands).where(bands.slug.eq(params.slug)).limit(1).then(r=>r[0]);
  if (!band) return NextResponse.json({ error: 'Band not found' }, { status: 404 });

  // Permissions: owner, admin or employee
  const profile = await db.select().from('profiles').where('userId', '=', session.user.id).limit(1).then(r=>r[0]);
  const canEdit = band.ownerUserId === session.user.id || profile?.isAdmin || profile?.isEmployee;
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { label, url, icon, position } = await request.json();
  const [newLink] = await db.insert(bandLinks).values({
    bandId: band.id,
    label,
    url,
    icon: icon ?? null,
    position: position ?? 0,
  }).returning();
  return NextResponse.json(newLink, { status: 201 });
}

/** PUT /api/bands/[slug]/links/:id */
export async function PUT(request: Request, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const band = await db.select().from(bands).where(bands.slug.eq(params.slug)).limit(1).then(r=>r[0]);
  if (!band) return NextResponse.json({ error: 'Band not found' }, { status: 404 });

  const profile = await db.select().from('profiles').where('userId', '=', session.user.id).limit(1).then(r=>r[0]);
  const canEdit = band.ownerUserId === session.user.id || profile?.isAdmin || profile?.isEmployee;
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { label, url, icon, position } = await request.json();
  await db.update(bandLinks).set({ label, url, icon: icon ?? null, position: position ?? 0 }).where(bandLinks.id.eq(Number(params.id)));
  const updated = await db.select().from(bandLinks).where(bandLinks.id.eq(Number(params.id))).limit(1).then(r=>r[0]);
  return NextResponse.json(updated);
}

/** DELETE /api/bands/[slug]/links/:id */
export async function DELETE(request: Request, { params }: { params: { slug: string; id: string } }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const band = await db.select().from(bands).where(bands.slug.eq(params.slug)).limit(1).then(r=>r[0]);
  if (!band) return NextResponse.json({ error: 'Band not found' }, { status: 404 });

  const profile = await db.select().from('profiles').where('userId', '=', session.user.id).limit(1).then(r=>r[0]);
  const canEdit = band.ownerUserId === session.user.id || profile?.isAdmin || profile?.isEmployee;
  if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.delete(bandLinks).where(bandLinks.id.eq(Number(params.id)));
  return NextResponse.json({ success: true });
}

