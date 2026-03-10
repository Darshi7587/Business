'use client';
// InsightGPT Enterprise - Modern Sidebar Navigation
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  MessageSquareText,
  Database,
  Upload,
  Lightbulb,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  HelpCircle,
  AlertTriangle,
  TrendingUp,
  GitCompareArrows,
  BookOpen,
  FileText,
  Bell,
  StickyNote,
} from 'lucide-react';
import { useAppStore } from '@/store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Executive overview' },
  { href: '/query', label: 'AI Query', icon: MessageSquareText, description: 'Natural language queries' },
  { href: '/explorer', label: 'Data Explorer', icon: Database, description: 'Browse your data' },
  { href: '/upload', label: 'Upload Data', icon: Upload, description: 'Import datasets' },
  { href: '/insights', label: 'AI Insights', icon: Lightbulb, description: 'Automated analysis' },
  { href: '/simulation', label: 'Simulation', icon: FlaskConical, description: 'What-if scenarios' },
];

const advancedItems = [
  { href: '/anomaly', label: 'Anomaly Detection', icon: AlertTriangle, description: 'Outlier analysis' },
  { href: '/forecast', label: 'Forecasting', icon: TrendingUp, description: 'Predict future trends' },
  { href: '/correlation', label: 'Correlation', icon: GitCompareArrows, description: 'Variable relationships' },
  { href: '/story', label: 'Data Story', icon: BookOpen, description: 'Narrative walkthrough' },
  { href: '/report', label: 'PDF Report', icon: FileText, description: 'Executive summary' },
  { href: '/alerts', label: 'Smart Alerts', icon: Bell, description: 'Threshold monitoring' },
  { href: '/annotations', label: 'Annotations', icon: StickyNote, description: 'Collaborative notes' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <>
      {/* Spacer for fixed sidebar */}
      <div 
        className="shrink-0 transition-all duration-300"
        style={{ width: sidebarCollapsed ? 80 : 280 }}
      />
      
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="fixed left-0 top-0 h-screen sidebar flex flex-col z-50"
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        {/* Logo */}
        <div className="relative p-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>InsightGPT</h1>
                  <p className="text-[10px] text-indigo-400 font-medium tracking-wider">ENTERPRISE</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
              >
                Main Menu
              </motion.p>
            )}
          </AnimatePresence>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block relative group"
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border border-indigo-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full"
                    />
                  )}
                  
                  {/* Icon Container */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30' 
                      : 'bg-white/5 group-hover:bg-indigo-500/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400'}`} />
                  </div>
                  
                  {/* Label */}
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1 min-w-0"
                      >
                        <p className={`text-sm font-medium truncate ${isActive ? (isDark ? 'text-white' : 'text-indigo-600') : (isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900')}`}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 glass-bright rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                )}
              </Link>
            );
          })}

          {/* Advanced Features Section */}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 pt-4 pb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider"
              >
                Advanced
              </motion.p>
            )}
          </AnimatePresence>

          {advancedItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block relative group"
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border border-indigo-500/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full"
                    />
                  )}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30' 
                      : 'bg-white/5 group-hover:bg-indigo-500/20'
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400'}`} />
                  </div>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isActive ? (isDark ? 'text-white' : 'text-indigo-600') : (isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900')}`}>
                          {item.label}
                        </p>
                        <p className="text-[9px] text-gray-500 truncate">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                {sidebarCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 glass-bright rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.label}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="relative p-3 border-t border-white/5 space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <Settings className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          
          <button 
            onClick={() => {
              // Trigger the floating chatbot by dispatching a custom event
              window.dispatchEvent(new CustomEvent('open-chatbot'));
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <HelpCircle className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  Help & Support
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute -right-3 top-24 w-6 h-6 rounded-full border flex items-center justify-center transition-all shadow-lg ${isDark ? 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:border-indigo-500 hover:bg-indigo-500/20' : 'bg-white border-gray-300 text-gray-500 hover:text-gray-900 hover:border-indigo-500 hover:bg-indigo-50'}`}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </motion.button>
      </motion.aside>
    </>
  );
}
