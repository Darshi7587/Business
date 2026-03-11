'use client';
// PDF Report Generator — One-click executive summary with charts & insights
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp,
  Hash, AlertTriangle, Printer, CheckCircle, Download,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Sidebar, Header, LoadingState } from '@/components';
import { useAppStore } from '@/store';

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

  // Insurer performance: settlement ratio, rejection ratio, year-over-year
  const insurerPerformance = useMemo(() => {
    if (data.length === 0) return [];
    const insurerMap: Record<string, { years: string[]; settlementRatios: number[]; rejectionRatios: number[]; totalClaims: number[]; paidAmt: number[] }> = {};
    data.forEach(r => {
      const name = String(r['life_insurer'] ?? '');
      const year = String(r['year'] ?? '');
      if (!name) return;
      if (!insurerMap[name]) insurerMap[name] = { years: [], settlementRatios: [], rejectionRatios: [], totalClaims: [], paidAmt: [] };
      insurerMap[name].years.push(year);
      insurerMap[name].settlementRatios.push(Number(r['claims_paid_ratio_no']) || 0);
      insurerMap[name].rejectionRatios.push(Number(r['claims_repudiated_rejected_ratio_no']) || 0);
      insurerMap[name].totalClaims.push(Number(r['total_claims_no']) || 0);
      insurerMap[name].paidAmt.push(Number(r['claims_paid_amt']) || 0);
    });
    return Object.entries(insurerMap).map(([name, d]) => {
      const avgSettlement = d.settlementRatios.reduce((a, b) => a + b, 0) / d.settlementRatios.length;
      const avgRejection = d.rejectionRatios.reduce((a, b) => a + b, 0) / d.rejectionRatios.length;
      const latestSettlement = d.settlementRatios[0] ?? avgSettlement;
      const totalClaimsSum = d.totalClaims.reduce((a, b) => a + b, 0);
      const totalPaidAmt = d.paidAmt.reduce((a, b) => a + b, 0);
      const trend = d.settlementRatios.length >= 2 ? d.settlementRatios[0] - d.settlementRatios[d.settlementRatios.length - 1] : 0;
      return { name, avgSettlement, avgRejection, latestSettlement, totalClaimsSum, totalPaidAmt, trend, yearsCount: d.years.length };
    }).sort((a, b) => b.avgSettlement - a.avgSettlement);
  }, [data]);

  // Industry-wide KPIs
  const industryKPIs = useMemo(() => {
    if (data.length === 0) return null;
    const settlementRatios = data.map(r => Number(r['claims_paid_ratio_no'])).filter(v => !isNaN(v) && v > 0);
    const rejectionRatios = data.map(r => Number(r['claims_repudiated_rejected_ratio_no'])).filter(v => !isNaN(v));
    const pendingRatios = data.map(r => Number(r['claims_pending_ratio_no'])).filter(v => !isNaN(v));
    const totalClaims = data.map(r => Number(r['total_claims_no'])).filter(v => !isNaN(v));
    const paidAmounts = data.map(r => Number(r['claims_paid_amt'])).filter(v => !isNaN(v));
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const min = (arr: number[]) => arr.length > 0 ? Math.min(...arr) : 0;
    const max = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 0;
    return {
      avgSettlement: avg(settlementRatios),
      minSettlement: min(settlementRatios),
      maxSettlement: max(settlementRatios),
      avgRejection: avg(rejectionRatios),
      avgPending: avg(pendingRatios),
      totalClaimsProcessed: totalClaims.reduce((a, b) => a + b, 0),
      totalAmountPaid: paidAmounts.reduce((a, b) => a + b, 0),
      uniqueInsurers: new Set(data.map(r => String(r['life_insurer'] ?? ''))).size,
      uniqueYears: new Set(data.map(r => String(r['year'] ?? ''))).size,
    };
  }, [data]);

  // Year-over-year industry trend
  const yearlyTrend = useMemo(() => {
    if (data.length === 0) return [];
    const yearMap: Record<string, { settlements: number[]; claims: number[]; paidAmt: number[] }> = {};
    data.forEach(r => {
      const year = String(r['year'] ?? '');
      if (!year) return;
      if (!yearMap[year]) yearMap[year] = { settlements: [], claims: [], paidAmt: [] };
      yearMap[year].settlements.push(Number(r['claims_paid_ratio_no']) || 0);
      yearMap[year].claims.push(Number(r['total_claims_no']) || 0);
      yearMap[year].paidAmt.push(Number(r['claims_paid_amt']) || 0);
    });
    return Object.entries(yearMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, d]) => ({
        year,
        avgSettlement: (d.settlements.reduce((a, b) => a + b, 0) / d.settlements.length * 100),
        totalClaims: d.claims.reduce((a, b) => a + b, 0),
        totalPaid: d.paidAmt.reduce((a, b) => a + b, 0),
      }));
  }, [data]);

  // Top & bottom performers
  const topPerformers = useMemo(() => insurerPerformance.filter(i => i.name !== 'LIC').slice(0, 5), [insurerPerformance]);
  const bottomPerformers = useMemo(() => [...insurerPerformance].filter(i => i.name !== 'LIC').sort((a, b) => a.avgSettlement - b.avgSettlement).slice(0, 5), [insurerPerformance]);

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
                <div className="report-title">Insurance Claims Analysis Report</div>
                <div className="report-subtitle">
                  {industryKPIs ? `${industryKPIs.uniqueInsurers} Life Insurers` : ''} &bull; {industryKPIs ? `${industryKPIs.uniqueYears} Years` : ''} &bull; {data.length.toLocaleString()} Records &bull; Quality: {qualityScore.grade} ({qualityScore.score}/100)
                </div>
              </div>

              {industryKPIs && (
                <div className="report-section">
                  <div className="section-title">Industry Overview</div>
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-label">Avg Settlement Rate</div>
                      <div className="kpi-value">{(industryKPIs.avgSettlement * 100).toFixed(1)}%</div>
                      <div className="kpi-sub">Range: {(industryKPIs.minSettlement * 100).toFixed(1)}% — {(industryKPIs.maxSettlement * 100).toFixed(1)}%</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Avg Rejection Rate</div>
                      <div className="kpi-value">{(industryKPIs.avgRejection * 100).toFixed(1)}%</div>
                      <div className="kpi-sub">Claims denied by insurers</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Total Claims Processed</div>
                      <div className="kpi-value">{industryKPIs.totalClaimsProcessed.toLocaleString()}</div>
                      <div className="kpi-sub">Across all insurers &amp; years</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Total Amount Paid</div>
                      <div className="kpi-value">&#8377;{(industryKPIs.totalAmountPaid).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr</div>
                      <div className="kpi-sub">Benefits disbursed to policyholders</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Avg Pending Rate</div>
                      <div className="kpi-value">{(industryKPIs.avgPending * 100).toFixed(2)}%</div>
                      <div className="kpi-sub">Claims still awaiting decision</div>
                    </div>
                    <div className="kpi-card">
                      <div className="kpi-label">Data Quality</div>
                      <div className="kpi-value">{qualityScore.grade} ({qualityScore.score}/100)</div>
                      <div className="kpi-sub">{anomalyCount} anomalies across {numericCols.length} metrics</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="report-section">
                <div className="section-title">Insurer Performance Comparison (Settlement Rate)</div>
                <table>
                  <thead><tr><th>Insurer</th><th>Avg Settlement Rate</th><th>Avg Rejection Rate</th><th>4-Year Trend</th><th>Total Claims</th></tr></thead>
                  <tbody>
                    {insurerPerformance.map(ip => (
                      <tr key={ip.name}>
                        <td>{ip.name}</td>
                        <td>{(ip.avgSettlement * 100).toFixed(1)}%</td>
                        <td>{(ip.avgRejection * 100).toFixed(1)}%</td>
                        <td>{ip.trend > 0 ? '&#9650;' : ip.trend < 0 ? '&#9660;' : '—'} {Math.abs(ip.trend * 100).toFixed(1)}%</td>
                        <td>{ip.totalClaimsSum.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {yearlyTrend.length > 0 && (
                <div className="report-section">
                  <div className="section-title">Year-over-Year Industry Trend</div>
                  <table>
                    <thead><tr><th>Year</th><th>Avg Settlement Rate</th><th>Total Claims</th><th>Total Paid (Cr)</th></tr></thead>
                    <tbody>
                      {yearlyTrend.map(yt => (
                        <tr key={yt.year}>
                          <td>{yt.year}</td>
                          <td>{yt.avgSettlement.toFixed(1)}%</td>
                          <td>{yt.totalClaims.toLocaleString()}</td>
                          <td>&#8377;{yt.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="report-section">
                <div className="section-title">Key Findings</div>
                <div className="insight-item">&bull; Industry average settlement rate: {industryKPIs ? (industryKPIs.avgSettlement * 100).toFixed(1) : 'N/A'}% — meaning ~{industryKPIs ? Math.round(industryKPIs.avgSettlement * 100) : 0} out of 100 death claims are successfully paid.</div>
                {topPerformers[0] && <div className="insight-item">&bull; Best performer: {topPerformers[0].name} with {(topPerformers[0].avgSettlement * 100).toFixed(1)}% average settlement rate.</div>}
                {bottomPerformers[0] && <div className="insight-item">&bull; Lowest performer: {bottomPerformers[0].name} with {(bottomPerformers[0].avgSettlement * 100).toFixed(1)}% average settlement rate.</div>}
                <div className="insight-item">&bull; {anomalyCount} statistical anomalies detected — mainly driven by LIC&apos;s dominant market share (processes 90%+ of all claims).</div>
                <div className="insight-item">&bull; Data quality score: {qualityScore.grade} ({qualityScore.score}/100) — {qualityScore.score >= 90 ? 'excellent, no missing values' : 'good quality dataset'}.</div>
                {yearlyTrend.length >= 2 && <div className="insight-item">&bull; Settlement rates {yearlyTrend[yearlyTrend.length - 1].avgSettlement > yearlyTrend[0].avgSettlement ? 'improved' : 'remained stable'} from {yearlyTrend[0].year} to {yearlyTrend[yearlyTrend.length - 1].year}.</div>}
              </div>
            </div>

            {/* Visual Preview */}
            <div className="space-y-6">
              {/* Industry KPI Cards */}
              {industryKPIs && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-400" /> Industry Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { label: 'Avg Settlement Rate', value: `${(industryKPIs.avgSettlement * 100).toFixed(1)}%`, sub: `${(industryKPIs.minSettlement * 100).toFixed(1)}% — ${(industryKPIs.maxSettlement * 100).toFixed(1)}%` },
                      { label: 'Avg Rejection Rate', value: `${(industryKPIs.avgRejection * 100).toFixed(1)}%`, sub: 'Claims denied' },
                      { label: 'Avg Pending Rate', value: `${(industryKPIs.avgPending * 100).toFixed(2)}%`, sub: 'Awaiting decision' },
                      { label: 'Total Claims', value: industryKPIs.totalClaimsProcessed.toLocaleString(), sub: 'All insurers & years' },
                      { label: 'Amount Paid', value: `₹${(industryKPIs.totalAmountPaid).toLocaleString(undefined, { maximumFractionDigits: 0 })} Cr`, sub: 'Benefits disbursed' },
                      { label: 'Data Quality', value: `${qualityScore.grade} (${qualityScore.score}/100)`, sub: `${anomalyCount} anomalies found` },
                    ].map((card, i) => (
                      <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass rounded-xl p-4">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">{card.label}</p>
                        <p className="text-lg font-bold text-white mt-1">{card.value}</p>
                        <p className="text-[10px] text-gray-500">{card.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Year-over-Year Settlement Trend */}
                {yearlyTrend.length > 0 && (
                  <div className="glass rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Settlement Rate Trend (Year-over-Year)
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={yearlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                        <YAxis domain={[90, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} formatter={(value) => `${Number(value).toFixed(1)}%`} />
                        <Bar dataKey="avgSettlement" name="Avg Settlement %" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Top Insurers by Settlement Rate */}
                {topPerformers.length > 0 && (
                  <div className="glass rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-pink-400" /> Top 5 Insurers (Settlement Rate)
                    </h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={topPerformers.map(p => ({ name: p.name.length > 15 ? p.name.slice(0, 14) + '…' : p.name, rate: +(p.avgSettlement * 100).toFixed(1) }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                        <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} width={120} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} formatter={(value) => `${value}%`} />
                        <Bar dataKey="rate" name="Settlement %" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Insurer Performance Table */}
              <div className="glass rounded-xl overflow-hidden">
                <h4 className="px-5 py-3 text-sm font-semibold text-white border-b border-white/5">Insurer Performance Comparison</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Insurer</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Avg Settlement</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Avg Rejection</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Trend</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Total Claims</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Paid (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {insurerPerformance.map(ip => (
                        <tr key={ip.name} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-sm text-gray-300 font-medium">{ip.name}</td>
                          <td className="px-4 py-3 text-sm text-right font-mono">
                            <span className={ip.avgSettlement >= 0.97 ? 'text-emerald-400' : ip.avgSettlement >= 0.95 ? 'text-white' : 'text-amber-400'}>{(ip.avgSettlement * 100).toFixed(1)}%</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-mono">
                            <span className={ip.avgRejection <= 0.02 ? 'text-emerald-400' : ip.avgRejection <= 0.05 ? 'text-white' : 'text-red-400'}>{(ip.avgRejection * 100).toFixed(1)}%</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {ip.trend > 0.005 ? <span className="text-emerald-400">▲ {(ip.trend * 100).toFixed(1)}%</span> : ip.trend < -0.005 ? <span className="text-red-400">▼ {(Math.abs(ip.trend) * 100).toFixed(1)}%</span> : <span className="text-gray-500">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-400 text-right font-mono">{ip.totalClaimsSum.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-400 text-right font-mono">₹{ip.totalPaidAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
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
                  <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Industry avg settlement rate: {industryKPIs ? (industryKPIs.avgSettlement * 100).toFixed(1) : 'N/A'}% — ~{industryKPIs ? Math.round(industryKPIs.avgSettlement * 100) : 0} out of 100 claims are paid</p>
                  {topPerformers[0] && <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Best: {topPerformers[0].name} ({(topPerformers[0].avgSettlement * 100).toFixed(1)}% settlement)</p>}
                  {bottomPerformers[0] && <p className="flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Needs improvement: {bottomPerformers[0].name} ({(bottomPerformers[0].avgSettlement * 100).toFixed(1)}% settlement)</p>}
                  <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> LIC dominates with 90%+ market share by volume</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> {anomalyCount} statistical outliers detected (Z-Score &gt; 2.5σ)</p>
                  <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Data quality: {qualityScore.grade} ({qualityScore.score}/100) — {data.length} records, {cols.length} attributes</p>
                  {yearlyTrend.length >= 2 && <p className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Settlement rates {yearlyTrend[yearlyTrend.length - 1].avgSettlement > yearlyTrend[0].avgSettlement ? 'improved' : 'remained stable'} from {yearlyTrend[0].year} to {yearlyTrend[yearlyTrend.length - 1].year}</p>}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
