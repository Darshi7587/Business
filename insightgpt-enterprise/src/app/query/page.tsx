'use client';
// AI Query Interface - Natural Language Chat with Stunning UI
import React, { useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { MessageSquareText, Sparkles, History, Bookmark } from 'lucide-react';
import { Sidebar, Header, AIChat, LoadingState } from '@/components';
import { useAppStore } from '@/store';

function QueryPageContent() {
  const searchParams = useSearchParams();
  const { setDataset, setDatasetAnalysis, dataset, conversations } = useAppStore();
  const initialQuery = searchParams.get('q') || '';

  // Load data on mount if not already loaded
  useEffect(() => {
    const loadData = async () => {
      if (dataset && dataset.length > 0) return;
      
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        
        if (result.success) {
          setDataset(result.data);
          setDatasetAnalysis(result.analysis);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#050816] flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="AI Query Interface" subtitle="Ask questions in natural language" />
        
        <main className="flex-1 overflow-hidden flex gap-6 p-6">
          {/* Main Chat Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 glass-bright rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <MessageSquareText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Analysis Chat</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-400">Powered by Gemini AI</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 glass rounded-xl text-gray-400 hover:text-white transition-colors"
                  title="Chat History"
                >
                  <History className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 glass rounded-xl text-gray-400 hover:text-white transition-colors"
                  title="Saved Queries"
                >
                  <Bookmark className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            
            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <AIChat fullPage initialQuery={initialQuery} />
            </div>
          </motion.div>

          {/* Side Panel - Capabilities */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-80 flex-shrink-0 hidden xl:block"
          >
            <div className="glass-bright rounded-2xl p-6 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Capabilities</h3>
                  <p className="text-xs text-gray-500">What I can do</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { 
                    title: 'Data Analysis', 
                    desc: 'Analyze trends, patterns, and anomalies in your insurance data',
                    color: 'from-indigo-500 to-purple-500'
                  },
                  { 
                    title: 'Generate Charts', 
                    desc: 'Create bar, line, area, and pie charts from your queries',
                    color: 'from-emerald-500 to-teal-500'
                  },
                  { 
                    title: 'Compare Metrics', 
                    desc: 'Compare insurers, years, or categories side by side',
                    color: 'from-amber-500 to-orange-500'
                  },
                  { 
                    title: 'Find Insights', 
                    desc: 'Discover hidden patterns and provide recommendations',
                    color: 'from-pink-500 to-rose-500'
                  },
                  { 
                    title: 'Natural Language', 
                    desc: 'Ask questions in plain English, no SQL needed',
                    color: 'from-cyan-500 to-blue-500'
                  },
                ].map((capability, index) => (
                  <motion.div
                    key={capability.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 glass rounded-xl group hover:border-white/10 transition-all"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${capability.color} flex items-center justify-center mb-3 opacity-80 group-hover:opacity-100 transition-opacity`}>
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-medium text-white text-sm mb-1">{capability.title}</h4>
                    <p className="text-xs text-gray-500">{capability.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{conversations.length}</p>
                    <p className="text-xs text-gray-500">Messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">
                      {conversations.filter(c => c.charts && c.charts.length > 0).length}
                    </p>
                    <p className="text-xs text-gray-500">Charts</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function QueryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <LoadingState type="full" message="Loading..." />
      </div>
    }>
      <QueryPageContent />
    </Suspense>
  );
}
