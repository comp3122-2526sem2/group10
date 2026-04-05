import React, { useState, useEffect } from 'react';

interface Textbook {
  id: number;
  original_name: string;
  uploaded_at: string;
  total_pages: number | null;
}

interface TextbookUploadProps {
  teacher_id: string;
}

export const TextbookUpload: React.FC<TextbookUploadProps> = ({ teacher_id: _teacher_id }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/teacher/textbooks/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      setUploadMessage({ type: 'success', text: data.message });
      setFile(null);
      await loadTextbooks();
      
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'Failed to upload textbook' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (textbookId: number) => {
    if (!confirm('Delete this textbook?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/api/v1/teacher/textbooks/${textbookId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await loadTextbooks();
    } catch (error) {
      alert('Failed to delete textbook');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      {/* Two-column layout */}
      <div className="flex gap-10">
        {/* Left side - Upload area */}
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload PDF Textbook</label>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-4 text-white rounded-xl font-bold shadow-sm transition flex justify-center items-center gap-2 ${(!file || uploading) ? 'bg-gray-300 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'}`}
          >
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>

          {uploadMessage && (
            <div className={`p-3 rounded-xl text-sm ${uploadMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {uploadMessage.text}
            </div>
          )}
        </div>

        {/* Right side - Info panel */}
        <div className="w-80">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Textbook Info
            </label>
            <p className="text-sm text-gray-600 bg-violet-50 p-4 rounded-xl border border-violet-100">
              Upload PDF textbooks to use as source material. The system will automatically detect chapters.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom table */}
      <div className="mt-10">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Textbooks</h3>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600 text-sm">Filename</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Uploaded Date</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Pages</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Loading...</td></tr>
              ) : textbooks.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No textbooks uploaded yet.</td></tr>
              ) : (
                textbooks.map((tb) => (
                  <tr key={tb.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">{tb.original_name}</td>
                    <td className="p-4 text-gray-500">{new Date(tb.uploaded_at).toLocaleDateString()}</td>
                    <td className="p-4 text-gray-500">{tb.total_pages || '?'} pages</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(tb.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};