import { Target, Student, ChalkboardTeacher } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Brand Side */}
        <div className="bg-indigo-600 p-12 text-white flex flex-col justify-center md:w-1/2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-50 -mr-20 -mt-20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full opacity-50 -ml-20 -mb-20 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Target weight="fill" className="text-white text-5xl" />
              <h1 className="text-4xl font-bold">Debunk AI</h1>
            </div>
            <p className="text-xl text-indigo-100 mb-4 font-medium">Fact-Checker Pro</p>
            <p className="text-indigo-200 leading-relaxed">
              Enhance your critical thinking by debunking AI hallucinations. Don't just consume AI content—verify it.
            </p>
          </div>
        </div>

        {/* Action Side */}
        <div className="p-12 md:w-1/2 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-500 mb-8">Choose your portal to continue.</p>

          <div className="space-y-4">
            <button 
              onClick={() => navigate('/student/dashboard')}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group group-hover:shadow-md"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Student size={24} weight="fill" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-800 group-hover:text-indigo-700 transition">Student Portal</h3>
                <p className="text-sm text-gray-500 text-left">Find errors and earn critical thinking points</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/teacher/dashboard')}
              className="w-full flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-purple-600 hover:bg-purple-50 transition-all group group-hover:shadow-md"
            >
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <ChalkboardTeacher size={24} weight="fill" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-gray-800 group-hover:text-purple-700 transition">Teacher Dashboard</h3>
                <p className="text-sm text-gray-500 text-left">Upload materials and configure AI assassins</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Landing;