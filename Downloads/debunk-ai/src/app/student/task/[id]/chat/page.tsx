import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getSubmissionForStudent } from '@/lib/services';
import { ReviewChat } from '@/components/review-chat';

export default async function StudentTaskChatPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const submission = await getSubmissionForStudent(params.id, user.id);
  if (!submission) notFound();
  const grading = submission.gradingResult as any;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-3xl font-black">Socratic Review Chat</h1>
        <p className="mt-2 text-slate-300">先从你漏掉或判错的那一条开始，我会一步步带你复盘。</p>
      </div>
      <ReviewChat submissionId={submission.id} errors={grading.missedErrors} initialSessions={submission.chatSessions} />
    </div>
  );
}
