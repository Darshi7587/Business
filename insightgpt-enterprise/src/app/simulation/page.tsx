'use client';
// Scenario Simulation Engine - What-If Analysis
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Settings,
  TrendingUp,
  TrendingDown,
  Sliders,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Sidebar, Header, ChartRenderer, LoadingState } from '@/components';
import { useAppStore } from '@/store';
import type { SimulationScenario } from '@/types';

interface SimulationParameter {
  id: string;
  label: string;
  description: string;
  type: 'percentage' | 'number' | 'currency';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  currentValue: number;
  unit?: string;
}

export default function SimulationPage() {
  const { dataset, setDataset, setDatasetAnalysis, activeSimulation, setActiveSimulation } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const [parameters, setParameters] = useState<SimulationParameter[]>([
    {
      id: 'settlement_ratio',
      label: 'Claim Settlement Ratio',
      description: 'Adjust the target settlement ratio across all insurers',
      type: 'percentage',
      min: 80,
      max: 100,
      step: 1,
      defaultValue: 95,
      currentValue: 95,
      unit: '%',
    },
    {
      id: 'claims_growth',
      label: 'Claims Growth Rate',
      description: 'Year-over-year growth in number of claims',
      type: 'percentage',
      min: -20,
      max: 50,
      step: 5,
      defaultValue: 10,
      currentValue: 10,
      unit: '%',
    },
    {
      id: 'avg_benefit',
      label: 'Average Benefit Amount',
      description: 'Adjust the average benefit paid per claim',
      type: 'currency',
      min: 1,
      max: 50,
      step: 1,
      defaultValue: 15,
      currentValue: 15,
      unit: 'Lakh',
    },
    {
      id: 'processing_time',
      label: 'Processing Time Reduction',
      description: 'Reduce claim processing time by percentage',
      type: 'percentage',
      min: 0,
      max: 50,
      step: 5,
      defaultValue: 0,
      currentValue: 0,
      unit: '%',
    },
  ]);

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
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const updateParameter = (id: string, value: number) => {
    setParameters(prev => prev.map(p => 
      p.id === id ? { ...p, currentValue: value } : p
    ));
  };

  const resetParameters = () => {
    setParameters(prev => prev.map(p => ({ ...p, currentValue: p.defaultValue })));
    setResults(null);
  };

  const runSimulation = async () => {
    setIsRunning(true);
    
    try {
      // Build scenario from parameters
      const scenario: SimulationScenario = {
        id: `sim-${Date.now()}`,
        name: 'Custom Scenario',
        description: 'User-defined what-if scenario',
        parameters: parameters.reduce((acc, p) => ({
          ...acc,
          [p.id]: p.currentValue,
        }), {}),
        createdAt: new Date().toISOString(),
      };

      // Call simulation API
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulate',
          scenario,
          datasetSize: dataset?.length || 0,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setActiveSimulation(scenario);
        setResults(result.results);
      }
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Calculate projected impacts based on parameters
  const calculateProjections = () => {
    if (!dataset) return null;
    
    const baseMetrics = {
      totalBenefits: dataset.reduce((sum, row) => sum + (Number(row['claims_paid_amt']) || 0), 0),
      totalClaims: dataset.reduce((sum, row) => sum + (Number(row['claims_paid_no']) || 0), 0),
      avgSettlement: dataset.reduce((sum, row) => sum + (Number(row['claims_paid_ratio_no']) || 0), 0) / dataset.length,
    };

    const settlementChange = (parameters[0].currentValue - 95) / 100;
    const claimsGrowth = parameters[1].currentValue / 100;
    const benefitMultiplier = parameters[2].currentValue / 15;
    const processingReduction = parameters[3].currentValue / 100;

    const projectedBenefits = baseMetrics.totalBenefits * (1 + claimsGrowth) * benefitMultiplier;
    const projectedClaims = Math.round(baseMetrics.totalClaims * (1 + claimsGrowth));
    const projectedSettlement = Math.min(100, baseMetrics.avgSettlement + settlementChange * 100);

    return {
      base: baseMetrics,
      projected: {
        totalBenefits: projectedBenefits,
        totalClaims: projectedClaims,
        avgSettlement: projectedSettlement,
      },
      changes: {
        benefits: ((projectedBenefits - baseMetrics.totalBenefits) / baseMetrics.totalBenefits) * 100,
        claims: ((projectedClaims - baseMetrics.totalClaims) / baseMetrics.totalClaims) * 100,
        settlement: projectedSettlement - baseMetrics.avgSettlement,
      },
    };
  };

  const projections = calculateProjections();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050816] flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState type="full" message="Loading simulation engine..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Scenario Simulation" subtitle="What-if analysis engine" />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-white">Scenario Simulation</h1>
              <p className="text-gray-400 mt-1">What-if analysis and impact forecasting</p>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetParameters}
                className="flex items-center gap-2 px-5 py-2.5 glass rounded-xl text-gray-300 hover:text-white transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={runSimulation}
                disabled={isRunning}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 rounded-xl font-semibold text-white transition-all shadow-lg shadow-indigo-500/25"
              >
                {isRunning ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Settings className="w-4 h-4" />
                    </motion.div>
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Simulation
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parameter Controls */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-bright rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-white">Scenario Parameters</h3>
                </div>
                
                <div className="space-y-8">
                  {parameters.map((param) => (
                    <div key={param.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-white">{param.label}</label>
                        <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-mono">
                          {param.currentValue}{param.unit}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-4">{param.description}</p>
                      <div className="relative">
                        <input
                          type="range"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={param.currentValue}
                          onChange={(e) => updateParameter(param.id, parseFloat(e.target.value))}
                          className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{param.min}{param.unit}</span>
                        <span>{param.max}{param.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Scenarios */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-bright rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-white">Quick Scenarios</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Conservative', desc: 'Low growth, stable operations', values: { settlement_ratio: 95, claims_growth: 5, avg_benefit: 12, processing_time: 10 } },
                    { name: 'Aggressive Growth', desc: 'High claims, increased benefits', values: { settlement_ratio: 98, claims_growth: 25, avg_benefit: 20, processing_time: 0 } },
                    { name: 'Efficiency Focus', desc: 'Improved processing, optimized costs', values: { settlement_ratio: 97, claims_growth: 10, avg_benefit: 14, processing_time: 30 } },
                  ].map((scenario, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02, x: 4 }}
                      onClick={() => {
                        setParameters(prev => prev.map(p => ({
                          ...p,
                          currentValue: scenario.values[p.id as keyof typeof scenario.values] ?? p.defaultValue,
                        })));
                      }}
                      className="w-full p-4 glass rounded-xl text-left transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white">{scenario.name}</span>
                        <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{scenario.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Impact Preview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Projected Metrics */}
              {projections && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: 'Total Benefits',
                      base: `₹${(projections.base.totalBenefits / 100000).toFixed(1)}K Cr`,
                      projected: `₹${(projections.projected.totalBenefits / 100000).toFixed(1)}K Cr`,
                      change: projections.changes.benefits,
                      gradient: 'from-indigo-500/20 to-purple-500/20',
                      iconColor: 'text-indigo-400',
                    },
                    {
                      label: 'Total Claims',
                      base: projections.base.totalClaims.toLocaleString(),
                      projected: projections.projected.totalClaims.toLocaleString(),
                      change: projections.changes.claims,
                      gradient: 'from-emerald-500/20 to-teal-500/20',
                      iconColor: 'text-emerald-400',
                    },
                    {
                      label: 'Settlement Ratio',
                      base: `${projections.base.avgSettlement.toFixed(1)}%`,
                      projected: `${projections.projected.avgSettlement.toFixed(1)}%`,
                      change: projections.changes.settlement,
                      gradient: 'from-amber-500/20 to-orange-500/20',
                      iconColor: 'text-amber-400',
                    },
                  ].map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className="glass-bright rounded-2xl p-6"
                    >
                      <p className="text-sm text-gray-400 mb-3">{metric.label}</p>
                      <div className="flex items-end gap-3 mb-3">
                        <p className="text-2xl font-bold text-white">{metric.projected}</p>
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                          metric.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {metric.change >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(metric.change).toFixed(1)}%
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 glass rounded-lg px-3 py-1 inline-block">Base: {metric.base}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Comparison Chart */}
              {projections && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-bright rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-6">Scenario Comparison</h3>
                  <ChartRenderer
                    config={{
                      type: 'bar',
                      data: [
                        { name: 'Benefits (Cr)', baseline: projections.base.totalBenefits / 100, projected: projections.projected.totalBenefits / 100 },
                        { name: 'Claims (K)', baseline: projections.base.totalClaims / 1000, projected: projections.projected.totalClaims / 1000 },
                        { name: 'Settlement %', baseline: projections.base.avgSettlement, projected: projections.projected.avgSettlement },
                      ],
                      xKey: 'name',
                      yKey: 'baseline',
                      title: '',
                      height: 300,
                      showComparison: true,
                    }}
                  />
                </motion.div>
              )}

              {/* AI Analysis */}
              {results && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-bright rounded-2xl p-6 border-l-4 border-indigo-500"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">AI Analysis</h3>
                  </div>
                  <div className="space-y-5">
                    <p className="text-gray-300 leading-relaxed">{results.summary || 'Running simulation analysis...'}</p>
                    
                    {results.recommendations && results.recommendations.length > 0 && (
                      <div className="glass rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Recommendations
                        </p>
                        {results.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 pl-6">
                            <span className="text-gray-300 text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {results.risks && results.risks.length > 0 && (
                      <div className="glass rounded-xl p-4 space-y-3">
                        <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Risk Factors
                        </p>
                        {results.risks.map((risk: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 pl-6">
                            <span className="text-gray-300 text-sm">{risk}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Run Prompt */}
              {!results && !isRunning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-bright rounded-2xl p-16 text-center"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Ready to Simulate</h3>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Adjust the parameters on the left, then click "Run Simulation" to see AI-powered projections and recommendations.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={runSimulation}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-semibold text-white transition-all shadow-lg shadow-indigo-500/25"
                  >
                    <Play className="w-5 h-5" />
                    Run Simulation
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
