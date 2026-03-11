// InsightGPT Enterprise - Google Gemini AI Integration
// Advanced RAG-based Natural Language to Dashboard System
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisResult, ChartConfig, AIInsight, QueryIntent, DatasetAnalysis } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_KEY_BACKUP = process.env.GEMINI_API_KEY_BACKUP || process.env.NEXT_PUBLIC_GEMINI_API_KEY_BACKUP || '';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const genAIBackup = GEMINI_API_KEY_BACKUP ? new GoogleGenerativeAI(GEMINI_API_KEY_BACKUP) : null;

// ============================================================================
// MODEL SELECTION WITH FALLBACK
// ============================================================================
async function getModelWithFallback() {
  // Try gemini-2.5-flash first, fallback to gemini-2.0-flash if it fails
  const primaryModel = 'gemini-2.5-flash';
  const fallbackModel = 'gemini-2.0-flash';
  
  return {
    primary: genAI.getGenerativeModel({ model: primaryModel }),
    fallback: genAI.getGenerativeModel({ model: fallbackModel }),
    primaryBackup: genAIBackup ? genAIBackup.getGenerativeModel({ model: primaryModel }) : null,
    fallbackBackup: genAIBackup ? genAIBackup.getGenerativeModel({ model: fallbackModel }) : null,
    primaryName: primaryModel,
    fallbackName: fallbackModel
  };
}

async function generateContentWithFallback(prompt: string) {
  const models = await getModelWithFallback();
  
  // Try primary key with primary model
  try {
    const result = await models.primary.generateContent(prompt);
    return result;
  } catch (error: any) {
    console.log(`Primary model ${models.primaryName} failed:`, error?.status || error?.message);
    
    // Try primary key with fallback model
    try {
      console.log(`Trying ${models.fallbackName} with primary key`);
      const result = await models.fallback.generateContent(prompt);
      return result;
    } catch (fallbackError: any) {
      console.log(`Primary key ${models.fallbackName} also failed:`, fallbackError?.status || fallbackError?.message);
      
      // Try backup API key with primary model if available
      if (models.primaryBackup) {
        try {
          console.log(`Trying backup API key with ${models.primaryName}`);
          const result = await models.primaryBackup.generateContent(prompt);
          return result;
        } catch (backupError: any) {
          console.log(`Backup key ${models.primaryName} failed:`, backupError?.status || backupError?.message);
          
          // Final attempt: backup key with fallback model
          if (models.fallbackBackup) {
            try {
              console.log(`Final attempt: backup key with ${models.fallbackName}`);
              const result = await models.fallbackBackup.generateContent(prompt);
              return result;
            } catch (finalError) {
              console.error('All API key and model combinations failed:', finalError);
              throw finalError;
            }
          }
          throw backupError;
        }
      }
      throw fallbackError;
    }
  }
}

// ============================================================================
// DYNAMIC DATA SCHEMA BUILDER
// ============================================================================

// Default schema for the built-in insurance dataset
const DEFAULT_DATA_SCHEMA = `
## DATASET: India Life Insurance Claims Dataset (Individual Death Claims)

### AVAILABLE COLUMNS (Use EXACT names):
| Column Name | Type | Description |
|-------------|------|-------------|
| life_insurer | string | Insurance company name |
| year | string | Financial year |
| claims_pending_start_no | number | Pending claims at start |
| claims_pending_start_amt | number | Pending amount at start |
| claims_intimated_no | number | New claims reported |
| claims_intimated_amt | number | New claims amount |
| total_claims_no | number | Total claims for processing |
| total_claims_amt | number | Total claims amount |
| claims_paid_no | number | Claims settled/paid |
| claims_paid_amt | number | Amount paid |
| claims_repudiated_no | number | Claims denied |
| claims_repudiated_amt | number | Repudiated amount |
| claims_rejected_no | number | Claims rejected |
| claims_rejected_amt | number | Rejected amount |
| claims_unclaimed_no | number | Unclaimed claims |
| claims_unclaimed_amt | number | Unclaimed amount |
| claims_pending_end_no | number | Pending at end |
| claims_pending_end_amt | number | Pending amount at end |
| claims_paid_ratio_no | number | Settlement ratio (0-1) |
| claims_paid_ratio_amt | number | Settlement ratio by amount (0-1) |
| claims_repudiated_rejected_ratio_no | number | Rejection ratio (0-1) |
| claims_repudiated_rejected_ratio_amt | number | Rejection ratio by amount (0-1) |
| claims_pending_ratio_no | number | Pending ratio (0-1) |
| claims_pending_ratio_amt | number | Pending ratio by amount (0-1) |
`;

