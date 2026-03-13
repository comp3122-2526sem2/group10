import { useState } from 'react';
import { Target, EnvelopeSimple, LockKey, SignIn, UserPlus } from '@phosphor-icons/react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(initialRole);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // [API_TODO] REPLACE_WITH_REAL_API: 调用 POST /api/v1/auth/login 或 POST /api/v1/auth/register
    // [API_TODO] CONTRACT_FIELDS: login -> { token, user{id,name,role} }, register -> user basic info
    // Simulate API Auth Request
    setTimeout(() => {
      // Mock successful login/register
      localStorage.setItem('token', 'mock_jwt_token_here');
      // [API_TODO] REPLACE_WITH_REAL_API: 登录后调用 GET /api/v1/auth/me 获取 points/name 并注入全局状态
      
      // Determine where to navigate based on the role state
      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/admin/dashboard');
      
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Target weight="fill" className="text-violet-600 text-5xl mb-3" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 text-center">
            {isLogin 
              ? 'Enter your credentials to access your portal' 
              : 'Join Debunk AI and start critical thinking'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Always show Role Selector to know where to redirect after Login/Register */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Account Role</label>
            <div className="flex gap-2">
              <label className={`flex-1 border p-3 rounded-xl cursor-pointer text-center font-medium transition ${role === 'student' ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" className="hidden" value="student" checked={role === 'student'} onChange={() => setRole('student')} />
                Student
              </label>
              <label className={`flex-1 border p-3 rounded-xl cursor-pointer text-center font-medium transition ${role === 'teacher' ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" className="hidden" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} />
                Teacher
              </label>
              <label className={`flex-1 border p-3 rounded-xl cursor-pointer text-center font-medium transition ${role === 'admin' ? 'border-gray-600 bg-gray-100 text-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <input type="radio" className="hidden" value="admin" checked={role === 'admin'} onChange={() => setRole('admin')} />
                Admin
              </label>
            </div>
          </div>

          {/* Only show Name on Registration */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserPlus className="text-gray-400" size={20} />
                </div>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition" 
                  placeholder="John Doe" 
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeSimple className="text-gray-400" size={20} />
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition" 
                placeholder="you@school.edu" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockKey className="text-gray-400" size={20} />
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <SignIn size={22} weight="bold" /> 
            )}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-500 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-violet-600 font-bold hover:underline transition"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default AuthPage;