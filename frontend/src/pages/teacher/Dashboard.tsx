import { Target, UserCircle, UploadSimple, ChalkboardTeacher, ChartBar, Gear } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-screen sticky top-0">
        <div className="flex items-center gap-3 cursor-pointer mb-10" onClick={() => navigate('/')}>
          <Target weight="fill" className="text-purple-600 text-3xl" />
          <h1 className="text-xl font-bold text-slate-800">Debunk AI</h1>
        </div>

        <nav className="space-y-2 flex-1">
          <a href="#" className="flex items-center gap-3 text-purple-700 bg-purple-50 font-medium px-4 py-3 rounded-lg border border-purple-100">
            <ChalkboardTeacher size={20} />
            Class Overview
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium px-4 py-3 rounded-lg transition">
            <UploadSimple size={20} />
            Materials & Generation
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium px-4 py-3 rounded-lg transition">
            <ChartBar size={20} />
            Student Analytics
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium px-4 py-3 rounded-lg transition">
            <Gear size={20} />
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-800">Class Overview</h2>
          <UserCircle size={32} className="text-gray-500 hover:text-purple-600 cursor-pointer transition" />
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">Active Students</p>
              <h3 className="text-3xl font-bold text-gray-900">42</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">Average Fact-Check Score</p>
              <h3 className="text-3xl font-bold text-green-600">86%</h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">Generated Tasks</p>
              <h3 className="text-3xl font-bold text-purple-600">12</h3>
            </div>
          </div>

          {/* Create New Task Teaser */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white flex justify-between items-center shadow-lg">
            <div>
              <h3 className="text-2xl font-bold mb-2">Create a New Fact-Check Task</h3>
              <p className="text-purple-100 max-w-lg leading-relaxed">
                Upload your study materials, and let AI generate an essay with subtle logical fallacies or hallucinations. Adjust the error density to fit your students' level.
              </p>
            </div>
            <button className="bg-white text-purple-700 px-6 py-3 rounded-lg font-bold shadow-md hover:bg-purple-50 transition flex items-center gap-2">
              <UploadSimple size={20} weight="bold" /> Upload Material
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeacherDashboard;