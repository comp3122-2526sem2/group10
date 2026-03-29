import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { letterGrade } from '@/lib/utils';
import { getSubmissionForStudent } from '@/lib/services';

export default async function StudentTaskResultPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const submission = await getSubmissionForStudent(params.id, user.id);
  if (!submission) notFound();
  const grading = submission.gradingResult as any;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[0.7fr,1.3fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm text-slate-300">Overall Score</div>
          <div className="mt-3 text-6xl font-black">{Math.round(submission.scoreOverall || 0)}</div>
          <div className="mt-2 text-xl text-cyan-300">Grade {letterGrade(Math.round(submission.scoreOverall || 0))}</div>
          <Link href={`/student/task/${params.id}/chat`} className="mt-6 inline-flex rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white">开始复盘对话</Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['Precision', submission.scorePrecision || 0],
              ['Recall', submission.scoreRecall || 0],
              ['分类准确率', submission.scoreClassification || 0],
              ['解释质量', submission.scoreExplanation || 0],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-center">
                <div className="text-xs text-slate-400">{label}</div>
                <div className="mt-2 text-2xl font-bold">{Math.round(value as number)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-300">{grading.personalizedFeedback}</div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">你的标注结果</h2>
          <div className="mt-4 space-y-3">
            {grading.annotationResults.map((row: any) => (
              <div key={row.annotationId} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
                <div className="font-medium">{row.matchStatus === 'true_positive' ? '✅ True Positive' : '❌ False Positive'}</div>
                <div className="mt-2">{row.selectedText}</div>
                <div className="mt-2 text-slate-400">{row.feedback}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">漏掉的错误</h2>
          <div className="mt-4 space-y-3">
            {grading.missedErrors.map((row: any) => (
              <div key={row.id} className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-50">
                <div className="font-medium">#{row.id} · {row.errorType}</div>
                <div className="mt-2">{row.errorText}</div>
                <div className="mt-2 text-amber-100/80">{row.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
