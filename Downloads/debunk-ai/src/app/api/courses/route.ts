import { NextResponse } from 'next/server';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { createCourseForTeacher, getStudentCourses, getTeacherCourses } from '@/lib/services';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const courses = user.role === 'TEACHER' ? await getTeacherCourses(user.id) : await getStudentCourses(user.id);
  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser('TEACHER');
    const body = await request.json();
    const course = await createCourseForTeacher(user.id, body.name, body.subject);
    return NextResponse.json({ course });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
