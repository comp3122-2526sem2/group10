import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getStudentDashboard } from '@/lib/services';

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const data = await getStudentDashboard(user.id);
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['XP', String(user.xp)],
          ['Level', String(user.level)],
          ['Streak', String(data.streak?.currentStreak || 0)],
          ['Badges', String(data.badges)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm text-slate-300">{label}</div>
            <div className="mt-3 text-3xl font-black">{value}</div>
          </div>
        ))}
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">待完成任务</h2>
          <Link href="/student/courses" className="text-sm text-cyan-300">查看全部课程</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.activeTasks.map((task) => (
            <Link key={task.id} href={`/student/task/${task.id}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 hover:border-cyan-400/40">
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{task.mode}</div>
              <div className="mt-2 text-lg font-semibold">{task.title}</div>
              <div className="mt-2 text-sm text-slate-300">{task.topic}</div>
            </Link>
          ))}
          {data.activeTasks.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">还没有已发布任务，先加入课程吧。</div> : null}
        </div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">最近成绩</h2>
        <div className="mt-4 space-y-3">
          {data.submissions.map((submission) => (
            <div key={submission.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
              <div className="font-medium">{submission.task.title}</div>
              <div className="mt-1">总分：{Math.round(submission.scoreOverall || 0)} / 100</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
