'use client';
// InsightGPT Enterprise - Executive Dashboard
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Shield,
  Sparkles,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Target,
  Clock,
  MessageSquareText,
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar, Header, ChartRenderer, AIChat, LoadingState } from '@/components';
import { useAppStore } from '@/store';
import type { InsuranceClaim } from '@/types';

export default function DashboardPage() {
  const { 
    dataset, 
    datasetAnalysis, 
    setDataset, 
    setDatasetAnalysis,
    insights,
    setInsights,
  } = useAppStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<Record<string, string | number> | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/data');
        const result = await response.json();
        
        if (result.success) {
          setDataset(result.data);
          setDatasetAnalysis(result.analysis);
          calculateMetrics(result.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!dataset || dataset.length === 0) {
      loadData();
    } else {
      calculateMetrics(dataset);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate AI insights
  useEffect(() => {
    const generateInsights = async () => {
      if (!datasetAnalysis || insights.length > 0) return;
      
      try {
        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'analyze',
            analysis: datasetAnalysis 
          }),
        });
        
        const result = await response.json();
        if (result.success && result.insights) {
          setInsights(result.insights);
        }
      } catch (error) {
        console.error('Failed to generate insights:', error);
      }
    };

    generateInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetAnalysis]);

  const calculateMetrics = (data: InsuranceClaim[]) => {
    if (!data || data.length === 0) return;
    
    const totalClaimsPaid = data.reduce((sum, row) => sum + (Number(row['claims_paid_amt']) || 0), 0);
    const totalDeathClaims = data.reduce((sum, row) => sum + (Number(row['claims_paid_no']) || 0), 0);
    const avgSettlementRatio = data.reduce((sum, row) => sum + (Number(row['claims_paid_ratio_no']) || 0), 0) / data.length;
    const uniqueInsurers = new Set(data.map(row => row['life_insurer'])).size;
    
    const latestYear = Math.max(...data.map(row => parseInt(String(row.year)?.split('-')[0] || '0')));
    const previousYear = latestYear - 1;
    
    const latestYearData = data.filter(row => String(row.year)?.includes(latestYear.toString()));
    const previousYearData = data.filter(row => String(row.year)?.includes(previousYear.toString()));
    
    const latestTotal = latestYearData.reduce((sum, row) => sum + (Number(row['claims_paid_amt']) || 0), 0);
    const previousTotal = previousYearData.reduce((sum, row) => sum + (Number(row['claims_paid_amt']) || 0), 0);
    
    const yoyChange = previousTotal > 0 ? ((latestTotal - previousTotal) / previousTotal) * 100 : 0;
    
    setMetrics({
      totalClaimsPaid: (totalClaimsPaid / 100).toFixed(1),
      totalDeathClaims: totalDeathClaims.toLocaleString(),
      avgSettlementRatio: avgSettlementRatio.toFixed(1),
      uniqueInsurers,
      yoyChange: yoyChange.toFixed(1),
    });
  };

  // Chart data generators
  const getTopInsurersData = () => {
    if (!dataset) return [];
    
    const insurerTotals = new Map<string, number>();
    dataset.forEach(row => {
      const insurer = String(row['life_insurer'] || 'Unknown');
      if (insurer.includes('Industry') || insurer.includes('PVT.')) return;
      const current = insurerTotals.get(insurer) || 0;
      insurerTotals.set(insurer, current + (Number(row['claims_paid_amt']) || 0));
    });
    
    return Array.from(insurerTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        value: Math.round(value / 100),
      }));
  };

  const getYearlyTrendData = () => {
    if (!dataset) return [];
    
    const yearlyTotals = new Map<string, { claims: number; settled: number }>();
    dataset.forEach(row => {
      if (String(row.life_insurer).includes('Industry')) return;
      const year = String(row.year || 'Unknown');
      const current = yearlyTotals.get(year) || { claims: 0, settled: 0 };
      yearlyTotals.set(year, {
        claims: current.claims + (Number(row['total_claims_no']) || 0),
        settled: current.settled + (Number(row['claims_paid_no']) || 0),
      });
    });
    
    return Array.from(yearlyTotals.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, data]) => ({
        name: year,
        claims: data.claims,
        settled: data.settled,
      }));
  };

  const getSettlementRatioData = () => {
    if (!dataset) return [];
    
    const insurerRatios = new Map<string, number[]>();
    dataset.forEach(row => {
      const insurer = String(row['life_insurer'] || 'Unknown');
      if (insurer.includes('Industry') || insurer.includes('PVT.')) return;
      const ratio = Number(row['claims_paid_ratio_no']) || 0;
      if (!insurerRatios.has(insurer)) insurerRatios.set(insurer, []);
      insurerRatios.get(insurer)!.push(ratio * 100);
    });
    
    return Array.from(insurerRatios.entries())
      .map(([name, ratios]) => ({
        name: name.length > 12 ? name.substring(0, 12) + '...' : name,
        value: Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050816] flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState type="full" message="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Total Benefits Paid',
      value: metrics ? `₹${metrics.totalClaimsPaid}K Cr` : '—',
      change: metrics ? parseFloat(String(metrics.yoyChange)) : 0,
      icon: DollarSign,
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-500/10 to-purple-500/10',
    },
    {
      title: 'Total Claims Settled',
      value: metrics?.totalDeathClaims || '—',
      change: 8.2,
      icon: Users,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
    {
      title: 'Avg Settlement Ratio',
      value: metrics ? `${metrics.avgSettlementRatio}%` : '—',
      change: 2.1,
      icon: Shield,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/10 to-orange-500/10',
    },
    {
      title: 'Active Insurers',
      value: metrics?.uniqueInsurers.toString() || '—',
      change: 0,
      icon: Target,
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-500/10 to-rose-500/10',
    },
  ];

  const quickQueries = [
    { query: 'Compare LIC vs Private Insurers', icon: BarChart3 },
    { query: 'Show claim settlement trends', icon: TrendingUp },
    { query: 'Top performing insurers', icon: Target },
    { query: 'Settlement ratio analysis', icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-[#050816] flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Executive Dashboard" subtitle="India Life Insurance Claims Analysis" />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Quick Stats Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Live Data</span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 glass rounded-xl">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Last updated: Just now</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  showAIPanel 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30' 
                    : 'glass text-gray-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Insights
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-gray-300 hover:text-white transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </motion.button>
            </div>
          </motion.div>

          <div className="flex gap-6">
            {/* Main Content */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metricCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="metric-card group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-xl`} />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          {card.change !== 0 && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              card.change > 0 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {card.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(card.change)}%
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                        <p className="text-2xl font-bold text-white">{card.value}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Insurers Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Top Insurers by Benefits</h3>
                      <p className="text-sm text-gray-500">Claims paid amount (₹ Cr)</p>
                    </div>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <ChartRenderer
                    config={{
                      type: 'bar',
                      data: getTopInsurersData(),
                      xKey: 'name',
                      yKey: 'value',
                      title: '',
                      height: 280,
                      colors: ['#6366f1', '#8b5cf6', '#a855f7'],
                    }}
                  />
                </motion.div>

                {/* Settlement Ratio Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Settlement Ratio Ranking</h3>
                      <p className="text-sm text-gray-500">Average settlement ratio (%)</p>
                    </div>
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  <ChartRenderer
                    config={{
                      type: 'bar',
                      data: getSettlementRatioData(),
                      xKey: 'name',
                      yKey: 'value',
                      title: '',
                      height: 280,
                      colors: ['#10b981', '#34d399', '#6ee7b7'],
                    }}
                  />
                </motion.div>

                {/* Yearly Trend */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Claims vs Settlements</h3>
                      <p className="text-sm text-gray-500">Year-over-year comparison</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        <span className="text-xs text-gray-400">Claims</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs text-gray-400">Settled</span>
                      </div>
                    </div>
                  </div>
                  <ChartRenderer
                    config={{
                      type: 'area',
                      data: getYearlyTrendData(),
                      xKey: 'name',
                      yKey: ['claims', 'settled'],
                      title: '',
                      height: 280,
                      colors: ['#6366f1', '#10b981'],
                    }}
                  />
                </motion.div>

                {/* AI Recommendations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">AI Insights</h3>
                        <p className="text-sm text-gray-500">Auto-generated analysis</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {insights.slice(0, 3).map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                        className={`p-4 rounded-xl border ${
                          insight.priority === 'high' || insight.impact === 'high'
                            ? 'bg-red-500/10 border-red-500/20' 
                            : insight.priority === 'medium' || insight.impact === 'medium'
                            ? 'bg-amber-500/10 border-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            insight.priority === 'high' || insight.impact === 'high' ? 'bg-red-400' :
                            insight.priority === 'medium' || insight.impact === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white text-sm mb-1">{insight.title}</h4>
                            <p className="text-xs text-gray-400 line-clamp-2">{insight.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {insights.length === 0 && (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-500">Generating AI insights...</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Quick Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-bright rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Quick Analysis</h3>
                      <p className="text-sm text-gray-500">One-click insights</p>
                    </div>
                  </div>
                  <Link 
                    href="/query"
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Open AI Query
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickQueries.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          window.location.href = `/query?q=${encodeURIComponent(item.query)}`;
                        }}
                        className="p-4 glass rounded-xl text-left hover:border-indigo-500/30 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 transition-colors">
                          <Icon className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.query}</p>
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 mt-2 transition-colors" />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* AI Panel */}
            <AnimatePresence>
              {showAIPanel && (
                <motion.div
                  initial={{ opacity: 0, x: 50, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 400 }}
                  exit={{ opacity: 0, x: 50, width: 0 }}
                  className="flex-shrink-0"
                >
                  <div className="glass-bright rounded-2xl h-full overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                          <MessageSquareText className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">AI Assistant</span>
                      </div>
                      <button 
                        onClick={() => setShowAIPanel(false)}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <AIChat embedded />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
