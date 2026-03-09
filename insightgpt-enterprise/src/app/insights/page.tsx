'use client';
// AI Insights Center
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Target,
  BarChart2,
  RefreshCw,
  ChevronRight,
  Clock,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { Sidebar, Header, ChartRenderer, LoadingState } from '@/components';
import { useAppStore } from '@/store';
import type { AIInsight } from '@/types';

export default function InsightsPage() {
  const { dataset, datasetAnalysis, setDataset, setDatasetAnalysis, insights, setInsights } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [narrative, setNarrative] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!dataset || dataset.length === 0) {
          const response = await fetch('/api/data');
          const result = await response.json();
          
          if (result.success) {
            setDataset(result.data);
            setDatasetAnalysis(result.analysis);
          }
        }
        
        if (insights.length === 0) {
          await generateInsights();
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generateInsights',
          data: dataset 
        }),
      });
      
      const result = await response.json();
      if (result.insights && result.insights.length > 0) {
        setInsights(result.insights);
      }

      // Also generate narrative
      const narrativeResponse = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateNarrative',
          data: dataset,
          chartType: 'summary',
          chartTitle: 'Executive Summary',
        }),
      });

      const narrativeResult = await narrativeResponse.json();
      if (narrativeResult.narrative) {
        setNarrative(narrativeResult.narrative);
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400' };
      case 'medium': return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' };
      case 'low': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' };
      default: return { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-400' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'anomaly': return AlertCircle;
      case 'opportunity': return Lightbulb;
      case 'risk': return Target;
      default: return Sparkles;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050816] flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState type="full" message="Loading insights..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="AI Insights Center" subtitle="AI-powered analysis and recommendations" />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-white">AI Insights Center</h1>
              <p className="text-gray-500">AI-generated insights and recommendations</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateInsights}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 rounded-xl font-semibold text-white transition-all shadow-lg shadow-indigo-500/30"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </motion.button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Insights List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Insights', value: insights.length, icon: Sparkles, color: 'indigo' },
                  { label: 'High Priority', value: insights.filter(i => i.priority === 'high').length, icon: AlertCircle, color: 'red' },
                  { label: 'Opportunities', value: insights.filter(i => i.type === 'opportunity').length, icon: Lightbulb, color: 'emerald' },
                  { label: 'Trends', value: insights.filter(i => i.type === 'trend').length, icon: TrendingUp, color: 'purple' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass-bright rounded-2xl p-5"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Insights Cards */}
              {isGenerating ? (
                <div className="glass-bright rounded-2xl p-16">
                  <LoadingState type="inline" message="AI is analyzing your data..." />
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight, index) => {
                    const colors = getPriorityColor(insight.priority || 'medium');
                    const Icon = getTypeIcon(insight.type);
                    
                    return (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setSelectedInsight(insight)}
                        className={`glass-bright rounded-2xl p-6 cursor-pointer border-l-4 ${colors.border.replace('/20', '')} hover:border-l-indigo-500 transition-all`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <h3 className="font-semibold text-white">{insight.title}</h3>
                              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {insight.priority}
                              </span>
                              <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-400 capitalize">
                                {insight.type}
                              </span>
                            </div>
                            <p className="text-gray-400 mb-4">{insight.description}</p>
                            
                            {insight.metrics && insight.metrics.length > 0 && (
                              <div className="flex flex-wrap gap-3">
                                {insight.metrics.map((metric, i) => (
                                  <div key={i} className="glass rounded-xl px-4 py-2">
                                    <p className="text-xs text-gray-500">{metric.label}</p>
                                    <p className="font-semibold text-white">{metric.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {insight.recommendation && (
                              <div className="mt-4 flex items-center gap-2 text-sm text-indigo-400">
                                <Zap className="w-4 h-4" />
                                <span>{insight.recommendation}</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {insights.length === 0 && !isGenerating && (
                    <div className="glass-bright rounded-2xl p-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No insights yet</h3>
                      <p className="text-gray-500 mb-6">Click the button above to generate AI insights</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div className="space-y-6">
              {/* AI Narrative */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-bright rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-white">AI Executive Summary</h3>
                </div>
                {narrative ? (
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                    {narrative}
                  </p>
                ) : (
                  <div className="flex items-center gap-3 text-gray-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading AI-generated summary...</span>
                  </div>
                )}
              </motion.div>

              {/* Selected Insight Detail */}
              {selectedInsight && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="font-semibold text-white">Insight Details</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Title</p>
                      <p className="text-white font-medium">{selectedInsight.title}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Category</p>
                      <p className="text-white capitalize font-medium">{selectedInsight.category}</p>
                    </div>
                    <div className="glass rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Confidence</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedInsight.confidence * 100}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          />
                        </div>
                        <span className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                          {(selectedInsight.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {selectedInsight.suggestedAction && (
                      <div className="glass rounded-xl p-4 border-l-4 border-indigo-500">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Suggested Action</p>
                        <p className="text-white font-medium">{selectedInsight.suggestedAction}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-bright rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-white">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Run Simulation', href: '/simulation', icon: '🎯' },
                    { label: 'Ask AI Copilot', href: '/query', icon: '🤖' },
                    { label: 'View Dashboard', href: '/dashboard', icon: '📊' },
                    { label: 'Explore Data', href: '/explorer', icon: '🔍' },
                  ].map((action, index) => (
                    <motion.a
                      key={index}
                      href={action.href}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-center justify-between p-4 glass rounded-xl transition-all group hover:border-indigo-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{action.icon}</span>
                        <span className="text-gray-300 group-hover:text-white font-medium">{action.label}</span>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
