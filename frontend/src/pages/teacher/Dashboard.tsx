import { useState } from 'react';
import { Target, UserCircle, UploadSimple, ChalkboardTeacher, ChartBar, Gear } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    // [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/auth/logout
    localStorage.removeItem('token');
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {/* 绝对统一的高度与排版的顶部导航栏（全宽，置顶） */}
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
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-full overflow-y-auto shrink-0">
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 text-violet-700 bg-violet-50 font-semibold px-4 py-3 rounded-xl border border-violet-100 transition-all">
              <ChalkboardTeacher size={20} />
              Class Overview
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-violet-600 font-medium px-4 py-3 rounded-xl transition-all">
              <UploadSimple size={20} />
              Materials & Generation
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-violet-600 font-medium px-4 py-3 rounded-xl transition-all">
              <ChartBar size={20} />
              Student Analytics
            </a>
            <a href="#" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 hover:text-violet-600 font-medium px-4 py-3 rounded-xl transition-all">
              <Gear size={20} />
              Settings
            </a>
          </nav>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-10 py-8 max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">Class Overview</h2>
            </header>

            {/* Quick Stats (统一卡片) */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <p className="text-gray-500 text-sm font-medium mb-1">Active Students</p>
                {/* [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/teacher/overview */}
                <h3 className="text-3xl font-bold text-gray-900">42</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <p className="text-gray-500 text-sm font-medium mb-1">Average Fact-Check Score</p>
                {/* [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/teacher/overview */}
                <h3 className="text-3xl font-bold text-green-600">86%</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <p className="text-gray-500 text-sm font-medium mb-1">Generated Tasks</p>
                {/* [API_TODO] CONTRACT_ENDPOINT: GET /api/v1/teacher/overview */}
                <h3 className="text-3xl font-bold text-violet-600">12</h3>
              </div>
            </div>

            {/* Create New Task Teaser */}
            <div className="bg-violet-600 rounded-2xl p-8 text-white flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-2xl font-bold mb-2">Create a New Fact-Check Task</h3>
                <p className="text-violet-100 max-w-lg leading-relaxed">
                  Upload your study materials, and let AI generate an essay with subtle logical fallacies or hallucinations. Adjust the error density to fit your students' level.
                </p>
              </div>
              {/* [API_TODO] CONTRACT_ENDPOINT: POST /api/v1/teacher/tasks (title/subject/sourceText/errorDensity) */}
              <button className="bg-white text-violet-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 hover:shadow transition flex items-center gap-2">
                <UploadSimple size={20} weight="bold" /> Upload Material
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboard;