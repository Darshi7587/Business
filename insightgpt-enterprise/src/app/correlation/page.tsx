'use client';
// Auto-Correlation Discovery — Pearson correlation matrix + heatmap
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitCompareArrows, ArrowUpRight, ArrowDownRight, Info, TrendingUp } from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Sidebar, Header, LoadingState } from '@/components';
import { useAppStore } from '@/store';

interface CorrelationPair {
  col1: string;
  col2: string;
  r: number;
  strength: string;
  direction: string;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i]; sumY += y[i]; sumXY += x[i] * y[i]; sumX2 += x[i] * x[i]; sumY2 += y[i] * y[i];
  }
  const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function getStrength(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.8) return 'Very Strong';
  if (abs >= 0.6) return 'Strong';
  if (abs >= 0.4) return 'Moderate';
  if (abs >= 0.2) return 'Weak';
  return 'Negligible';
}

function heatColor(r: number): string {
  if (r >= 0.8) return '#10B981';
  if (r >= 0.6) return '#34D399';
  if (r >= 0.4) return '#6EE7B7';
  if (r >= 0.2) return '#A7F3D0';
  if (r > -0.2) return '#6B7280';
  if (r > -0.4) return '#FCA5A5';
  if (r > -0.6) return '#F87171';
  if (r > -0.8) return '#EF4444';
  return '#DC2626';
}

