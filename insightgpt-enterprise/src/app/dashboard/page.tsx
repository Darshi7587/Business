'use client';
// InsightGPT Enterprise - Power BI Style Dashboard
import React, { useEffect, useState, useMemo } from 'react';
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
  DollarSign, 
  Shield, 
  Building2,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Table,
} from 'lucide-react';
import { useAppStore } from '@/store';

interface InsuranceData {
  life_insurer: string;
  year: string;
  claims_pending_start_no: number;
  claims_pending_start_amt: number;
  claims_intimated_no: number;
  claims_intimated_amt: number;
  total_claims_no: number;
  total_claims_amt: number;
  claims_paid_no: number;
  claims_paid_amt: number;
  claims_repudiated_no: number;
  claims_repudiated_amt: number;
  claims_rejected_no: number;
  claims_rejected_amt: number;
  claims_pending_end_no: number;
  claims_pending_end_amt: number;
  claims_paid_ratio_no: number;
  claims_paid_ratio_amt: number;
  category: string;
}

const COLORS = {
  primary: '#0078D4',
  secondary: '#106EBE',
  success: '#107C10',
  warning: '#FFB900',
  danger: '#D83B01',
  purple: '#8764B8',
  teal: '#008575',
  orange: '#CA5010',
  chart: ['#0078D4', '#00A2ED', '#8764B8', '#107C10', '#FFB900', '#D83B01', '#008575', '#CA5010'],
};

