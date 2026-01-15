import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params;
  return NextResponse.json({ slug: resolved.slug });
}