/**
 * Build a dynamic schema string from any dataset by analyzing its columns, types, and sample values.
 */
function buildDynamicSchema(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return DEFAULT_DATA_SCHEMA;

  const columns = Object.keys(data[0]);
  const numericCols: string[] = [];
  const categoricalCols: string[] = [];
  const columnInfo: { name: string; type: string; samples: string }[] = [];

  for (const col of columns) {
    const nonNullValues = data
      .map(r => r[col])
      .filter(v => v !== null && v !== undefined && v !== '');
    const sample = nonNullValues.slice(0, 5);
    const isNumeric = nonNullValues.length > 0 && nonNullValues.every(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''));

    if (isNumeric) {
      numericCols.push(col);
      const nums = nonNullValues.map(Number);
      columnInfo.push({
        name: col,
        type: 'number',
        samples: `min=${Math.min(...nums)}, max=${Math.max(...nums)}`,
      });
    } else {
      categoricalCols.push(col);
      const uniqueVals = [...new Set(nonNullValues.map(String))];
      columnInfo.push({
        name: col,
        type: 'string',
        samples: uniqueVals.slice(0, 8).join(', ') + (uniqueVals.length > 8 ? ` (${uniqueVals.length} unique)` : ''),
      });
    }
  }

  let schema = `## DATASET SCHEMA (${data.length} rows, ${columns.length} columns)\n\n`;
  schema += `### COLUMNS:\n| Column Name | Type | Sample Values |\n|-------------|------|---------------|\n`;
  for (const info of columnInfo) {
    schema += `| ${info.name} | ${info.type} | ${info.samples} |\n`;
  }

  if (categoricalCols.length > 0) {
    schema += `\n### CATEGORICAL COLUMNS (for grouping/filtering): ${categoricalCols.join(', ')}\n`;
  }
  if (numericCols.length > 0) {
    schema += `### NUMERIC COLUMNS (for aggregation/metrics): ${numericCols.join(', ')}\n`;
  }

  schema += `\n### IMPORTANT RULES:\n`;
  schema += `- Only use EXACT column names listed above\n`;
  schema += `- Columns with "ratio" or "rate" in the name are usually 0-1 decimals\n`;
  schema += `- Do NOT invent columns or data that doesn't exist\n`;

  return schema;
}

// Variable to hold the current schema — updated when dataset changes
let DATA_SCHEMA = DEFAULT_DATA_SCHEMA;

/**
 * Call this whenever a new dataset is loaded/uploaded to regenerate the schema
 */
export function updateDataSchema(data: Record<string, unknown>[]): void {
  DATA_SCHEMA = buildDynamicSchema(data);
}

/**
 * Get the first categorical column (for grouping) and first numeric column (for metrics)
 * from a dataset, used as smart defaults in local fallback analysis.
 */
function detectDefaultColumns(data: Record<string, unknown>[]): { dimension: string; metric: string; allNumeric: string[]; allCategorical: string[] } {
  if (!data || data.length === 0) return { dimension: 'name', metric: 'value', allNumeric: [], allCategorical: [] };
  const columns = Object.keys(data[0]);
  const allNumeric: string[] = [];
  const allCategorical: string[] = [];

  for (const col of columns) {
    const sample = data.slice(0, 20).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
    const isNumeric = sample.length > 0 && sample.every(v => typeof v === 'number');
    if (isNumeric) allNumeric.push(col);
    else allCategorical.push(col);
  }

  return {
    dimension: allCategorical[0] || columns[0],
    metric: allNumeric[0] || columns[1] || columns[0],
    allNumeric,
    allCategorical,
  };
}

