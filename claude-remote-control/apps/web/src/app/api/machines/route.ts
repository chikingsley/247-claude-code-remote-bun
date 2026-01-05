import { NextResponse } from 'next/server';
import { db, machines } from '@/lib/db';

export async function GET() {
  const allMachines = await db.select().from(machines);
  return NextResponse.json(allMachines);
}
