'use client';
// InsightGPT Enterprise - AI Chat Interface
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  User, 
  Loader2,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import ChartRenderer from './ChartRenderer';
import type { ConversationMessage, ChartConfig, AIInsight } from '@/types';

const SUGGESTED_QUERIES = [
  'Show claim settlement ratio by insurer',
  'Which insurer has the highest rejection rate?',
  'Compare claims paid vs rejected across years',
  'Show trends of claims paid by insurer',
  'Top 5 insurers by claims amount',
  'Year-over-year claim growth analysis',
];

interface AIChatProps {
  embedded?: boolean;
  fullPage?: boolean;
  initialQuery?: string;
}

export default function AIChat({ embedded = false, fullPage = false, initialQuery }: AIChatProps) {
  const { 
    conversations, 
    addMessage, 
    updateMessage, 
    isProcessing, 
    setIsProcessing,
  } = useAppStore();
  
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const handleSubmit = useCallback(async (query: string) => {
    if (!query.trim() || isProcessing) return;
    
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    
    addMessage(userMessage);
    setInput('');
    setIsProcessing(true);
    
    // Add loading message
    const assistantId = (Date.now() + 1).toString();
    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    });
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const result = await response.json();
      
      updateMessage(assistantId, {
        content: result.narrative || 'Here are the results for your query.',
        charts: result.charts || [],
        insights: result.insights || [],
        isLoading: false,
      });
    } catch (error) {
      updateMessage(assistantId, {
        content: 'I encountered an error processing your request. Please try again.',
        isLoading: false,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, addMessage, updateMessage, setIsProcessing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(input);
    }
  };

  const handleVoiceInput = useCallback(() => {
    // If already listening, stop
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognitionClass = win.webkitSpeechRecognition || win.SpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = false;
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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-white mb-3"
            >
              Ask Me Anything
            </motion.h2>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-400 max-w-lg mb-8"
            >
              I can analyze your insurance claims data, create visualizations, 
              find patterns, and answer complex business questions - all in plain English.
            </motion.p>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl"
            >
              {SUGGESTED_QUERIES.map((query, index) => (
                <motion.button
                  key={query}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSubmit(query)}
                  className="flex items-center gap-3 px-4 py-3.5 glass hover:border-indigo-500/30 rounded-xl text-left text-sm text-gray-300 hover:text-white transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-indigo-500/40 group-hover:to-purple-500/40 transition-all">
                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <span className="flex-1">{query}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        ) : (
          <AnimatePresence>
            {conversations.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-4xl ${message.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`rounded-2xl px-5 py-4 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30' 
                      : 'glass-bright text-gray-100'
                  }`}>
                    {message.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing your query...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  
                  {/* Charts */}
                  {message.charts && message.charts.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {message.charts.map((chart: ChartConfig, index: number) => (
                        <ChartRenderer key={index} config={chart} />
                      ))}
                    </div>
                  )}
                  
                  {/* Insights */}
                  {message.insights && message.insights.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {message.insights.map((insight: AIInsight) => (
                        <div 
                          key={insight.id}
                          className={`glass rounded-xl p-4 border-l-2 ${
                            insight.impact === 'high' 
                              ? 'border-l-red-500 bg-red-500/5'
                              : insight.impact === 'medium'
                                ? 'border-l-amber-500 bg-amber-500/5'
                                : 'border-l-emerald-500 bg-emerald-500/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                              insight.impact === 'high' 
                                ? 'bg-red-500/20 text-red-400'
                                : insight.impact === 'medium'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {insight.impact} impact
                            </span>
                            <span className="text-xs text-gray-500">
                              {(insight.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <h4 className="font-medium text-white">{insight.title}</h4>
                          <p className="text-sm text-gray-400 mt-1">{insight.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  {message.role === 'assistant' && !message.isLoading && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/5 p-4 bg-[#050816]/80 backdrop-blur-xl">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your data..."
              rows={1}
              className="w-full px-5 py-4 pr-28 glass-bright rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
              style={{ minHeight: '56px', maxHeight: '120px' }}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleVoiceInput}
                className={`p-2.5 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                    : 'glass text-gray-400 hover:text-white'
                }`}
              >
                {isListening ? <Mic className="w-4 h-4 animate-pulse" /> : <MicOff className="w-4 h-4" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSubmit(input)}
                disabled={!input.trim() || isProcessing}
                className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white transition-all shadow-lg shadow-indigo-500/30 disabled:shadow-none"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">
          Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">Enter</kbd> to send • <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
