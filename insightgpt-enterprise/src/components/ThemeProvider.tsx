'use client';
// Theme Provider - Handles light/dark mode switching
import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import FloatingChatbot from './FloatingChatbot';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useAppStore();
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('insightgpt_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, [setTheme]);

  useEffect(() => {
    if (!mounted) return;
    
    // Update document class and CSS variables based on theme
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#050816';
      document.body.style.color = '#ffffff';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#1e293b';
    }
  }, [theme, mounted]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return <div className="dark bg-gray-950 text-white min-h-screen">{children}</div>;
  }

  return (
    <div className={theme === 'dark' ? 'dark bg-gray-950 text-white min-h-screen' : 'light bg-slate-50 text-slate-900 min-h-screen'}>
      {children}
      <FloatingChatbot />
    </div>
  );
}
