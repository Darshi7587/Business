'use client';
// InsightGPT Enterprise - Metric Card Component
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  color?: 'indigo' | 'green' | 'red' | 'yellow' | 'purple' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    icon: 'text-indigo-400',
    gradient: 'from-indigo-500 to-purple-600',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    icon: 'text-green-400',
    gradient: 'from-green-500 to-emerald-600',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    icon: 'text-red-400',
    gradient: 'from-red-500 to-rose-600',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    icon: 'text-yellow-400',
    gradient: 'from-yellow-500 to-orange-600',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-600',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    icon: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-600',
  },
};

export default function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = 'indigo',
  size = 'md',
}: MetricCardProps) {
  const colors = colorClasses[color];
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      if (val < 1 && val > 0) return `${(val * 100).toFixed(1)}%`;
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`${colors.bg} ${colors.border} border rounded-xl p-${size === 'sm' ? '4' : size === 'lg' ? '8' : '6'} transition-all hover:shadow-lg hover:shadow-${color}-500/10`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 font-medium mb-2">{title}</p>
          <p className={`${size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-2xl' : 'text-3xl'} font-bold text-white`}>
            {formatValue(value)}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : change < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm ${
                change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {change > 0 ? '+' : ''}{(change * 100).toFixed(1)}%
                {changeLabel && <span className="text-gray-500 ml-1">{changeLabel}</span>}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
