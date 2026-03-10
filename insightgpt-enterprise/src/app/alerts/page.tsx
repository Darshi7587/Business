'use client';
// Scheduled Alerts — Set threshold rules and monitor data conditions
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Plus, Trash2, CheckCircle, AlertTriangle,
  XCircle, TrendingUp, TrendingDown, Filter,
} from 'lucide-react';
import { Sidebar, Header, LoadingState } from '@/components';
import { useAppStore } from '@/store';

interface AlertRule {
  id: string;
  column: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  label: string;
  active: boolean;
}

interface TriggeredAlert {
  ruleId: string;
  label: string;
  column: string;
  operator: string;
  threshold: number;
  matchCount: number;
  percentage: number;
  sampleValues: number[];
}

const OPERATORS: { value: AlertRule['operator']; label: string }[] = [
  { value: '>', label: 'greater than' },
  { value: '<', label: 'less than' },
  { value: '>=', label: 'greater or equal' },
  { value: '<=', label: 'less or equal' },
  { value: '==', label: 'equal to' },
  { value: '!=', label: 'not equal to' },
];

const STORAGE_KEY = 'insightgpt-alert-rules';

function loadRules(): AlertRule[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveRules(rules: AlertRule[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export default function AlertsPage() {
  const { dataset, customDataset, setDataset, setDatasetAnalysis } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formCol, setFormCol] = useState('');
  const [formOp, setFormOp] = useState<AlertRule['operator']>('>');
  const [formThreshold, setFormThreshold] = useState('');
  const [formLabel, setFormLabel] = useState('');

  useEffect(() => { setRules(loadRules()); }, []);

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

  const numericCols = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(col => {
      const s = data.slice(0, 20).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
      return s.length > 0 && s.every(v => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)) && String(v).trim() !== ''));
    });
  }, [data]);

  useEffect(() => {
    if (numericCols.length > 0 && !formCol) setFormCol(numericCols[0]);
  }, [numericCols, formCol]);

  const evaluate = useCallback((value: number, op: AlertRule['operator'], threshold: number): boolean => {
    switch (op) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
    }
  }, []);

  const triggered = useMemo<TriggeredAlert[]>(() => {
    if (data.length === 0) return [];
    return rules.filter(r => r.active).map(rule => {
      const values = data.map(r => Number(r[rule.column])).filter(v => !isNaN(v));
      const matches = values.filter(v => evaluate(v, rule.operator, rule.threshold));
      return {
        ruleId: rule.id,
        label: rule.label,
        column: rule.column,
        operator: rule.operator,
        threshold: rule.threshold,
        matchCount: matches.length,
        percentage: values.length > 0 ? Math.round((matches.length / values.length) * 10000) / 100 : 0,
        sampleValues: matches.slice(0, 5),
      };
    }).filter(t => t.matchCount > 0);
  }, [rules, data, evaluate]);

  const addRule = () => {
    if (!formCol || !formThreshold) return;
    const newRule: AlertRule = {
      id: Date.now().toString(),
      column: formCol,
      operator: formOp,
      threshold: Number(formThreshold),
      label: formLabel || `${formCol} ${formOp} ${formThreshold}`,
      active: true,
    };
    const updated = [...rules, newRule];
    setRules(updated);
    saveRules(updated);
    setFormThreshold('');
    setFormLabel('');
    setShowForm(false);
  };

  const deleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    saveRules(updated);
  };

  const toggleRule = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setRules(updated);
    saveRules(updated);
  };

  if (loading) return <div className="min-h-screen flex"><Sidebar /><div className="flex-1"><LoadingState type="full" message="Loading data..." /></div></div>;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Smart Alerts" subtitle="Threshold-based data monitoring" />
        <main className="flex-1 p-6 overflow-auto">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Active Rules', value: rules.filter(r => r.active).length, icon: Filter, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Triggered Alerts', value: triggered.length, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'All Clear', value: rules.filter(r => r.active).length - triggered.length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-bright rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className="text-xl font-bold text-white">{Math.max(0, Number(card.value))}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Triggered Alerts */}
          {triggered.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-bright rounded-xl p-5 mb-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400 animate-bounce" /> Triggered Alerts
              </h3>
              <div className="space-y-3">
                {triggered.map(t => (
                  <div key={t.ruleId} className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{t.label}</p>
                      <p className="text-xs text-gray-400">
                        {t.matchCount.toLocaleString()} rows match ({t.percentage}%) — {t.column.replace(/_/g, ' ')} {t.operator} {t.threshold.toLocaleString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
                      {t.matchCount} hits
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rules List + Add Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-bright rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Alert Rules</h3>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm hover:bg-indigo-500/30 transition-colors">
                  <Plus className="w-4 h-4" /> Add Rule
                </motion.button>
              </div>

              <AnimatePresence>
                {showForm && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-4 glass rounded-xl space-y-3 overflow-hidden">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <select value={formCol} onChange={e => setFormCol(e.target.value)} className="px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                        {numericCols.map(c => <option key={c} value={c} className="bg-gray-900">{c.replace(/_/g, ' ')}</option>)}
                      </select>
                      <select value={formOp} onChange={e => setFormOp(e.target.value as AlertRule['operator'])} className="px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                        {OPERATORS.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
                      </select>
                      <input type="number" value={formThreshold} onChange={e => setFormThreshold(e.target.value)} placeholder="Threshold" className="px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-500" />
                      <input type="text" value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="Label (optional)" className="px-3 py-2 glass rounded-lg text-white bg-transparent border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-500" />
                    </div>
                    <div className="flex justify-end">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={addRule} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white text-sm font-medium">
                        Create Alert
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {rules.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                  <p className="text-white font-medium">No alert rules yet</p>
                  <p className="text-sm">Click &quot;Add Rule&quot; to create threshold-based alerts</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rules.map(rule => {
                    const isTriggered = triggered.some(t => t.ruleId === rule.id);
                    return (
                      <div key={rule.id} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isTriggered ? 'bg-amber-500/5 border border-amber-500/10' : 'glass'}`}>
                        <button onClick={() => toggleRule(rule.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rule.active ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'}`}>
                          {rule.active && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${rule.active ? 'text-white' : 'text-gray-500 line-through'}`}>{rule.label}</p>
                          <p className="text-[11px] text-gray-500">{rule.column.replace(/_/g, ' ')} {rule.operator} {rule.threshold.toLocaleString()}</p>
                        </div>
                        {isTriggered && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-medium">TRIGGERED</span>}
                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="glass-bright rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Column Stats</h3>
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
                {numericCols.map(col => {
                  const vals = data.map(r => Number(r[col])).filter(v => !isNaN(v));
                  if (vals.length === 0) return null;
                  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
                  const max = Math.max(...vals);
                  const min = Math.min(...vals);
                  return (
                    <div key={col} className="p-3 glass rounded-lg">
                      <p className="text-xs font-medium text-white mb-1">{col.replace(/_/g, ' ')}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>Min: {min.toLocaleString()}</span>
                        <span>Avg: {mean.toFixed(1)}</span>
                        <span>Max: {max.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
