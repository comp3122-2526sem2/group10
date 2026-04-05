import React, { useState, useEffect } from 'react';

interface TaskFormWithTextbookProps {
  teacher_id: string;
  onTaskCreated?: (taskId: string) => void;
}

export const TaskFormWithTextbook: React.FC<TaskFormWithTextbookProps> = ({ 
  teacher_id: _teacher_id, 
  onTaskCreated 
}) => {
  const [textbooks, setTextbooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedTextbook, setSelectedTextbook] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [density, setDensity] = useState(2);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    loadTextbooks();
  }, []);

  const loadTextbooks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/teacher/textbooks', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setTextbooks(data.textbooks || []);
    } catch (error) {
      console.error('Failed to load textbooks:', error);
    }
  };

  const loadChapters = async (textbookId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/textbooks/${textbookId}/chapters`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      // Remove duplicates by chapter_number
      const unique = data.chapters?.filter((ch: any, i: number, self: any[]) =>
        i === self.findIndex((c: any) => c.chapter_number === ch.chapter_number)
      ) || [];
      setChapters(unique);
    } catch (error) {
      console.error('Failed to load chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTextbook || !selectedChapter) {
      alert('Please select a textbook and chapter');
      return;
    }

    setGenerating(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/teacher/tasks/from-textbook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subject,
          textbook_id: selectedTextbook,
          chapter_id: selectedChapter,
          hallucination_density: density,
        }),
      });

      const data = await response.json();
      setGeneratedDraft(data);
      
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Make sure Ollama is running.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedDraft) return;

    setIsPublishing(true);

    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8000/api/v1/teacher/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: generatedDraft.taskId,
          title: generatedDraft.title,
          subject: generatedDraft.subject,
        }),
      });
      
      alert('Task published successfully!');
      setGeneratedDraft(null);
      setTitle('');
      setSubject('');
      setSelectedTextbook(null);
      setSelectedChapter(null);
      
      if (onTaskCreated) onTaskCreated(generatedDraft.taskId);
      
    } catch (error) {
      console.error('Failed to publish task', error);
      alert('Failed to publish task.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      {/* Two-column layout*/}
      <div className="flex gap-10">
        {/* Left side */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g., Industrial Revolution"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g., History"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Textbook</label>
              <select
                value={selectedTextbook || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  setSelectedTextbook(id);
                  setSelectedChapter(null);
                  if (id) loadChapters(id);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Select a textbook --</option>
                {textbooks.map((tb) => (
                  <option key={tb.id} value={tb.id}>{tb.original_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Chapter</label>
              <select
                value={selectedChapter || ''}
                onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                disabled={!selectedTextbook || loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-gray-100"
              >
                <option value="">-- Select a chapter --</option>
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.chapter_number ? `Chapter ${ch.chapter_number}` : 'Introduction'}
                    {` (Pages ${ch.start_page}-${ch.end_page})`}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading chapters...
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedChapter || textbooks.length === 0}
            className={`w-full py-4 text-white rounded-xl font-bold shadow-sm transition flex justify-center items-center gap-2 ${(generating || !selectedChapter || textbooks.length === 0) ? 'bg-gray-300 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'}`}
          >
            {generating ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Flawed Text
              </>
            )}
          </button>

          {textbooks.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              No textbooks uploaded yet. Upload a PDF in the "Textbook Manager" section above first.
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="w-80">
          <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Hallucination Density
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className={`text-sm font-medium ${density === 1 ? 'text-violet-600' : 'text-gray-500'}`}>Low</span>
              <input
                type="range"
                min="1"
                max="3"
                value={density}
                onChange={(e) => setDensity(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <span className={`text-sm font-medium ${density === 3 ? 'text-violet-600' : 'text-gray-500'}`}>High</span>
            </div>
            <p className="text-sm text-gray-600 bg-violet-50 p-4 rounded-xl border border-violet-100">
              {density === 1 && "Creates obvious factual errors. Best for beginners."}
              {density === 2 && "Mixes factual and logical errors. Good for standard tests."}
              {density === 3 && "Subtle causal inversions and deep AI hallucinations. Expect a high fail rate."}
            </p>
          </div>
        </div>
      </div>

      {/* Generated Preview */}
      {generatedDraft && (
        <div className="mt-8 bg-white border border-violet-100 rounded-3xl p-8 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Generated Material Preview
            </h3>
            <span className="text-sm font-semibold px-3 py-1 bg-violet-100 text-violet-700 rounded-full">
              Density: {density === 1 ? 'Low' : density === 2 ? 'Medium' : 'High'}
            </span>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[150px]">
            {generatedDraft.generatedText}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-100 bg-violet-50/50 p-5">
            <h4 className="font-semibold text-gray-900 mb-3">Injected Errors</h4>
            <div className="space-y-3">
              {generatedDraft.highlights?.map((item: any) => (
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
              {isPublishing ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isPublishing ? 'Publishing...' : 'Publish to Students'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};