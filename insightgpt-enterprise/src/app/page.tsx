'use client';
// InsightGPT Enterprise - Landing Page
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart2,
  Brain,
  MessageSquareText,
  Database,
  Upload,
  Sparkles,
  Zap,
  ArrowRight,
  TrendingUp,
  Mic,
  PieChart,
  Search,
  CheckCircle,
  LayoutDashboard,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Ask questions in plain English — get instant charts, insights, and dashboards powered by Gemini AI.',
    color: 'from-purple-500 to-pink-500',
    href: '/query',
  },
  {
    icon: Mic,
    title: 'Voice Queries',
    description: 'Speak your questions naturally. Voice recognition converts speech to data queries instantly.',
    color: 'from-indigo-500 to-blue-500',
    href: '/query',
  },
  {
    icon: BarChart2,
    title: 'Auto-Generated Charts',
    description: 'Bar, line, pie, area, scatter — the AI picks the best visualization for your question.',
    color: 'from-emerald-500 to-teal-500',
    href: '/query',
  },
  {
    icon: Zap,
    title: 'What-If Simulation',
    description: 'Run scenario simulations. Change parameters and see projected business impact in real-time.',
    color: 'from-amber-500 to-orange-500',
    href: '/simulation',
  },
  {
    icon: Upload,
    title: 'Upload Any Dataset',
    description: 'Drag & drop your CSV files. All pages instantly update to analyze your custom data.',
    color: 'from-rose-500 to-red-500',
    href: '/upload',
  },
  {
    icon: Sparkles,
    title: 'Smart Insights',
    description: 'AI automatically detects trends, anomalies, and opportunities hidden in your data.',
    color: 'from-cyan-500 to-blue-500',
    href: '/insights',
  },
];

const steps = [
  { step: '01', title: 'Upload Your Data', description: 'Drop any CSV file — or use the built-in insurance claims dataset', icon: Upload },
  { step: '02', title: 'Ask Questions', description: 'Type or speak your question in natural language — no SQL needed', icon: Search },
  { step: '03', title: 'Get Dashboards', description: 'AI generates interactive charts, insights, and recommendations instantly', icon: LayoutDashboard },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-1/3 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-200px] right-1/4 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-[-100px] w-[400px] h-[400px] bg-pink-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">InsightGPT</h1>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-[0.2em] uppercase">Enterprise</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it Works</a>
          <a href="#demo" className="text-sm text-gray-400 hover:text-white transition-colors">Demo</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Powered by Google Gemini AI
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6">
              Ask Questions.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Get Dashboards.
              </span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-xl">
              Transform natural language into stunning, interactive dashboards in real-time. <strong className="text-gray-200">No SQL. No coding. No waiting.</strong>
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/query">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all"
                >
                  <MessageSquareText className="w-4 h-4" />
                  Start Asking
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </Link>
              <Link href="/dashboard">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-7 py-3.5 border border-gray-700 hover:border-gray-500 rounded-xl font-semibold text-gray-300 hover:text-white transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  View Dashboard
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Right - App Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* Browser mockup */}
            <div className="relative bg-[#0d1225] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Browser bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-[#0a0f1e]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-gray-800/50 rounded-lg text-xs text-gray-500 font-mono">
                    insightgpt.app/query
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">Dashboard Generated</span>
                </div>
              </div>

              {/* Chat content */}
              <div className="p-6 space-y-5">
                {/* User query */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <MessageSquareText className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-200">
                    Which insurer has the highest claim settlement ratio?
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>

                {/* AI response */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-400 font-semibold tracking-wide uppercase">AI Insight</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Based on your query, I&apos;ve analyzed the data and found 3 key insights with actionable recommendations.
                  </p>
                </div>

                {/* Mini charts */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 font-medium">Revenue Trend</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {[40, 55, 45, 65, 50, 70, 60].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-sm opacity-80" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#111827] border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 font-medium">Distribution</span>
                      <PieChart className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div className="flex items-center justify-center h-12">
                      <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-purple-500 border-r-pink-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Three simple steps to go from raw data to actionable insights</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center group hover:border-indigo-500/30 transition-all"
            >
              <div className="text-6xl font-black text-white/[0.03] absolute top-4 right-6">{step.step}</div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-5">
                <step.icon className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.description}</p>
              {index < 2 && (
                <div className="hidden md:block absolute right-[-20px] top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-gray-700" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Everything you need to understand your data — powered by AI</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <Link key={feature.title} href={feature.href}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all cursor-pointer h-full"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Demo / CTA Section */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center p-12 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to explore your data?</h2>
          <p className="text-gray-400 max-w-lg mx-auto mb-8">
            Upload your own dataset or explore the built-in insurance claims data with AI-powered analytics.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/upload">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-semibold text-white shadow-xl shadow-indigo-500/30 transition-all"
              >
                <Upload className="w-4 h-4" />
                Upload Your Dataset
              </motion.div>
            </Link>
            <Link href="/query">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-8 py-3.5 border border-gray-700 hover:border-gray-500 rounded-xl font-semibold text-gray-300 hover:text-white transition-all"
              >
                Explore Demo Data
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-8 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span>InsightGPT Enterprise &copy; {new Date().getFullYear()}</span>
          </div>
          <p>Powered by Gemini AI + Next.js</p>
        </div>
      </footer>
    </div>
  );
}
