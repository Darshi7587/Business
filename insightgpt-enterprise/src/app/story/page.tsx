'use client';
// Data Story Mode — Auto-generated slide-by-slide walkthrough of findings
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronLeft, ChevronRight, Play, Pause,
  BarChart3, TrendingUp, AlertTriangle, PieChart, Hash,
  Sparkles, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart as RePieChart, Pie, Cell,
} from 'recharts';
import { Sidebar, Header, LoadingState } from '@/components';
import { useAppStore } from '@/store';

interface Slide {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  bgGradient: string;
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6'];

export default function StoryPage() {
  const { dataset, customDataset, setDataset, setDatasetAnalysis } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

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

  const cols = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);
  const numericCols = useMemo(() => cols.filter(c => {
    const s = data.slice(0, 20).map(r => r[c]).filter(v => v !== null && v !== undefined && v !== '');
    return s.length > 0 && s.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && String(v).trim() !== ''));
  }), [cols, data]);
  const categoricalCols = useMemo(() => cols.filter(c => !numericCols.includes(c)), [cols, numericCols]);

  // Compute stats for slides
  const stats = useMemo(() => {
    const result: Record<string, { mean: number; min: number; max: number; sum: number; stdDev: number }> = {};
    for (const col of numericCols) {
      const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
      if (vals.length === 0) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      result[col] = { mean, min: Math.min(...vals), max: Math.max(...vals), sum: vals.reduce((a, b) => a + b, 0), stdDev: Math.sqrt(variance) };
    }
    return result;
  }, [numericCols, data]);

  const catDistributions = useMemo(() => {
    const result: Record<string, { name: string; value: number }[]> = {};
    for (const col of categoricalCols.slice(0, 3)) {
      const counts: Record<string, number> = {};
      data.forEach(r => { const v = String(r[col] ?? 'Unknown'); counts[v] = (counts[v] || 0) + 1; });
      result[col] = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));
    }
    return result;
  }, [categoricalCols, data]);

  // Build slides
  const slides = useMemo<Slide[]>(() => {
    if (data.length === 0) return [];
    const s: Slide[] = [];

    // Slide 1: Title
    s.push({
      title: 'Data Story',
      subtitle: `${data.length.toLocaleString()} rows × ${cols.length} columns`,
      icon: <BookOpen className="w-8 h-8 text-indigo-400" />,
      bgGradient: 'from-indigo-500/20 to-purple-500/20',
      content: (
        <div className="text-center space-y-4">
          <p className="text-4xl font-bold text-white">{data.length.toLocaleString()}</p>
          <p className="text-gray-400">records analyzed across {cols.length} dimensions</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {cols.slice(0, 10).map(c => <span key={c} className="px-3 py-1 glass rounded-full text-xs text-gray-300">{c.replace(/_/g, ' ')}</span>)}
            {cols.length > 10 && <span className="px-3 py-1 glass rounded-full text-xs text-gray-400">+{cols.length - 10} more</span>}
          </div>
        </div>
      ),
    });

    // Slide 2: Key Metrics overview
    const topNumericCols = numericCols.slice(0, 4);
    if (topNumericCols.length > 0) {
      s.push({
        title: 'Key Metrics',
        subtitle: 'Summary statistics at a glance',
        icon: <Hash className="w-8 h-8 text-emerald-400" />,
        bgGradient: 'from-emerald-500/20 to-teal-500/20',
        content: (
          <div className="grid grid-cols-2 gap-4">
            {topNumericCols.map(col => {
              const st = stats[col];
              if (!st) return null;
              return (
                <div key={col} className="glass rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">{col.replace(/_/g, ' ')}</p>
                  <p className="text-2xl font-bold text-white">{st.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-gray-500">avg | range: {st.min.toLocaleString()} — {st.max.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        ),
      });
    }

    // Slide 3+: Distribution bar charts for top numeric cols
    for (const col of numericCols.slice(0, 2)) {
      const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
      const binCount = Math.min(15, Math.ceil(Math.sqrt(vals.length)));
      const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
      const binSize = range / binCount;
      const bins = Array.from({ length: binCount }, (_, i) => {
        const lo = min + i * binSize;
        const hi = lo + binSize;
        const count = vals.filter(v => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length;
        return { range: lo.toFixed(1), count };
      });
      s.push({
        title: `${col.replace(/_/g, ' ')} Distribution`,
        subtitle: `How ${col.replace(/_/g, ' ')} values are spread`,
        icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
        bgGradient: 'from-blue-500/20 to-cyan-500/20',
        content: (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bins}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
              <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ),
      });
    }

    // Category slides
    for (const col of Object.keys(catDistributions).slice(0, 2)) {
      const dist = catDistributions[col];
      s.push({
        title: `${col.replace(/_/g, ' ')} Breakdown`,
        subtitle: `Top ${dist.length} categories`,
        icon: <PieChart className="w-8 h-8 text-pink-400" />,
        bgGradient: 'from-pink-500/20 to-rose-500/20',
        content: (
          <ResponsiveContainer width="100%" height={280}>
            <RePieChart>
              <Pie data={dist} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`} labelLine={{ stroke: '#6B7280' }}>
                {dist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
            </RePieChart>
          </ResponsiveContainer>
        ),
      });
    }

    // Trend slide for first numeric col
    if (numericCols.length > 0) {
      const col = numericCols[0];
      const trendData = data.slice(0, 50).map((r, i) => ({ index: i, value: Number(r[col]) || 0 }));
      s.push({
        title: `${col.replace(/_/g, ' ')} Trend`,
        subtitle: 'First 50 data points',
        icon: <TrendingUp className="w-8 h-8 text-amber-400" />,
        bgGradient: 'from-amber-500/20 to-orange-500/20',
        content: (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="index" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
              <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ),
      });
    }

    // Outlier summary slide
    if (numericCols.length > 0) {
      const outlierInfo = numericCols.slice(0, 5).map(col => {
        const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const stdDev = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
        const outliers = stdDev > 0 ? vals.filter(v => Math.abs((v - mean) / stdDev) > 2.5).length : 0;
        return { column: col.replace(/_/g, ' '), outliers, total: vals.length, pct: ((outliers / vals.length) * 100).toFixed(1) };
      });
      s.push({
        title: 'Anomaly Summary',
        subtitle: 'Outliers detected (Z > 2.5σ)',
        icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
        bgGradient: 'from-red-500/20 to-orange-500/20',
        content: (
          <div className="space-y-3">
            {outlierInfo.map(o => (
              <div key={o.column} className="flex items-center gap-3 glass rounded-lg p-3">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{o.column}</p>
                  <p className="text-xs text-gray-500">{o.outliers} outliers out of {o.total} values ({o.pct}%)</p>
                </div>
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(Number(o.pct) * 5, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        ),
      });
    }

    // Final slide
    s.push({
      title: 'Explore Further',
      subtitle: 'Dive deeper into your data',
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      bgGradient: 'from-purple-500/20 to-indigo-500/20',
      content: (
        <div className="text-center space-y-4">
          <p className="text-gray-300">Use the other tools to explore further:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'AI Query', href: '/query' },
              { label: 'Anomaly Detection', href: '/anomaly' },
              { label: 'Forecasting', href: '/forecast' },
              { label: 'Correlation', href: '/correlation' },
            ].map(l => (
              <a key={l.href} href={l.href} className="px-4 py-2 glass rounded-xl text-sm text-white hover:bg-white/10 transition-all flex items-center gap-2">
                {l.label} <ArrowRight className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      ),
    });

    return s;
  }, [data, cols, numericCols, stats, catDistributions]);

  // Auto-play
  useEffect(() => {
    if (!autoPlay || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay, slides.length]);

  const goNext = useCallback(() => setCurrentSlide(p => Math.min(p + 1, slides.length - 1)), [slides.length]);
  const goPrev = useCallback(() => setCurrentSlide(p => Math.max(p - 1, 0)), []);

  if (loading) return <div className="min-h-screen flex"><Sidebar /><div className="flex-1"><LoadingState type="full" message="Loading data..." /></div></div>;

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Data Story" subtitle="Auto-generated narrative walkthrough" />
        <main className="flex-1 p-6 overflow-auto flex flex-col items-center justify-center">
          {slides.length === 0 ? (
            <p className="text-gray-400">No data to create a story. Upload a dataset first.</p>
          ) : (
            <>
              {/* Slide */}
              <div className="w-full max-w-3xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.35 }}
                    className={`glass-bright rounded-2xl p-8 bg-gradient-to-br ${slide?.bgGradient} min-h-[420px] flex flex-col`}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      {slide?.icon}
                      <div>
                        <h2 className="text-xl font-bold text-white">{slide?.title}</h2>
                        <p className="text-sm text-gray-400">{slide?.subtitle}</p>
                      </div>
                      <span className="ml-auto text-xs glass px-3 py-1 rounded-full text-gray-400">{currentSlide + 1}/{slides.length}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      {slide?.content}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Controls */}
                <div className="flex items-center justify-between mt-6">
                  <button onClick={goPrev} disabled={currentSlide === 0} className="p-2 glass rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Dots */}
                    <div className="flex gap-1.5">
                      {slides.map((_, i) => (
                        <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-indigo-500 w-6' : 'bg-gray-600 hover:bg-gray-500'}`} />
                      ))}
                    </div>
                    <button onClick={() => setAutoPlay(!autoPlay)} className="p-2 glass rounded-lg text-white hover:bg-white/10 transition-all">
                      {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>

                  <button onClick={goNext} disabled={currentSlide === slides.length - 1} className="p-2 glass rounded-lg text-white hover:bg-white/10 disabled:opacity-30 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
