import { useEffect, useState } from 'react';
import { Target, UserCircle, Files, Star, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { fetchPendingTasks, type TaskItem } from '../../api/mock';

function StudentDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    // [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/student/tasks?status=pending
    fetchPendingTasks().then(setTasks).catch((error) => {
      console.error('Failed to fetch pending tasks', error);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* 绝对统一的高度与排版的顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-8 h-[72px] flex justify-between items-center w-full">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <Target weight="fill" className="text-violet-600 text-3xl" />
          <h1 className="text-xl font-bold text-gray-900">Debunk AI</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Star weight="fill" className="text-yellow-400 text-xl" />
            {/* [API_TODO] REPLACE_WITH_REAL_API: points 来自 GET /api/v1/auth/me */}
            <span className="font-bold text-gray-700">120 pts</span>
          </div>
          <UserCircle size={32} className="text-gray-400 hover:text-violet-600 cursor-pointer transition" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-10">
        <section className="mb-10">
          {/* [API_TODO] REPLACE_WITH_REAL_API: name 来自 GET /api/v1/auth/me */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, Jason! 👋</h2>
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
      </main>
    </div>
  );
}

export default StudentDashboard;