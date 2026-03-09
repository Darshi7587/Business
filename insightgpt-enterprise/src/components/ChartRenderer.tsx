'use client';
// InsightGPT Enterprise - Dynamic Chart Renderer with Stunning Animations
import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ChartConfig } from '@/types';
import { TrendingUp, TrendingDown, Minus, Download, Maximize2, Share2 } from 'lucide-react';

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

interface ChartRendererProps {
  config: ChartConfig;
  height?: number;
  showLegend?: boolean;
  interactive?: boolean;
  onDataPointClick?: (data: Record<string, unknown>) => void;
}

export default function ChartRenderer({
  config,
  height = 350,
  showLegend = true,
  interactive = true,
  onDataPointClick,
}: ChartRendererProps) {
  const { type, data, title, description, xAxis, yAxis, xKey, yKey, colors = CHART_COLORS } = config;
  
  // Support both yAxis and yKey for backwards compatibility
  const yAxisValue = yAxis || yKey || 'value';
  const yAxes = Array.isArray(yAxisValue) ? yAxisValue : [yAxisValue].filter(Boolean);
  const xAxisKey = xAxis || xKey || 'name';
  
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0a0f1e]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl shadow-black/20"
        >
          <p className="font-semibold text-white mb-2 text-sm">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full shadow-lg"
                  style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}40` }}
                />
                <span className="text-gray-400">{entry.name}:</span>
                <span className="font-medium text-white">
                  {typeof entry.value === 'number' 
                    ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                    : entry.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const handleClick = (data: Record<string, unknown>) => {
    if (interactive && onDataPointClick) {
      onDataPointClick(data);
    }
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <BarChart data={data} onClick={(e: any) => e?.activePayload && handleClick(e.activePayload[0].payload)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
                tickLine={{ stroke: '#4b5563' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
                tickLine={{ stroke: '#4b5563' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toFixed(value < 1 ? 2 : 0);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend wrapperStyle={{ paddingTop: 20 }} />}
              {yAxes.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                  cursor={interactive ? 'pointer' : 'default'}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toFixed(value < 1 ? 2 : 0);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {yAxes.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                outerRadius={120}
                fill="#8884d8"
                dataKey={yAxes[0] || 'value'}
                onClick={(_, index) => handleClick(data[index])}
                cursor={interactive ? 'pointer' : 'default'}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
              />
              <YAxis 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: '#4b5563' }}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {yAxes.filter((key): key is string => key !== undefined).map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey={yAxes[0]} 
                name={yAxes[0]}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                dataKey={yAxes[1] || yAxes[0]} 
                name={yAxes[1] || yAxes[0]}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Data" data={data} fill={colors[0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={data}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
              {yAxes.map((key, index) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                />
              ))}
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="left"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toFixed(0);
                }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend />}
              {yAxes.slice(0, 1).map((key, index) => (
                <Bar
                  key={key}
                  yAxisId="left"
                  dataKey={key}
                  fill={colors[index]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
              {yAxes.slice(1).map((key, index) => (
                <Line
                  key={key}
                  yAxisId="right"
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index + 1]}
                  strokeWidth={2}
                  dot={{ fill: colors[index + 1], strokeWidth: 2, r: 4 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'metric':
        const value = data[0]?.[yAxes[0] || Object.keys(data[0])[1]] as number;
        const change = data[0]?.change as number;
        
        return (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <p className="text-5xl font-bold text-white mb-2">
              {typeof value === 'number' 
                ? value >= 1 
                  ? value.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : `${(value * 100).toFixed(1)}%`
                : value}
            </p>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${
                change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {change > 0 ? <TrendingUp size={16} /> : change < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                <span>{change > 0 ? '+' : ''}{(change * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Unsupported chart type: {type}</p>
          </div>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-bright rounded-2xl p-6 group hover:border-indigo-500/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      <div className="relative">
        {/* Gradient overlay for visual polish */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-indigo-500/5 pointer-events-none rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        {renderChart()}
      </div>
    </motion.div>
  );
}
