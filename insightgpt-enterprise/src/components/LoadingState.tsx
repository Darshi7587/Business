'use client';
// InsightGPT Enterprise - Loading State Components
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

interface LoadingStateProps {
  type?: 'full' | 'inline' | 'card' | 'skeleton';
  message?: string;
}

export default function LoadingState({ type = 'inline', message }: LoadingStateProps) {
  if (type === 'full') {
    return (
      <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-indigo-400" />
            </div>
          </div>
          <p className="text-lg text-white font-medium">{message || 'Loading...'}</p>
          <p className="text-sm text-gray-400 mt-1">Please wait while we process your request</p>
        </motion.div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-8">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 mb-4"
          />
          <p className="text-gray-300">{message || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (type === 'skeleton') {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800 rounded-lg animate-pulse w-1/3" />
        <div className="h-64 bg-gray-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-800 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-gray-400">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message || 'Loading...'}</span>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
      <div className="h-6 bg-gray-700 rounded w-48 mb-4 animate-pulse" />
      <div className="h-64 bg-gray-700/50 rounded-lg animate-pulse flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
      </div>
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
      <div className="h-4 bg-gray-700 rounded w-24 mb-3 animate-pulse" />
      <div className="h-8 bg-gray-700 rounded w-32 animate-pulse" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700">
        <div className="h-6 bg-gray-700 rounded w-32 animate-pulse" />
      </div>
      <div className="divide-y divide-gray-700/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex gap-4">
            <div className="h-4 bg-gray-700 rounded flex-1 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse" />
            <div className="h-4 bg-gray-700 rounded w-24 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
