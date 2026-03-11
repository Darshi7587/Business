'use client';
// InsightGPT Enterprise - Power BI Style Dashboard (Generic)
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Shield, 
  Building2,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Hash,
  Layers,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Table,
  AlertTriangle,
  Activity,
  Eye,
} from 'lucide-react';
import { Sidebar, Header } from '@/components';
import { useAppStore } from '@/store';

const COLORS = {
  primary: '#0078D4',
  secondary: '#106EBE',
  success: '#107C10',
  warning: '#FFB900',
  danger: '#D83B01',
  purple: '#8764B8',
  teal: '#008575',
  orange: '#CA5010',
  chart: ['#0078D4', '#00A2ED', '#8764B8', '#107C10', '#FFB900', '#D83B01', '#008575', '#CA5010', '#4A154B', '#2D7D9A'],
};

const KPI_ICONS = [DollarSign, CheckCircle2, Shield, Building2, TrendingUp, Hash, Layers, Clock];

export default function DashboardPage() {
  const { customDataset, dataset: storeDataset } = useAppStore();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter1, setSelectedFilter1] = useState<string>('All');
  const [selectedFilter2, setSelectedFilter2] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-detect columns
  const { numericCols, categoricalCols, primaryDimension, timeDimension } = useMemo(() => {
    if (data.length === 0) return { numericCols: [] as string[], categoricalCols: [] as string[], primaryDimension: '', timeDimension: '' };
    const cols = Object.keys(data[0]);
    const numeric: string[] = [];
    const categorical: string[] = [];
    for (const col of cols) {
      const sample = data.slice(0, 20).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      if (sample.length > 0 && sample.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== ''))) {
        numeric.push(col);
      } else {
        categorical.push(col);
      }
    }
    const timeDim = categorical.find(c => /year|date|time|month|quarter|period/i.test(c)) || '';
    const primaryDim = categorical.find(c => c !== timeDim) || categorical[0] || '';
    return { numericCols: numeric, categoricalCols: categorical, primaryDimension: primaryDim, timeDimension: timeDim };
  }, [data]);

  const filter1Label = primaryDimension ? primaryDimension.replace(/_/g, ' ') : 'Category';
  const filter2Label = timeDimension ? timeDimension.replace(/_/g, ' ') : 'Period';

  // Real-time auto-refresh countdown  
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          setLastRefresh(new Date());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  useEffect(() => {
    if (customDataset && customDataset.length > 0) {
      setData(customDataset);
      setLoading(false);
    } else if (storeDataset && storeDataset.length > 0) {
      setData(storeDataset);
      setLoading(false);
    } else {
      loadData();
    }
  }, [customDataset, storeDataset]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      const result = await response.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setLastRefresh(new Date());
    setRefreshCountdown(30);
    // Re-trigger reactive data from store
    if (customDataset && customDataset.length > 0) {
      setData([...customDataset]);
    } else if (storeDataset && storeDataset.length > 0) {
      setData([...storeDataset]);
    } else {
      loadData();
    }
  }, [customDataset, storeDataset]);

  // Clean data — remove garbage/corrupt and aggregate rows (before user filters)
  const cleanData = useMemo(() => {
    let filtered = [...data];
    // Remove garbage/corrupt rows (HTML, binary, very short non-meaningful values)
    filtered = filtered.filter(row => {
      const firstVal = String(Object.values(row)[0] || '');
      if (firstVal.includes('<') || firstVal.includes('>') || firstVal.length > 200) return false;
      // Remove rows where most numeric fields are null/0
      const numVals = numericCols.map(c => Number(row[c])).filter(v => !isNaN(v) && v !== 0);
      if (numericCols.length > 3 && numVals.length < 2) return false;
      return true;
    });
    // Remove aggregate/total rows (case-insensitive)
    if (primaryDimension) {
      filtered = filtered.filter(row => {
        const val = String(row[primaryDimension] || '').toLowerCase();
        return !val.includes('industry') && !val.includes('pvt.') && !val.includes('total') && !val.includes('private total');
      });
    }
    return filtered;
  }, [data, numericCols, primaryDimension]);

  // Data Quality Metrics — computed on clean data (excludes garbage/aggregate rows)
  const dataQuality = useMemo(() => {
    if (cleanData.length === 0) return { completeness: 0, validity: 0, consistency: 0, overall: 0, missingCount: 0, totalCells: 0, invalidCount: 0, duplicates: 0 };
    const cols = Object.keys(cleanData[0]);
    const totalCells = cleanData.length * cols.length;
    let missingCount = 0;
    let invalidCount = 0;
    const colTypeMix: string[] = [];
    
    for (const col of cols) {
      let numCount = 0;
      let strCount = 0;
      for (const row of cleanData) {
        const v = row[col];
        if (v === null || v === undefined || v === '' || v === 'NA' || v === 'N/A' || v === 'null') {
          missingCount++;
        } else if (typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '')) {
          numCount++;
        } else {
          strCount++;
        }
      }
      if (numCount > 0 && strCount > 0 && numCount < cleanData.length * 0.9 && strCount < cleanData.length * 0.9) {
        colTypeMix.push(col);
        invalidCount += Math.min(numCount, strCount);
      }
    }
    
    const seen = new Set<string>();
    let duplicates = 0;
    for (const row of cleanData) {
      const key = JSON.stringify(row);
      if (seen.has(key)) duplicates++;
      else seen.add(key);
    }
    
    const completeness = totalCells > 0 ? Math.round(((totalCells - missingCount) / totalCells) * 100) : 100;
    const validity = totalCells > 0 ? Math.round(((totalCells - invalidCount) / totalCells) * 100) : 100;
    const dupPct = cleanData.length > 0 ? (duplicates / cleanData.length) * 100 : 0;
    const consistency = Math.round(100 - dupPct - (colTypeMix.length / Math.max(cols.length, 1)) * 10);
    const overall = Math.round((completeness * 0.4 + validity * 0.35 + Math.max(0, consistency) * 0.25));
    
    return { completeness, validity, consistency: Math.max(0, consistency), overall, missingCount, totalCells, invalidCount, duplicates };
  }, [cleanData]);

  // User-filtered data (cleanData + user filter selections)
  const filteredData = useMemo(() => {
    let filtered = [...cleanData];
    if (selectedFilter1 !== 'All' && primaryDimension) {
      filtered = filtered.filter(row => String(row[primaryDimension]) === selectedFilter1);
    }
    if (selectedFilter2 !== 'All' && timeDimension) {
      filtered = filtered.filter(row => String(row[timeDimension]) === selectedFilter2);
    }
    return filtered;
  }, [cleanData, selectedFilter1, selectedFilter2, primaryDimension, timeDimension]);

  const filter1Values = useMemo(() => {
    if (!primaryDimension) return ['All'];
    const vals = [...new Set(cleanData.map(row => String(row[primaryDimension] || '')))].filter(Boolean);
    return ['All', ...vals.sort()];
  }, [cleanData, primaryDimension]);

  const filter2Values = useMemo(() => {
    if (!timeDimension) return ['All'];
    const vals = [...new Set(cleanData.map(row => String(row[timeDimension] || '')))].filter(Boolean).sort();
    return ['All', ...vals];
  }, [cleanData, timeDimension]);

  // Smart KPI column selection — prefer meaningful metrics
  const kpiColumns = useMemo(() => {
    if (numericCols.length === 0) return [];
    // Priority order: total/paid/ratio columns first, then others
    const priority = [
      ...numericCols.filter(c => c.includes('total_claims') || c.includes('total')),
      ...numericCols.filter(c => c.includes('paid') && !c.includes('ratio') && !c.includes('repud')),
      ...numericCols.filter(c => c.includes('ratio') && c.includes('paid')),
      ...numericCols.filter(c => c.includes('ratio') && (c.includes('repud') || c.includes('reject'))),
    ];
    // Deduplicate, then fill with remaining
    const seen = new Set<string>();
    const result: string[] = [];
    for (const col of priority) {
      if (!seen.has(col)) { seen.add(col); result.push(col); }
    }
    for (const col of numericCols) {
      if (!seen.has(col) && result.length < 6) { seen.add(col); result.push(col); }
    }
    return result.slice(0, 4);
  }, [numericCols]);

  // Calculate KPI metrics with missing value handling
  const kpiMetrics = useMemo(() => {
    if (filteredData.length === 0 || kpiColumns.length === 0) return [];
    const kpis: { label: string; value: number; format: 'number' | 'ratio'; change?: number; missing: number }[] = [];
    for (const col of kpiColumns) {
      const rawValues = filteredData.map(r => r[col]);
      const validValues = rawValues.filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v))).map(v => Number(v));
      const missingInCol = rawValues.length - validValues.length;
      if (validValues.length === 0) continue;
      const isRatio = col.includes('ratio') || col.includes('rate') || col.includes('percent');
      const total = validValues.reduce((a, b) => a + b, 0);
      const avg = total / validValues.length;
      
      // Calculate trend: compare by time dimension if available
      let change: number | undefined;
      if (timeDimension) {
        const periods = [...new Set(filteredData.map(r => String(r[timeDimension] || '')))].filter(Boolean).sort();
        if (periods.length >= 2) {
          const latest = periods[periods.length - 1];
          const previous = periods[periods.length - 2];
          const latestVals = filteredData.filter(r => String(r[timeDimension]) === latest).map(r => Number(r[col])).filter(v => !isNaN(v));
          const prevVals = filteredData.filter(r => String(r[timeDimension]) === previous).map(r => Number(r[col])).filter(v => !isNaN(v));
          if (latestVals.length > 0 && prevVals.length > 0) {
            const latestMetric = isRatio ? (latestVals.reduce((a, b) => a + b, 0) / latestVals.length) : latestVals.reduce((a, b) => a + b, 0);
            const prevMetric = isRatio ? (prevVals.reduce((a, b) => a + b, 0) / prevVals.length) : prevVals.reduce((a, b) => a + b, 0);
            if (prevMetric !== 0) change = ((latestMetric - prevMetric) / Math.abs(prevMetric)) * 100;
          }
        }
      }
      
      kpis.push({ label: col.replace(/_/g, ' '), value: isRatio ? avg : total, format: isRatio ? 'ratio' : 'number', change, missing: missingInCol });
    }
    return kpis;
  }, [filteredData, kpiColumns, timeDimension]);

  // Top items chart
  const topItemsData = useMemo(() => {
    if (!primaryDimension || numericCols.length === 0) return [];
    const metric = numericCols[0];
    const totals = new Map<string, number>();
    filteredData.forEach(row => {
      const key = String(row[primaryDimension] || 'Unknown');
      totals.set(key, (totals.get(key) || 0) + (Number(row[metric]) || 0));
    });
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        value: Math.round(value * 100) / 100,
      }));
  }, [filteredData, primaryDimension, numericCols]);

  // Trend data
  const trendData = useMemo(() => {
    if (!timeDimension || numericCols.length === 0) return [];
    const metric1 = numericCols[0];
    const metric2 = numericCols.length > 1 ? numericCols[1] : null;
    const groups = new Map<string, { m1: number; m2: number; count: number }>();
    filteredData.forEach(row => {
      const key = String(row[timeDimension] || '');
      if (!key) return;
      const cur = groups.get(key) || { m1: 0, m2: 0, count: 0 };
      groups.set(key, {
        m1: cur.m1 + (Number(row[metric1]) || 0),
        m2: cur.m2 + (metric2 ? (Number(row[metric2]) || 0) : 0),
        count: cur.count + 1,
      });
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, d]) => {
        const point: Record<string, unknown> = { name };
        point[metric1.replace(/_/g, ' ')] = Math.round(d.m1 * 100) / 100;
        if (metric2) point[metric2.replace(/_/g, ' ')] = Math.round(d.m2 * 100) / 100;
        return point;
      });
  }, [filteredData, timeDimension, numericCols]);

  // Distribution data
  const distributionData = useMemo(() => {
    if (!primaryDimension || numericCols.length < 2) return [];
    const metric = numericCols[1];
    const isRatio = metric.includes('ratio') || metric.includes('rate');
    const groups = new Map<string, { total: number; count: number }>();
    filteredData.forEach(row => {
      const key = String(row[primaryDimension] || 'Unknown');
      const cur = groups.get(key) || { total: 0, count: 0 };
      groups.set(key, { total: cur.total + (Number(row[metric]) || 0), count: cur.count + 1 });
    });
    return Array.from(groups.entries())
      .map(([name, d]) => ({
        name: name.length > 12 ? name.substring(0, 12) + '...' : name,
        fullName: name,
        value: Math.round((isRatio ? d.total / d.count : d.total) * 1000) / 1000,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [filteredData, primaryDimension, numericCols]);

  // Pie chart
  const pieData = useMemo(() => {
    if (!primaryDimension || numericCols.length === 0) return [];
    const metric = numericCols[0];
    const totals = new Map<string, number>();
    filteredData.forEach(row => {
      const key = String(row[primaryDimension] || 'Unknown');
      totals.set(key, (totals.get(key) || 0) + (Number(row[metric]) || 0));
    });
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const top5 = sorted.slice(0, 5);
    const othersVal = sorted.slice(5).reduce((sum, [, v]) => sum + v, 0);
    const total = sorted.reduce((sum, [, v]) => sum + v, 0);
    const result = top5.map(([name, value], i) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      value,
      percentage: ((value / total) * 100).toFixed(1),
      color: COLORS.chart[i % COLORS.chart.length],
    }));
    if (othersVal > 0) {
      result.push({ name: 'Others', value: othersVal, percentage: ((othersVal / total) * 100).toFixed(1), color: '#9CA3AF' });
    }
    return result;
  }, [filteredData, primaryDimension, numericCols]);

  // Table data
  const tableData = useMemo(() => {
    if (!primaryDimension) return [];
    const stats = new Map<string, Record<string, number>>();
    filteredData.forEach(row => {
      const key = String(row[primaryDimension] || 'Unknown');
      const cur = stats.get(key) || {};
      for (const col of numericCols) {
        cur[col] = (cur[col] || 0) + (Number(row[col]) || 0);
      }
      cur._count = (cur._count || 0) + 1;
      stats.set(key, cur);
    });
    return Array.from(stats.entries())
      .map(([name, s]) => ({ name, ...s } as Record<string, unknown>))
      .sort((a, b) => ((Number(b[numericCols[0]]) || 0) - (Number(a[numericCols[0]]) || 0)));
  }, [filteredData, primaryDimension, numericCols]);

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    if (value < 1 && value > 0) return value.toFixed(4);
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-[#F3F2F1]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#0078D4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  const datasetTitle = primaryDimension === 'life_insurer' ? 'Insurance Claims Analytics' : 'Data Analytics Dashboard';
  const datasetSubtitle = primaryDimension === 'life_insurer' ? 'India Life Insurance | IRDAI Data' : `${data.length} records | ${numericCols.length + categoricalCols.length} columns`;
  const qualityColor = dataQuality.overall >= 90 ? '#107C10' : dataQuality.overall >= 70 ? '#FFB900' : '#D83B01';

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Dashboard" subtitle="Executive overview" />
        
        <div className="flex-1 bg-[#F3F2F1] overflow-auto">
      {/* Sub Header Bar */}
      <div className="bg-[#1B1B1B] text-white px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <span className="font-semibold text-lg">{datasetTitle}</span>
          </div>
          <div className="h-6 w-px bg-gray-600"></div>
          <span className="text-gray-300 text-sm">{datasetSubtitle}</span>
          <div className="h-6 w-px bg-gray-600"></div>
          <div className="flex items-center gap-2 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400">Live</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">Refresh in {refreshCountdown}s</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${autoRefresh ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10 text-gray-400'}`}>
            <Eye className="w-4 h-4" /> Auto
          </button>
          <button onClick={handleRefresh} className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-white/10 rounded transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-white/10 rounded transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Sub Header */}
      <div className="bg-white border-b border-gray-300 px-4 flex items-center justify-between">
        <div className="flex">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-[#0078D4] text-[#0078D4]' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Overview</button>
          <button onClick={() => setActiveTab('details')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#0078D4] text-[#0078D4]' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>Detailed Analysis</button>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${showFilters ? 'bg-[#0078D4] text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex">
        {/* Filter Panel */}
        {showFilters && (
          <aside className="w-64 bg-white border-r border-gray-200 p-4 min-h-[calc(100vh-88px)]">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Filters</h3>
            
            {timeDimension && (
              <div className="mb-6">
                <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {filter2Label}
                </label>
                <select value={selectedFilter2} onChange={(e) => setSelectedFilter2(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D4]">
                  {filter2Values.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            {primaryDimension && (
              <div className="mb-6">
                <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {filter1Label}
                </label>
                <select value={selectedFilter1} onChange={(e) => setSelectedFilter1(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0078D4]">
                  {filter1Values.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            )}

            <button onClick={() => { setSelectedFilter1('All'); setSelectedFilter2('All'); }} className="w-full text-sm text-[#0078D4] hover:underline py-2">Clear All Filters</button>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Data Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Records:</span><span className="font-medium text-gray-900">{filteredData.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Columns:</span><span className="font-medium text-gray-900">{numericCols.length + categoricalCols.length}</span></div>
                {primaryDimension && <div className="flex justify-between"><span className="text-gray-500">{filter1Label}:</span><span className="font-medium text-gray-900">{new Set(filteredData.map(r => r[primaryDimension])).size}</span></div>}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' ? (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpiMetrics.map((kpi, i) => {
                  const Icon = KPI_ICONS[i % KPI_ICONS.length];
                  const colors = [COLORS.primary, COLORS.success, COLORS.purple, COLORS.orange];
                  const color = colors[i % colors.length];
                  const isUp = kpi.change !== undefined && kpi.change >= 0;
                  return (
                    <div key={kpi.label} className="bg-white rounded shadow-sm border-l-4 p-4" style={{ borderLeftColor: color }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">{kpi.label}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {kpi.format === 'ratio' ? `${(kpi.value * 100).toFixed(1)}%` : formatNumber(kpi.value)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {kpi.change !== undefined && (
                              <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(kpi.change).toFixed(1)}%
                              </span>
                            )}
                            {kpi.missing > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-600" title={`${kpi.missing} missing values handled`}>
                                <AlertTriangle className="w-3 h-3" />
                                {kpi.missing} null
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                          <Icon className="w-5 h-5" style={{ color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Data Health Bar */}
              <div className="bg-white rounded shadow-sm p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: qualityColor }} />
                    Data Health Monitor
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{cleanData.length} records</span>
                    <span>{numericCols.length + categoricalCols.length} columns</span>
                    <span>{dataQuality.totalCells.toLocaleString()} cells</span>
                    <span className="font-medium" style={{ color: qualityColor }}>Score: {dataQuality.overall}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold" style={{ color: dataQuality.completeness >= 90 ? '#107C10' : '#D83B01' }}>{dataQuality.completeness}%</p>
                    <p className="text-xs text-gray-500">Completeness</p>
                    <p className="text-[10px] text-gray-400 mt-1">{dataQuality.missingCount} missing cells</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold" style={{ color: dataQuality.validity >= 90 ? '#107C10' : '#D83B01' }}>{dataQuality.validity}%</p>
                    <p className="text-xs text-gray-500">Validity</p>
                    <p className="text-[10px] text-gray-400 mt-1">{dataQuality.invalidCount} mixed-type cells</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-lg font-bold" style={{ color: dataQuality.consistency >= 90 ? '#107C10' : '#D83B01' }}>{dataQuality.consistency}%</p>
                    <p className="text-xs text-gray-500">Consistency</p>
                    <p className="text-[10px] text-gray-400 mt-1">{dataQuality.duplicates} duplicate rows</p>
                  </div>
                  <div className="text-center p-3 rounded" style={{ backgroundColor: `${qualityColor}10` }}>
                    <p className="text-lg font-bold" style={{ color: qualityColor }}>{dataQuality.overall}%</p>
                    <p className="text-xs text-gray-500">Overall Score</p>
                    <p className="text-[10px] text-gray-400 mt-1">40%C + 35%V + 25%K</p>
                  </div>
                </div>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {topItemsData.length > 0 && (
                  <div className="bg-white rounded shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#0078D4]" />
                      Top by {numericCols[0]?.replace(/_/g, ' ') || 'Value'}
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={topItemsData} layout="vertical" margin={{ left: 5, right: 25, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal vertical={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [Number(value).toLocaleString(), numericCols[0]?.replace(/_/g, ' ')]} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                          {topItemsData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {trendData.length > 0 && (
                  <div className="bg-white rounded shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#107C10]" />
                      Trends Over {timeDimension?.replace(/_/g, ' ') || 'Time'}
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorM1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0078D4" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#0078D4" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorM2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#107C10" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#107C10" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        {Object.keys(trendData[0] || {}).filter(k => k !== 'name').map((key, i) => (
                          <Area key={key} type="monotone" dataKey={key} stroke={i === 0 ? '#0078D4' : '#107C10'} strokeWidth={2} fillOpacity={1} fill={`url(#colorM${i + 1})`} />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {distributionData.length > 0 && (
                  <div className="bg-white rounded shadow-sm p-4 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#8764B8]" />
                      {numericCols[1]?.replace(/_/g, ' ') || 'Distribution'}
                    </h3>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={distributionData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [Number(value).toLocaleString(), numericCols[1]?.replace(/_/g, ' ')]} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                          {distributionData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {pieData.length > 0 && (
                  <div className="bg-white rounded shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-[#CA5010]" />
                      Composition
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [formatNumber(Number(value)), '']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 mt-2">
                      {pieData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                            <span className="text-gray-600">{item.name}</span>
                          </div>
                          <span className="font-medium text-gray-900">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Table */}
              {tableData.length > 0 && (
                <div className="bg-white rounded shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Table className="w-4 h-4 text-gray-500" />
                      Performance Details
                    </h3>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">{tableData.length} items</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{filter1Label}</th>
                          {numericCols.slice(0, 5).map(col => (
                            <th key={col} className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{col.replace(/_/g, ' ')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tableData.slice(0, 12).map((row) => (
                          <tr key={String(row.name)} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{String(row.name)}</td>
                            {numericCols.slice(0, 5).map(col => (
                              <td key={col} className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(Number(row[col]) || 0)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Detailed Analysis Tab */
            <div className="space-y-6">
              {trendData.length > 0 && (
                <div className="bg-white rounded shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Trend Comparison</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px' }} />
                      <Legend />
                      {Object.keys(trendData[0] || {}).filter(k => k !== 'name').map((key, i) => (
                        <Line key={key} type="monotone" dataKey={key} stroke={COLORS.chart[i % COLORS.chart.length]} strokeWidth={2} dot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Full Data Table */}
              <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800">Complete Data View</h3>
                </div>
                <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{filter1Label}</th>
                        {numericCols.slice(0, 6).map(col => (
                          <th key={col} className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{col.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tableData.map((row) => (
                        <tr key={String(row.name)} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{String(row.name)}</td>
                          {numericCols.slice(0, 6).map(col => (
                            <td key={col} className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(Number(row[col]) || 0)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>InsightGPT Enterprise | {data.length} records loaded | Data Quality: {dataQuality.overall}%</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              Last refreshed: {lastRefresh.toLocaleTimeString('en-IN')}
            </span>
            <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </footer>
        </div>
      </div>
    </div>
  );
}
