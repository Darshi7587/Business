'use client';
// Collaborative Annotations — Add notes to data points & persist in localStorage
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Trash2, StickyNote, Search,
  User, Clock, BarChart3, X,
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceDot,
} from 'recharts';
import { Sidebar, Header, LoadingState } from '@/components';
import { useAppStore } from '@/store';

interface Annotation {
  id: string;
  column: string;
  rowIndex: number;
  value: number;
  note: string;
  author: string;
  createdAt: string;
  color: string;
}

const ANNO_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#06B6D4'];
const STORAGE_KEY = 'insightgpt-annotations';

function loadAnnotations(): Annotation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveAnnotations(annos: Annotation[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(annos));
}

export default function AnnotationsPage() {
  const { dataset, customDataset, setDataset, setDatasetAnalysis } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<{ index: number; value: number } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [authorName, setAuthorName] = useState('Analyst');
  const [filterSearch, setFilterSearch] = useState('');

  useEffect(() => { setAnnotations(loadAnnotations()); }, []);

  useEffect(() => {
    const loadData = async () => {
      const activeData = customDataset && customDataset.length > 0 ? customDataset : dataset;
      if (activeData && activeData.length > 0) { setData(activeData); setLoading(false); return; }
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        if (result.success) { setDataset(result.data); setDatasetAnalysis(result.analysis); setData(result.data); }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadData();
  }, [dataset, customDataset, setDataset, setDatasetAnalysis]);

  const numericCols = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(col => {
      const s = data.slice(0, 20).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      return s.length > 0 && s.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && String(v).trim() !== ''));
    });
  }, [data]);

  useEffect(() => {
    if (numericCols.length > 0 && !selectedColumn) setSelectedColumn(numericCols[0]);
  }, [numericCols, selectedColumn]);

  const chartData = useMemo(() => {
    if (!selectedColumn || data.length === 0) return [];
    return data.slice(0, 200).map((r, i) => ({
      index: i,
      value: Number(r[selectedColumn]) || 0,
    }));
  }, [selectedColumn, data]);

  const columnAnnotations = useMemo(() =>
    annotations.filter(a => a.column === selectedColumn),
    [annotations, selectedColumn]
  );

  const filteredAnnotations = useMemo(() => {
    if (!filterSearch.trim()) return annotations;
    const lower = filterSearch.toLowerCase();
    return annotations.filter(a =>
      a.note.toLowerCase().includes(lower) ||
      a.column.toLowerCase().includes(lower) ||
      a.author.toLowerCase().includes(lower)
    );
  }, [annotations, filterSearch]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = useCallback((e: any) => {
    if (e?.activePayload?.[0]) {
      const { index, value } = e.activePayload[0].payload;
      setSelectedPoint({ index, value });
    }
  }, []);

  const addAnnotation = () => {
    if (!selectedPoint || !noteText.trim()) return;
    const newAnno: Annotation = {
      id: Date.now().toString(),
      column: selectedColumn,
      rowIndex: selectedPoint.index,
      value: selectedPoint.value,
      note: noteText.trim(),
      author: authorName || 'Analyst',
      createdAt: new Date().toISOString(),
      color: ANNO_COLORS[annotations.length % ANNO_COLORS.length],
    };
    const updated = [...annotations, newAnno];
    setAnnotations(updated);
    saveAnnotations(updated);
    setNoteText('');
    setSelectedPoint(null);
  };

  const deleteAnnotation = (id: string) => {
    const updated = annotations.filter(a => a.id !== id);
    setAnnotations(updated);
    saveAnnotations(updated);
  };

  if (loading) return <div className="min-h-screen flex"><Sidebar /><div className="flex-1"><LoadingState type="full" message="Loading data..." /></div></div>;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Annotations" subtitle="Add notes to data points for collaboration" />
        <main className="flex-1 p-6 overflow-auto">
          {/* Controls */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <select value={selectedColumn} onChange={e => { setSelectedColumn(e.target.value); setSelectedPoint(null); }} className="px-4 py-2.5 glass-bright rounded-xl text-white bg-transparent border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {numericCols.map(c => <option key={c} value={c} className="bg-gray-900">{c.replace(/_/g, ' ')}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Your name" className="px-3 py-2 glass-bright rounded-lg text-white bg-transparent border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-36" />
            </div>
            <span className="text-sm text-gray-400 ml-auto">
              <StickyNote className="w-4 h-4 inline mr-1" />{annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 glass-bright rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" /> {selectedColumn?.replace(/_/g, ' ')} — Click a point to annotate
              </h3>
              <p className="text-[10px] text-gray-500 mb-4">Showing first {chartData.length} data points. Annotated points are highlighted.</p>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }} onClick={handleChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="index" name="Row" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis type="number" dataKey="value" name="Value" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => {
                      const anno = columnAnnotations.find(a => a.value === value);
                      return [anno ? `${value} 📝 ${anno.note}` : value, name];
                    }}
                  />
                  <Scatter data={chartData} shape="circle">
                    {chartData.map((entry, idx) => {
                      const hasAnno = columnAnnotations.some(a => a.rowIndex === entry.index);
                      const isSelected = selectedPoint?.index === entry.index;
                      return (
                        <Cell
                          key={idx}
                          fill={isSelected ? '#F59E0B' : hasAnno ? '#EF4444' : '#6366F1'}
                          r={isSelected ? 8 : hasAnno ? 6 : 3}
                          stroke={isSelected ? '#fff' : 'none'}
                          strokeWidth={isSelected ? 2 : 0}
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>

              {/* Add note form */}
              <AnimatePresence>
                {selectedPoint && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-4 p-4 glass rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-white">
                        Annotate Row <span className="font-bold">#{selectedPoint.index}</span> — Value: <span className="font-bold text-indigo-400">{selectedPoint.value.toLocaleString()}</span>
                      </p>
                      <button onClick={() => setSelectedPoint(null)} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Type your note..." className="flex-1 px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-500" onKeyDown={e => e.key === 'Enter' && addAnnotation()} />
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addAnnotation} disabled={!noteText.trim()} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white text-sm font-medium disabled:opacity-50">
                        <Plus className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Annotations List */}
            <div className="glass-bright rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" /> All Annotations
              </h3>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Search notes..." className="w-full pl-9 pr-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-500" />
              </div>
              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '500px' }}>
                {filteredAnnotations.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <StickyNote className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No annotations yet</p>
                    <p className="text-xs">Click a data point on the chart to add one</p>
                  </div>
                ) : (
                  filteredAnnotations.map(anno => (
                    <motion.div key={anno.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-3 glass rounded-lg group">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: anno.color }} />
                        <div className="flex-1">
                          <p className="text-sm text-white">{anno.note}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                            <span>{anno.column.replace(/_/g, ' ')}</span>
                            <span>•</span>
                            <span>Row {anno.rowIndex}</span>
                            <span>•</span>
                            <span>{anno.value.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                            <User className="w-3 h-3" /> {anno.author}
                            <Clock className="w-3 h-3 ml-1" /> {new Date(anno.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button onClick={() => deleteAnnotation(anno.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
