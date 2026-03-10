'use client';
// Anomaly Detection Engine — Auto-scan for outliers with statistical methods
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Zap,
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, BarChart, Bar, ReferenceLine,
} from 'recharts';
import { Sidebar, Header, LoadingState } from '@/components';
import { useAppStore } from '@/store';

interface AnomalyResult {
  column: string;
  index: number;
  value: number;
  zScore: number;
  severity: 'critical' | 'warning' | 'info';
  explanation: string;
  row: Record<string, unknown>;
}

interface ColumnStats {
  name: string;
  mean: number;
  stdDev: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  anomalyCount: number;
  totalValues: number;
}

function computeStats(values: number[]): { mean: number; stdDev: number; median: number; q1: number; q3: number; iqr: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0, median: 0, q1: 0, q3: 0, iqr: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  return { mean, stdDev, median, q1, q3, iqr: q3 - q1 };
}

export default function AnomalyPage() {
  const { dataset, customDataset, setDataset, setDatasetAnalysis } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);
  const [columnStatsMap, setColumnStatsMap] = useState<ColumnStats[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [zThreshold, setZThreshold] = useState(2.5);

  useEffect(() => {
    const loadData = async () => {
      const activeData = customDataset && customDataset.length > 0 ? customDataset : dataset;
      if (activeData && activeData.length > 0) {
        setData(activeData);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        if (result.success) {
          setDataset(result.data);
          setDatasetAnalysis(result.analysis);
          setData(result.data);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadData();
  }, [dataset, customDataset, setDataset, setDatasetAnalysis]);

  const numericCols = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(col => {
      const sample = data.slice(0, 20).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      return sample.length > 0 && sample.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && String(v).trim() !== ''));
    });
  }, [data]);

  useEffect(() => {
    if (numericCols.length > 0 && !selectedColumn) setSelectedColumn(numericCols[0]);
  }, [numericCols, selectedColumn]);

  const runAnomalyDetection = () => {
    setScanning(true);
    // Use setTimeout so UI updates first
    setTimeout(() => {
      const results: AnomalyResult[] = [];
      const statsArr: ColumnStats[] = [];

      for (const col of numericCols) {
        const values = data.map((r, i) => ({ val: Number(r[col]), idx: i })).filter(v => !isNaN(v.val));
        const nums = values.map(v => v.val);
        const stats = computeStats(nums);
        let anomalyCount = 0;

        for (const { val, idx } of values) {
          if (stats.stdDev === 0) continue;
          const zScore = Math.abs((val - stats.mean) / stats.stdDev);
          if (zScore >= zThreshold) {
            anomalyCount++;
            const severity: AnomalyResult['severity'] = zScore >= 4 ? 'critical' : zScore >= 3 ? 'warning' : 'info';
            const direction = val > stats.mean ? 'above' : 'below';
            results.push({
              column: col,
              index: idx,
              value: val,
              zScore: Math.round(zScore * 100) / 100,
              severity,
              explanation: `Value ${val.toLocaleString()} is ${zScore.toFixed(1)}σ ${direction} the mean (${stats.mean.toFixed(2)}). This is statistically unusual.`,
              row: data[idx],
            });
          }
        }

        statsArr.push({
          name: col,
          mean: stats.mean,
          stdDev: stats.stdDev,
          median: stats.median,
          q1: stats.q1,
          q3: stats.q3,
          iqr: stats.iqr,
          anomalyCount,
          totalValues: nums.length,
        });
      }

      results.sort((a, b) => b.zScore - a.zScore);
      setAnomalies(results);
      setColumnStatsMap(statsArr);
      setScanning(false);
    }, 100);
  };

  // Auto-run detection when data loads
  useEffect(() => {
    if (data.length > 0 && numericCols.length > 0 && anomalies.length === 0 && !scanning) {
      runAnomalyDetection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, numericCols]);

  const filteredAnomalies = useMemo(() => {
    if (!selectedColumn) return anomalies;
    return anomalies.filter(a => a.column === selectedColumn);
  }, [anomalies, selectedColumn]);

  const scatterData = useMemo(() => {
    if (!selectedColumn || data.length === 0) return [];
    const stats = columnStatsMap.find(s => s.name === selectedColumn);
    if (!stats) return [];
    return data.map((r, i) => {
      const val = Number(r[selectedColumn]);
      if (isNaN(val)) return null;
      const z = stats.stdDev > 0 ? Math.abs((val - stats.mean) / stats.stdDev) : 0;
      return { index: i, value: val, zScore: Math.round(z * 100) / 100, isAnomaly: z >= zThreshold };
    }).filter(Boolean);
  }, [selectedColumn, data, columnStatsMap, zThreshold]);

  const distributionData = useMemo(() => {
    if (!selectedColumn || data.length === 0) return [];
    const values = data.map(r => Number(r[selectedColumn])).filter(v => !isNaN(v));
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
    const binSize = range / binCount || 1;
    const bins: { range: string; count: number; hasAnomaly: boolean }[] = [];
    const stats = columnStatsMap.find(s => s.name === selectedColumn);
    for (let i = 0; i < binCount; i++) {
      const lo = min + i * binSize;
      const hi = lo + binSize;
      const count = values.filter(v => v >= lo && (i === binCount - 1 ? v <= hi : v < hi)).length;
      const midpoint = (lo + hi) / 2;
      const z = stats && stats.stdDev > 0 ? Math.abs((midpoint - stats.mean) / stats.stdDev) : 0;
      bins.push({ range: `${lo.toFixed(1)}`, count, hasAnomaly: z >= zThreshold });
    }
    return bins;
  }, [selectedColumn, data, columnStatsMap, zThreshold]);

  const totalCritical = anomalies.filter(a => a.severity === 'critical').length;
  const totalWarning = anomalies.filter(a => a.severity === 'warning').length;
  const totalInfo = anomalies.filter(a => a.severity === 'info').length;
  const anomalyRate = data.length > 0 ? ((anomalies.length / (data.length * numericCols.length)) * 100).toFixed(2) : '0';

  if (loading) return <div className="min-h-screen flex"><Sidebar /><div className="flex-1"><LoadingState type="full" message="Loading data..." /></div></div>;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Anomaly Detection" subtitle="Statistical outlier analysis" />
        <main className="flex-1 p-6 overflow-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Anomalies', value: anomalies.length, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: 'Critical', value: totalCritical, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'Warning', value: totalWarning, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Info', value: totalInfo, icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Anomaly Rate', value: `${anomalyRate}%`, icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-bright rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className="text-xl font-bold text-white">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <select value={selectedColumn} onChange={e => setSelectedColumn(e.target.value)} className="px-4 py-2.5 glass-bright rounded-xl text-white bg-transparent border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {numericCols.map(col => <option key={col} value={col} className="bg-gray-900">{col.replace(/_/g, ' ')}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Z-Score Threshold:</span>
              <input type="range" min="1.5" max="4" step="0.5" value={zThreshold} onChange={e => setZThreshold(Number(e.target.value))} className="w-32 accent-indigo-500" />
              <span className="text-sm font-medium text-white w-8">{zThreshold}σ</span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={runAnomalyDetection} disabled={scanning} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium">
              {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {scanning ? 'Scanning...' : 'Re-Scan'}
            </motion.button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Scatter Plot */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-bright rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Outlier Scatter — {selectedColumn?.replace(/_/g, ' ')}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" dataKey="index" name="Row" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <YAxis type="number" dataKey="value" name="Value" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                  <Scatter data={scatterData} shape="circle">
                    {scatterData.map((entry: Record<string, unknown> | null, idx: number) => (
                      <Cell key={idx} fill={entry && (entry as { isAnomaly: boolean }).isAnomaly ? '#EF4444' : '#6366F1'} r={entry && (entry as { isAnomaly: boolean }).isAnomaly ? 6 : 3} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Normal</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Anomaly</span>
              </div>
            </motion.div>

            {/* Distribution */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-bright rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" /> Value Distribution
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.hasAnomaly ? '#EF4444' : '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Column Health Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-bright rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4">Column Health Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {columnStatsMap.map((stat) => {
                const healthPct = stat.totalValues > 0 ? ((1 - stat.anomalyCount / stat.totalValues) * 100) : 100;
                const color = healthPct >= 99 ? 'emerald' : healthPct >= 95 ? 'amber' : 'red';
                return (
                  <div key={stat.name} className="p-3 glass rounded-lg cursor-pointer hover:border-indigo-500/30 transition-all" onClick={() => setSelectedColumn(stat.name)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{stat.name.replace(/_/g, ' ')}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400`}>
                        {stat.anomalyCount} outlier{stat.anomalyCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full bg-${color}-500`} style={{ width: `${healthPct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                      <span>μ={stat.mean.toFixed(2)}</span>
                      <span>σ={stat.stdDev.toFixed(2)}</span>
                      <span>{healthPct.toFixed(1)}% healthy</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Anomaly Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-bright rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Detected Anomalies ({filteredAnomalies.length})
              </h3>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
              <table className="w-full">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Column</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Value</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Z-Score</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAnomalies.slice(0, 50).map((a, i) => (
                    <tr key={`${a.column}-${a.index}-${i}`} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          a.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                          a.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {a.severity === 'critical' ? <XCircle className="w-3 h-3" /> : a.severity === 'warning' ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                          {a.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">{a.column.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-sm text-white text-right font-mono">{a.value.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        <span className={a.zScore >= 4 ? 'text-red-400' : a.zScore >= 3 ? 'text-amber-400' : 'text-blue-400'}>{a.zScore}σ</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{a.explanation}</td>
                    </tr>
                  ))}
                  {filteredAnomalies.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                      <p className="text-white font-medium">No anomalies detected!</p>
                      <p className="text-sm">All values are within {zThreshold}σ of the mean.</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