export default function CorrelationPage() {
  const { dataset, customDataset, setDataset, setDatasetAnalysis } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [selectedPair, setSelectedPair] = useState<CorrelationPair | null>(null);

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

  const { matrix, pairs } = useMemo(() => {
    if (numericCols.length < 2) return { matrix: [] as number[][], pairs: [] as CorrelationPair[] };
    const columns: number[][] = numericCols.map(col =>
      data.map(r => Number(r[col])).map(v => (isNaN(v) ? 0 : v))
    );
    const n = numericCols.length;
    const mat: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
    const pairList: CorrelationPair[] = [];

    for (let i = 0; i < n; i++) {
      mat[i][i] = 1;
      for (let j = i + 1; j < n; j++) {
        const r = Math.round(pearsonCorrelation(columns[i], columns[j]) * 10000) / 10000;
        mat[i][j] = r;
        mat[j][i] = r;
        pairList.push({
          col1: numericCols[i],
          col2: numericCols[j],
          r,
          strength: getStrength(r),
          direction: r >= 0 ? 'Positive' : 'Negative',
        });
      }
    }
    pairList.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    return { matrix: mat, pairs: pairList };
  }, [numericCols, data]);

  const scatterPoints = useMemo(() => {
    if (!selectedPair) return [];
    return data.map(r => ({
      x: Number(r[selectedPair.col1]) || 0,
      y: Number(r[selectedPair.col2]) || 0,
    })).filter(p => !isNaN(p.x) && !isNaN(p.y));
  }, [selectedPair, data]);

  useEffect(() => {
    if (pairs.length > 0 && !selectedPair) setSelectedPair(pairs[0]);
  }, [pairs, selectedPair]);

  if (loading) return <div className="min-h-screen flex"><Sidebar /><div className="flex-1"><LoadingState type="full" message="Loading data..." /></div></div>;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Correlation Discovery" subtitle="Auto-detect relationships between variables" />
        <main className="flex-1 p-6 overflow-auto">
          {numericCols.length < 2 ? (
            <div className="flex items-center justify-center h-64 glass-bright rounded-xl">
              <p className="text-gray-400">Need at least 2 numeric columns for correlation analysis.</p>
            </div>
          ) : (
            <>
              {/* Heatmap */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-bright rounded-xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <GitCompareArrows className="w-4 h-4 text-indigo-400" /> Correlation Heatmap
                </h3>
                <div className="overflow-x-auto">
                  <table className="border-collapse mx-auto">
                    <thead>
                      <tr>
                        <th />
                        {numericCols.map(c => (
                          <th key={c} className="px-1 py-1 text-[10px] text-gray-400 font-medium max-w-[80px] truncate" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '90px' }}>
                            {c.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {numericCols.map((rowCol, ri) => (
                        <tr key={rowCol}>
                          <td className="px-2 py-1 text-[10px] text-gray-400 font-medium text-right max-w-[100px] truncate">{rowCol.replace(/_/g, ' ')}</td>
                          {numericCols.map((colCol, ci) => {
                            const val = matrix[ri]?.[ci] ?? 0;
                            return (
                              <td key={colCol} className="p-0.5">
                                <button
                                  onClick={() => {
                                    if (ri !== ci) {
                                      const p = pairs.find(pp => (pp.col1 === rowCol && pp.col2 === colCol) || (pp.col1 === colCol && pp.col2 === rowCol));
                                      if (p) setSelectedPair(p);
                                    }
                                  }}
                                  className="w-10 h-10 rounded-md flex items-center justify-center text-[9px] font-bold transition-transform hover:scale-110"
                                  style={{ backgroundColor: heatColor(val), color: Math.abs(val) > 0.4 ? '#fff' : '#D1D5DB' }}
                                >
                                  {val.toFixed(2)}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-center gap-1 mt-3 text-[10px] text-gray-500">
                    <span className="w-4 h-3 rounded" style={{ backgroundColor: '#DC2626' }} /> -1
                    <span className="w-4 h-3 rounded" style={{ backgroundColor: '#6B7280' }} /> 0
                    <span className="w-4 h-3 rounded" style={{ backgroundColor: '#10B981' }} /> +1
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Scatter Plot for selected pair */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-bright rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    {selectedPair ? `${selectedPair.col1.replace(/_/g, ' ')} vs ${selectedPair.col2.replace(/_/g, ' ')}` : 'Select a pair'}
                  </h3>
                  {selectedPair && (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis type="number" dataKey="x" name={selectedPair.col1} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                          <YAxis type="number" dataKey="y" name={selectedPair.col2} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                          <Scatter data={scatterPoints} fill="#6366F1" fillOpacity={0.6} r={3} />
                        </ScatterChart>
                      </ResponsiveContainer>
                      <div className="mt-3 flex items-center gap-3 text-sm">
                        <span className={`font-semibold ${selectedPair.r >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          r = {selectedPair.r.toFixed(4)}
                        </span>
                        <span className="text-gray-400">|</span>
                        <span className="text-gray-300">{selectedPair.strength} {selectedPair.direction}</span>
                      </div>
                    </>
                  )}
                </motion.div>

                {/* Top Correlations List */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-bright rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-amber-400" /> Top Correlations
                  </h3>
                  <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '360px' }}>
                    {pairs.slice(0, 20).map((p, i) => (
                      <button key={`${p.col1}-${p.col2}`} onClick={() => setSelectedPair(p)} className={`w-full text-left p-3 rounded-lg transition-all ${selectedPair?.col1 === p.col1 && selectedPair?.col2 === p.col2 ? 'bg-indigo-500/20 border border-indigo-500/30' : 'glass hover:bg-white/5'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-5">#{i + 1}</span>
                            {p.r >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
                            <span className="text-sm text-gray-200">{p.col1.replace(/_/g, ' ')} ↔ {p.col2.replace(/_/g, ' ')}</span>
                          </div>
                          <span className={`text-sm font-mono font-semibold ${Math.abs(p.r) >= 0.6 ? (p.r >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-gray-400'}`}>
                            {p.r >= 0 ? '+' : ''}{p.r.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 ml-7">{p.strength} {p.direction.toLowerCase()} correlation</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Insights */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-bright rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-400" /> Key Insights
                </h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {pairs.filter(p => Math.abs(p.r) >= 0.6).length === 0 ? (
                    <p>No strong correlations (|r| ≥ 0.6) were found between any numeric column pairs in the dataset.</p>
                  ) : (
                    pairs.filter(p => Math.abs(p.r) >= 0.6).slice(0, 5).map(p => (
                      <p key={`${p.col1}-${p.col2}-insight`}>
                        • <span className="text-white font-medium">{p.col1.replace(/_/g, ' ')}</span> and{' '}
                        <span className="text-white font-medium">{p.col2.replace(/_/g, ' ')}</span> have a{' '}
                        <span className={p.r >= 0 ? 'text-emerald-400' : 'text-red-400'}>{p.strength.toLowerCase()} {p.direction.toLowerCase()}</span>{' '}
                        correlation (r={p.r.toFixed(3)}). {p.r >= 0.6 ? 'As one increases, the other tends to increase as well.' : p.r <= -0.6 ? 'As one increases, the other tends to decrease.' : ''}
                      </p>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
