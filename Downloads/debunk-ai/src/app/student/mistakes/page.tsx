import { revalidatePath } from 'next/cache';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { getMistakes, updateMistakeNote } from '@/lib/services';

export default async function StudentMistakesPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const mistakes = await getMistakes(user.id);

  async function saveNote(formData: FormData) {
    'use server';
    const session = await requireUser('STUDENT');
    await updateMistakeNote(String(formData.get('id')), session.id, String(formData.get('note') || ''));
    revalidatePath('/student/mistakes');
  }

  return (
    <div className="space-y-4">
      {mistakes.map((mistake) => (
        <form key={mistake.id} action={saveNote} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <input type="hidden" name="id" value={mistake.id} />
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-300">{mistake.entryType}</div>
          <div className="mt-2 text-xl font-semibold">{mistake.submission.task.title}</div>
          <textarea name="note" defaultValue={mistake.personalNotes || ''} placeholder="How will you avoid this error next time?" className="mt-4 min-h-[120px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white" />
          <button className="mt-3 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white">Save Note</button>
        </form>
      ))}
      {mistakes.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-slate-400">No mistakes recorded yet. Complete more tasks to build up your error journal.</div> : null}
    </div>
  );
}
