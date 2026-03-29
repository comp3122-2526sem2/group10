import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getCourseForViewer } from '@/lib/services';

export default async function StudentCourseDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const course = await getCourseForViewer(params.id, user.id, user.role);
  if (!course) notFound();
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{course.subject}</div>
        <h1 className="mt-2 text-3xl font-black">{course.name}</h1>
        <p className="mt-2 text-slate-300">教师：{course.teacher.name} · 邀请码：{course.inviteCode}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {course.tasks.map((task) => (
          <Link key={task.id} href={`/student/task/${task.id}`} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 hover:border-cyan-400/40">
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{task.mode}</div>
            <div className="mt-2 text-xl font-semibold">{task.title}</div>
            <div className="mt-2 text-sm text-slate-300">{task.topic}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
