import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherDashboard } from '@/lib/services';

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const data = await getTeacherDashboard(user.id);
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Courses', String(data.courses.length)],
          ['Total Tasks', String(data.courses.reduce((sum, c) => sum + c.tasks.length, 0))],
          ['Recent Submissions', String(data.recentSubmissions.length)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-300">{label}</div>
            <div className="mt-3 text-3xl font-black">{value}</div>
          </div>
        ))}
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">课程概览</h2>
          <Link href="/teacher/task/create" className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">新建任务</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.courses.map((course) => (
            <Link key={course.id} href={`/teacher/course/${course.id}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{course.subject}</div>
              <div className="mt-2 text-xl font-semibold">{course.name}</div>
              <div className="mt-2 text-sm text-slate-300">Students {course.enrollments.length} · Tasks {course.tasks.length}</div>
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">最近提交</h2>
        <div className="mt-4 space-y-3">
          {data.recentSubmissions.map((submission) => (
            <Link key={submission.id} href={`/teacher/task/${submission.taskId}/submissions/${submission.id}`} className="block rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <div className="font-medium">{submission.student.name} · {submission.task.title}</div>
              <div className="mt-1 text-sm text-slate-400">Overall {Math.round(submission.scoreOverall || 0)}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
