// InsightGPT Enterprise - Type Definitions

export interface InsuranceClaim {
  [key: string]: string | number | undefined;
  life_insurer: string;
  year: string;
  claims_pending_start_no: number;
  claims_pending_start_amt: number;
  claims_intimated_no: number;
  claims_intimated_amt: number;
  total_claims_no: number;
  total_claims_amt: number;
  claims_paid_no: number;
  claims_paid_amt: number;
  claims_repudiated_no: number;
  claims_repudiated_amt: number;
  claims_rejected_no: number;
  claims_rejected_amt: number;
  claims_unclaimed_no: number;
  claims_unclaimed_amt: number;
  claims_pending_end_no: number;
  claims_pending_end_amt: number;
  claims_paid_ratio_no: number;
  claims_paid_ratio_amt: number;
  claims_repudiated_rejected_ratio_no: number;
  claims_repudiated_rejected_ratio_amt: number;
  claims_pending_ratio_no: number;
  claims_pending_ratio_amt: number;
  category: string;
}

export interface QueryResult {
  data: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  executionTime: number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'radar' | 'composed' | 'metric';
  title: string;
  description?: string;
  xAxis?: string;
  yAxis?: string | string[];
  xKey?: string;
  yKey?: string | string[];
  height?: number;
  showComparison?: boolean;
  data: Record<string, unknown>[];
  colors?: string[];
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'insight';
  title: string;
  config: ChartConfig | MetricConfig | TableConfig | InsightConfig;
  position: { x: number; y: number; w: number; h: number };
}

export interface MetricConfig {
  value: number | string;
  label: string;
  change?: number;
  changeLabel?: string;
  icon?: string;
  color?: string;
}

export interface TableConfig {
  columns: { key: string; label: string; format?: string }[];
  data: Record<string, unknown>[];
  sortable?: boolean;
  pagination?: boolean;
}

export interface InsightConfig {
  insights: AIInsight[];
}

export interface AIInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'comparison' | 'recommendation' | 'summary' | 'opportunity';
  priority?: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  relatedMetrics?: string[];
  metrics?: { label: string; value: string | number }[];
  recommendation?: string;
  category?: string;
  suggestedAction?: string;
}

export interface AIAnalysisResult {
  query: string;
  intent: QueryIntent;
  sqlQuery?: string;
  charts: ChartConfig[];
  insights: AIInsight[];
  narrative: string;
  suggestions: string[];
  confidence: number;
}

export interface QueryIntent {
  action: 'compare' | 'trend' | 'breakdown' | 'aggregate' | 'filter' | 'rank' | 'none';
  metrics: string[];
  dimensions: string[];
  filters: Record<string, unknown>;
  timeRange?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DatasetAnalysis {
  totalRows: number;
  totalColumns: number;
  columns: ColumnAnalysis[];
  missingValues: Record<string, number>;
  correlations: { pair: [string, string]; correlation: number }[];
  suggestedQuestions: string[];
}

export interface ColumnAnalysis {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  uniqueValues: number;
  nullCount: number;
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  mode?: string | number;
  sampleValues: (string | number)[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: SimulationParameter[] | Record<string, number>;
  results?: SimulationResult;
  createdAt?: string;
}

export interface SimulationParameter {
  id?: string;
  name?: string;
  label: string;
  description?: string;
  type: 'percentage' | 'number' | 'multiplier' | 'currency';
  currentValue: number;
  newValue?: number;
  defaultValue?: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export interface SimulationResult {
  originalData: Record<string, unknown>[];
  simulatedData: Record<string, unknown>[];
  changes: { metric: string; original: number; simulated: number; change: number }[];
  summary: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | Date;
  charts?: ChartConfig[];
  chart?: ChartConfig;
  insights?: AIInsight[];
  suggestions?: string[];
  isLoading?: boolean;
}

export interface AppState {
  // Data
  dataset: InsuranceClaim[];
  customDataset: Record<string, unknown>[] | null;
  datasetAnalysis: DatasetAnalysis | null;
  
  // Conversation
  conversations: ConversationMessage[];
  currentQuery: string;
  isProcessing: boolean;
  
  // Dashboard
  dashboardWidgets: DashboardWidget[];
  activeFilters: Record<string, unknown>;
  
  // Simulation
  activeSimulation: SimulationScenario | null;
  
  // Settings
  theme: 'light' | 'dark';
  voiceEnabled: boolean;
}
