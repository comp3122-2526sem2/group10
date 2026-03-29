import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ErrorDensity, TaskMode } from '@prisma/client';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { modeOptions, subjectOptions } from '@/lib/constants';
import { createTaskForTeacher, getTeacherCourses } from '@/lib/services';

export default async function TeacherTaskCreatePage({ searchParams }: { searchParams?: { courseId?: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const courses = await getTeacherCourses(user.id);

  async function createTask(formData: FormData) {
    'use server';
    const session = await requireUser('TEACHER');
    const task = await createTaskForTeacher({
      courseId: String(formData.get('courseId')),
      title: String(formData.get('title')),
      topic: String(formData.get('topic')),
      subjectArea: String(formData.get('subjectArea')),
      mode: String(formData.get('mode')) as TaskMode,
      referenceMaterial: String(formData.get('referenceMaterial') || ''),
      errorDensity: String(formData.get('errorDensity')) as ErrorDensity,
      errorConfig: { factual: 1, logical: 1, hallucination: 1, conceptual: 1 },
      isPublished: true,
      isChallenge: formData.get('isChallenge') === 'on',
      challengeDuration: Number(formData.get('challengeDuration') || 0) || null,
    });
    revalidatePath('/teacher/dashboard');
    revalidatePath('/teacher/courses');
    redirect(`/teacher/task/${task.id}/preview`);
  }

  return (
    <form action={createTask} className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-5">
      <h1 className="text-3xl font-black">Task Creation Wizard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm">课程</label>
          <select name="courseId" defaultValue={searchParams?.courseId} className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white">
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm">任务标题</label>
          <input name="title" defaultValue="Debunk Task" className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm">Topic</label>
          <input name="topic" placeholder="Newton's Third Law / French Revolution / ..." className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
        </div>
        <div>
          <label className="mb-2 block text-sm">Subject</label>
          <select name="subjectArea" className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white">{subjectOptions.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <div>
          <label className="mb-2 block text-sm">Mode</label>
          <select name="mode" className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white">{modeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        </div>
        <div>
          <label className="mb-2 block text-sm">Error Density</label>
          <select name="errorDensity" className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white">
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm">Reference Material (optional)</label>
        <textarea name="referenceMaterial" rows={10} placeholder="粘贴 PDF 提取内容、Markdown、讲义摘要，系统会优先基于它生成。" className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="isChallenge" /> 同步挑战模式</label>
        <input type="number" name="challengeDuration" min={10} step={5} defaultValue={15} className="w-40 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
        <span className="text-sm text-slate-400">分钟</span>
      </div>
      <button className="rounded-2xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white">生成并进入预览</button>
    </form>
  );
}
