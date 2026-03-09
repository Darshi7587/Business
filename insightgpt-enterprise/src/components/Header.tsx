'use client';
// InsightGPT Enterprise - Modern Header Component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  Mic, 
  MicOff,
  User,
  Settings,
  LogOut,
  Command,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/store';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggleTheme, voiceEnabled, setVoiceEnabled } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/query?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const notifications = [
    { id: 1, title: 'New insights available', time: '5 min ago', unread: true },
    { id: 2, title: 'Dataset analysis complete', time: '1 hour ago', unread: true },
    { id: 3, title: 'Weekly report ready', time: 'Yesterday', unread: false },
  ];

  return (
    <header className="h-20 glass-subtle border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Title Section */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">{title}</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
              BETA
            </span>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Search */}
        <motion.div 
          initial={false}
          animate={{ width: showSearch ? 280 : 44 }}
          className="relative overflow-hidden"
        >
          <form onSubmit={handleSearch}>
            <motion.button
              type={showSearch ? 'submit' : 'button'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !showSearch && setShowSearch(true)}
              className={`flex items-center gap-2 h-11 rounded-xl transition-all ${
                showSearch 
                  ? 'w-full bg-white/5 border border-white/10 px-4' 
                  : 'w-11 bg-white/5 border border-white/10 justify-center hover:bg-white/10 hover:border-indigo-500/30'
              }`}
            >
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {showSearch && (
                <input
                  type="text"
                  placeholder="Search anything..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                  onBlur={() => !searchQuery && setShowSearch(false)}
                />
              )}
            </motion.button>
          </form>
          {!showSearch && (
            <div className="absolute right-0 top-0 px-1.5 py-0.5 text-[10px] text-gray-500 flex items-center gap-0.5 pointer-events-none hidden md:flex">
              <Command className="w-3 h-3" />K
            </div>
          )}
        </motion.div>

        {/* Voice Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            voiceEnabled 
              ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10' 
              : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-indigo-500/30'
          }`}
          title={voiceEnabled ? 'Disable Voice' : 'Enable Voice'}
        >
          {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </motion.button>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-indigo-500/30 flex items-center justify-center transition-all"
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <Sun className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <Moon className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-indigo-500/30 flex items-center justify-center transition-all relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full ring-2 ring-[#0a0f1e]"></span>
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 glass-bright rounded-xl shadow-2xl py-2 z-50 border border-white/10"
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <button className="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-start gap-3"
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.unread ? 'bg-indigo-500' : 'bg-gray-600'}`} />
                        <div>
                          <p className="text-sm text-white">{notif.title}</p>
                          <p className="text-xs text-gray-500">{notif.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-white/5">
                    <Link href="/settings" className="text-xs text-indigo-400 hover:text-indigo-300">
                      Notification settings
                    </Link>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* User Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-[10px] text-gray-500">Enterprise Plan</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 glass-bright rounded-xl shadow-2xl py-2 z-50 border border-white/10"
                >
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-medium text-white">Admin User</p>
                    <p className="text-xs text-gray-500">admin@insightgpt.app</p>
                  </div>
                  <div className="py-1">
                    <Link 
                      href="/settings" 
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" /> Profile
                    </Link>
                    <Link 
                      href="/settings" 
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" /> Settings
                    </Link>
                  </div>
                  <div className="border-t border-white/5 pt-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
