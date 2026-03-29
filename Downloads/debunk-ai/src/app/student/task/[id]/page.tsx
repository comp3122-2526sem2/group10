import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getSubmissionForStudent, getTaskForViewer } from '@/lib/services';
import { TaskWorkspace } from '@/components/task-workspace';

export default async function StudentTaskPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const task = await getTaskForViewer(params.id, user.id, user.role);
  if (!task) notFound();
  const submission = await getSubmissionForStudent(params.id, user.id);
  if (submission) redirect(`/student/task/${params.id}/result`);
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{task.mode}</div>
        <h1 className="mt-2 text-3xl font-black">{task.title}</h1>
        <p className="mt-2 text-slate-300">Topic: {task.topic}</p>
      </div>
      <TaskWorkspace taskId={task.id} mode={task.mode} content={task.generatedContent} meta={task.generatedMeta as any} />
    </div>
  );
}
