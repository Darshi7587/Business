// InsightGPT Enterprise - Global State Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  ConversationMessage, 
  DashboardWidget, 
  DatasetAnalysis,
  SimulationScenario,
  AIInsight
} from '@/types';

interface AppStore {
  // Dataset — fully generic, works with any CSV
  dataset: Record<string, unknown>[];
  customDataset: Record<string, unknown>[] | null;
  datasetAnalysis: DatasetAnalysis | null;
  isDataLoaded: boolean;
  
  // Conversations
  conversations: ConversationMessage[];
  isProcessing: boolean;
  
  // Dashboard
  dashboardWidgets: DashboardWidget[];
  activeFilters: Record<string, unknown>;
  
  // Insights
  insights: AIInsight[];
  
  // Simulation
  activeSimulation: SimulationScenario | null;
  
  // UI State
  theme: 'light' | 'dark';
  voiceEnabled: boolean;
  sidebarCollapsed: boolean;
  activePage: string;
  
  // Actions
  setDataset: (data: Record<string, unknown>[]) => void;
  setCustomDataset: (data: Record<string, unknown>[] | null) => void;
  setDatasetAnalysis: (analysis: DatasetAnalysis | null) => void;
  setIsDataLoaded: (loaded: boolean) => void;
  
  addMessage: (message: ConversationMessage) => void;
  updateMessage: (id: string, updates: Partial<ConversationMessage>) => void;
  clearConversations: () => void;
  setIsProcessing: (processing: boolean) => void;
  addConversation: (conversation: { id: string; title: string; messages: ConversationMessage[]; createdAt: string; updatedAt: string }) => void;
  
  addWidget: (widget: DashboardWidget) => void;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  removeWidget: (id: string) => void;
  clearWidgets: () => void;
  setActiveFilters: (filters: Record<string, unknown>) => void;
  
  setInsights: (insights: AIInsight[]) => void;
  addInsight: (insight: AIInsight) => void;
  
  setActiveSimulation: (simulation: SimulationScenario | null) => void;
  
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActivePage: (page: string) => void;
}

export const useAppStore = create<AppStore>()(persist((set) => ({
  // Initial State
  dataset: [],
  customDataset: null,
  datasetAnalysis: null,
  isDataLoaded: false,
  
  conversations: [],
  isProcessing: false,
  
  dashboardWidgets: [],
  activeFilters: {},
  
  insights: [],
  
  activeSimulation: null,
  
  theme: 'dark',
  voiceEnabled: false,
  sidebarCollapsed: false,
  activePage: 'dashboard',
  
  // Actions
  setDataset: (data) => set({ dataset: data, isDataLoaded: true }),
  setCustomDataset: (data) => set({ customDataset: data }),
  setDatasetAnalysis: (analysis) => set({ datasetAnalysis: analysis }),
  setIsDataLoaded: (loaded) => set({ isDataLoaded: loaded }),
  
  addMessage: (message) => set((state) => ({
    conversations: [...state.conversations, message],
  })),
  
  updateMessage: (id, updates) => set((state) => ({
    conversations: state.conversations.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    ),
  })),
  
  clearConversations: () => set({ conversations: [] }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),
  
  addConversation: (conversation) => set((state) => {
    // Replace or add conversation messages by id
    const otherMessages = state.conversations.filter(
      (msg) => !conversation.messages.some((m) => m.id === msg.id)
    );
    return { conversations: [...otherMessages, ...conversation.messages] };
  }),
  
  addWidget: (widget) => set((state) => ({
    dashboardWidgets: [...state.dashboardWidgets, widget],
  })),
  
  updateWidget: (id, updates) => set((state) => ({
    dashboardWidgets: state.dashboardWidgets.map((w) =>
      w.id === id ? { ...w, ...updates } : w
    ),
  })),
  
  removeWidget: (id) => set((state) => ({
    dashboardWidgets: state.dashboardWidgets.filter((w) => w.id !== id),
  })),
  
  clearWidgets: () => set({ dashboardWidgets: [] }),
  
  setActiveFilters: (filters) => set({ activeFilters: filters }),
  
  setInsights: (insights) => set({ insights }),
  addInsight: (insight) => set((state) => ({
    insights: [...state.insights, insight],
  })),
  
  setActiveSimulation: (simulation) => set({ activeSimulation: simulation }),
  
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('insightgpt_theme', theme);
    }
    set({ theme });
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('insightgpt_theme', newTheme);
    }
    return { theme: newTheme };
  }),
  setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setActivePage: (page) => set({ activePage: page }),
}), {
  name: 'insightgpt-store',
  partialize: (state) => ({
    customDataset: state.customDataset,
    theme: state.theme,
    voiceEnabled: state.voiceEnabled,
    sidebarCollapsed: state.sidebarCollapsed,
  }),
}));
