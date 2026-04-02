import { useState, useEffect } from 'react';
import { Target, UserCircle, ChalkboardTeacher, Buildings, MagnifyingGlass, Spinner } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchClassrooms, 
  createClassroom, 
  assignTeacherToClassroom, 
  refreshClassroomCode,
  inviteStudents,
  type Classroom
} from '../../api/mock';

function AdminDashboard() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeClassroom, setActiveClassroom] = useState<string>('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [studentEmails, setStudentEmails] = useState('');

  useEffect(() => {
    fetchClassrooms().then(data => {
      setClassrooms(data);
      if (data.length > 0) setActiveClassroom(data[0].id);
      setIsLoading(false);
    });
  }, []);

  const currentClass = classrooms.find(c => c.id === activeClassroom);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  // --- 交互逻辑 ---

  const handleCreateClassroom = async () => {
    const className = prompt("Please enter the name for the new classroom:");
    if (className && className.trim() !== "") {
      const newClass = await createClassroom({ name: className });
      setClassrooms([...classrooms, newClass]);
      setActiveClassroom(newClass.id);
    }
  };

  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const handleAddTeacher = async () => {
    if (!newTeacherEmail || !currentClass) return;
    setIsAddingTeacher(true);
    await assignTeacherToClassroom(currentClass.id, newTeacherEmail);
    alert(`Mock: Invitation sent to ${newTeacherEmail} for ${currentClass.name}!`);
    setNewTeacherEmail('');
    setIsAddingTeacher(false);
  };

  const [isRefreshingCode, setIsRefreshingCode] = useState(false);
  const handleGenerateCode = async () => {
    if (!currentClass) return;
    setIsRefreshingCode(true);
    const newCode = await refreshClassroomCode(currentClass.id);
    const updatedClassrooms = classrooms.map(c => 
      c.id === currentClass.id ? { ...c, code: newCode } : c
    );
    setClassrooms(updatedClassrooms);
    setIsRefreshingCode(false);
  };

  const [isInviting, setIsInviting] = useState(false);
  const handleInviteStudents = async () => {
    if (!studentEmails || !currentClass) return;
    setIsInviting(true);
    const emailsList = studentEmails.split(',').map(e => e.trim()).filter(e => e !== '');
    await inviteStudents(currentClass.id, emailsList);
    alert(`Mock: Invitations sent to ${emailsList.length} students!`);
    setStudentEmails('');
    setIsInviting(false);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50"><Spinner className="animate-spin text-indigo-600 text-3xl" /></div>;
  }

  return (
    <div className="h-screen bg-gray-50 font-sans text-gray-800 flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-8 h-[72px] flex justify-between items-center shrink-0 w-full z-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <Target weight="fill" className="text-indigo-600 text-3xl" />
          <h1 className="text-xl font-bold text-gray-900">Debunk AI - Admin Center</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <button onClick={() => setProfileOpen((v) => !v)} className="text-gray-400 hover:text-indigo-600 cursor-pointer transition flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">System Admin</span>
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
        {/* Sidebar for System configuration / Global level */}
        <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col h-full overflow-y-auto shrink-0">
          <div className="flex items-center gap-2 mb-6 px-2 text-indigo-600">
            <Buildings size={24} weight="fill" />
            <h3 className="font-bold text-lg tracking-wide">Classrooms</h3>
          </div>
          
          <nav className="space-y-1">
            {classrooms.map(c => (
              <button 
                key={c.id}
                onClick={() => setActiveClassroom(c.id)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm truncate transition-colors ${activeClassroom === c.id ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                {c.name}
              </button>
            ))}
            <button 
              onClick={handleCreateClassroom}
              className="w-full text-left px-4 py-2 mt-2 rounded-lg text-sm text-indigo-600 font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              + New Classroom
            </button>
          </nav>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 overflow-y-auto h-full bg-gray-50">
          <div className="px-10 py-8 max-w-5xl mx-auto pb-24">
            <header className="mb-8">
              <div className="flex items-center gap-3 text-indigo-600 mb-2">
                <Buildings size={24} />
                <span className="font-semibold tracking-wide uppercase text-sm">Classroom Management</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{currentClass?.name}</h2>
              <p className="text-gray-500 mt-2">Manage teachers and enroll students for this specific classroom scope.</p>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Add Teacher Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ChalkboardTeacher size={24} className="text-indigo-600" />
                  Manage Teachers
                </h3>
                <p className="text-sm text-gray-500">
                  Assign teachers to manage tasks and view analytics for this classroom.
                </p>
                
                <div className="flex flex-col gap-3 mt-2">
                    <label className="text-sm font-semibold text-gray-700">Assign Teacher by Email</label>
                    <div className="flex gap-2">
                        <input 
                          type="email" 
                          value={newTeacherEmail}
                          onChange={(e) => setNewTeacherEmail(e.target.value)}
                          placeholder="teacher@school.edu"
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                        <button 
                          onClick={handleAddTeacher}
                          disabled={isAddingTeacher}
                          className={`bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${isAddingTeacher && 'opacity-70'}`}
                        >
                            {isAddingTeacher ? <Spinner className="animate-spin" /> : null} Add Teacher
                        </button>
                    </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Assigned Teachers</h4>
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                      Teacher assignments are now stored in the database when you submit an email above.
                    </div>
                </div>
              </div>

              {/* Add Students Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserCircle size={24} className="text-emerald-600" />
                  Manage Students
                </h3>
                <p className="text-sm text-gray-500">
                  Enroll students via email, or distribute the class invite code.
                </p>
                
                <div className="flex flex-col gap-3 mt-2">
                    <label className="text-sm font-semibold text-gray-700">Invite Code</label>
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={currentClass?.code || "N/A"}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-center tracking-widest text-gray-700"
                        />
                        <button 
                          onClick={handleGenerateCode}
                          disabled={isRefreshingCode}
                          className={`bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${isRefreshingCode && 'opacity-70'}`}
                        >
                            {isRefreshingCode ? <Spinner className="animate-spin" /> : null} Refresh
                        </button>
                    </div>
                </div>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold text-gray-700">Bulk Invite via Email</label>
                    <textarea 
                      value={studentEmails}
                      onChange={(e) => setStudentEmails(e.target.value)}
                      placeholder="student1@school.edu, student2@school.edu..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                    ></textarea>
                </div>
                <button 
                  onClick={handleInviteStudents}
                  disabled={isInviting}
                  className={`mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition w-full flex items-center justify-center gap-2 ${isInviting && 'opacity-70'}`}
                >
                  {isInviting ? <Spinner className="animate-spin" /> : null} Invite Students
                </button>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">Total Enrolled: {currentClass?.enrolled}</span>
                    <button className="text-emerald-600 text-sm font-medium hover:text-emerald-800 flex items-center gap-1">
                      <MagnifyingGlass size={16} /> View Roster
                    </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
