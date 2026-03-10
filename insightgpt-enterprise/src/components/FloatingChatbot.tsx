'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  User,
  Loader2,
  Copy,
  Check,
  Bot,
  Minus,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import ChartRenderer from './ChartRenderer';
import type { ChartConfig, AIInsight } from '@/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  charts?: ChartConfig[];
  insights?: AIInsight[];
  suggestions?: string[];
}

export default function FloatingChatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Listen for "open-chatbot" event from Help & Support button
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handler);
    return () => window.removeEventListener('open-chatbot', handler);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi! \ud83d\udc4b I'm your InsightGPT assistant. Ask me anything about the app or your data.\n\nTry:\n\u2022 \"What can this app do?\"\n\u2022 \"How do I upload data?\"\n\u2022 \"Show top categories by value\"",
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length]);

  const handleSubmit = useCallback(async (query: string) => {
    if (!query.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    const assistantId = `msg-${Date.now() + 1}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }]);

    try {
      // Check if it's a website/app question first
      const appAnswer = getAppAnswer(query);
      if (appAnswer) {
        setMessages(prev => prev.map(m => m.id === assistantId ? {
          ...m,
          content: appAnswer,
          isLoading: false,
        } : m));
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();

      setMessages(prev => prev.map(m => m.id === assistantId ? {
        ...m,
        content: result.narrative || 'Here are the results.',
        charts: result.charts || [],
        insights: result.insights || [],
        suggestions: result.suggestions || [],
        isLoading: false,
      } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === assistantId ? {
        ...m,
        content: 'Sorry, something went wrong. Please try again.',
        isLoading: false,
      } : m));
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleVoiceInput = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice not supported. Use Chrome or Edge.');
      return;
    }

    const SpeechRecognitionClass = win.webkitSpeechRecognition || win.SpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === 'not-allowed') {
        alert('Microphone access denied.');
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSubmit(transcript);
    };
    recognition.start();
  }, [isListening, handleSubmit]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Hide on landing page
  if (pathname === '/') return null;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[100] w-[400px] h-[560px] bg-[#0d1225] border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">InsightGPT Assistant</h3>
                  <p className="text-[10px] text-indigo-200">Ask anything about the app or data</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setIsOpen(false); setMessages([]); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div className={`max-w-[280px] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm ${
                      message.role === 'user'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-800/80 text-gray-200'
                    }`}>
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs">Analyzing...</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{message.content}</p>
                      )}
                    </div>

                    {/* Charts */}
                    {message.charts && message.charts.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {message.charts.map((chart: ChartConfig, index: number) => (
                          <div key={index} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                            <ChartRenderer config={chart} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Insights */}
                    {message.insights && message.insights.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {message.insights.slice(0, 2).map((insight: AIInsight) => (
                          <div key={insight.id} className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                            <p className="text-xs text-indigo-300 font-medium">{insight.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{insight.description}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {message.suggestions.slice(0, 3).map((s, i) => (
                          <button
                            key={i}
                            onClick={() => { setInput(s); inputRef.current?.focus(); }}
                            className="px-2.5 py-1 text-[11px] bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full border border-gray-700 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Copy */}
                    {message.role === 'assistant' && !message.isLoading && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="mt-1 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-700/50 p-3 bg-[#0a0f1e]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  rows={1}
                  className="flex-1 px-3.5 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                  style={{ minHeight: '40px', maxHeight: '80px' }}
                />
                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleSubmit(input)}
                  disabled={!input.trim() || isProcessing}
                  className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 disabled:from-gray-700 disabled:to-gray-700 rounded-lg text-white transition-all"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Answer website/app questions locally without calling AI
function getAppAnswer(query: string): string | null {
  const q = query.toLowerCase().trim().replace(/[.!?,]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Greetings
  const greetingWords = ['hi', 'hello', 'hey', 'hii', 'hiii', 'yo', 'sup', 'good morning', 'good afternoon', 'good evening', 'howdy'];
  if (greetingWords.some(g => q === g || q.startsWith(g + ' ')) || /^(hi|hey|hello|yo)\b/i.test(q) || /tell.*about.*your/i.test(q) || /who are you/i.test(q) || /what are you/i.test(q) || /introduce/i.test(q)) {
    return "Hello! 👋 I'm the **InsightGPT Assistant** — your AI-powered helper for this analytics platform.\n\nI can help you with:\n\n🧭 **Navigate** — Find any feature or page\n📊 **Analyze** — Ask data questions (go to AI Query for charts)\n📤 **Upload** — Guide you through importing data\n💡 **Explain** — How features work\n\nAsk me anything about the app!";
  }

  // Thank you
  if (/thank|thanks|thx/i.test(q)) {
    return "You're welcome! 😊 Let me know if you need anything else.";
  }

  // Bye
  if (/^(bye|goodbye|see you|cya)/i.test(q)) {
    return "Goodbye! 👋 Feel free to come back anytime you need help.";
  }

  // Navigation / page questions
  if (/what.*can.*(do|help)|feature|capabilit/i.test(q)) {
    return "InsightGPT Enterprise can:\n\n📊 **Dashboard** — KPI cards, charts, insurer comparison\n🔍 **AI Query** — Ask data questions in plain English\n📁 **Data Explorer** — Browse and filter raw data\n📤 **Upload** — Import your own CSV datasets\n💡 **AI Insights** — Auto-generated trends & anomalies\n⚗️ **Simulation** — What-if scenario analysis\n🎤 **Voice** — Ask questions by speaking\n\nNavigate using the sidebar!";
  }

  if (/how.*(upload|import)|upload.*data/i.test(q)) {
    return "To upload your data:\n\n1. Click **Upload Data** in the sidebar\n2. Drag & drop your CSV file or click to browse\n3. Click **Use This Dataset**\n\nAll pages will automatically update to analyze your custom data!";
  }

  if (/how.*(use|work|start|get started)/i.test(q)) {
    return "Getting started is easy:\n\n1. **Explore** — The app comes with built-in insurance claims data\n2. **Ask** — Go to AI Query and type/speak any question\n3. **Dashboard** — View pre-built analytics overview\n4. **Upload** — Import your own CSV for custom analysis\n\nTry asking: \"Show top 5 insurers by claims paid\"";
  }

  if (/what.*data|about.*data|dataset/i.test(q)) {
    return "The app comes with a built-in **sample dataset** to get you started.\n\nYou can **upload your own CSV** to analyze any dataset!\n\nGo to **Upload Data** in the sidebar to import your file.";
  }

  if (/where.*dashboard|how.*dashboard/i.test(q)) {
    return "Click **Dashboard** in the sidebar to see:\n\n• KPI cards (Total Paid, Claims Settled, Ratio, Insurers)\n• Top insurers chart\n• Year-over-year trends\n• Claims distribution\n• Filterable by year and insurer";
  }

  if (/simulation|what.if|scenario/i.test(q)) {
    return "Go to **Simulation** in the sidebar to:\n\n• Adjust settlement ratio, claim volume, or rejection rate\n• See projected impact on business metrics\n• Compare current vs simulated scenarios\n• Get AI recommendations based on changes";
  }

  if (/insights|trends|anomal/i.test(q) && !/show|compare|top|which|what is/i.test(q)) {
    return "Click **AI Insights** in the sidebar to see:\n\n• Auto-detected trends in claims data\n• Anomalies and outliers\n• Performance comparisons\n• AI-generated recommendations\n\nInsights are regenerated each time you load the page or upload new data.";
  }

  if (/voice|speech|mic|speak/i.test(q)) {
    return "Voice input is available on the **AI Query** page:\n\n1. Click the 🎤 microphone button\n2. Speak your question naturally\n3. The query is automatically sent when you finish speaking\n\nWorks best in **Chrome** or **Edge**.";
  }

  if (/explorer|browse.*data|raw.*data/i.test(q)) {
    return "Click **Data Explorer** in the sidebar to:\n\n• Browse all records in a sortable table\n• Search and filter by any column\n• View column statistics and distributions\n• Export filtered data";
  }

  if (/setting|theme|dark.*mode|light.*mode/i.test(q)) {
    return "Go to **Settings** in the sidebar to:\n\n• Toggle dark/light theme\n• Configure preferences\n\nYou can also use the theme toggle in the header.";
  }

  return null;
}
