'use client';
// Settings Page
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Moon,
  Sun,
  Bell,
  Mic,
  Key,
  Database,
  Palette,
  Globe,
  Shield,
  Save,
  Check,
  ChevronRight,
  User,
  Mail,
  Building2,
  Camera,
} from 'lucide-react';
import { Sidebar, Header } from '@/components';
import { useAppStore } from '@/store';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

export default function SettingsPage() {
  const { theme, setTheme, voiceEnabled, setVoiceEnabled } = useAppStore();
  const [geminiKey, setGeminiKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileName, setProfileName] = useState('Admin User');
  const [profileEmail, setProfileEmail] = useState('admin@insightgpt.app');
  const [profileCompany, setProfileCompany] = useState('InsightGPT Enterprise');

  const sections: SettingSection[] = [
    { id: 'profile', title: 'Profile', icon: User, description: 'Your account information' },
    { id: 'appearance', title: 'Appearance', icon: Palette, description: 'Customize the look and feel' },
    { id: 'ai', title: 'AI Settings', icon: Key, description: 'Configure AI model and API' },
    { id: 'voice', title: 'Voice Input', icon: Mic, description: 'Voice recognition settings' },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Manage alerts and updates' },
    { id: 'data', title: 'Data', icon: Database, description: 'Data management and storage' },
  ];

  const [activeSection, setActiveSection] = useState('profile');

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('insightgpt_settings', JSON.stringify({
      theme,
      voiceEnabled,
      geminiKey: geminiKey ? '***' : '', // Don't store actual key in demo
      notifications,
      autoRefresh,
    }));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Settings" subtitle="Configure your experience" />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-gray-400 mt-1">Configure your InsightGPT Enterprise experience</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
                  saved 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </motion.div>

            <div className="flex gap-6">
              {/* Sidebar Navigation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-64 flex-shrink-0"
              >
                <nav className="glass-bright rounded-2xl overflow-hidden">
                  {sections.map((section, index) => (
                    <motion.button
                      key={section.id}
                      whileHover={{ x: 4 }}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full p-4 flex items-center gap-3 text-left transition-all ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-indigo-500/20 to-transparent border-l-4 border-indigo-500'
                          : 'hover:bg-white/5 border-l-4 border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        activeSection === section.id 
                          ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'
                          : 'bg-white/5'
                      }`}>
                        <section.icon className={`w-5 h-5 ${
                          activeSection === section.id ? 'text-indigo-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className={`font-medium ${
                          activeSection === section.id ? 'text-white' : 'text-gray-300'
                        }`}>
                          {section.title}
                        </p>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </nav>
              </motion.div>

              {/* Content Area */}
              <div className="flex-1 space-y-6">
                {/* Profile */}
                {activeSection === 'profile' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-bright rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Profile</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                            <span className="text-3xl font-bold text-white">AU</span>
                          </div>
                          <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg">
                            <Camera className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{profileName}</h3>
                          <p className="text-sm text-gray-400">{profileEmail}</p>
                          <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30">
                            Enterprise Plan
                          </span>
                        </div>
                      </div>

                      {/* Profile Fields */}
                      <div className="grid gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              type="text"
                              value={profileName}
                              onChange={(e) => setProfileName(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">Email</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              type="email"
                              value={profileEmail}
                              onChange={(e) => setProfileEmail(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-300 mb-2 block">Company</label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input
                              type="text"
                              value={profileCompany}
                              onChange={(e) => setProfileCompany(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Appearance */}
                {activeSection === 'appearance' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-bright rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-pink-400" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Appearance</h2>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Theme */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-4 block">Theme</label>
                        <div className="grid grid-cols-2 gap-4">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setTheme('dark')}
                            className={`p-5 rounded-xl transition-all ${
                              theme === 'dark' 
                                ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500' 
                                : 'glass border-2 border-transparent hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                <Moon className="w-5 h-5 text-indigo-400" />
                              </div>
                              <span className="font-semibold text-white">Dark</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-3">
                              Easy on the eyes, perfect for long sessions
                            </p>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            onClick={() => setTheme('light')}
                            className={`p-5 rounded-xl transition-all ${
                              theme === 'light' 
                                ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500' 
                                : 'glass border-2 border-transparent hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <Sun className="w-5 h-5 text-amber-400" />
                              </div>
                              <span className="font-semibold text-white">Light</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-3">
                              Clean and bright for daytime use
                            </p>
                          </motion.button>
                        </div>
                      </div>

                      {/* Accent Color */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-4 block">Accent Color</label>
                        <div className="flex gap-4">
                          {[
                            { name: 'indigo', color: 'bg-indigo-500' },
                            { name: 'purple', color: 'bg-purple-500' },
                            { name: 'pink', color: 'bg-pink-500' },
                            { name: 'cyan', color: 'bg-cyan-500' },
                            { name: 'emerald', color: 'bg-emerald-500' },
                          ].map((item) => (
                            <motion.button
                              key={item.name}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-12 h-12 rounded-xl ${item.color} ring-2 ring-offset-4 ring-offset-[#050816] ${
                                item.name === 'indigo' ? 'ring-white' : 'ring-transparent'
                              } hover:ring-white/50 transition-all shadow-lg`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* AI Settings */}
                {activeSection === 'ai' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-bright rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                        <Key className="w-5 h-5 text-indigo-400" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">AI Configuration</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {/* API Key */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-3 block">
                          Google Gemini API Key
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="Enter your API key..."
                            className="w-full px-5 py-4 glass rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                          />
                          <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Get your API key from{' '}
                          <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                            Google AI Studio
                          </a>
                        </p>
                      </div>

                      {/* Model Selection */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-3 block">AI Model</label>
                        <select className="w-full px-5 py-4 glass rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all bg-transparent">
                          <option value="gemini-2.0-flash" className="bg-gray-900">Gemini 2.0 Flash (Recommended)</option>
                          <option value="gemini-1.5-pro" className="bg-gray-900">Gemini 1.5 Pro</option>
                          <option value="gemini-1.5-flash" className="bg-gray-900">Gemini 1.5 Flash</option>
                        </select>
                      </div>

                      {/* Temperature */}
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-300">Response Creativity</label>
                          <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">0.3</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          defaultValue="0.3"
                          className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Precise</span>
                          <span>Creative</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Voice Settings */}
                {activeSection === 'voice' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-bright rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                        <Mic className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Voice Input</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Enable Voice */}
                      <div className="glass rounded-xl p-5 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">Enable Voice Input</p>
                          <p className="text-sm text-gray-400 mt-1">Use your microphone to ask questions</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setVoiceEnabled(!voiceEnabled)}
                          className={`w-14 h-8 rounded-full transition-all ${
                            voiceEnabled ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'
                          }`}
                        >
                          <motion.div
                            layout
                            className={`w-6 h-6 bg-white rounded-full shadow-lg ${
                              voiceEnabled ? 'ml-7' : 'ml-1'
                            }`}
                          />
                        </motion.button>
                      </div>

                      {/* Language */}
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-3 block">Language</label>
                        <select className="w-full px-5 py-4 glass rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all bg-transparent">
                          <option value="en-US" className="bg-gray-900">English (US)</option>
                          <option value="en-GB" className="bg-gray-900">English (UK)</option>
                          <option value="en-IN" className="bg-gray-900">English (India)</option>
                          <option value="hi-IN" className="bg-gray-900">Hindi</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Notifications */}
                {activeSection === 'notifications' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-bright rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-amber-400" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Notifications</h2>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        { label: 'AI Insights', desc: 'Get notified when new insights are discovered', enabled: notifications },
                        { label: 'Data Updates', desc: 'Notifications when data is refreshed', enabled: true },
                        { label: 'System Alerts', desc: 'Important system and security alerts', enabled: true },
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          className="glass rounded-xl p-5 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-white">{item.label}</p>
                            <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => index === 0 && setNotifications(!notifications)}
                            className={`w-14 h-8 rounded-full transition-all ${
                              item.enabled ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'
                            }`}
                          >
                            <motion.div
                              layout
                              className={`w-6 h-6 bg-white rounded-full shadow-lg ${
                                item.enabled ? 'ml-7' : 'ml-1'
                              }`}
                            />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Data Settings */}
                {activeSection === 'data' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-bright rounded-2xl p-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <Database className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Data Management</h2>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Auto Refresh */}
                      <div className="glass rounded-xl p-5 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">Auto Refresh Data</p>
                          <p className="text-sm text-gray-400 mt-1">Automatically refresh data every hour</p>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setAutoRefresh(!autoRefresh)}
                          className={`w-14 h-8 rounded-full transition-all ${
                            autoRefresh ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-white/10'
                          }`}
                        >
                          <motion.div
                            layout
                            className={`w-6 h-6 bg-white rounded-full shadow-lg ${
                              autoRefresh ? 'ml-7' : 'ml-1'
                            }`}
                          />
                        </motion.button>
                      </div>

                      {/* Cache */}
                      <div className="glass rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-medium text-white">Cache Storage</p>
                            <p className="text-sm text-gray-400 mt-1">12.5 MB used</p>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                          >
                            Clear Cache
                          </motion.button>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '25%' }}
                            transition={{ duration: 0.8 }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          />
                        </div>
                      </div>

                      {/* Export */}
                      <div>
                        <p className="font-medium text-white mb-4">Export Data</p>
                        <div className="flex gap-4">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-3 glass rounded-xl text-gray-300 hover:text-white transition-all font-medium"
                          >
                            Export as CSV
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-3 glass rounded-xl text-gray-300 hover:text-white transition-all font-medium"
                          >
                            Export as JSON
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
