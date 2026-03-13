import { Target, UserCircle, Files, Star, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <Target weight="fill" className="text-indigo-600 text-3xl" />
          <h1 className="text-xl font-bold text-slate-800">Debunk AI</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Star weight="fill" className="text-yellow-400 text-xl" />
            <span className="font-bold text-slate-700">120 pts</span>
          </div>
          <UserCircle size={28} className="text-gray-500 hover:text-indigo-600 cursor-pointer transition" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-8">
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back, Jason! 👋</h2>
          <p className="text-gray-500">Ready to track down some AI hallucinations?</p>
        </section>

        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Files className="text-indigo-600" /> Pending Tasks
            </h3>
          </div>

          <div className="grid gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition">
              <div>
                <p className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wider">Computer Science</p>
                <h4 className="text-lg font-bold text-gray-900 mb-1">A Brief History of Computer Science</h4>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400"></span> 5 Hidden Flaws
                </p>
              </div>
              <button 
                onClick={() => navigate('/student/workspace/task-1')}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
              >
                Start Mission <ArrowRight weight="bold" />
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition opacity-75">
              <div>
                <p className="text-xs font-semibold text-purple-600 mb-1 uppercase tracking-wider">World History</p>
                <h4 className="text-lg font-bold text-gray-900 mb-1">The Industrial Revolution (AI Draft)</h4>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> 8 Hidden Flaws
                </p>
              </div>
              <button className="bg-gray-100 text-gray-500 px-6 py-2.5 rounded-lg font-medium cursor-not-allowed">
                Locked
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudentDashboard;