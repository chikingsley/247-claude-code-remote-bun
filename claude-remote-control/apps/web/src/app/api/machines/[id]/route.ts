import { NextResponse } from 'next/server';
import { db, machines } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [machine] = await db.select().from(machines).where(eq(machines.id, id));

  if (!machine) {
    return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
  }

  return NextResponse.json(machine);
}