// ============================================================================
// INTELLIGENT CHART SELECTION GUIDE
// ============================================================================
const CHART_SELECTION_GUIDE = `
## CHART TYPE SELECTION RULES (STRICTLY FOLLOW):

### BAR CHART - Use when:
- Comparing values across CATEGORIES (insurers, types)
- Ranking items (top/bottom performers)
- Showing distribution across discrete groups
- Example: "Compare claims paid by each insurer"

### LINE CHART - Use when:
- Showing TRENDS over TIME (years)
- Tracking changes over periods
- Multiple time series comparison
- Example: "How have settlement ratios changed over years?"

### PIE CHART - Use when:
- Showing COMPOSITION (parts of whole)
- Maximum 5-7 slices
- Percentages that sum to 100%
- Example: "What percentage of claims does LIC handle?"

### AREA CHART - Use when:
- Cumulative totals over time
- Stacked composition over time
- Volume/magnitude emphasis
- Example: "Total industry claims over time"

### METRIC CARD - Use when:
- Single KPI or summary statistic
- Average, total, max, min values
- Example: "What is the average settlement ratio?"

### COMPOSED CHART (Bar + Line) - Use when:
- Comparing amounts AND ratios together
- Two different scales needed
- Example: "Show claims amount and settlement ratio together"

### SCATTER CHART - Use when:
- Correlation between two numeric variables
- Example: "Is there a relationship between claims volume and rejection rate?"

### RADAR CHART - Use when:
- Multi-dimensional comparison of few entities
- 4-8 metrics compared
- Example: "Compare LIC vs HDFC across all metrics"
`;

// ============================================================================
// QUERY CLASSIFICATION & HANDLING
// ============================================================================
const QUERY_CLASSIFICATION_PROMPT = `
## QUERY CLASSIFICATION INSTRUCTIONS:

FIRST, classify the user query into ONE of these categories:

1. **GREETING**: Simple greetings like "hi", "hello", "hey", "good morning", or questions about this project/app/system ("what is this", "what does this do", "tell me about this project")
   → Response: Friendly greeting + explain that this is InsightGPT Enterprise, an AI-powered BI analytics platform for analyzing datasets with natural language

2. **DATA_QUERY**: Questions about the loaded dataset/data analysis. Also handle MISSPELLED data queries — try to understand the intent even if words are misspelled (e.g. "compre" = "compare", "insurrs" = "insurers", "settlemnt" = "settlement", "trnds" = "trends")
   → Response: Full analysis with charts, insights, narrative

3. **CAPABILITY_QUERY**: Questions about what this system can do, how to use it
   → Response: Explain available analysis capabilities

4. **OUT_OF_SCOPE**: General questions NOT related to data analysis or this app (e.g. science, math, coding, history)
   → Response: Politely explain this is a data analytics tool and redirect to data-related queries

5. **AMBIGUOUS**: Vague queries that need clarification
   → Response: Ask for clarification with specific suggestions

## HALLUCINATION PREVENTION RULES:
- NEVER invent data or statistics not derivable from the dataset
- NEVER claim to have data that doesn't exist (no geographic, demographic, monthly data)
- If asked about unavailable data, explicitly state "This information is not available in the current dataset"
- Only use columns that EXACTLY match the schema
`;

