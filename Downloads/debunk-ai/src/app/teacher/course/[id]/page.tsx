import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCourseForViewer } from '@/lib/services';

export default async function TeacherCoursePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const course = await getCourseForViewer(params.id, user.id, user.role);
  if (!course) notFound();
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{course.subject}</div>
        <h1 className="mt-2 text-3xl font-black">{course.name}</h1>
        <p className="mt-2 text-slate-300">邀请码：{course.inviteCode}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">学生名单</h2>
          <div className="mt-4 space-y-3">
            {course.enrollments.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">{row.student.name} · {row.student.email}</div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">任务列表</h2>
            <Link href={`/teacher/task/create?courseId=${course.id}`} className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">创建任务</Link>
          </div>
          <div className="space-y-3">
            {course.tasks.map((task) => (
              <Link key={task.id} href={`/teacher/task/${task.id}`} className="block rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
                <div className="font-medium">{task.title}</div>
                <div className="mt-1 text-sm text-slate-400">{task.mode} · {task.topic}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
