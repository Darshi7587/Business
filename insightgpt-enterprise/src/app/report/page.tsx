'use client';
// PDF Report Generator — One-click executive summary with charts & insights
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Eye, BarChart3, TrendingUp,
  Hash, AlertTriangle, Printer, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Sidebar, Header, LoadingState } from '@/components';
import { useAppStore } from '@/store';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6'];

export default function ReportPage() {
  const { dataset, customDataset, setDataset, setDatasetAnalysis } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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

  const stats = useMemo(() => {
    const result: Record<string, { mean: number; min: number; max: number; sum: number; stdDev: number; median: number }> = {};
    for (const col of numericCols) {
      const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
      if (vals.length === 0) continue;
      const sorted = [...vals].sort((a, b) => a - b);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      const median = vals.length % 2 === 0 ? (sorted[vals.length / 2 - 1] + sorted[vals.length / 2]) / 2 : sorted[Math.floor(vals.length / 2)];
      result[col] = { mean, min: Math.min(...vals), max: Math.max(...vals), sum: vals.reduce((a, b) => a + b, 0), stdDev: Math.sqrt(variance), median };
    }
    return result;
  }, [numericCols, data]);

  const topCatDist = useMemo(() => {
    if (categoricalCols.length === 0) return { col: '', data: [] as { name: string; value: number }[] };
    const col = categoricalCols[0];
    const counts: Record<string, number> = {};
    data.forEach(r => { const v = String(r[col] ?? 'Unknown'); counts[v] = (counts[v] || 0) + 1; });
    return { col, data: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value })) };
  }, [categoricalCols, data]);

  const trendData = useMemo(() => {
    if (numericCols.length === 0) return [];
    const col = numericCols[0];
    return data.slice(0, 30).map((r, i) => ({ index: i + 1, value: Number(r[col]) || 0 }));
  }, [numericCols, data]);

  const anomalyCount = useMemo(() => {
    let count = 0;
    for (const col of numericCols) {
      const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
      if (vals.length === 0) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const stdDev = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
      if (stdDev > 0) count += vals.filter(v => Math.abs((v - mean) / stdDev) > 2.5).length;
    }
    return count;
  }, [numericCols, data]);

  // Data quality score
  const qualityScore = useMemo(() => {
    const totalCells = data.length * cols.length;
    let missing = 0;
    data.forEach(r => cols.forEach(c => { const v = r[c]; if (v === null || v === undefined || v === '' || v === 'NA') missing++; }));
    const pct = totalCells > 0 ? (missing / totalCells) * 100 : 0;
    const score = Math.max(0, Math.min(100, Math.round(100 - pct * 2)));
    return { score, grade: score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F' };
  }, [data, cols]);

  const handleDownload = async () => {
    setGenerating(true);
    // Use print-friendly method
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      if (!printWindow || !reportRef.current) { setGenerating(false); return; }
      const content = reportRef.current.innerHTML;
      printWindow.document.write(`
        <!DOCTYPE html><html><head><title>InsightGPT Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
          body { background: #fff; color: #1a1a1a; padding: 40px; }
          .report-section { margin-bottom: 32px; }
          .report-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #1e1b4b; }
          .report-subtitle { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
          .kpi-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
          .kpi-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
          .kpi-value { font-size: 24px; font-weight: 700; color: #1e1b4b; }
          .kpi-sub { font-size: 11px; color: #9ca3af; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
          td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
          .section-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #1e1b4b; border-bottom: 2px solid #6366f1; padding-bottom: 4px; }
          .insight-item { padding: 8px 0; font-size: 13px; color: #374151; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          @media print { body { padding: 20px; } }
        </style></head><body>${content}
        <div class="footer">Generated by InsightGPT Enterprise &mdash; ${new Date().toLocaleDateString()}</div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      setGenerating(false);
    }, 300);
  };

  if (loading) return <div className="min-h-screen flex"><Sidebar /><div className="flex-1"><LoadingState type="full" message="Loading data..." /></div></div>;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Report Generator" subtitle="One-click executive summary" />
        <main className="flex-1 p-6 overflow-auto">
          {/* Action Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Executive Report</h2>
              <p className="text-sm text-gray-500">{data.length.toLocaleString()} records &bull; {cols.length} columns &bull; Generated {new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDownload} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-medium shadow-lg shadow-indigo-500/30">
                {generating ? <Download className="w-4 h-4 animate-bounce" /> : <Printer className="w-4 h-4" />}
                {generating ? 'Generating...' : 'Print / Save PDF'}
              </motion.button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="glass-bright rounded-2xl p-8 bg-white/[0.02]">
            {/* Hidden print content */}
            <div ref={reportRef} style={{ display: 'none' }}>
              <div className="report-section">
                <div className="report-title">Data Analysis Report</div>
                <div className="report-subtitle">{data.length.toLocaleString()} records &bull; {cols.length} columns &bull; Quality Score: {qualityScore.grade} ({qualityScore.score}/100)</div>
              </div>
              <div className="report-section">
                <div className="section-title">Key Performance Indicators</div>
                <div className="kpi-grid">
                  {numericCols.slice(0, 6).map(col => {
                    const s = stats[col];
                    if (!s) return null;
                    return (
                      <div key={col} className="kpi-card">
                        <div className="kpi-label">{col.replace(/_/g, ' ')}</div>
                        <div className="kpi-value">{s.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className="kpi-sub">Range: {s.min.toLocaleString()} — {s.max.toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="report-section">
                <div className="section-title">Statistical Summary</div>
                <table>
                  <thead><tr><th>Column</th><th>Mean</th><th>Median</th><th>Std Dev</th><th>Min</th><th>Max</th></tr></thead>
                  <tbody>
                    {numericCols.map(col => {
                      const s = stats[col];
                      if (!s) return null;
                      return <tr key={col}><td>{col.replace(/_/g, ' ')}</td><td>{s.mean.toFixed(2)}</td><td>{s.median.toFixed(2)}</td><td>{s.stdDev.toFixed(2)}</td><td>{s.min.toLocaleString()}</td><td>{s.max.toLocaleString()}</td></tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div className="report-section">
                <div className="section-title">Key Findings</div>
                <div className="insight-item">• Dataset contains {data.length.toLocaleString()} records with {cols.length} attributes.</div>
                <div className="insight-item">• {anomalyCount} statistical anomalies detected across {numericCols.length} numeric columns (Z &gt; 2.5σ).</div>
                <div className="insight-item">• Data quality score: {qualityScore.grade} ({qualityScore.score}/100).</div>
                {numericCols.length > 0 && <div className="insight-item">• Highest average in &quot;{numericCols.reduce((a, b) => (stats[a]?.mean || 0) > (stats[b]?.mean || 0) ? a : b).replace(/_/g, ' ')}&quot;: {Math.max(...numericCols.map(c => stats[c]?.mean || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>}
                {topCatDist.data.length > 0 && <div className="insight-item">• Most common {topCatDist.col.replace(/_/g, ' ')}: &quot;{topCatDist.data[0]?.name}&quot; ({topCatDist.data[0]?.value.toLocaleString()} occurrences)</div>}
              </div>
            </div>

            {/* Visual Preview */}
            <div className="space-y-6">
              {/* KPI Cards */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-indigo-400" /> Key Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {numericCols.slice(0, 8).map((col, i) => {
                    const s = stats[col];
                    if (!s) return null;
                    return (
                      <motion.div key={col} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-xl p-4">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">{col.replace(/_/g, ' ')}</p>
                        <p className="text-lg font-bold text-white mt-1">{s.mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-gray-500">{s.min.toLocaleString()} — {s.max.toLocaleString()}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trendData.length > 0 && (
                  <div className="glass rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> {numericCols[0]?.replace(/_/g, ' ')} Trend
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="index" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                        <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {topCatDist.data.length > 0 && (
                  <div className="glass rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-pink-400" /> {topCatDist.col.replace(/_/g, ' ')} Distribution
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={topCatDist.data} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" nameKey="name" label={({ name }) => name}>
                          {topCatDist.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Stats Table */}
              <div className="glass rounded-xl overflow-hidden">
                <h4 className="px-5 py-3 text-sm font-semibold text-white border-b border-white/5">Statistical Summary</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Column</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Mean</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Median</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Std Dev</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Min</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Max</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {numericCols.map(col => {
                        const s = stats[col];
                        if (!s) return null;
                        return (
                          <tr key={col} className="hover:bg-white/5">
                            <td className="px-4 py-3 text-sm text-gray-300">{col.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3 text-sm text-white text-right font-mono">{s.mean.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-white text-right font-mono">{s.median.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-400 text-right font-mono">{s.stdDev.toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-gray-400 text-right font-mono">{s.min.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-400 text-right font-mono">{s.max.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Findings */}
              <div className="glass rounded-xl p-5">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Key Findings
                </h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Dataset: {data.length.toLocaleString()} records, {cols.length} attributes</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Anomalies: {anomalyCount} outliers detected across {numericCols.length} columns</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Quality: {qualityScore.grade} ({qualityScore.score}/100)</p>
                  {topCatDist.data.length > 0 && (
                    <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Most common {topCatDist.col.replace(/_/g, ' ')}: &quot;{topCatDist.data[0]?.name}&quot; ({topCatDist.data[0]?.value} occurrences)</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
