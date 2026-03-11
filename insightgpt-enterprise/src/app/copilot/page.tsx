'use client';
// AI Copilot - Persistent Assistant
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Lightbulb,
  TrendingUp,
  PieChart,
  Table2,
  Code,
  Copy,
  Check,
  User,
  Bot,
  Wand2,
  ChevronDown,
} from 'lucide-react';
import { Sidebar, Header, ChartRenderer, LoadingState } from '@/components';
import { useAppStore } from '@/store';
import type { ConversationMessage } from '@/types';

interface CopilotContext {
  recentQueries: string[];
  activeInsights: string[];
  currentPage: string;
}

export default function CopilotPage() {
  const { 
    dataset, 
    customDataset,
    setDataset, 
    setDatasetAnalysis,
    voiceEnabled, 
    setVoiceEnabled,
  } = useAppStore();

  const activeData = customDataset && customDataset.length > 0 ? customDataset : dataset;
  
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const suggestions = [
    { icon: TrendingUp, text: "What's the overall trend in the data?", category: 'Trends' },
    { icon: PieChart, text: "Compare the top 5 categories", category: 'Analysis' },
    { icon: Lightbulb, text: "Give me 3 actionable insights from this data", category: 'Insights' },
    { icon: Table2, text: "Which categories have the lowest values?", category: 'Query' },
    { icon: Code, text: "Generate a summary report for executives", category: 'Report' },
    { icon: Wand2, text: "What would happen if values improved by 5%?", category: 'Simulation' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!dataset || dataset.length === 0) {
          const response = await fetch('/api/data');
          const result = await response.json();
          
          if (result.success) {
            setDataset(result.data);
            setDatasetAnalysis(result.analysis);
          }
        }
        
        // Set welcome message
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hello! I'm your AI Copilot. I can help you with:\n\n\u2022 Analyzing trends and patterns\n\u2022 Comparing categories and groups\n\u2022 Generating insights and recommendations\n\u2022 Running what-if scenarios\n\u2022 Creating reports and summaries\n\nHow can I assist you today?",
          timestamp: new Date().toISOString(),
        }]);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (voiceText?: string) => {
    const messageText = voiceText || input.trim();
    if (!messageText || isProcessing) return;

    const userMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setShowSuggestions(false);

    try {
      // Build conversation context from recent messages
      const recentMessages = messages.slice(-6);
      const conversationContext = recentMessages.length > 0
        ? recentMessages.map(m => `${m.role}: ${m.content}`).join('\n')
        : undefined;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageText,
          data: activeData && activeData.length > 0 ? activeData : undefined,
          conversationContext,
        }),
      });

      const result = await response.json();
      
      // Check if response is ok and has expected data
      const isSuccess = response.ok && !result.error;

      const assistantMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: isSuccess 
          ? result.narrative || result.analysis?.explanation || 'I analyzed your query.'
          : result.narrative || result.message || 'Sorry, I encountered an error processing your request.',
        timestamp: new Date().toISOString(),
        chart: isSuccess && result.charts?.length > 0 ? result.charts[0] : undefined,
        insights: isSuccess && result.insights ? result.insights : undefined,
        suggestions: result.suggestions || undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    // If already listening, stop
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permission in your browser settings.');
      }
      // no-speech and aborted are normal — ignore silently
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (event.results[0].isFinal) {
        setInput(transcript);
        handleSend(transcript);
      } else {
        setInput(transcript);
      }
    };

    recognition.start();
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState type="full" message="Initializing AI Copilot..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header title="AI Copilot" subtitle="Your intelligent assistant" />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">AI Copilot</h1>
                <p className="text-sm text-gray-400">Your intelligent data assistant</p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-2xl ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div className={`p-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Chart */}
                    {message.chart && (
                      <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <ChartRenderer config={message.chart} />
                      </div>
                    )}

                    {/* Insights */}
                    {message.insights && message.insights.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.insights.slice(0, 3).map((insight, i) => (
                          <div
                            key={i}
                            className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg"
                          >
                            <p className="text-sm text-indigo-200">{insight.title}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggestions */}
                    {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Try asking:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestions.slice(0, 4).map((suggestion, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setInput(suggestion);
                                inputRef.current?.focus();
                              }}
                              className="px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full border border-gray-600 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => copyToClipboard(message.content, index)}
                          className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Processing Indicator */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6 }}
                      className="w-2 h-2 bg-indigo-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                      className="w-2 h-2 bg-indigo-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                      className="w-2 h-2 bg-indigo-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {showSuggestions && messages.length <= 1 && (
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">Suggested questions</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(suggestion.text);
                      inputRef.current?.focus();
                    }}
                    className="p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <suggestion.icon className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs text-indigo-400">{suggestion.category}</span>
                    </div>
                    <p className="text-sm text-gray-300 group-hover:text-white line-clamp-2">
                      {suggestion.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3 bg-gray-800/50 border border-gray-700 rounded-2xl p-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your data..."
                  rows={1}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none min-h-[24px] max-h-32"
                  style={{ height: 'auto' }}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVoiceInput}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening 
                        ? 'bg-red-500 text-white' 
                        : 'hover:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isProcessing}
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                AI Copilot can analyze your insurance claims data and provide insights
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
