'use client';
// Predictive Forecasting — Linear regression + moving averages with confidence bands
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Calendar, Layers, Settings2, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, Legend, ReferenceLine,
} from 'recharts';
import { Sidebar, Header, LoadingState } from '@/components';
import { useAppStore } from '@/store';

interface ForecastPoint {
  label: string;
  actual: number | null;
  forecast: number | null;
  upper: number | null;
  lower: number | null;
  ma3: number | null;
  ma5: number | null;
  isForecast: boolean;
}

function linearRegression(ys: number[]): { slope: number; intercept: number; r2: number } {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0, r2: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += ys[i]; sumXY += i * ys[i]; sumX2 += i * i; sumY2 += ys[i] * ys[i];
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const ssTot = sumY2 - (sumY * sumY) / n;
  const ssRes = ys.reduce((sum, y, i) => sum + (y - (intercept + slope * i)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function movingAverage(values: (number | null)[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1).filter(v => v !== null) as number[];
    return slice.length === window ? slice.reduce((a, b) => a + b, 0) / window : null;
  });
}

export default function ForecastPage() {
  const { dataset, customDataset, setDataset, setDatasetAnalysis } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [forecastPeriods, setForecastPeriods] = useState(5);

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
  const labelCols = useMemo(() => cols.filter(c => !numericCols.includes(c)), [cols, numericCols]);

  useEffect(() => {
    if (numericCols.length > 0 && !selectedMetric) setSelectedMetric(numericCols[0]);
    if (labelCols.length > 0 && !selectedLabel) setSelectedLabel(labelCols[0]);
  }, [numericCols, labelCols, selectedMetric, selectedLabel]);

  const { forecastData, regression, rmse } = useMemo(() => {
    if (!selectedMetric || data.length === 0) return { forecastData: [], regression: { slope: 0, intercept: 0, r2: 0 }, rmse: 0 };
    const values = data.map(r => Number(r[selectedMetric])).filter(v => !isNaN(v));
    const labels = selectedLabel ? data.map((r, i) => String(r[selectedLabel] ?? `Row ${i + 1}`)) : data.map((_, i) => `Row ${i + 1}`);
    const reg = linearRegression(values);
    const residuals = values.map((v, i) => (v - (reg.intercept + reg.slope * i)) ** 2);
    const mse = residuals.reduce((a, b) => a + b, 0) / values.length;
    const computedRmse = Math.sqrt(mse);
    const confidenceMultiplier = 1.96;

    const ma3 = movingAverage(values as (number | null)[], 3);
    const ma5 = movingAverage(values as (number | null)[], 5);

    const points: ForecastPoint[] = values.map((v, i) => ({
      label: labels[i] ?? `Row ${i + 1}`,
      actual: v,
      forecast: Math.round((reg.intercept + reg.slope * i) * 100) / 100,
      upper: null,
      lower: null,
      ma3: ma3[i] !== null ? Math.round(ma3[i]! * 100) / 100 : null,
      ma5: ma5[i] !== null ? Math.round(ma5[i]! * 100) / 100 : null,
      isForecast: false,
    }));

    for (let j = 1; j <= forecastPeriods; j++) {
      const idx = values.length - 1 + j;
      const predicted = Math.round((reg.intercept + reg.slope * idx) * 100) / 100;
      const margin = confidenceMultiplier * computedRmse * Math.sqrt(1 + j / values.length);
      points.push({
        label: `Forecast +${j}`,
        actual: null,
        forecast: predicted,
        upper: Math.round((predicted + margin) * 100) / 100,
        lower: Math.round((predicted - margin) * 100) / 100,
        ma3: null,
        ma5: null,
        isForecast: true,
      });
    }

    // Limit to last 60 actuals + forecasts for legibility
    const maxActuals = 60;
    const actuals = points.filter(p => !p.isForecast);
    const forecasts = points.filter(p => p.isForecast);
    const trimmed = actuals.length > maxActuals ? actuals.slice(actuals.length - maxActuals) : actuals;
    return { forecastData: [...trimmed, ...forecasts], regression: reg, rmse: computedRmse };
  }, [selectedMetric, selectedLabel, data, forecastPeriods]);

  const trendDirection = regression.slope > 0 ? 'Upward' : regression.slope < 0 ? 'Downward' : 'Flat';
  const trendColor = regression.slope > 0 ? 'text-emerald-400' : regression.slope < 0 ? 'text-red-400' : 'text-gray-400';

  if (loading) return <div className="min-h-screen flex"><Sidebar /><div className="flex-1"><LoadingState type="full" message="Loading data..." /></div></div>;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Predictive Forecasting" subtitle="Linear regression & trend projection" />
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Trend', value: trendDirection, sub: `Slope: ${regression.slope.toFixed(4)}`, color: trendColor, icon: TrendingUp },
              { label: 'R² Score', value: regression.r2.toFixed(4), sub: regression.r2 >= 0.7 ? 'Good fit' : regression.r2 >= 0.4 ? 'Moderate fit' : 'Weak fit', color: regression.r2 >= 0.7 ? 'text-emerald-400' : 'text-amber-400', icon: Layers },
              { label: 'RMSE', value: rmse.toFixed(2), sub: 'Root Mean Squared Error', color: 'text-blue-400', icon: Settings2 },
              { label: 'Forecasting', value: `${forecastPeriods} periods`, sub: 'ahead', color: 'text-purple-400', icon: Calendar },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-bright rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                  <div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-[10px] text-gray-500">{card.sub}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <select value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)} className="px-4 py-2.5 glass-bright rounded-xl text-white bg-transparent border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {numericCols.map(c => <option key={c} value={c} className="bg-gray-900">{c.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={selectedLabel} onChange={e => setSelectedLabel(e.target.value)} className="px-4 py-2.5 glass-bright rounded-xl text-white bg-transparent border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
              {labelCols.map(c => <option key={c} value={c} className="bg-gray-900">{c.replace(/_/g, ' ')}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Forecast periods:</span>
              <input type="range" min="1" max="15" value={forecastPeriods} onChange={e => setForecastPeriods(Number(e.target.value))} className="w-28 accent-indigo-500" />
              <span className="text-sm font-medium text-white w-6">{forecastPeriods}</span>
            </div>
          </div>

          {/* Main Chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-bright rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Forecast — {selectedMetric.replace(/_/g, ' ')}
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={forecastData} margin={{ top: 10, right: 30, bottom: 10, left: 0 }}>
                <defs>
                  <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9CA3AF' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                <Legend />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#colorConfidence)" name="Upper CI" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="url(#colorConfidence)" name="Lower CI" />
                <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} dot={false} name="Actual" connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="#6366F1" strokeWidth={2} strokeDasharray="8 4" dot={false} name="Forecast" />
                <Line type="monotone" dataKey="ma3" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="MA-3" connectNulls={false} />
                <Line type="monotone" dataKey="ma5" stroke="#EC4899" strokeWidth={1.5} dot={false} name="MA-5" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Interpretation */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-bright rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">AI Interpretation</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• The data shows a <span className={`font-semibold ${trendColor}`}>{trendDirection.toLowerCase()}</span> trend with a slope of <span className="text-white font-medium">{regression.slope.toFixed(4)}</span> per period.</p>
              <p>• The R² value of <span className="text-white font-medium">{regression.r2.toFixed(4)}</span> indicates the linear model explains <span className="text-white font-medium">{(regression.r2 * 100).toFixed(1)}%</span> of the variance in the data.</p>
              <p>• The RMSE of <span className="text-white font-medium">{rmse.toFixed(2)}</span> represents the typical prediction error magnitude.</p>
              <p>• The 95% confidence interval widens for further-out forecasts, reflecting increasing uncertainty.</p>
              {regression.r2 < 0.4 && <p className="text-amber-400">⚠️ Low R² — the linear model may not be a good fit. The data could follow a non-linear pattern.</p>}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
