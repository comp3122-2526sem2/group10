'use client';

import { useMemo, useState } from 'react';

type ErrorRow = { id: number; errorText: string; errorType: string; explanation: string; correctVersion: string };

export function ReviewChat({ submissionId, errors, initialSessions }: { submissionId: string; errors: ErrorRow[]; initialSessions: any[] }) {
  const [selectedErrorId, setSelectedErrorId] = useState<number>(errors[0]?.id || 1);
  const [message, setMessage] = useState('');
  const [teachback, setTeachback] = useState('');
  const [sessions, setSessions] = useState<any[]>(initialSessions || []);
  const currentSession = useMemo(() => sessions.find((item) => item.errorId === selectedErrorId), [sessions, selectedErrorId]);

  async function sendMessage() {
    if (!message.trim()) return;
    const res = await fetch(`/api/chat/${submissionId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errorId: selectedErrorId, message }) });
    const json = await res.json();
    setSessions((prev) => [...prev.filter((item) => item.errorId !== selectedErrorId), json.session]);
    setMessage('');
  }

  async function sendTeachback() {
    const res = await fetch(`/api/chat/${submissionId}/teachback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errorId: selectedErrorId, teachback }) });
    const json = await res.json();
    setSessions((prev) => [...prev.filter((item) => item.errorId !== selectedErrorId), json.session]);
    alert(`Teach-back ${json.result.passed ? 'Passed' : 'Failed'}: ${json.result.feedback}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-slate-900">Select Error to Review</h3>
        {errors.map((error) => (
          <button key={error.id} onClick={() => setSelectedErrorId(error.id)} className={`w-full rounded-2xl border px-3 py-3 text-left text-sm ${selectedErrorId === error.id ? 'border-cyan-500 bg-cyan-50 text-cyan-900' : 'border-slate-200 text-slate-700'}`}>
            <div className="font-medium">#{error.id} · {error.errorType}</div>
            <div className="mt-1 line-clamp-2 text-xs">{error.errorText}</div>
          </button>
        ))}
      </div>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          {errors.find((item) => item.id === selectedErrorId)?.explanation}
        </div>
        <div className="space-y-3">
          {(currentSession?.messages || []).map((msg: any, index: number) => (
            <div key={index} className={`rounded-2xl px-4 py-3 text-sm ${msg.role === 'assistant' ? 'bg-cyan-50 text-cyan-900' : 'bg-slate-100 text-slate-800'}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Explain why you missed this error..." className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-slate-900" />
          <button onClick={sendMessage} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Send</button>
        </div>
        <div className="border-t border-slate-200 pt-4">
          <div className="mb-2 text-sm font-medium text-slate-800">Teach-back: Explain in your own words</div>
          <textarea value={teachback} onChange={(e) => setTeachback(e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900" placeholder="Why is the original text wrong? What is the correct version?" />
          <button onClick={sendTeachback} className="mt-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">Submit Teach-back</button>
        </div>
      </div>
    </div>
  );
}
