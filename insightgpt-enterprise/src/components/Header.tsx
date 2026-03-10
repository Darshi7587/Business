'use client';
// InsightGPT Enterprise - Modern Header Component
import React, { useState, useEffect, useCallback } from 'react';
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
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import { useAppStore } from '@/store';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface SearchResult {
  type: string;
  title: string;
  description: string;
  insurer?: string;
  year?: string;
  premium?: number;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { theme, toggleTheme, voiceEnabled, setVoiceEnabled } = useAppStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const router = useRouter();

  // Voice recognition via Web Speech API
  const startVoiceRecognition = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceTranscript('');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);

      if (event.results[0].isFinal) {
        setIsListening(false);
        if (transcript.trim()) {
          router.push(`/query?q=${encodeURIComponent(transcript.trim())}`);
        }
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [router]);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setSearchSuggestions([
        'Show claims by insurer',
        'Compare settlement ratios',
        'Year-wise trends',
      ]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
      setSearchSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showSearch) {
        performSearch(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showSearch, performSearch]);

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
      setSearchResults([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/query?q=${encodeURIComponent(suggestion)}`);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const notifications = [
    { id: 1, title: 'New insights available', time: '5 min ago', unread: true },
    { id: 2, title: 'Dataset analysis complete', time: '1 hour ago', unread: true },
    { id: 3, title: 'Weekly report ready', time: 'Yesterday', unread: false },
  ];

  return (
    <header className={`h-20 border-b px-6 flex items-center justify-between sticky top-0 z-40 ${theme === 'dark' ? 'glass-subtle border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
      {/* Title Section */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
              BETA
            </span>
          </div>
          {subtitle && (
            <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
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
                  ? `w-full border px-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}` 
                  : `w-11 border justify-center ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-indigo-500/30' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'}`
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
                  className={`flex-1 bg-transparent text-sm placeholder-gray-500 focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
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
          
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {showSearch && searchQuery.length >= 2 && (searchResults.length > 0 || searchSuggestions.length > 0 || isSearching) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                {isSearching ? (
                  <div className="px-4 py-6 text-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-400 mt-2">Searching...</p>
                  </div>
                ) : (
                  <>
                    {searchResults.length > 0 && (
                      <div className="p-2">
                        <p className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">Results</p>
                        {searchResults.slice(0, 5).map((result, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(result.insurer || result.title)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{result.insurer || result.title}</p>
                              <p className="text-xs text-gray-500">Year: {result.year || 'N/A'} • Premium: ${result.premium?.toLocaleString() || 'N/A'}</p>
                            </div>
                            <BarChart2 className="w-4 h-4 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    )}
                    {searchSuggestions.length > 0 && searchResults.length === 0 && (
                      <div className="p-2">
                        <p className="px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">Suggestions</p>
                        {searchSuggestions.slice(0, 5).map((suggestion, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">{suggestion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.length === 0 && searchSuggestions.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-400">No results found for &quot;{searchQuery}&quot;</p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Voice Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (!voiceEnabled) {
              setVoiceEnabled(true);
              startVoiceRecognition();
            } else if (!isListening) {
              startVoiceRecognition();
            }
          }}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            isListening
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
              : voiceEnabled 
              ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10' 
              : `border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`
          }`}
          title={isListening ? 'Listening...' : voiceEnabled ? 'Click to speak' : 'Enable Voice'}
        >
          {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </motion.button>

        {/* Voice Transcript Popup */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute top-full right-32 mt-2 px-4 py-3 rounded-xl shadow-xl z-50 min-w-[200px] ${
                theme === 'dark' ? 'bg-slate-900/95 border border-white/10 text-white' : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-red-400">Listening...</span>
              </div>
              <p className="text-sm">{voiceTranscript || 'Speak now...'}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-indigo-500/30' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
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
