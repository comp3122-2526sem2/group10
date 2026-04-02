import { useEffect, useMemo, useState } from 'react';
import { Target, UserCircle, Robot, PencilSimpleLine, X, CaretDown, CheckCircle, CursorText, ArrowLeft, Spinner, Star } from '@phosphor-icons/react';
import { useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { fetchStudentTaskDetail, submitAnnotation, type StudentTaskDetail } from '../../api/mock';

function Workspace() {
  const navigate = useNavigate();
  const { taskId = 'task-1' } = useParams();
  const [taskDetail, setTaskDetail] = useState<StudentTaskDetail | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<number | null>(null);
  const [annotation, setAnnotation] = useState('');
  const [errorType, setErrorType] = useState('Logical Error');
  const [resolved, setResolved] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState<number[]>([]);
  const [resolvedData, setResolvedData] = useState<Record<number, { isGolden: boolean; points: number; message: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const totalErrors = taskDetail?.totalErrors ?? 0;

  useEffect(() => {
    setIsLoading(true);
    setLoadError('');

    fetchStudentTaskDetail(taskId)
      .then((detail) => {
        const preResolved = detail.highlights
          .filter((item) => item.isResolved)
          .map((item) => item.highlightId);
        const preSubmitted = detail.highlights
          .filter((item) => item.isSubmitted)
          .map((item) => item.highlightId);

        setTaskDetail(detail);
        setResolved(preResolved);
        setSubmitted(preSubmitted);

        if (detail.submittedCount >= detail.totalErrors) {
          navigate(`/student/review/${taskId}`, { replace: true });
          return;
        }

        setSelectedHighlight(detail.highlights.find((item) => !item.isSubmitted)?.highlightId ?? null);
      })
      .catch((error) => {
        console.error('Failed to fetch task detail', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load task.');
      })
      .finally(() => setIsLoading(false));
  }, [navigate, taskId]);

  const highlightText = useMemo(() => {
    return taskDetail?.highlights.reduce<Record<number, string>>((acc, item) => {
      acc[item.highlightId] = item.text;
      return acc;
    }, {}) ?? {};
  }, [taskDetail]);

  const renderedContentHtml = useMemo(() => {
    if (!taskDetail?.contentHtml) return '';

    const parser = new DOMParser();
    const documentFragment = parser.parseFromString(taskDetail.contentHtml, 'text/html');
    const highlightNodes = documentFragment.querySelectorAll<HTMLElement>('[data-highlight-id]');

    highlightNodes.forEach((node) => {
      const highlightId = Number(node.dataset.highlightId);
      node.classList.add('workspace-highlight');

      if (resolved.includes(highlightId)) {
        node.classList.add('workspace-highlight-resolved');
      } else if (selectedHighlight === highlightId) {
        node.classList.add('workspace-highlight-active');
      } else if (node.dataset.golden === 'true') {
        node.classList.add('workspace-highlight-golden');
      }
    });

    return documentFragment.body.innerHTML;
  }, [resolved, selectedHighlight, taskDetail]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const highlightNode = target.closest<HTMLElement>('[data-highlight-id]');
    if (!highlightNode?.dataset.highlightId) return;

    const highlightId = Number(highlightNode.dataset.highlightId);
    if (submitted.includes(highlightId)) return;

    setSelectedHighlight(highlightId);
  };

  const handleSubmit = async () => {
    if (selectedHighlight === null || submitted.includes(selectedHighlight)) return;

    setIsSubmitting(true);

    try {
      const response = await submitAnnotation({
        taskId,
        highlightId: selectedHighlight,
        errorType,
        reason: annotation,
      });

      const nextSubmitted = Array.from(new Set([...submitted, selectedHighlight]));
      setSubmitted(nextSubmitted);
      setResolvedData((current) => ({
        ...current,
        [selectedHighlight]: {
          isGolden: response.isGolden || false,
          points: response.pointsEarned,
          message: response.message,
        },
      }));

      if (response.isCorrect) {
        setResolved((current) => [...current, selectedHighlight]);
      }

      setAnnotation('');

      if (response.isGolden) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
        });
      }

      if (nextSubmitted.length >= totalErrors) {
        navigate(`/student/review/${taskId}`);
        return;
      }

      const nextHighlight = taskDetail?.highlights.find((item) => !nextSubmitted.includes(item.highlightId))?.highlightId ?? null;
      setSelectedHighlight(nextHighlight);
    } catch (error) {
      console.error('Failed to submit annotation', error);
      alert(error instanceof Error ? error.message : 'Failed to submit annotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-8 h-[72px] flex justify-between items-center shrink-0 w-full z-10">
        <div className="flex items-center gap-3 w-1/3">
          <button onClick={() => navigate('/student/dashboard')} className="mr-2 text-gray-400 hover:text-violet-600 transition">
            <ArrowLeft size={24} weight="bold" />
          </button>
          <Target weight="fill" className="text-violet-600 text-3xl" />
          <h1 className="text-xl font-bold text-gray-900">Debunk AI</h1>
        </div>

        <div className="flex justify-center w-1/3">
          <div className="flex bg-white px-5 py-2 rounded-full border border-gray-200 shadow-sm items-center gap-4">
            <span className="text-sm font-semibold text-gray-600">Task Progress</span>
            <div className="flex gap-2 items-center">
              <div className="text-sm font-medium text-gray-700">
                Submitted <span className="text-violet-600 font-bold text-lg">{submitted.length}/{totalErrors}</span> annotations
              </div>
              <div className="w-32 h-2.5 bg-gray-100 rounded-full ml-2 overflow-hidden border border-gray-200">
                <div
                  className="h-full bg-violet-600 transition-all duration-500 rounded-full"
                  style={{ width: `${totalErrors ? (submitted.length / totalErrors) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 w-1/3">
          <div className="relative">
            <button onClick={() => setProfileOpen((v) => !v)} className="text-gray-400 hover:text-violet-600 cursor-pointer transition">
              <UserCircle size={32} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-xl shadow-md py-1 z-20">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <section className="flex-1 overflow-y-auto w-2/3 p-12 bg-white z-0 relative">
          <div className="max-w-4xl mx-auto">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">{taskDetail?.title ?? 'Loading task...'}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Robot size={18} /> Generated by AI Assistant. Please review and debunk the flaws.
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-gray-600">
                <Spinner size={20} className="animate-spin" />
                Loading task content...
              </div>
            ) : loadError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                {loadError}
              </div>
            ) : (
              <div
                className="space-y-6 text-lg leading-relaxed text-gray-800 workspace-content"
                onClick={handleContentClick}
                dangerouslySetInnerHTML={{ __html: renderedContentHtml }}
              />
            )}
          </div>
        </section>

        <aside className="w-[450px] bg-gray-50 border-l border-gray-200 p-8 flex flex-col h-full overflow-y-auto shrink-0">
          {selectedHighlight && !submitted.includes(selectedHighlight) ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6 animate-fade-in-up">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <PencilSimpleLine size={20} className="text-violet-600" />
                  Add Annotation
                </h3>
                <button onClick={() => setSelectedHighlight(null)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="bg-yellow-50 text-yellow-800 text-sm p-4 rounded-xl border border-yellow-200 italic shadow-inner">
                "{highlightText[selectedHighlight] ?? ''}"
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">Error Type</label>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white border border-gray-300 text-gray-700 rounded-xl py-3 px-4 pr-10 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition shadow-sm cursor-pointer hover:bg-gray-50"
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                  >
                    <option value="Logical Error">Logical Error</option>
                    <option value="Factual Error">Factual Error</option>
                    <option value="AI Hallucination">AI Hallucination</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <CaretDown weight="fill" size={18} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-grow">
                <label className="text-sm font-semibold text-gray-700">Correction Reason</label>
                <textarea
                  placeholder="Please enter your correction reason or the factual knowledge..."
                  className="w-full h-32 bg-white border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none transition shadow-sm"
                  value={annotation}
                  onChange={(e) => setAnnotation(e.target.value)}
                  disabled={isSubmitting}
                ></textarea>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!annotation.trim() || isSubmitting}
                className={`w-full py-3 rounded-xl font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                  (!annotation.trim() || isSubmitting) ? 'bg-gray-300 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 hover:shadow-md'
                }`}
              >
                {isSubmitting ? (
                  <Spinner size={22} className="animate-spin" />
                ) : (
                  <CheckCircle size={22} />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Correction'}
              </button>
            </div>
          ) : selectedHighlight !== null && resolved.includes(selectedHighlight) ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3 animate-fade-in-up rounded-2xl bg-white border border-gray-200 p-6">
              {resolvedData[selectedHighlight]?.isGolden ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-200 to-yellow-500 flex items-center justify-center text-white mb-2 shadow-lg scale-[1.1]">
                    <Star weight="fill" size={42} />
                  </div>
                  <h3 className="font-bold text-xl text-yellow-600">Golden Hallucination!</h3>
                  <p className="font-medium text-gray-700">{resolvedData[selectedHighlight]?.message}</p>
                  <p className="text-sm font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-full mt-2">
                    +{resolvedData[selectedHighlight]?.points} Points
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-500 mb-2">
                    <CheckCircle weight="fill" size={36} />
                  </div>
                  <p className="font-medium text-gray-700">{resolvedData[selectedHighlight]?.message || 'Successfully debunked this error!'}</p>
                  <p className="text-sm font-medium text-green-600">+{resolvedData[selectedHighlight]?.points || 1} Point, Great job!</p>
                </>
              )}
            </div>
          ) : selectedHighlight !== null && submitted.includes(selectedHighlight) ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 rounded-2xl bg-white border border-gray-200 p-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                <CheckCircle weight="fill" size={36} />
              </div>
              <p className="font-medium text-gray-700">{resolvedData[selectedHighlight]?.message || 'Annotation submitted.'}</p>
              <p className="text-sm text-gray-500">Finish all annotations to unlock the separate review page.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-4 rounded-2xl bg-white border border-gray-200 p-6">
              <CursorText size={48} className="opacity-50" />
              <p className="font-medium text-gray-500 leading-relaxed">Select/click highlighted text on the left<br/>to start your "Debunk" task</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default Workspace;
