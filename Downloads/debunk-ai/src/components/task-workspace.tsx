'use client';

import { useMemo, useRef, useState } from 'react';
import { errorTypeMap } from '@/lib/constants';

type Annotation = {
  id: string;
  start: number;
  end: number;
  selectedText: string;
  errorType: keyof typeof errorTypeMap;
  explanation: string;
  confidence: number;
};

type TaskWorkspaceProps = {
  taskId: string;
  mode: string;
  content: string;
  meta?: any;
  existingAnnotations?: Annotation[];
};

function renderHighlighted(content: string, annotations: Annotation[]) {
  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  let cursor = 0;
  const parts: Array<{ text: string; type?: keyof typeof errorTypeMap; key: string }> = [];
  sorted.forEach((item, index) => {
    if (item.start > cursor) parts.push({ text: content.slice(cursor, item.start), key: `plain-${index}-${cursor}` });
    parts.push({ text: content.slice(item.start, item.end), type: item.errorType, key: item.id });
    cursor = item.end;
  });
  if (cursor < content.length) parts.push({ text: content.slice(cursor), key: `tail-${cursor}` });
  return parts;
}

export function TaskWorkspace({ taskId, mode, content, meta, existingAnnotations = [] }: TaskWorkspaceProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(existingAnnotations);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [errorType, setErrorType] = useState<keyof typeof errorTypeMap>('factual');
  const [explanation, setExplanation] = useState('');
  const [confidence, setConfidence] = useState(70);
  const [betterVersion, setBetterVersion] = useState('A');
  const [saving, setSaving] = useState(false);
  const highlighted = useMemo(() => renderHighlighted(content, annotations), [annotations, content]);

  function captureSelection() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return;
    const text = content.slice(start, end);
    setSelection({ start, end, text });
  }

  function addAnnotation() {
    if (!selection) return;
    const overlaps = annotations.some((item) => !(selection.end <= item.start || selection.start >= item.end));
    if (overlaps) {
      alert('Overlapping highlights are not allowed. Please select a non-overlapping segment.');
      return;
    }
    setAnnotations((prev) => [...prev, { id: crypto.randomUUID(), start: selection.start, end: selection.end, selectedText: selection.text, errorType, explanation, confidence }]);
    setSelection(null);
    setExplanation('');
    setConfidence(70);
  }

  async function submitTask() {
    setSaving(true);
    const res = await fetch(`/api/tasks/${taskId}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ annotations, additionalResponse: mode === 'COMPARE' ? { betterVersion } : {} }) });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || 'Submission failed');
      setSaving(false);
      return;
    }
    window.location.href = `/student/task/${taskId}/result`;
  }

  async function requestHint() {
    const res = await fetch(`/api/tasks/${taskId}/hint`, { method: 'POST' });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Hint request failed');
    alert(json.hint);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-slate-900">Reading Area (Read-only)</div>
            <div className="text-xs text-slate-500">Select text in the box, then fill in annotations on the right.</div>
          </div>
          <button onClick={requestHint} className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">I'm Stuck</button>
        </div>
        <textarea ref={textareaRef} onMouseUp={captureSelection} onKeyUp={captureSelection} readOnly value={content} className="min-h-[420px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-sm leading-7 text-slate-800" />
        {mode === 'COMPARE' ? (
          <div className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-700">
            <div className="mb-2 font-medium text-slate-900">Which version is more reliable?</div>
            <select value={betterVersion} onChange={(e) => setBetterVersion(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-900">
              <option value="A">Version A</option>
              <option value="B">Version B</option>
            </select>
          </div>
        ) : null}
      </div>
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">新建标注</div>
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{selection ? selection.text : '先在左侧选中一段文字。'}</div>
          <div className="mt-3 space-y-3">
            <select value={errorType} onChange={(e) => setErrorType(e.target.value as keyof typeof errorTypeMap)} className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-slate-900">
              {Object.entries(errorTypeMap).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
            </select>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={4} placeholder="写出你认为它错在哪里，以及正确说法。" className="w-full rounded-2xl border border-slate-200 px-3 py-3 text-slate-900" />
            <div>
              <div className="mb-1 text-xs text-slate-500">Confidence: {confidence}</div>
              <input type="range" min={0} max={100} value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="w-full" />
            </div>
            <button onClick={addAnnotation} className="w-full rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white">保存标注</button>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">已标注 {annotations.length} 条</div>
            <button onClick={submitTask} disabled={saving || annotations.length === 0} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{saving ? '提交中...' : '提交评分'}</button>
          </div>
          <div className="space-y-3">
            {annotations.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-3 text-sm text-slate-700">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${errorTypeMap[item.errorType].color}`}>{errorTypeMap[item.errorType].label}</span>
                  <button onClick={() => setAnnotations((prev) => prev.filter((row) => row.id !== item.id))} className="text-xs text-rose-600">删除</button>
                </div>
                <div className="font-medium text-slate-900">{item.selectedText}</div>
                <div className="mt-1 text-xs">{item.explanation}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">高亮预览</div>
          <div className="max-h-[320px] overflow-auto rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-800 whitespace-pre-wrap">
            {highlighted.map((part) => part.type ? <mark key={part.key} className={`rounded px-1 ${errorTypeMap[part.type].color}`}>{part.text}</mark> : <span key={part.key}>{part.text}</span>)}
          </div>
          {meta?.citations ? <div className="mt-4 rounded-2xl border border-slate-200 p-3 text-sm text-slate-700"><div className="mb-2 font-medium text-slate-900">Citations</div>{meta.citations.map((item: any) => <div key={item.label}>{item.label} {item.text}</div>)}</div> : null}
        </div>
      </div>
    </div>
  );
}
