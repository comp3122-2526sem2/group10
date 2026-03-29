import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCourseForViewer } from '@/lib/services';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const course = await getCourseForViewer(params.id, user.id, user.role);
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ course });
}
