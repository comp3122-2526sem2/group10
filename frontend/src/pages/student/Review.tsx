import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Target, UserCircle } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchStudentTaskDetail, type StudentTaskDetail } from '../../api/mock';

function ReviewPage() {
  const navigate = useNavigate();
  const { taskId = 'task-1' } = useParams();
  const [taskDetail, setTaskDetail] = useState<StudentTaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError('');

    fetchStudentTaskDetail(taskId)
      .then(setTaskDetail)
      .catch((loadError) => {
        console.error('Failed to load review page', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load review page.');
      })
      .finally(() => setIsLoading(false));
  }, [taskId]);

  const missedReferences = useMemo(() => {
    if (!taskDetail?.studyGuide) return [];
    const resolvedSet = new Set(
      taskDetail.highlights.filter((highlight) => highlight.isResolved).map((highlight) => highlight.highlightId),
    );
    return taskDetail.studyGuide.references.filter((reference) => !resolvedSet.has(reference.highlightId));
  }, [taskDetail]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const reviewReady = !!taskDetail && taskDetail.submittedCount >= taskDetail.totalErrors;

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-800 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-8 h-[72px] flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/student/dashboard')} className="text-gray-400 hover:text-violet-600 transition">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <Target weight="fill" className="text-violet-600 text-3xl" />
          <h1 className="text-xl font-bold text-gray-900">Debunk AI</h1>
        </div>
        <div className="relative">
          <button onClick={() => setProfileOpen((current) => !current)} className="text-gray-400 hover:text-violet-600 transition">
            <UserCircle size={32} />
          </button>
          {profileOpen ? (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-md py-1 z-20">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-6xl mx-auto px-8 py-10 scrollbar-hide">
        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-gray-600">Loading review guide...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">{error}</div>
        ) : !taskDetail ? null : !reviewReady ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-800">
            You can open this page as soon as your own account has submitted every annotation for this task.
            {taskDetail ? ` Current progress: ${taskDetail.submittedCount}/${taskDetail.totalErrors} submitted.` : ''}
          </div>
        ) : (
          <div className="space-y-8">
            <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">
                    {taskDetail.studyGuide.resourceTitle}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-gray-900">{taskDetail.title} Review</h2>
                  <p className="mt-4 max-w-3xl text-gray-600 leading-relaxed">{taskDetail.studyGuide.overview}</p>
                </div>
                <div className="rounded-2xl bg-violet-50 border border-violet-100 px-5 py-4 text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Accuracy</p>
                  <p className="mt-2 text-3xl font-bold text-violet-700">{taskDetail.foundErrors}/{taskDetail.totalErrors}</p>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              {taskDetail.studyGuide.sections.map((section) => (
                <article key={section.sectionTitle} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-violet-600">
                    <BookOpen size={20} weight="fill" />
                    <h3 className="font-semibold text-gray-900">{section.sectionTitle}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600">{section.content}</p>
                </article>
              ))}
            </section>

            <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Missed Error Recovery</h3>
                  <p className="mt-2 text-gray-500">Each card links a missed AI error back to a short textbook-style explanation and a few revision prompts.</p>
                </div>
                <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
                  {missedReferences.length} concept{missedReferences.length === 1 ? '' : 's'} to revisit
                </span>
              </div>

              {missedReferences.length ? (
                <div className="mt-8 space-y-5">
                  {missedReferences.map((reference) => (
                    <div key={reference.highlightId} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Missed Highlight #{reference.highlightId}
                      </p>
                      <h4 className="mt-2 text-lg font-semibold text-gray-900">{reference.conceptTitle}</h4>
                      <p className="mt-3 text-sm leading-relaxed text-gray-700">
                        <span className="font-semibold">Correct explanation:</span> {reference.explanation}
                      </p>
                      <div className="mt-4 rounded-xl border border-white bg-white px-4 py-4 text-sm leading-relaxed text-gray-700">
                        <span className="font-semibold text-gray-900">Textbook excerpt:</span> {reference.textbookExcerpt}
                      </div>
                      <div className="mt-4 space-y-2">
                        {reference.reviewPoints.map((point) => (
                          <p key={point} className="text-sm text-gray-600">- {point}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 px-6 py-6 text-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={22} weight="fill" />
                    <p className="font-medium">You caught every highlighted AI error. Use the notes above as a quick revision summary.</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReviewPage;
