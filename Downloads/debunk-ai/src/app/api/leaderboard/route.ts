import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/services';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId') || undefined;
  const leaderboard = await getLeaderboard(courseId);
  return NextResponse.json(leaderboard);
}
