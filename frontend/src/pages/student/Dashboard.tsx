import { useEffect, useState } from 'react';
import { Target, UserCircle, Files, Star, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { fetchCompletedTasks, fetchPendingTasks, fetchStudentProfile, type TaskItem, type StudentProfile } from '../../api/mock';

function StudentDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskItem[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    fetchStudentProfile().then(setProfile).catch(console.error);

    fetchPendingTasks().then(setTasks).catch((error) => {
      console.error('Failed to fetch pending tasks', error);
    });

    fetchCompletedTasks().then(setCompletedTasks).catch((error) => {
      console.error('Failed to fetch completed tasks', error);
    });
  }, []);

  const handleLogout = () => {
    // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/auth/logout
    localStorage.removeItem('token');
    navigate('/auth');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-800 overflow-hidden">
      {/* 绝对统一的高度与排版的顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-8 h-[72px] flex justify-between items-center w-full">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <Target weight="fill" className="text-violet-600 text-3xl" />
          <h1 className="text-xl font-bold text-gray-900">Debunk AI</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Star weight="fill" className="text-yellow-400 text-xl" />
            <span className="font-bold text-gray-700">{profile ? profile.points : '...'} pts</span>
          </div>
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

      <main className="flex-1 overflow-y-auto max-w-5xl mx-auto p-10 scrollbar-hide">
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, {profile?.name || 'Student'}! 👋</h2>
          <p className="text-gray-500">Ready to track down some AI hallucinations?</p>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Files className="text-violet-600" /> Pending Tasks
            </h3>
          </div>

          <div className="grid gap-4">
            {tasks.map((task) => (
            <div key={task.id} className={`bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition ${task.locked ? 'opacity-75' : ''}`}>
              <div>
                <p className="text-xs font-semibold text-violet-600 mb-2 uppercase tracking-wider">{task.subject}</p>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h4>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${task.locked ? 'bg-red-500' : 'bg-yellow-400'}`}></span> {task.flawsCount} Hidden Flaws
                </p>
              </div>
              {task.locked ? (
                <button className="bg-gray-100 text-gray-400 px-6 py-2.5 rounded-xl font-semibold cursor-not-allowed flex items-center gap-2">
                  Locked
                </button>
              ) : (
                <button 
                  onClick={() => navigate(`/student/workspace/${task.id}`)}
                  className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-violet-700 transition shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  Start Mission <ArrowRight weight="bold" />
                </button>
              )}
            </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Files className="text-violet-600" /> Review Ready
            </h3>
          </div>

          <div className="grid gap-4">
            {completedTasks.length ? completedTasks.map((task) => (
              <div key={task.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wider">{task.subject}</p>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{task.title}</h4>
                  <p className="text-sm text-gray-500">You have submitted every annotation for this task. Open your review guide and recovery notes.</p>
                </div>
                <button
                  onClick={() => navigate(`/student/review/${task.id}`)}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  Open Review <ArrowRight weight="bold" />
                </button>
              </div>
            )) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 text-gray-500">
                The review page unlocks as soon as you submit all annotations for one task on your own account.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;
