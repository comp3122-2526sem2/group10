import { useState, useEffect } from 'react';
import { Target, UserCircle, UploadSimple, ChalkboardTeacher, ChartBar, Flame, WarningCircle, Robot, TestTube, Spinner, BookOpen } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import {
  fetchBlindspotHeatmap,
  fetchTeacherOverviewStats,
  fetchRecentTasks,
  generateFlawedText,
  publishTask,
  type InsightReport,
  type GeneratedDraft,
  type TeacherTask,
} from '../../api/mock';
// NEW IMPORTS for textbook features
import { TextbookUpload } from './TextbookUpload';
import { TaskFormWithTextbook } from './TaskFormWithTextbook';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [heatmapData, setHeatmapData] = useState<InsightReport | null>(null);
  const [overviewStats, setOverviewStats] = useState<{ activeStudents: number; avgFactCheckScore: number; generatedTasks: number } | null>(null);
  const [recentTasks, setRecentTasks] = useState<TeacherTask[]>([]);
  // MODIFIED: Added 'textbooks' tab
  const [activeTab, setActiveTab] = useState<'overview' | 'generation' | 'analytics' | 'textbooks'>('overview');

  const [taskTitle, setTaskTitle] = useState('New Fact-check Task');
  const [subject, setSubject] = useState('General');
  const [sourceText, setSourceText] = useState('');
  const [hallucinationDensity, setHallucinationDensity] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedDraft | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');
  
  // NEW: Get teacher ID from localStorage or auth context
  const [teacher_id, setTeacherId] = useState<string>('');

  useEffect(() => {
    // Get teacher ID from stored user data
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setTeacherId(user.id);
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [overview, tasks] = await Promise.all([
          fetchTeacherOverviewStats(),
          fetchRecentTasks(),
        ]);
        setOverviewStats(overview);
        setRecentTasks(tasks);

        if (tasks.length > 0) {
          const report = await fetchBlindspotHeatmap(tasks[0].id);
          setHeatmapData(report);
        } else {
          setHeatmapData({
            taskId: 'none',
            title: 'No published tasks yet',
            blindspots: [],
          });
        }
      } catch (loadError) {
        console.error('Failed to load teacher dashboard', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard.');
      }
    };

    loadDashboard().catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
      alert('Please enter source material.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await generateFlawedText({
        sourceText,
        density: hallucinationDensity,
        title: taskTitle,
        subject,
      });
      setGeneratedDraft(response);
    } catch (generateError) {
      console.error('Failed to generate task', generateError);
      setError(generateError instanceof Error ? generateError.message : 'Failed to generate task.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedDraft) return;

    setIsPublishing(true);
    setError('');

    try {
      await publishTask({ taskId: generatedDraft.taskId, title: taskTitle, subject });
      const [overview, tasks] = await Promise.all([
        fetchTeacherOverviewStats(),
        fetchRecentTasks(),
      ]);
      setOverviewStats(overview);
      setRecentTasks(tasks);
      if (tasks.length > 0) {
        const report = await fetchBlindspotHeatmap(tasks[0].id);
        setHeatmapData(report);
      }
      setGeneratedDraft(null);
      setSourceText('');
      setActiveTab('overview');
    } catch (publishError) {
      console.error('Failed to publish task', publishError);
      setError(publishError instanceof Error ? publishError.message : 'Failed to publish task.');
    } finally {
      setIsPublishing(false);
    }
  };

  // NEW: Handle task creation from textbook
  const handleTaskCreatedFromTextbook = (taskId: string) => {
    console.log('Task created:', taskId);
    // Refresh tasks list
    const loadTasks = async () => {
      const tasks = await fetchRecentTasks();
      setRecentTasks(tasks);
    };
    loadTasks();
    setActiveTab('overview');
  };

  return (
    <div className="h-screen bg-gray-50 font-sans text-gray-800 flex flex-col overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-8 h-[72px] flex justify-between items-center shrink-0 w-full z-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <Target weight="fill" className="text-violet-600 text-3xl" />
          <h1 className="text-xl font-bold text-gray-900">Debunk AI</h1>
        </div>
        <div className="flex items-center gap-6">
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

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-full overflow-y-auto shrink-0">
          <nav className="space-y-4">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center justify-start gap-4 font-semibold px-4 py-4 rounded-xl transition-all text-[15px] ${activeTab === 'overview' ? 'text-violet-700 bg-violet-50 border border-violet-100' : 'text-gray-600 hover:bg-gray-50 hover:text-violet-600'}`}>
              <ChalkboardTeacher size={24} />
              <span className="text-left leading-tight">Class Overview</span>
            </button>
            <button onClick={() => setActiveTab('generation')} className={`w-full flex items-center justify-start gap-4 font-semibold px-4 py-4 rounded-xl transition-all text-[15px] ${activeTab === 'generation' ? 'text-violet-700 bg-violet-50 border border-violet-100' : 'text-gray-600 hover:bg-gray-50 hover:text-violet-600'}`}>
              <UploadSimple size={24} />
              <span className="text-left leading-tight">Materials &<br/>Generation</span>
            </button>
            {/* NEW: Textbooks tab button */}
            <button onClick={() => setActiveTab('textbooks')} className={`w-full flex items-center justify-start gap-4 font-semibold px-4 py-4 rounded-xl transition-all text-[15px] ${activeTab === 'textbooks' ? 'text-violet-700 bg-violet-50 border border-violet-100' : 'text-gray-600 hover:bg-gray-50 hover:text-violet-600'}`}>
              <BookOpen size={24} />
              <span className="text-left leading-tight">Textbooks</span>
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center justify-start gap-4 font-semibold px-4 py-4 rounded-xl transition-all text-[15px] ${activeTab === 'analytics' ? 'text-violet-700 bg-violet-50 border border-violet-100' : 'text-gray-600 hover:bg-gray-50 hover:text-violet-600'}`}>
              <ChartBar size={24} />
              <span className="text-left leading-tight">Student Analytics</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto h-full bg-gray-50">
          <div className="px-10 py-8 max-w-6xl mx-auto pb-24">
            {error ? (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                {error}
              </div>
            ) : null}

            {activeTab === 'overview' && (
              <>
                <header className="mb-8 flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-gray-900">Class Overview</h2>
                </header>

                <div className="grid grid-cols-3 gap-6 mb-10">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <p className="text-gray-500 text-sm font-medium mb-1">Active Students</p>
                    <h3 className="text-3xl font-bold text-gray-900">{overviewStats?.activeStudents || 0}</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <p className="text-gray-500 text-sm font-medium mb-1">Average Fact-Check Score</p>
                    <h3 className="text-3xl font-bold text-green-600">{overviewStats?.avgFactCheckScore || 0}%</h3>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                    <p className="text-gray-500 text-sm font-medium mb-1">Generated Tasks</p>
                    <h3 className="text-3xl font-bold text-violet-600">{overviewStats?.generatedTasks || 0}</h3>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-4 mt-8">Recent Fact-Check Tasks</h3>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-4 font-semibold text-gray-600 text-sm">Task Title</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Subject</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm">Completion</th>
                        <th className="p-4 font-semibold text-gray-600 text-sm text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentTasks.length ? recentTasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50 transition">
                          <td className="p-4 font-medium text-gray-900">{task.title}</td>
                          <td className="p-4 text-gray-500">{task.subject}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${task.completion >= 80 ? 'bg-green-500' : task.completion >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${task.completion}%` }}></div>
                              </div>
                              <span className="text-sm text-gray-600">{task.completion}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={async () => {
                                setActiveTab('analytics');
                                const report = await fetchBlindspotHeatmap(task.id);
                                setHeatmapData(report);
                              }}
                              className="text-violet-600 font-medium hover:text-violet-800 transition"
                            >
                              View Insights
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-500">No published tasks yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Textbooks Tab Content */}
            {activeTab === 'textbooks' && (
              <div className="space-y-8">
                <header className="mb-4">
                  <h2 className="text-3xl font-bold text-gray-900">Textbook Management</h2>
                  <p className="text-gray-500 mt-2">Upload PDF textbooks and create fact-check tasks from specific chapters.</p>
                </header>
                
                {/* Textbook Upload Component */}
                <TextbookUpload teacher_id={teacher_id} />
                
                {/* Create Task from Textbook Component */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <TaskFormWithTextbook 
                    teacher_id={teacher_id} 
                    onTaskCreated={handleTaskCreatedFromTextbook}
                  />
                </div>
              </div>
            )}

            {activeTab === 'generation' && (
              <>
                <header className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Materials & AI Generation</h2>
                  <p className="text-gray-500 mt-2">Generate a flawed passage from your own class material, then publish it to students.</p>
                </header>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex gap-10">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
                        <input
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                          placeholder="Industrial Revolution"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                        <input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                          placeholder="World History"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Source Material</label>
                      <textarea
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        className="w-full h-80 bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none transition"
                        placeholder="Paste your original text or course notes here..."
                      ></textarea>
                    </div>
                  </div>
                  <div className="w-80 flex flex-col gap-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <TestTube size={20} className="text-violet-600" /> Hallucination Density
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        value={hallucinationDensity}
                        onChange={(e) => setHallucinationDensity(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                        <span className={hallucinationDensity === 1 ? 'text-violet-600 font-bold' : ''}>Low</span>
                        <span className={hallucinationDensity === 2 ? 'text-violet-600 font-bold' : ''}>Medium</span>
                        <span className={hallucinationDensity === 3 ? 'text-violet-600 font-bold' : ''}>High</span>
                      </div>
                      <p className="text-sm text-gray-600 bg-violet-50 p-4 rounded-xl mt-4 border border-violet-100">
                        {hallucinationDensity === 1 && "Creates obvious factual errors. Best for beginners."}
                        {hallucinationDensity === 2 && "Mixes factual and logical errors. Good for standard tests."}
                        {hallucinationDensity === 3 && "Subtle causal inversions and deep AI hallucinations. Expect a high fail rate."}
                      </p>
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className={`w-full py-4 text-white rounded-xl font-bold shadow-sm transition flex justify-center items-center gap-2 ${isGenerating ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'}`}
                    >
                      {isGenerating ? <Spinner size={22} className="animate-spin" /> : <Robot size={22} />}
                      {isGenerating ? 'Generating...' : 'Generate Flawed Text'}
                    </button>
                  </div>
                </div>

                {generatedDraft && (
                  <div className="mt-8 bg-white border border-violet-100 rounded-3xl p-8 shadow-sm animate-fade-in-up">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Robot size={24} className="text-violet-600" /> Generated Material Preview
                      </h3>
                      <span className="text-sm font-semibold px-3 py-1 bg-violet-100 text-violet-700 rounded-full">
                        Density: {hallucinationDensity}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[150px]">
                      {generatedDraft.generatedText}
                    </div>

                    <div className="mt-6 rounded-2xl border border-gray-100 bg-violet-50/50 p-5">
                      <h4 className="font-semibold text-gray-900 mb-3">Injected Errors</h4>
                      <div className="space-y-3">
                        {generatedDraft.highlights.map((item) => (
                          <div key={item.highlightId} className="rounded-xl border border-violet-100 bg-white px-4 py-3">
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-medium text-gray-900">{item.text}</span>
                              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{item.errorType}</span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{item.canonicalReason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                      <button
                        onClick={() => setGeneratedDraft(null)}
                        className="px-6 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className={`px-6 py-2.5 rounded-xl font-semibold bg-violet-600 text-white hover:bg-violet-700 shadow-sm transition flex items-center gap-2 ${isPublishing ? 'opacity-75' : ''}`}
                      >
                        {isPublishing ? <Spinner className="animate-spin" /> : null} Publish to Students
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'analytics' && (
              <>
                <header className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">Student Analytics & Insights</h2>
                </header>
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Flame weight="fill" className="text-red-500 text-2xl" />
                    <h3 className="text-2xl font-bold text-gray-900">Class Blindspot Heatmap</h3>
                  </div>
                  <p className="text-gray-500 mb-8 max-w-3xl">
                    This heatmap shows the AI errors that students struggled to identify in the recent task <span className="font-bold text-gray-700">"{heatmapData?.title}"</span>. Darker red indicates a higher miss rate.
                  </p>

                  <div className="space-y-4">
                    {heatmapData?.blindspots.length ? heatmapData.blindspots.map((spot, idx) => {
                      let bgColorClass = "bg-red-500 text-white";
                      let warningLevel = "Critical Blindspot";
                      if (spot.missRate < 0.2) {
                        bgColorClass = "bg-green-100 text-green-900";
                        warningLevel = "Mastered";
                      } else if (spot.missRate < 0.5) {
                        bgColorClass = "bg-yellow-100 text-yellow-900 border border-yellow-200";
                        warningLevel = "Moderate Risk";
                      } else if (spot.missRate < 0.8) {
                        bgColorClass = "bg-red-100 text-red-900 border border-red-200";
                        warningLevel = "High Risk";
                      }

                      return (
                        <div key={idx} className="flex items-stretch gap-6 bg-gray-50 rounded-xl p-5 border border-gray-100 items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-bold px-2 py-1 bg-gray-200 text-gray-700 rounded uppercase tracking-wider">
                                {spot.errorType}
                              </span>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                {spot.missRate >= 0.5 && <WarningCircle size={16} className="text-red-500" />}
                                {warningLevel}
                              </span>
                            </div>
                            <p className={`text-lg font-medium p-3 rounded-lg ${bgColorClass} transition-all`}>
                              "{spot.text}"
                            </p>
                          </div>

                          <div className="w-32 flex flex-col items-center justify-center shrink-0">
                            <span className="text-3xl font-black text-gray-900">
                              {Math.round(spot.missRate * 100)}%
                            </span>
                            <span className="text-xs font-medium text-gray-500 uppercase text-center mt-1">
                              Students<br/>Missed It
                            </span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-6 text-center text-gray-500">
                        Publish a task and collect student submissions to see analytics here.
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboard;