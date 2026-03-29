import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { createCourseForTeacher, getTeacherCourses } from '@/lib/services';

export default async function TeacherCoursesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const courses = await getTeacherCourses(user.id);

  async function createCourse(formData: FormData) {
    'use server';
    const session = await requireUser('TEACHER');
    await createCourseForTeacher(session.id, String(formData.get('name') || ''), String(formData.get('subject') || 'General'));
    revalidatePath('/teacher/courses');
    revalidatePath('/teacher/dashboard');
  }

  return (
    <div className="space-y-6">
      <form action={createCourse} className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-lg font-semibold">创建课程</div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr,1fr,auto]">
          <input name="name" placeholder="课程名称" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
          <input name="subject" placeholder="学科" className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
          <button className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white">创建</button>
        </div>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} href={`/teacher/course/${course.id}`} className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-cyan-400/40">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{course.subject}</div>
            <div className="mt-2 text-xl font-semibold">{course.name}</div>
            <div className="mt-3 text-sm text-slate-300">邀请码：{course.inviteCode}</div>
            <div className="mt-1 text-sm text-slate-400">学生 {course.enrollments.length} · 任务 {course.tasks.length}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
