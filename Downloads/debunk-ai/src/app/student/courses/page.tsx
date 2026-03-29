import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { getStudentCourses, joinCourseByCode } from '@/lib/services';

export default async function StudentCoursesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const courses = await getStudentCourses(user.id);

  async function joinCourse(formData: FormData) {
    'use server';
    const session = await requireUser('STUDENT');
    await joinCourseByCode(session.id, String(formData.get('inviteCode') || ''));
    revalidatePath('/student/courses');
    revalidatePath('/student/dashboard');
  }

  return (
    <div className="space-y-6">
      <form action={joinCourse} className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-lg font-semibold">Join a Course</div>
        <div className="mt-3 flex flex-col gap-3 md:flex-row">
          <input name="inviteCode" placeholder="Enter invite code (e.g., DEBUNK01)" className="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
          <button className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white">Join</button>
        </div>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((row) => (
          <Link key={row.course.id} href={`/student/course/${row.course.id}`} className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-cyan-400/40">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{row.course.subject}</div>
            <div className="mt-2 text-xl font-semibold">{row.course.name}</div>
            <div className="mt-3 text-sm text-slate-300">Teacher: {row.course.teacher.name}</div>
            <div className="mt-1 text-sm text-slate-400">Tasks: {row.course.tasks.length}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
