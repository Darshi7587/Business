'use client';
// InsightGPT Enterprise - Modern Landing Page
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  MessageSquareText,
  Database,
  Zap,
  Shield,
  LineChart,
  PieChart,
  TrendingUp,
  Check,
  Mic,
  Upload,
  LayoutDashboard,
  Target,
} from 'lucide-react';

const DEMO_QUERIES = [
  "Show me monthly sales revenue for Q3 broken down by region",
  "Which insurer has the highest claim settlement ratio?",
  "Compare LIC vs private insurers performance",
  "Top 5 performing categories by revenue",
  "Show trend of claims paid over the last 3 years",
];

const TYPING_SPEED = 50;
const PAUSE_BETWEEN = 2000;

export default function LandingPage() {
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const heroRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Typewriter effect
  useEffect(() => {
    const query = DEMO_QUERIES[currentQueryIndex];
    let charIndex = 0;
    setIsTyping(true);
    setDisplayText('');

    const typeInterval = setInterval(() => {
      if (charIndex <= query.length) {
        setDisplayText(query.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setTimeout(() => {
          setCurrentQueryIndex((prev) => (prev + 1) % DEMO_QUERIES.length);
        }, PAUSE_BETWEEN);
      }
    }, TYPING_SPEED);

    return () => clearInterval(typeInterval);
  }, [currentQueryIndex]);

  return (
    <div className="min-h-screen bg-[#050816] floating-orbs overflow-hidden">
      {/* Animated Grid Background */}
      <div className="fixed inset-0 animated-grid opacity-30 pointer-events-none" />
      
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="glass-bright rounded-2xl px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">InsightGPT</h1>
                <p className="text-[10px] text-indigo-400 -mt-0.5 font-medium tracking-wider">ENTERPRISE</p>
              </div>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it Works</a>
              <a href="#demo" className="text-sm text-gray-400 hover:text-white transition-colors">Demo</a>
              <Link 
                href="/query"
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl font-medium text-white text-sm shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-105"
              >
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-32 pb-20 px-6 min-h-screen flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm mb-6"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-gray-300">Powered by Google Gemini AI</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              >
                <span className="text-white">Ask Questions.</span>
                <br />
                <span className="gradient-text">Get Dashboards.</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0"
              >
                Transform natural language into stunning, interactive dashboards in real-time. 
                <span className="text-white font-medium"> No SQL. No coding. No waiting.</span>
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link 
                  href="/query"
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-2xl font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-105"
                >
                  <MessageSquareText className="w-5 h-5" />
                  Start Asking
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-2 px-8 py-4 glass hover:bg-white/10 rounded-2xl font-semibold text-white transition-all"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  View Dashboard
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center lg:justify-start gap-8 mt-12"
              >
                {[
                  { value: '10x', label: 'Faster Insights' },
                  { value: '0', label: 'SQL Required' },
                  { value: '∞', label: 'Possibilities' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right Column - Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full" />
              
              {/* Demo Card */}
              <div className="relative glass-bright rounded-3xl overflow-hidden shadow-2xl">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-5 py-4 bg-black/40 border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white/5 rounded-lg px-4 py-1.5 text-xs text-gray-400 text-center">
                      insightgpt.app/query
                    </div>
                  </div>
                </div>
                
                {/* Chat Interface */}
                <div className="p-6 space-y-6">
                  {/* Input Demo */}
                  <div className="relative">
                    <div className="glass rounded-2xl p-4 border border-indigo-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                          <MessageSquareText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm min-h-[20px]">
                            {displayText}
                            <span className={`inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 ${isTyping ? 'animate-pulse' : ''}`} />
                          </p>
                        </div>
                        <button className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-colors">
                          <Mic className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI Response Preview */}
                  <motion.div
                    key={currentQueryIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Insight Card */}
                    <div className="glass rounded-xl p-4 border-l-4 border-indigo-500">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs text-indigo-400 font-medium">AI INSIGHT</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        Based on your query, I&apos;ve analyzed the data and found 3 key insights with actionable recommendations.
                      </p>
                    </div>

                    {/* Mini Charts */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-400">Revenue Trend</span>
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex items-end gap-1 h-12">
                          {[40, 55, 45, 70, 60, 85, 75].map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${h}%` }}
                              transition={{ delay: 0.5 + i * 0.1 }}
                              className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-sm"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-400">Distribution</span>
                          <PieChart className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="relative w-12 h-12 mx-auto">
                          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="3" />
                            <motion.circle 
                              cx="18" cy="18" r="15" fill="none" 
                              stroke="url(#gradient)" 
                              strokeWidth="3" 
                              strokeLinecap="round"
                              strokeDasharray="94"
                              initial={{ strokeDashoffset: 94 }}
                              animate={{ strokeDashoffset: 25 }}
                              transition={{ delay: 0.8, duration: 1 }}
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a855f7" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 glass rounded-xl px-4 py-2 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm text-white font-medium">Dashboard Generated</span>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-4 -left-4 glass rounded-xl px-4 py-2 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm text-white font-medium">AI Processing</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Problem Statement */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-bright rounded-3xl p-10 md:p-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-sm text-red-400 mb-6">
              <Target className="w-4 h-4" />
              The Problem
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Data Teams Are Overwhelmed.
              <br />
              <span className="text-gray-500">Business Users Are Waiting.</span>
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Accessing insights requires technical skills like SQL or navigating complex BI tools. 
              This creates a bottleneck where data teams are flooded with basic reporting requests, 
              and executives wait days for simple dashboards.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mt-10">
              {[
                { value: '3-5 days', label: 'Average wait for a dashboard', color: 'text-red-400' },
                { value: '70%', label: 'Time spent on basic reports', color: 'text-yellow-400' },
                { value: '85%', label: 'Executives lack SQL skills', color: 'text-orange-400' },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-6">
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 mb-6">
              <Sparkles className="w-4 h-4" />
              The Solution
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              InsightGPT Enterprise
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              AI-powered Business Intelligence that speaks your language
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquareText,
                title: 'Natural Language Interface',
                description: 'Ask questions in plain English. Our AI understands business context and generates perfect queries.',
                gradient: 'from-indigo-500 to-purple-500',
              },
              {
                icon: BrainCircuit,
                title: 'Smart Chart Selection',
                description: 'AI automatically selects the optimal visualization type based on your data and query intent.',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: Zap,
                title: 'Real-Time Generation',
                description: 'Get instant, interactive dashboards. No waiting for data teams or complex configurations.',
                gradient: 'from-pink-500 to-red-500',
              },
              {
                icon: Database,
                title: 'Any Data Source',
                description: 'Connect to CSV, databases, APIs, or upload files directly. Your data, your way.',
                gradient: 'from-cyan-500 to-blue-500',
              },
              {
                icon: LineChart,
                title: 'AI-Powered Insights',
                description: 'Automatically discover trends, anomalies, and opportunities hidden in your data.',
                gradient: 'from-green-500 to-emerald-500',
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-grade encryption and compliance with SOC 2, GDPR, and HIPAA standards.',
                gradient: 'from-yellow-500 to-orange-500',
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group glass-bright rounded-2xl p-6 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Three simple steps to data-driven decisions</p>
          </motion.div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-30" />
            
            <div className="grid lg:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Ask a Question',
                  description: 'Type your business question in plain English. Like talking to a data expert.',
                  icon: MessageSquareText,
                  example: '"Show me monthly sales by region for Q3"',
                },
                {
                  step: '02',
                  title: 'AI Processes',
                  description: 'Gemini AI interprets your intent, queries the data, and selects optimal visualizations.',
                  icon: BrainCircuit,
                  example: 'Understanding context → Querying data → Selecting charts',
                },
                {
                  step: '03',
                  title: 'Get Your Dashboard',
                  description: 'Receive interactive charts, AI insights, and actionable recommendations instantly.',
                  icon: LayoutDashboard,
                  example: 'Charts + Insights + Recommendations',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="glass-bright rounded-3xl p-8 h-full">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-xl shadow-indigo-500/30">
                        {item.step}
                      </div>
                    </div>
                    
                    <div className="pt-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
                        <item.icon className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-3">{item.title}</h3>
                      <p className="text-gray-400 mb-4">{item.description}</p>
                      <div className="glass rounded-xl px-4 py-3 text-sm text-indigo-300 font-mono">
                        {item.example}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Target Persona */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-bright rounded-3xl p-10 md:p-16 relative overflow-hidden"
          >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl rounded-full" />
            
            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm text-indigo-400 mb-6">
                  <Target className="w-4 h-4" />
                  Built For You
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  The Non-Technical Executive
                </h2>
                <p className="text-lg text-gray-400 mb-6">
                  You know what business questions you want to ask. You shouldn&apos;t need to learn 
                  SQL or configure complex BI tools to get answers.
                </p>
                <ul className="space-y-4">
                  {[
                    'Ask questions in plain English',
                    'Get instant visual dashboards',
                    'No technical skills required',
                    'AI-powered recommendations',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="relative">
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                      CXO
                    </div>
                    <div>
                      <p className="font-semibold text-white">Executive User</p>
                      <p className="text-sm text-gray-400">Chief Experience Officer</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between glass rounded-lg px-4 py-3">
                      <span className="text-gray-400">SQL Knowledge</span>
                      <span className="text-red-400">Not Required</span>
                    </div>
                    <div className="flex items-center justify-between glass rounded-lg px-4 py-3">
                      <span className="text-gray-400">Time to Dashboard</span>
                      <span className="text-green-400">Seconds</span>
                    </div>
                    <div className="flex items-center justify-between glass rounded-lg px-4 py-3">
                      <span className="text-gray-400">Input Method</span>
                      <span className="text-indigo-400">Natural Language</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-3xl rounded-full" />
            
            <div className="relative glass-bright rounded-3xl p-12 md:p-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Transform
                <br />
                <span className="gradient-text">Your Data Experience?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Join the future of Business Intelligence. Ask questions, get answers, make decisions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/query"
                  className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-2xl font-semibold text-white text-lg shadow-xl shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 hover:scale-105"
                >
                  Start Asking Questions
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/upload"
                  className="flex items-center gap-2 px-10 py-5 glass hover:bg-white/10 rounded-2xl font-semibold text-white text-lg transition-all"
                >
                  <Upload className="w-5 h-5" />
                  Upload Your Data
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">InsightGPT Enterprise</h3>
                <p className="text-xs text-gray-500">AI-Powered Business Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-500">
              <span>Powered by Google Gemini</span>
              <span>•</span>
              <span>Built for Hackathon 2024</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
