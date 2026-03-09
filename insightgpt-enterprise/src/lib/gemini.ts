// InsightGPT Enterprise - Google Gemini AI Integration
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisResult, ChartConfig, AIInsight, QueryIntent, DatasetAnalysis } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const DATA_SCHEMA = `
You are analyzing the India Life Insurance Claims Dataset. Here's the schema:

COLUMNS:
- life_insurer (string): Insurance company name (e.g., "LIC", "HDFC", "ICICI", "SBI Life", "Max", "Kotak", "Bajaj Allianz", "Tata AIA", etc.)
- year (string): Financial year (e.g., "2021-22", "2020-21", "2019-20", "2018-19")
- claims_pending_start_no (number): Number of pending claims at period start
- claims_pending_start_amt (number): Amount of pending claims at period start
- claims_intimated_no (number): Number of newly reported claims
- claims_intimated_amt (number): Amount of newly reported claims
- total_claims_no (number): Total claims for processing
- total_claims_amt (number): Total claims amount
- claims_paid_no (number): Number of claims paid/settled
- claims_paid_amt (number): Amount of claims paid
- claims_repudiated_no (number): Number of claims denied after investigation
- claims_repudiated_amt (number): Amount of repudiated claims
- claims_rejected_no (number): Number of claims rejected upfront
- claims_rejected_amt (number): Amount of rejected claims
- claims_unclaimed_no (number): Approved but unclaimed claims count
- claims_unclaimed_amt (number): Approved but unclaimed amount
- claims_pending_end_no (number): Pending claims at period end
- claims_pending_end_amt (number): Pending claims amount at period end
- claims_paid_ratio_no (number): Ratio of claims paid (0-1)
- claims_paid_ratio_amt (number): Ratio of claims amount paid (0-1)
- claims_repudiated_rejected_ratio_no (number): Rejection ratio by count
- claims_repudiated_rejected_ratio_amt (number): Rejection ratio by amount
- claims_pending_ratio_no (number): Pending ratio by count
- claims_pending_ratio_amt (number): Pending ratio by amount
- category (string): "Individual Death Claims"

KEY INSURERS: LIC (Life Insurance Corporation), HDFC Life, ICICI Prudential, SBI Life, Max Life, Kotak Mahindra, Bajaj Allianz, Tata AIA, Aditya Birla Sun Life (ABSL), PNB MetLife

IMPORTANT NOTES:
- "Industry" or "Industry Total" rows represent aggregate industry data
- "PVT." or "Private Total" rows represent private sector totals
- Ratio columns are already calculated (0-1 scale, multiply by 100 for percentage)
- Higher claims_paid_ratio means better settlement performance
- Lower claims_repudiated_rejected_ratio means fewer denials
`;

const CHART_SELECTION_GUIDE = `
CHART SELECTION RULES:
1. BAR CHART: Use for comparing values across categories (e.g., claims by insurer)
2. LINE CHART: Use for trends over time (e.g., claims over years)
3. PIE CHART: Use for showing composition/parts of whole (max 7 slices)
4. AREA CHART: Use for cumulative trends or stacked time series
5. SCATTER CHART: Use for correlation between two numeric variables
6. RADAR CHART: Use for comparing multiple metrics across few categories
7. METRIC CARD: Use for single KPI values (e.g., total claims, average ratio)
8. COMPOSED CHART: Use when combining bar and line (e.g., amount and ratio together)

Always prefer bar charts for categorical comparisons and line charts for time-based analysis.
`;

export async function analyzeQuery(
  query: string,
  datasetAnalysis?: DatasetAnalysis,
  conversationContext?: string
): Promise<AIAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const systemPrompt = `${DATA_SCHEMA}

${CHART_SELECTION_GUIDE}

You are InsightGPT Enterprise, an AI-powered Business Intelligence assistant. Analyze the user's question and provide:

1. INTENT: What is the user trying to understand?
2. QUERY PLAN: What data operations are needed?
3. CHARTS: What visualizations best answer this question?
4. INSIGHTS: What business insights can be derived?
5. NARRATIVE: A natural language summary explaining the data story.

${conversationContext ? `CONVERSATION CONTEXT:\n${conversationContext}\n` : ''}

Respond in this exact JSON format:
{
  "intent": {
    "action": "compare|trend|breakdown|aggregate|filter|rank",
    "metrics": ["column names to analyze"],
    "dimensions": ["columns to group by"],
    "filters": {"column": "value"},
    "timeRange": "year filter if any",
    "limit": number or null,
    "sortBy": "column to sort by",
    "sortOrder": "asc|desc"
  },
  "charts": [
    {
      "type": "bar|line|pie|area|scatter|radar|composed|metric",
      "title": "Chart title",
      "description": "What this chart shows",
      "xAxis": "column for x-axis",
      "yAxis": ["column(s) for y-axis"],
      "dataTransformation": "description of how to transform data"
    }
  ],
  "insights": [
    {
      "type": "trend|anomaly|comparison|recommendation|summary",
      "title": "Insight title",
      "description": "Detailed insight",
      "confidence": 0.0-1.0,
      "impact": "high|medium|low"
    }
  ],
  "narrative": "A paragraph explaining the analysis and what the data reveals",
  "suggestions": ["3-5 follow-up questions the user might ask"],
  "confidence": 0.0-1.0
}

USER QUESTION: ${query}`;

    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      query,
      intent: parsed.intent,
      charts: parsed.charts || [],
      insights: parsed.insights || [],
      narrative: parsed.narrative || '',
      suggestions: parsed.suggestions || [],
      confidence: parsed.confidence || 0.8,
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return getDefaultAnalysis(query);
  }
}

