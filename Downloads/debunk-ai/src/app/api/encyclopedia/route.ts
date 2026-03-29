import { NextResponse } from 'next/server';
import { getEncyclopedia } from '@/lib/services';

export async function GET() {
  return NextResponse.json({ items: getEncyclopedia() });
}