export async function analyzeQuery(
  query: string,
  datasetAnalysis?: DatasetAnalysis,
  conversationContext?: string,
  data?: Record<string, unknown>[]
): Promise<AIAnalysisResult> {
  try {
    const systemPrompt = `You are InsightGPT Enterprise, an intelligent Business Intelligence assistant that converts natural language queries into interactive data dashboards.

${QUERY_CLASSIFICATION_PROMPT}

${DATA_SCHEMA}

${CHART_SELECTION_GUIDE}

${conversationContext ? `## CONVERSATION CONTEXT:\n${conversationContext}\n` : ''}

## USER QUERY: "${query}"

## YOUR TASK:
1. First, CLASSIFY the query type (greeting/data_query/capability_query/out_of_scope/ambiguous)
2. For DATA_QUERY: Generate proper analysis with correct chart selection. Try to understand misspelled words.
3. For other types: Generate appropriate conversational response

## RESPONSE FORMAT (JSON):
{
  "queryType": "greeting|data_query|capability_query|out_of_scope|ambiguous",
  "intent": {
    "action": "compare|trend|breakdown|aggregate|filter|rank|none",
    "metrics": ["EXACT column names from schema"],
    "dimensions": ["EXACT column names for grouping"],
    "filters": {"column": "value"},
    "timeRange": "specific year or null",
    "limit": number or null,
    "sortBy": "column name or null",
    "sortOrder": "asc|desc"
  },
  "charts": [
    {
      "type": "bar|line|pie|area|scatter|radar|composed|metric",
      "title": "Descriptive chart title",
      "description": "What this visualization shows",
      "xAxis": "EXACT column name for x-axis",
      "yAxis": ["EXACT column name(s) for y-axis"],
      "reasoning": "Why this chart type was selected"
    }
  ],
  "insights": [
    {
      "id": "unique_id",
      "type": "trend|anomaly|comparison|recommendation|summary",
      "title": "Concise insight title",
      "description": "Detailed explanation with specific data references",
      "confidence": 0.0-1.0,
      "impact": "high|medium|low"
    }
  ],
  "narrative": "Natural language explanation of the analysis - conversational for greetings, analytical for data queries",
  "suggestions": ["3-5 specific follow-up questions relevant to this query"],
  "confidence": 0.0-1.0,
  "dataLimitations": ["Any relevant data limitations for this query"]
}`;

    const result = await generateContentWithFallback(systemPrompt);
    const response = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Handle non-data queries specially
    if (parsed.queryType === 'greeting') {
      return {
        query,
        intent: { action: 'none', metrics: [], dimensions: [], filters: {} },
        charts: [],
        insights: [],
        narrative: parsed.narrative || "Hello! I'm InsightGPT Enterprise, your AI-powered insurance analytics assistant. I can help you analyze the India Life Insurance Claims dataset. Try asking me things like:\n\n• \"Compare settlement ratios across insurers\"\n• \"Show me claims trends over the years\"\n• \"Which insurer has the lowest rejection rate?\"\n• \"What's the total claims paid by LIC?\"\n\nWhat would you like to explore?",
        suggestions: parsed.suggestions || [
          'Show top 5 insurers by claims paid',
          'Compare LIC vs private insurers',
          'What are the settlement ratio trends?',
          'Which insurer has lowest pending claims?',
        ],
        confidence: 1.0,
      };
    }
    
    if (parsed.queryType === 'general_knowledge' || parsed.queryType === 'out_of_scope') {
      return {
        query,
        intent: { action: 'none', metrics: [], dimensions: [], filters: {} },
        charts: [],
        insights: [],
        narrative: "I'm designed specifically for **data analysis**. I can help you explore and visualize your dataset!\n\nTry asking:\n• \"Show top 10 by value\"\n• \"Compare across categories\"\n• \"What are the trends over time?\"\n• \"Which category has the highest value?\"",
        suggestions: [
          'Show an overview of the data',
          'Compare values across categories',
          'Top 10 items by value',
          'Show trends over time',
        ],
        confidence: 0.9,
      };
    }
    
    if (parsed.queryType === 'ambiguous') {
      return {
        query,
        intent: { action: 'none', metrics: [], dimensions: [], filters: {} },
        charts: [],
        insights: [],
        narrative: parsed.narrative || "I'd like to help, but I need a bit more detail. Could you specify:\n\n• Which metric you want to analyze (claims paid, settlement ratio, rejections)?\n• Which insurers or time period to focus on?\n• What type of comparison or trend you're looking for?",
        suggestions: parsed.suggestions || [
          'Show total claims by insurer for 2021-22',
          'Compare settlement ratios: LIC vs HDFC',
          'Trend of rejection rates over all years',
        ],
        confidence: 0.6,
      };
    }
    
    // For data queries, return full analysis
    return {
      query,
      intent: parsed.intent || { action: 'aggregate', metrics: ['claims_paid_no'], dimensions: ['life_insurer'], filters: {} },
      charts: parsed.charts || [],
      insights: parsed.insights || [],
      narrative: parsed.narrative || '',
      suggestions: parsed.suggestions || [],
      confidence: parsed.confidence || 0.8,
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    const fallback = getDefaultAnalysis(query, data);
    // Only show warning for data queries, not greetings/chat
    if (fallback.intent.action !== 'none') {
      fallback.narrative = `⚠️ AI service is temporarily unavailable — using local analysis.\n\n${fallback.narrative}`;
    }
    return fallback;
  }
}

export async function generateInsights(
  data: Record<string, unknown>[],
  context?: string
): Promise<AIInsight[]> {
  try {
    const sampleData = data.slice(0, 20);
    
    const prompt = `${DATA_SCHEMA}

Analyze this insurance claims data and generate business insights:

DATA SAMPLE (${data.length} total rows):
${JSON.stringify(sampleData, null, 2)}

${context ? `CONTEXT: ${context}` : ''}

Generate 5-7 actionable business insights. Respond in JSON format:
{
  "insights": [
    {
      "id": "unique_id",
      "type": "trend|anomaly|comparison|recommendation|summary",
      "priority": "high|medium|low",
      "title": "Short human-readable insight title (e.g. 'LIC Dominates Claim Volume')",
      "description": "Detailed explanation with specific numbers from the data",
      "confidence": 0.0-1.0,
      "impact": "high|medium|low",
      "category": "Claims|Financial|Market Share|Risk|Performance|Efficiency",
      "recommendation": "Specific actionable recommendation",
      "suggestedAction": "Concrete next step to take",
      "relatedMetrics": ["relevant column names"],
      "metrics": [{"label": "Key Metric Name", "value": "value with unit"}]
    }
  ]
}`;

    const result = await generateContentWithFallback(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return [];
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.insights || [];
  } catch (error) {
    console.error('Insight Generation Error:', error);
    // Local fallback: generate basic insights from data statistics
    return generateLocalInsights(data);
  }
}

/**
 * Generate insights locally when Gemini API is unavailable.
 */
function generateLocalInsights(data: Record<string, unknown>[]): AIInsight[] {
  if (!data || data.length === 0) return [];
  const insights: AIInsight[] = [];
  const cols = Object.keys(data[0]);
  const numericCols = cols.filter(c => data.slice(0, 10).some(r => typeof r[c] === 'number'));
  const categoricalCols = cols.filter(c => !numericCols.includes(c));

  // Helper to make column names readable
  const readable = (col: string) => col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Insight 1: Dataset summary
  insights.push({
    id: 'local-summary',
    type: 'summary',
    priority: 'medium',
    title: 'Dataset Overview',
    description: `The dataset contains ${data.length} records with ${cols.length} columns (${numericCols.length} numeric, ${categoricalCols.length} categorical). This provides a comprehensive view for analysis.`,
    confidence: 1.0,
    impact: 'medium',
    category: 'Performance',
    recommendation: 'Review the data distribution across all columns for deeper insights.',
    suggestedAction: 'Run the AI Copilot to ask specific questions about the data.',
    metrics: [
      { label: 'Total Records', value: data.length },
      { label: 'Columns', value: cols.length },
      { label: 'Numeric Fields', value: numericCols.length },
    ],
  });

  // Insight 2: Top numeric column stats with better titles
  for (const col of numericCols.slice(0, 3)) {
    const values = data.map(r => Number(r[col])).filter(v => !isNaN(v));
    if (values.length === 0) continue;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
    const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg !== 0 ? ((stdDev / avg) * 100).toFixed(1) : '0';
    
    const isHighVariance = Number(cv) > 100;
    insights.push({
      id: `local-stats-${col}`,
      type: isHighVariance ? 'anomaly' : 'summary',
      priority: isHighVariance ? 'high' : 'medium',
      title: `${readable(col)} Analysis`,
      description: `Across ${values.length} records, the average ${readable(col).toLowerCase()} is ${avg.toFixed(2)} with a range of ${min.toLocaleString()} to ${max.toLocaleString()}. The median is ${median.toFixed(2)} and coefficient of variation is ${cv}%.${isHighVariance ? ' High variance detected — values are spread widely.' : ''}`,
      confidence: 1.0,
      impact: isHighVariance ? 'high' : 'medium',
      category: 'Financial',
      recommendation: isHighVariance ? `Investigate why ${readable(col).toLowerCase()} varies so widely across records.` : `Monitor ${readable(col).toLowerCase()} trends over time for shifts.`,
      suggestedAction: `Filter and explore ${readable(col).toLowerCase()} in the Data Explorer.`,
      metrics: [
        { label: 'Average', value: avg.toFixed(2) },
        { label: 'Median', value: median.toFixed(2) },
        { label: 'Max', value: max.toLocaleString() },
        { label: 'CV', value: `${cv}%` },
      ],
    });
  }

  // Insight 3: Top categorical distribution
  if (categoricalCols.length > 0) {
    const catCol = categoricalCols[0];
    const counts: Record<string, number> = {};
    data.forEach(r => {
      const v = String(r[catCol] || '');
      counts[v] = (counts[v] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top3 = sorted.slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ');
    const topPct = ((sorted[0][1] / data.length) * 100).toFixed(1);
    insights.push({
      id: 'local-distribution',
      type: 'comparison',
      priority: 'medium',
      title: `${readable(catCol)} Market Distribution`,
      description: `Most frequent in ${readable(catCol).toLowerCase()}: ${top3}. The leader holds ${topPct}% market share out of ${sorted.length} unique entities.`,
      confidence: 1.0,
      impact: 'medium',
      category: 'Market Share',
      recommendation: `Analyze performance differences between top and bottom ${readable(catCol).toLowerCase()} entities.`,
      suggestedAction: `Compare the top 5 ${readable(catCol).toLowerCase()} values in the Query page.`,
      metrics: [
        { label: 'Top Entity', value: sorted[0][0] },
        { label: 'Market Share', value: `${topPct}%` },
        { label: 'Unique Values', value: sorted.length },
      ],
    });
  }

  // Insight 4: Identify highest-value records
  if (numericCols.length > 0) {
    const mainCol = numericCols[0];
    const withVal = data.map((r, i) => ({ idx: i, val: Number(r[mainCol]) })).filter(v => !isNaN(v.val));
    withVal.sort((a, b) => b.val - a.val);
    const top3Val = withVal.slice(0, 3);
    const topSum = top3Val.reduce((s, v) => s + v.val, 0);
    const totalSum = withVal.reduce((s, v) => s + v.val, 0);
    const topPct = totalSum > 0 ? ((topSum / totalSum) * 100).toFixed(1) : '0';
    insights.push({
      id: 'local-top-records',
      type: 'recommendation',
      priority: 'high',
      title: `Top Records by ${readable(mainCol)}`,
      description: `The top 3 records account for ${topPct}% of the total ${readable(mainCol).toLowerCase()} (${topSum.toLocaleString()} out of ${totalSum.toLocaleString()}).`,
      confidence: 0.95,
      impact: 'high',
      category: 'Financial',
      recommendation: 'Focus analysis on the highest-value records to understand key drivers.',
      suggestedAction: 'Use Data Explorer to filter and examine top records.',
      metrics: [
        { label: 'Top 3 Total', value: topSum.toLocaleString() },
        { label: 'Share of Total', value: `${topPct}%` },
      ],
    });
  }

  return insights;
}

export async function generateNarrative(
  chartData: Record<string, unknown>[],
  chartType: string,
  chartTitle: string
): Promise<string> {
  try {
    const prompt = `${DATA_SCHEMA}

You are a business analyst writing a data story. Based on this ${chartType} chart titled "${chartTitle}":

DATA:
${JSON.stringify(chartData.slice(0, 15), null, 2)}

Write a 2-3 sentence narrative summary explaining what the data shows, highlighting key findings and any notable patterns or outliers. Be specific with numbers. Respond with just the narrative text, no JSON.`;

    const result = await generateContentWithFallback(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Narrative Generation Error:', error);
    // Local fallback narrative
    if (chartData.length > 0) {
      const keys = Object.keys(chartData[0]).filter(k => typeof chartData[0][k] === 'number');
      const firstKey = keys[0];
      if (firstKey) {
        const values = chartData.map(r => Number(r[firstKey])).filter(v => !isNaN(v));
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        return `This ${chartType} chart "${chartTitle}" shows ${chartData.length} data points. The average ${firstKey.replace(/_/g, ' ')} is ${avg.toFixed(2)}.`;
      }
    }
    return `This ${chartType} chart shows the requested data. AI narrative generation is temporarily unavailable.`;
  }
}

export async function runSimulation(
  originalData: Record<string, unknown>[],
  parameters: { name: string; currentValue: number; newValue: number }[]
): Promise<{ simulatedData: Record<string, unknown>[]; summary: string }> {
  try {
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

    const result = await generateContentWithFallback(prompt);
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

function getDefaultAnalysis(query: string, data?: Record<string, unknown>[]): AIAnalysisResult {
  const q = query.toLowerCase().trim().replace(/[.!?,]+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Check if query looks like a greeting or non-data chat
  const greetingWords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'hii', 'hiii', 'yo', 'sup', 'whats up', 'what\'s up'];
  const isGreeting = greetingWords.some(g => q === g || q.startsWith(g + ' ') || new RegExp(`\\b${g}\\b`).test(q)) ||
    /^(hi|hey|hello|yo)\b/i.test(q);
  
  if (isGreeting) {
    return {
      query,
      intent: { action: 'none', metrics: [], dimensions: [], filters: {} },
      charts: [],
      insights: [],
      narrative: "Hello! 👋 I'm InsightGPT Enterprise, your AI-powered data analytics assistant.\n\nI can help you with:\n\n📊 **Data Analysis** — Ask questions about your dataset\n📈 **Track trends** over time\n🔍 **Find** top/bottom performers\n💡 **Generate insights** from data\n\nTry asking:\n• \"Show data by category\"\n• \"What are the trends over time?\"\n• \"Top 5 items by value\"",
      suggestions: [
        'Show an overview of the data',
        'Compare values across categories',
        'What are the trends over time?',
        'Top 10 items by value',
        'Show distribution breakdown',
      ],
      confidence: 1.0,
    };
  }
  
  // Check if this is a general knowledge question (not about the data)
  const isDataRelated = /(claim|insur|ratio|trend|compar|show|paid|reject|pending|total|top|bottom|best|worst|year|lic|hdfc|sbi|icici|data|chart|graph|plot|analyz|metric|column|row|record|dataset|average|sum|count|max|min|median|filter|sort|group|breakdown|distribution)/i.test(q);
  
  if (!isDataRelated && q.split(' ').length >= 3) {
    // Non-data question — redirect to data queries
    return {
      query,
      intent: { action: 'none', metrics: [], dimensions: [], filters: {} },
      charts: [],
      insights: [],
      narrative: "I'm designed specifically for **data analysis**. I can help you explore and visualize your dataset!\n\nTry asking:\n• \"Show top 10 by value\"\n• \"Compare across categories\"\n• \"Show trends over time\"",
      suggestions: [
        'Show an overview of the data',
        'Top 10 items by value',
        'Compare across categories',
      ],
      confidence: 0.5,
    };
  }
  
  // ============================================================================
  // SMART LOCAL QUERY PARSER — works generically for ANY dataset
  // ============================================================================

  // Detect columns from current data
  const { dimension, metric, allNumeric, allCategorical } = data && data.length > 0
    ? detectDefaultColumns(data)
    : { dimension: 'life_insurer', metric: 'claims_paid_no', allNumeric: ['claims_paid_no'], allCategorical: ['life_insurer'] };

  // Try to match query words to actual column names
  let selectedMetric = metric;
  let metricLabel = metric.replace(/_/g, ' ');
  
  for (const col of allNumeric) {
    const colWords = col.replace(/_/g, ' ').toLowerCase();
    if (q.includes(colWords) || colWords.split(' ').some(w => w.length > 3 && q.includes(w))) {
      selectedMetric = col;
      metricLabel = col.replace(/_/g, ' ');
      break;
    }
  }

  // Also check hardcoded insurance patterns for backward compatibility
  const metricPatterns: { pattern: RegExp; metric: string; label: string }[] = [
    { pattern: /settl(e|ement)\s*(ratio|rate)?/i, metric: 'claims_paid_ratio_no', label: 'Settlement Ratio' },
    { pattern: /reject(ion|ed)?\s*(ratio|rate)?/i, metric: 'claims_repudiated_rejected_ratio_no', label: 'Rejection Ratio' },
    { pattern: /repudiat/i, metric: 'claims_repudiated_rejected_ratio_no', label: 'Rejection Ratio' },
    { pattern: /pending\s*(ratio|rate)?/i, metric: 'claims_pending_ratio_no', label: 'Pending Ratio' },
    { pattern: /claims?\s*paid\s*(amount|amt|value|money)/i, metric: 'claims_paid_amt', label: 'Claims Paid (₹)' },
    { pattern: /claims?\s*paid/i, metric: 'claims_paid_no', label: 'Claims Paid' },
    { pattern: /total\s*claims?\s*(amount|amt|value|money)/i, metric: 'total_claims_amt', label: 'Total Claims (₹)' },
    { pattern: /total\s*claims?/i, metric: 'total_claims_no', label: 'Total Claims' },
    { pattern: /intimat(ed|ion)/i, metric: 'claims_intimated_no', label: 'Claims Intimated' },
    { pattern: /(claim|payout)\s*(amount|amt|value|money)/i, metric: 'claims_paid_amt', label: 'Claim Amount (₹)' },
  ];
  
  // Only use insurance patterns if those columns exist
  for (const mp of metricPatterns) {
    if (mp.pattern.test(q) && allNumeric.includes(mp.metric)) {
      selectedMetric = mp.metric;
      metricLabel = mp.label;
      break;
    }
  }
  
  // Detect action type
  let action: 'compare' | 'trend' | 'rank' | 'aggregate' | 'breakdown' = 'aggregate';
  let chartType: 'bar' | 'line' | 'pie' = 'bar';
  
  if (/trend|over\s*(the\s*)?(year|time)|year[\s-]*(wise|by)|by\s*year|annually/i.test(q)) {
    action = 'trend';
    chartType = 'line';
  } else if (/compar(e|ison)|vs\.?|versus|against/i.test(q)) {
    action = 'compare';
    chartType = 'bar';
  } else if (/top\s*\d+|bottom\s*\d+|best|worst|highest|lowest|rank/i.test(q)) {
    action = 'rank';
    chartType = 'bar';
  } else if (/breakdown|distribution|share|percent|%/i.test(q)) {
    action = 'breakdown';
    chartType = 'pie';
  }
  
  // Detect time filter
  let timeRange: string | undefined;
  const yearMatch = q.match(/20(1[0-9]|2[0-4])[-\s]*(1[0-9]|2[0-5])?/);
  if (yearMatch) {
    timeRange = yearMatch[0];
  }
  
  // Detect specific filter values from categorical columns
  const filters: Record<string, string | string[]> = {};
  
  // Check for categorical values mentioned in the query
  if (data && data.length > 0) {
    for (const catCol of allCategorical.slice(0, 3)) {
      const uniqueVals = [...new Set(data.map(r => String(r[catCol] || '')))];
      const matchedVals = uniqueVals.filter(v => v.length > 2 && q.includes(v.toLowerCase()));
      if (matchedVals.length === 1) {
        filters[catCol] = matchedVals[0];
      } else if (matchedVals.length > 1) {
        filters[catCol] = matchedVals;
      }
    }
  }
  
  // Detect limit (top N)
  let limit: number | undefined;
  const limitMatch = q.match(/top\s*(\d+)|(\d+)\s*(best|top)/i);
  if (limitMatch) {
    limit = parseInt(limitMatch[1] || limitMatch[2]);
  }
  const bottomMatch = q.match(/bottom\s*(\d+)|(\d+)\s*(worst|bottom)/i);
  if (bottomMatch) {
    limit = parseInt(bottomMatch[1] || bottomMatch[2]);
  }
  
  // Build dimensions — detect time column for trends
  const timeCol = allCategorical.find(c => /year|date|time|month|quarter|period/i.test(c)) || (allCategorical.includes('year') ? 'year' : undefined);
  const dimensions: string[] = action === 'trend' && timeCol ? [timeCol] : [dimension];
  
  // Sort order
  const sortOrder = bottomMatch || /worst|lowest|minimum/.test(q) ? 'asc' as const : 'desc' as const;
  
  // Build chart title
  let chartTitle = metricLabel;
  if (action === 'trend') {
    chartTitle = `${metricLabel} Over Time`;
  } else if (action === 'rank' && limit) {
    chartTitle = `Top ${limit} by ${metricLabel}`;
  } else {
    chartTitle = `${metricLabel} by ${dimension.replace(/_/g, ' ')}`;
  }
  if (timeRange) {
    chartTitle += ` (${timeRange})`;
  }
  
  return {
    query,
    intent: {
      action,
      metrics: [selectedMetric],
      dimensions,
      filters,
      timeRange,
      limit,
      sortBy: selectedMetric,
      sortOrder,
    },
    charts: [{
      type: chartType,
      title: chartTitle,
      description: `Analysis based on: "${query}"`,
      xAxis: dimensions[0],
      yAxis: [selectedMetric],
      data: [],
    }],
    insights: [],
    narrative: `Showing ${metricLabel.toLowerCase()} ${action === 'trend' ? 'trends over time' : `by ${dimension.replace(/_/g, ' ')}`}${timeRange ? ` for ${timeRange}` : ''}.`,
    suggestions: [
      action !== 'trend' && timeCol ? 'Show trends over time' : `Compare across ${dimension.replace(/_/g, ' ')}`,
      allNumeric.length > 1 && allNumeric[1] !== selectedMetric ? `Show ${allNumeric[1].replace(/_/g, ' ')}` : 'Show a different metric',
      !timeRange && timeCol ? `Filter by latest ${timeCol}` : 'Show all periods',
      `Top 5 by ${(allNumeric.find(m => m !== selectedMetric) || selectedMetric).replace(/_/g, ' ')}`,
      'Show distribution breakdown',
    ],
    confidence: 0.85,
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