export async function generateInsights(
  data: Record<string, unknown>[],
  context?: string
): Promise<AIInsight[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const sampleData = data.slice(0, 20);
    
    const prompt = `${DATA_SCHEMA}

Analyze this insurance claims data and generate business insights:

DATA SAMPLE (${data.length} total rows):
${JSON.stringify(sampleData, null, 2)}

${context ? `CONTEXT: ${context}` : ''}

Generate 3-5 actionable business insights. Respond in JSON format:
{
  "insights": [
    {
      "id": "unique_id",
      "type": "trend|anomaly|comparison|recommendation|summary",
      "title": "Short insight title",
      "description": "Detailed explanation with specific numbers",
      "confidence": 0.0-1.0,
      "impact": "high|medium|low",
      "relatedMetrics": ["relevant column names"]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.insights || [];
  } catch (error) {
    console.error('Insight Generation Error:', error);
    return [];
  }
}

export async function generateNarrative(
  chartData: Record<string, unknown>[],
  chartType: string,
  chartTitle: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `${DATA_SCHEMA}

You are a business analyst writing a data story. Based on this ${chartType} chart titled "${chartTitle}":

DATA:
${JSON.stringify(chartData.slice(0, 15), null, 2)}

Write a 2-3 sentence narrative summary explaining what the data shows, highlighting key findings and any notable patterns or outliers. Be specific with numbers. Respond with just the narrative text, no JSON.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Narrative Generation Error:', error);
    return 'Unable to generate narrative at this time.';
  }
}

export async function runSimulation(
  originalData: Record<string, unknown>[],
  parameters: { name: string; currentValue: number; newValue: number }[]
): Promise<{ simulatedData: Record<string, unknown>[]; summary: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `${DATA_SCHEMA}

You are running a what-if simulation on insurance claims data.

ORIGINAL DATA SAMPLE:
${JSON.stringify(originalData.slice(0, 10), null, 2)}

SIMULATION PARAMETERS:
${parameters.map(p => `- ${p.name}: Change from ${p.currentValue} to ${p.newValue} (${((p.newValue - p.currentValue) / p.currentValue * 100).toFixed(1)}% change)`).join('\n')}

Explain how these changes would affect the business metrics. Consider:
1. Impact on claims processing
2. Financial implications
3. Customer satisfaction effects
4. Risk considerations

Provide a detailed summary paragraph of the simulation results.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();
    
    // Apply simple simulation to data
    const simulatedData = originalData.map(row => {
      const newRow = { ...row };
      parameters.forEach(param => {
        const multiplier = param.newValue / param.currentValue;
        if (typeof newRow[param.name] === 'number') {
          newRow[param.name] = (newRow[param.name] as number) * multiplier;
        }
      });
      return newRow;
    });
    
    return { simulatedData, summary };
  } catch (error) {
    console.error('Simulation Error:', error);
    return { simulatedData: originalData, summary: 'Simulation could not be completed.' };
  }
}

export async function selectChartType(
  data: Record<string, unknown>[],
  intent: QueryIntent
): Promise<ChartConfig['type']> {
  // Rule-based chart selection with AI fallback
  const { action, metrics, dimensions } = intent;
  
  // Time-based → Line chart
  if (dimensions.some(d => d.includes('year') || d.includes('date') || d.includes('time'))) {
    return 'line';
  }
  
  // Single value → Metric card
  if (data.length === 1 && metrics.length === 1) {
    return 'metric';
  }
  
  // Composition (percentages, ratios) with few categories → Pie
  if (metrics.some(m => m.includes('ratio')) && data.length <= 7) {
    return 'pie';
  }
  
  // Comparison across categories → Bar
  if (action === 'compare' || action === 'rank') {
    return 'bar';
  }
  
  // Trend analysis → Line
  if (action === 'trend') {
    return 'line';
  }
  
  // Multiple metrics comparison → Composed
  if (metrics.length > 1) {
    return 'composed';
  }
  
  // Default to bar for categorical data
  return 'bar';
}

function getDefaultAnalysis(query: string): AIAnalysisResult {
  return {
    query,
    intent: {
      action: 'aggregate',
      metrics: ['claims_paid_no'],
      dimensions: ['life_insurer'],
      filters: {},
    },
    charts: [{
      type: 'bar',
      title: 'Claims Overview',
      description: 'Default visualization',
      xAxis: 'life_insurer',
      yAxis: ['claims_paid_no'],
      data: [],
    }],
    insights: [{
      id: '1',
      type: 'summary',
      title: 'Analysis Pending',
      description: 'Please try rephrasing your question for better results.',
      confidence: 0.5,
      impact: 'medium',
    }],
    narrative: 'The system is analyzing your request. Please ensure your question relates to the available insurance claims data.',
    suggestions: [
      'Show claims by insurer',
      'Compare settlement ratios',
      'Which insurer has highest rejections?',
    ],
    confidence: 0.5,
  };
}

export async function refineQuery(
  originalQuery: string,
  refinement: string,
  previousResult: AIAnalysisResult
): Promise<AIAnalysisResult> {
  const context = `
PREVIOUS QUERY: ${originalQuery}
PREVIOUS INTENT: ${JSON.stringify(previousResult.intent)}
USER REFINEMENT: ${refinement}
`;
  
  return analyzeQuery(refinement, undefined, context);
}
