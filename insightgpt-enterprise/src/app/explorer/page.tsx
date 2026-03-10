'use client';
// Smart Data Explorer - Dataset Analysis
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  BarChart2,
  Table2,
  Download,
  Columns,
  Hash,
  Type,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Sidebar, Header, DataTable, ChartRenderer, LoadingState } from '@/components';
import { useAppStore } from '@/store';
import type { InsuranceClaim } from '@/types';

interface ColumnStats {
  name: string;
  type: 'numeric' | 'categorical' | 'date' | 'text';
  missing: number;
  unique: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
  mode?: string | number;
  distribution?: { value: string; count: number }[];
}

export default function ExplorerPage() {
  const { dataset, datasetAnalysis, setDataset, setDatasetAnalysis } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'data'>('overview');
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (dataset && dataset.length > 0) {
        analyzeColumns(dataset);
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        
        if (result.success) {
          setDataset(result.data);
          setDatasetAnalysis(result.analysis);
          analyzeColumns(result.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  const analyzeColumns = (data: InsuranceClaim[]) => {
    if (!data || data.length === 0) return;
    
    const columns = Object.keys(data[0]);
    const stats: ColumnStats[] = columns.map(col => {
      const values = data.map(row => row[col as keyof InsuranceClaim]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      
      // Determine type
      const numericValues = nonNullValues.filter(v => typeof v === 'number' || !isNaN(Number(v)));
      const isNumeric = numericValues.length > nonNullValues.length * 0.8;
      
      // Calculate unique values
      const uniqueValues = new Set(nonNullValues);
      
      // Distribution for categorical
      const valueCounts = new Map<string, number>();
      nonNullValues.forEach(v => {
        const key = String(v);
        valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
      });
      
      const distribution = Array.from(valueCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      if (isNumeric) {
        const nums = numericValues.map(v => Number(v));
        const sorted = [...nums].sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        
        return {
          name: col,
          type: 'numeric',
          missing: values.length - nonNullValues.length,
          unique: uniqueValues.size,
          min: Math.min(...nums),
          max: Math.max(...nums),
          mean: sum / nums.length,
          median: sorted[Math.floor(sorted.length / 2)],
          distribution,
        };
      } else {
        return {
          name: col,
          type: col.toLowerCase().includes('year') || col.toLowerCase().includes('date') ? 'date' : 'categorical',
          missing: values.length - nonNullValues.length,
          unique: uniqueValues.size,
          mode: distribution[0]?.value,
          distribution,
        };
      }
    });
    
    setColumnStats(stats);
  };

  const getColumnIcon = (type: string) => {
    switch (type) {
      case 'numeric': return Hash;
      case 'categorical': return Type;
      case 'date': return Calendar;
      default: return Type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState type="full" message="Loading dataset..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Smart Data Explorer" subtitle="Analyze your dataset" />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-white">Smart Data Explorer</h1>
              <p className="text-gray-500">Analyze and understand your dataset</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2.5 glass rounded-xl text-gray-300 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </motion.button>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart2 },
              { id: 'columns', label: 'Columns', icon: Columns },
              { id: 'data', label: 'Data', icon: Table2 },
            ].map(tab => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'glass text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Dataset Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Database className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-gray-400 text-sm">Total Rows</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{dataset?.length.toLocaleString()}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <Columns className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-gray-400 text-sm">Total Columns</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{columnStats.length}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                      <Hash className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-gray-400 text-sm">Numeric Columns</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {columnStats.filter(c => c.type === 'numeric').length}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                      <Type className="w-5 h-5 text-pink-400" />
                    </div>
                    <span className="text-gray-400 text-sm">Categorical</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {columnStats.filter(c => c.type === 'categorical' || c.type === 'date').length}
                  </p>
                </motion.div>
              </div>

              {/* Column Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Column Types</h3>
                  <ChartRenderer
                    config={{
                      type: 'pie',
                      data: [
                        { name: 'Numeric', value: columnStats.filter(c => c.type === 'numeric').length },
                        { name: 'Categorical', value: columnStats.filter(c => c.type === 'categorical').length },
                        { name: 'Date', value: columnStats.filter(c => c.type === 'date').length },
                      ],
                      xKey: 'name',
                      yKey: 'value',
                      title: '',
                      height: 250,
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Missing Values</h3>
                  <ChartRenderer
                    config={{
                      type: 'bar',
                      data: columnStats
                        .filter(c => c.missing > 0)
                        .sort((a, b) => b.missing - a.missing)
                        .slice(0, 8)
                        .map(c => ({ name: c.name.substring(0, 15), value: c.missing })),
                      xKey: 'name',
                      yKey: 'value',
                      title: '',
                      height: 250,
                    }}
                  />
                </motion.div>
              </div>

              {/* Data Quality */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-bright rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Data Quality Score</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: 'Completeness', value: 92, color: 'emerald' },
                    { label: 'Validity', value: 98, color: 'indigo' },
                    { label: 'Consistency', value: 100, color: 'purple' },
                  ].map((metric, index) => (
                    <motion.div 
                      key={metric.label}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className={`w-32 h-32 mx-auto rounded-full border-8 border-${metric.color}-500/20 flex items-center justify-center mb-4 relative`}>
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke={`rgb(var(--${metric.color}-500))`}
                            strokeWidth="8"
                            strokeDasharray={`${metric.value * 3.27} 327`}
                            strokeLinecap="round"
                            className={`stroke-${metric.color}-500`}
                          />
                        </svg>
                        <span className="text-3xl font-bold text-white">{metric.value}%</span>
                      </div>
                      <p className="text-gray-400">{metric.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Columns Tab */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              {columnStats.map((col, index) => {
                const Icon = getColumnIcon(col.type);
                const isExpanded = expandedColumn === col.name;
                
                return (
                  <motion.div
                    key={col.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-bright rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedColumn(isExpanded ? null : col.name)}
                      className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          col.type === 'numeric' ? 'bg-indigo-500/20' :
                          col.type === 'date' ? 'bg-purple-500/20' : 'bg-cyan-500/20'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            col.type === 'numeric' ? 'text-indigo-400' :
                            col.type === 'date' ? 'text-purple-400' : 'text-cyan-400'
                          }`} />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-white">{col.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{col.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Unique</p>
                          <p className="font-semibold text-white">{col.unique}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Missing</p>
                          <p className={`font-semibold ${col.missing > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {col.missing}
                          </p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"
                        >
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </motion.div>
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="px-5 pb-5 border-t border-white/5"
                      >
                        <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Stats */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-4">Statistics</h4>
                            <div className="space-y-3">
                              {col.type === 'numeric' ? (
                                <>
                                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                                    <span className="text-gray-400">Min</span>
                                    <span className="text-white font-medium">{Number(col.min).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                                    <span className="text-gray-400">Max</span>
                                    <span className="text-white font-medium">{Number(col.max).toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                                    <span className="text-gray-400">Mean</span>
                                    <span className="text-white font-medium">{col.mean?.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                                    <span className="text-gray-400">Median</span>
                                    <span className="text-white font-medium">{col.median?.toLocaleString()}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                                    <span className="text-gray-400">Mode</span>
                                    <span className="text-white font-medium truncate max-w-[200px]">{col.mode}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 glass rounded-xl">
                                    <span className="text-gray-400">Unique Values</span>
                                    <span className="text-white font-medium">{col.unique}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Distribution */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-4">Top Values</h4>
                            <div className="space-y-3">
                              {col.distribution?.slice(0, 5).map((item, i) => (
                                <div key={i} className="p-3 glass rounded-xl">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="text-white font-medium truncate max-w-[180px]">{item.value}</span>
                                    <span className="text-indigo-400 font-medium">{item.count}</span>
                                  </div>
                                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(item.count / (col.distribution?.[0]?.count || 1)) * 100}%` }}
                                      transition={{ duration: 0.5, delay: i * 0.1 }}
                                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && dataset && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-bright rounded-2xl overflow-hidden"
            >
              <DataTable data={dataset} pageSize={20} />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