export default function DashboardPage() {
  const { customDataset, dataset: storeDataset } = useAppStore();
  const [data, setData] = useState<InsuranceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('All Years');
  const [selectedInsurer, setSelectedInsurer] = useState<string>('All Insurers');
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  useEffect(() => {
    // Use custom uploaded dataset if available, otherwise fetch default
    if (customDataset && customDataset.length > 0) {
      setData(customDataset as unknown as InsuranceData[]);
      setLoading(false);
    } else if (storeDataset && storeDataset.length > 0) {
      setData(storeDataset as unknown as InsuranceData[]);
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

  // Filter data based on selections
  const filteredData = useMemo(() => {
    let filtered = data.filter(row => 
      !String(row.life_insurer).includes('Industry') && 
      !String(row.life_insurer).includes('PVT.') &&
      !String(row.life_insurer).includes('TOTAL')
    );
    
    if (selectedYear !== 'All Years') {
      filtered = filtered.filter(row => row.year === selectedYear);
    }
    if (selectedInsurer !== 'All Insurers') {
      filtered = filtered.filter(row => row.life_insurer === selectedInsurer);
    }
    return filtered;
  }, [data, selectedYear, selectedInsurer]);

  // Get unique years and insurers for filters
  const years = useMemo(() => {
    const uniqueYears = [...new Set(data.map(row => row.year))].filter(Boolean).sort();
    return ['All Years', ...uniqueYears];
  }, [data]);

  const insurers = useMemo(() => {
    const uniqueInsurers = [...new Set(data.map(row => row.life_insurer))]
      .filter(name => name && !name.includes('Industry') && !name.includes('PVT.') && !name.includes('TOTAL'))
      .sort();
    return ['All Insurers', ...uniqueInsurers];
  }, [data]);

  // Calculate KPI metrics
  const metrics = useMemo(() => {
    if (filteredData.length === 0) return null;

    const totalClaimsPaid = filteredData.reduce((sum, row) => sum + (Number(row.claims_paid_amt) || 0), 0);
    const totalClaimsNo = filteredData.reduce((sum, row) => sum + (Number(row.claims_paid_no) || 0), 0);
    const totalRejected = filteredData.reduce((sum, row) => sum + (Number(row.claims_repudiated_no) || 0) + (Number(row.claims_rejected_no) || 0), 0);
    const totalPending = filteredData.reduce((sum, row) => sum + (Number(row.claims_pending_end_no) || 0), 0);
    const avgSettlementRatio = filteredData.reduce((sum, row) => sum + (Number(row.claims_paid_ratio_no) || 0), 0) / filteredData.length;
    
    // Calculate YoY change
    const allYears = [...new Set(filteredData.map(row => row.year))].sort();
    const latestYear = allYears[allYears.length - 1];
    const prevYear = allYears[allYears.length - 2];
    
    const currentYearPaid = filteredData.filter(row => row.year === latestYear)
      .reduce((sum, row) => sum + (Number(row.claims_paid_amt) || 0), 0);
    const prevYearPaid = filteredData.filter(row => row.year === prevYear)
      .reduce((sum, row) => sum + (Number(row.claims_paid_amt) || 0), 0);
    const yoyChange = prevYearPaid > 0 ? ((currentYearPaid - prevYearPaid) / prevYearPaid) * 100 : 0;

    return {
      totalClaimsPaid,
      totalClaimsNo,
      totalRejected,
      totalPending,
      avgSettlementRatio: avgSettlementRatio * 100,
      yoyChange,
      uniqueInsurers: new Set(filteredData.map(row => row.life_insurer)).size,
    };
  }, [filteredData]);

  // Prepare chart data
  const topInsurersData = useMemo(() => {
    const insurerTotals = new Map<string, number>();
    filteredData.forEach(row => {
      const current = insurerTotals.get(row.life_insurer) || 0;
      insurerTotals.set(row.life_insurer, current + (Number(row.claims_paid_amt) || 0));
    });
    return Array.from(insurerTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        value: Math.round(value),
      }));
  }, [filteredData]);

  const yearlyTrendData = useMemo(() => {
    const yearlyTotals = new Map<string, { paid: number; intimated: number; ratio: number; count: number }>();
    filteredData.forEach(row => {
      const year = row.year;
      if (!year) return;
      const current = yearlyTotals.get(year) || { paid: 0, intimated: 0, ratio: 0, count: 0 };
      yearlyTotals.set(year, {
        paid: current.paid + (Number(row.claims_paid_amt) || 0),
        intimated: current.intimated + (Number(row.claims_intimated_amt) || 0),
        ratio: current.ratio + (Number(row.claims_paid_ratio_no) || 0),
        count: current.count + 1,
      });
    });
    return Array.from(yearlyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, data]) => ({
        name: year,
        'Claims Paid': Math.round(data.paid),
        'Claims Intimated': Math.round(data.intimated),
        'Settlement Ratio': Math.round((data.ratio / data.count) * 100),
      }));
  }, [filteredData]);

  const settlementRatioData = useMemo(() => {
    const insurerRatios = new Map<string, { total: number; count: number }>();
    filteredData.forEach(row => {
      const current = insurerRatios.get(row.life_insurer) || { total: 0, count: 0 };
      insurerRatios.set(row.life_insurer, {
        total: current.total + (Number(row.claims_paid_ratio_no) || 0),
        count: current.count + 1,
      });
    });
    return Array.from(insurerRatios.entries())
      .map(([name, data]) => ({
        name: name.length > 12 ? name.substring(0, 12) + '...' : name,
        fullName: name,
        value: Math.round((data.total / data.count) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
  }, [filteredData]);

  const claimsDistributionData = useMemo(() => {
    if (filteredData.length === 0) return [];
    
    const totals = {
      paid: filteredData.reduce((sum, row) => sum + (Number(row.claims_paid_no) || 0), 0),
      rejected: filteredData.reduce((sum, row) => sum + (Number(row.claims_repudiated_no) || 0) + (Number(row.claims_rejected_no) || 0), 0),
      pending: filteredData.reduce((sum, row) => sum + (Number(row.claims_pending_end_no) || 0), 0),
    };
    
    const total = totals.paid + totals.rejected + totals.pending;
    
    return [
      { name: 'Settled', value: totals.paid, percentage: ((totals.paid / total) * 100).toFixed(1), color: COLORS.success },
      { name: 'Rejected', value: totals.rejected, percentage: ((totals.rejected / total) * 100).toFixed(1), color: COLORS.danger },
      { name: 'Pending', value: totals.pending, percentage: ((totals.pending / total) * 100).toFixed(1), color: COLORS.warning },
    ];
  }, [filteredData]);

  const tableData = useMemo(() => {
    const insurerStats = new Map<string, {
      paid: number;
      paidAmt: number;
      ratio: number;
      rejected: number;
      pending: number;
      count: number;
    }>();
    
    filteredData.forEach(row => {
      const current = insurerStats.get(row.life_insurer) || { paid: 0, paidAmt: 0, ratio: 0, rejected: 0, pending: 0, count: 0 };
      insurerStats.set(row.life_insurer, {
        paid: current.paid + (Number(row.claims_paid_no) || 0),
        paidAmt: current.paidAmt + (Number(row.claims_paid_amt) || 0),
        ratio: current.ratio + (Number(row.claims_paid_ratio_no) || 0),
        rejected: current.rejected + (Number(row.claims_repudiated_no) || 0) + (Number(row.claims_rejected_no) || 0),
        pending: current.pending + (Number(row.claims_pending_end_no) || 0),
        count: current.count + 1,
      });
    });
    
    return Array.from(insurerStats.entries())
      .map(([name, stats]) => ({
        name,
        claimsPaid: stats.paid,
        amountPaid: stats.paidAmt,
        settlementRatio: (stats.ratio / stats.count) * 100,
        rejected: stats.rejected,
        pending: stats.pending,
      }))
      .sort((a, b) => b.amountPaid - a.amountPaid);
  }, [filteredData]);

  const formatCurrency = (value: number) => {
    if (value >= 10000) return `₹${(value / 100).toFixed(0)}K Cr`;
    if (value >= 100) return `₹${value.toFixed(0)} Cr`;
    return `₹${value.toFixed(2)} Cr`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2F1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0078D4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2F1]">
      {/* Header Bar - Power BI Style */}
      <header className="bg-[#1B1B1B] text-white px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <span className="font-semibold text-lg">Insurance Claims Analytics</span>
          </div>
          <div className="h-6 w-px bg-gray-600"></div>
          <span className="text-gray-300 text-sm">India Life Insurance | IRDAI Data</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-white/10 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-white/10 rounded transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Sub Header with Tabs */}
      <div className="bg-white border-b border-gray-300 px-4 flex items-center justify-between">
        <div className="flex">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview' 
                ? 'border-[#0078D4] text-[#0078D4]' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details' 
                ? 'border-[#0078D4] text-[#0078D4]' 
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Detailed Analysis
          </button>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${
            showFilters ? 'bg-[#0078D4] text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="flex">
        {/* Filter Panel - Power BI Style Slicer */}
        {showFilters && (
          <aside className="w-64 bg-white border-r border-gray-200 p-4 min-h-[calc(100vh-88px)]">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Filters</h3>
            
            {/* Year Filter */}
            <div className="mb-6">
              <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Financial Year
              </label>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Insurer Filter */}
            <div className="mb-6">
              <label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                Insurance Company
              </label>
              <select 
                value={selectedInsurer}
                onChange={(e) => setSelectedInsurer(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent"
              >
                {insurers.map(insurer => (
                  <option key={insurer} value={insurer}>{insurer}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <button 
              onClick={() => { setSelectedYear('All Years'); setSelectedInsurer('All Insurers'); }}
              className="w-full text-sm text-[#0078D4] hover:underline py-2"
            >
              Clear All Filters
            </button>

            {/* Data Summary */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Data Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Records:</span>
                  <span className="font-medium">{filteredData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Insurers:</span>
                  <span className="font-medium">{metrics?.uniqueInsurers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Years:</span>
                  <span className="font-medium">{new Set(filteredData.map(r => r.year)).size}</span>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 ${showFilters ? '' : ''}`}>
          {activeTab === 'overview' ? (
            <>
              {/* KPI Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Amount Paid */}
                <div className="bg-white rounded shadow-sm border-l-4 border-[#0078D4] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Total Amount Paid</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {metrics ? formatCurrency(metrics.totalClaimsPaid) : '—'}
                      </p>
                      {metrics && metrics.yoyChange !== 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {metrics.yoyChange > 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                          <span className={`text-xs font-medium ${metrics.yoyChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(metrics.yoyChange).toFixed(1)}% vs last year
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="w-10 h-10 bg-[#0078D4]/10 rounded flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#0078D4]" />
                    </div>
                  </div>
                </div>

                {/* Claims Settled */}
                <div className="bg-white rounded shadow-sm border-l-4 border-[#107C10] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Claims Settled</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {metrics ? formatNumber(metrics.totalClaimsNo) : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Total claims processed</p>
                    </div>
                    <div className="w-10 h-10 bg-[#107C10]/10 rounded flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-[#107C10]" />
                    </div>
                  </div>
                </div>

                {/* Settlement Ratio */}
                <div className="bg-white rounded shadow-sm border-l-4 border-[#8764B8] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Avg Settlement Ratio</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {metrics ? `${metrics.avgSettlementRatio.toFixed(1)}%` : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Industry benchmark: 95%</p>
                    </div>
                    <div className="w-10 h-10 bg-[#8764B8]/10 rounded flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#8764B8]" />
                    </div>
                  </div>
                </div>

                {/* Active Insurers */}
                <div className="bg-white rounded shadow-sm border-l-4 border-[#CA5010] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium tracking-wide">Active Insurers</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {metrics ? metrics.uniqueInsurers : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Life insurance companies</p>
                    </div>
                    <div className="w-10 h-10 bg-[#CA5010]/10 rounded flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#CA5010]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded shadow-sm p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Settled</p>
                    <p className="text-xl font-bold text-green-600">{metrics ? formatNumber(metrics.totalClaimsNo) : '—'}</p>
                  </div>
                </div>
                <div className="bg-white rounded shadow-sm p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Rejected</p>
                    <p className="text-xl font-bold text-red-600">{metrics ? formatNumber(metrics.totalRejected) : '—'}</p>
                  </div>
                </div>
                <div className="bg-white rounded shadow-sm p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Pending</p>
                    <p className="text-xl font-bold text-amber-600">{metrics ? formatNumber(metrics.totalPending) : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Insurers */}
                <div className="bg-white rounded shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#0078D4]" />
                    Top 10 Insurers by Claims Paid
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={topInsurersData} layout="vertical" margin={{ left: 5, right: 25, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: 10, fill: '#6B7280' }} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={90} 
                        tick={{ fontSize: 10, fill: '#374151' }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        formatter={(value) => [`₹${Number(value).toLocaleString()} Cr`, 'Claims Paid']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {topInsurersData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Yearly Trend */}
                <div className="bg-white rounded shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#107C10]" />
                    Claims Trend Over Years
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={yearlyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0078D4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0078D4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorIntimated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#107C10" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#107C10" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
                      <Tooltip 
                        formatter={(value, name) => [`₹${Number(value).toLocaleString()} Cr`, name]}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="Claims Paid" stroke="#0078D4" strokeWidth={2} fillOpacity={1} fill="url(#colorPaid)" />
                      <Area type="monotone" dataKey="Claims Intimated" stroke="#107C10" strokeWidth={2} fillOpacity={1} fill="url(#colorIntimated)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Settlement Ratio Bar */}
                <div className="bg-white rounded shadow-sm p-4 lg:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#8764B8]" />
                    Settlement Ratio by Insurer
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={settlementRatioData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9, fill: '#6B7280' }} 
                        axisLine={false} 
                        tickLine={false} 
                        angle={-45} 
                        textAnchor="end" 
                        height={50} 
                      />
                      <YAxis 
                        domain={[85, 100]} 
                        tick={{ fontSize: 10, fill: '#6B7280' }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => `${value}%`} 
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Settlement Ratio']}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
                        {settlementRatioData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.value >= 98 ? COLORS.success : entry.value >= 95 ? COLORS.primary : COLORS.warning} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="bg-white rounded shadow-sm p-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-[#CA5010]" />
                    Claims Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={claimsDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {claimsDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2 mt-2">
                    {claimsDistributionData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Table className="w-4 h-4 text-gray-500" />
                    Insurer Performance Details
                  </h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">{tableData.length} insurers</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Insurer</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Claims Paid</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount (₹ Cr)</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Settlement %</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rejected</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Pending</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tableData.slice(0, 12).map((row) => (
                        <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(row.claimsPaid)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">₹{row.amountPaid.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              row.settlementRatio >= 98 ? 'bg-green-100 text-green-700' : 
                              row.settlementRatio >= 95 ? 'bg-blue-100 text-blue-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {row.settlementRatio.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(row.rejected)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(row.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Detailed Analysis Tab */
            <div className="space-y-6">
              <div className="bg-white rounded shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Year-over-Year Comparison</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={yearlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(value) => `₹${(value/1000).toFixed(0)}K`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(value) => `${value}%`} domain={[90, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '4px' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="Claims Paid" stroke="#0078D4" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="left" type="monotone" dataKey="Claims Intimated" stroke="#107C10" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="Settlement Ratio" stroke="#8764B8" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Full Table */}
              <div className="bg-white rounded shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-800">Complete Insurer Data</h3>
                </div>
                <div className="overflow-x-auto" style={{ maxHeight: '500px' }}>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Insurer</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Claims Paid</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount (₹ Cr)</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Settlement %</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Rejected</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Pending</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tableData.map((row) => (
                        <tr key={row.name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(row.claimsPaid)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">₹{row.amountPaid.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              row.settlementRatio >= 98 ? 'bg-green-100 text-green-700' : 
                              row.settlementRatio >= 95 ? 'bg-blue-100 text-blue-700' : 
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {row.settlementRatio.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(row.rejected)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(row.pending)}</td>
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
          <span>Data Source: IRDAI Annual Reports | Individual Death Claims</span>
          <span>Last Updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </footer>
    </div>
  );
}
