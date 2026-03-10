// InsightGPT Enterprise - Google Gemini AI Integration
// Advanced RAG-based Natural Language to Dashboard System
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIAnalysisResult, ChartConfig, AIInsight, QueryIntent, DatasetAnalysis } from '@/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ============================================================================
// COMPREHENSIVE DATA SCHEMA (RAG Context)
// ============================================================================
const DATA_SCHEMA = `
## DATASET: India Life Insurance Claims Dataset (Individual Death Claims)

### AVAILABLE INSURERS (24 companies, use EXACT names):
Aditya Birla Sun Life, Aegon, Ageas Federal, Aviva, Bajaj Allianz, Bharti Axa, Canara HSBC OBC, 
Edelweiss Tokio, Exide Life, Future Generali, HDFC Life, ICICI Prudential, IndiaFirst, Kotak Mahindra, 
LIC, Max Life, PNB MetLife, Pramerica Life, Reliance Nippon, SBI Life, Sahara Life, Shriram, 
Star Union Dai-ichi, Tata AIA

### AVAILABLE YEARS (5 years):
2017-18, 2018-19, 2019-20, 2020-21, 2021-22

### AVAILABLE COLUMNS (Use EXACT names):
| Column Name | Type | Description | Example Values |
|-------------|------|-------------|----------------|
| life_insurer | string | Insurance company name | "LIC", "HDFC Life", "ICICI Prudential" |
| year | string | Financial year | "2021-22", "2020-21", "2019-20" |
| claims_pending_start_no | number | Pending claims at period start | 5000 |
| claims_pending_start_amt | number | Pending amount at start (₹) | 50000000 |
| claims_intimated_no | number | New claims reported | 10000 |
| claims_intimated_amt | number | New claims amount (₹) | 100000000 |
| total_claims_no | number | Total claims for processing | 15000 |
| total_claims_amt | number | Total claims amount (₹) | 150000000 |
| claims_paid_no | number | Claims settled/paid | 14000 |
| claims_paid_amt | number | Amount paid (₹) | 140000000 |
| claims_repudiated_no | number | Claims denied after investigation | 200 |
| claims_repudiated_amt | number | Repudiated amount (₹) | 2000000 |
| claims_rejected_no | number | Claims rejected upfront | 100 |
| claims_rejected_amt | number | Rejected amount (₹) | 1000000 |
| claims_unclaimed_no | number | Approved but unclaimed | 50 |
| claims_unclaimed_amt | number | Unclaimed amount (₹) | 500000 |
| claims_pending_end_no | number | Pending at period end | 650 |
| claims_pending_end_amt | number | Pending amount at end (₹) | 6500000 |
| claims_paid_ratio_no | number | Settlement ratio by count (0-1) | 0.95 |
| claims_paid_ratio_amt | number | Settlement ratio by amount (0-1) | 0.93 |
| claims_repudiated_rejected_ratio_no | number | Rejection ratio by count (0-1) | 0.02 |
| claims_repudiated_rejected_ratio_amt | number | Rejection ratio by amount (0-1) | 0.02 |
| claims_pending_ratio_no | number | Pending ratio by count (0-1) | 0.04 |
| claims_pending_ratio_amt | number | Pending ratio by amount (0-1) | 0.04 |

### CRITICAL: BUSINESS TERM TO COLUMN MAPPING
When user asks for:
- "settlement ratio", "claim settlement", "settlement rate" → USE: claims_paid_ratio_no
- "rejection ratio", "rejection rate", "repudiation" → USE: claims_repudiated_rejected_ratio_no
- "pending ratio", "pending rate" → USE: claims_pending_ratio_no
- "claims paid", "number of claims", "claim count" → USE: claims_paid_no
- "claim amount", "money paid", "payout" → USE: claims_paid_amt
- "total claims" → USE: total_claims_no or total_claims_amt
- "new claims", "intimated claims" → USE: claims_intimated_no

IMPORTANT: Ratios are decimal values (0.0 to 1.0). For example, 0.98 = 98% settlement rate.

### DATA LIMITATIONS:
- Years available: 2017-18 to 2021-22 ONLY (5 years)
- Category: Only "Individual Death Claims" (no group claims, no maturity claims)
- Geographic data: NOT available (no state/region info)
- Monthly/quarterly breakdown: NOT available (annual data only)
- Agent/channel data: NOT available
- No aggregate/industry totals in data - must calculate if needed
- Customer demographics: NOT available
`;

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

1. **GREETING**: Simple greetings like "hi", "hello", "hey", "good morning"
   → Response: Friendly greeting + offer to help with insurance data analysis

2. **DATA_QUERY**: Questions about the insurance claims data
   → Response: Full analysis with charts, insights, narrative

3. **CAPABILITY_QUERY**: Questions about what this system can do
   → Response: Explain available analysis capabilities

4. **OUT_OF_SCOPE**: Questions about topics NOT in the dataset
   → Response: Politely explain data limitations, suggest related queries

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
  conversationContext?: string
): Promise<AIAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const systemPrompt = `You are InsightGPT Enterprise, an intelligent Business Intelligence assistant that converts natural language queries into interactive data dashboards.

${QUERY_CLASSIFICATION_PROMPT}

${DATA_SCHEMA}

${CHART_SELECTION_GUIDE}

${conversationContext ? `## CONVERSATION CONTEXT:\n${conversationContext}\n` : ''}

## USER QUERY: "${query}"

## YOUR TASK:
1. First, CLASSIFY the query type (greeting/data_query/capability_query/out_of_scope/ambiguous)
2. For DATA_QUERY: Generate proper analysis with correct chart selection
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

    const result = await model.generateContent(systemPrompt);
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
    
    if (parsed.queryType === 'out_of_scope') {
      return {
        query,
        intent: { action: 'none', metrics: [], dimensions: [], filters: {} },
        charts: [],
        insights: [{
          id: 'limitation',
          type: 'summary',
          title: 'Data Limitation',
          description: parsed.dataLimitations?.[0] || 'This information is not available in the current dataset.',
          confidence: 1.0,
          impact: 'low',
        }],
        narrative: parsed.narrative || "I don't have data to answer that question. The current dataset contains India Life Insurance Claims data from 2018-2022, including insurer performance, settlement ratios, and claims statistics. It doesn't include geographic breakdowns, customer demographics, or monthly data.",
        suggestions: parsed.suggestions || [
          'Show claims by insurer',
          'Compare settlement ratios over years',
          'Which insurer handles the most claims?',
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
    const fallback = getDefaultAnalysis(query);
    fallback.narrative = `⚠️ AI service is temporarily unavailable — using local analysis.\n\n${fallback.narrative}`;
    return fallback;
  }
}

export async function generateInsights(
  data: Record<string, unknown>[],
  context?: string
): Promise<AIInsight[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
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
  const q = query.toLowerCase().trim();
  
  // Check if query looks like a greeting
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'];
  const isGreeting = greetings.some(g => q === g || q.startsWith(g + ' ') || q.startsWith(g + ','));
  
  if (isGreeting) {
    return {
      query,
      intent: { action: 'none', metrics: [], dimensions: [], filters: {} },
      charts: [],
      insights: [],
      narrative: "Hello! 👋 I'm InsightGPT Enterprise, your AI-powered insurance analytics assistant.\n\nI can help you analyze the India Life Insurance Claims dataset (2017-2022). Here's what I can do:\n\n📊 **Compare** insurers by claims, settlements, rejections\n📈 **Track trends** over years\n🔍 **Find** top/bottom performers\n💡 **Generate insights** from the data\n\nTry asking:\n• \"Show settlement ratio by insurer\"\n• \"Compare LIC vs HDFC Life\"\n• \"Top 5 insurers by rejection rate\"",
      suggestions: [
        'Show settlement ratio by insurer for 2021-22',
        'Compare claims paid across all insurers',
        'Which insurer has the highest rejection rate?',
        'Show LIC performance over the years',
        'Top 10 insurers by total claims',
      ],
      confidence: 1.0,
    };
  }
  
  // ============================================================================
  // SMART LOCAL QUERY PARSER (Works without Gemini API)
  // ============================================================================
  
  // Detect metrics from query
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
  
  let selectedMetric = 'claims_paid_no';
  let metricLabel = 'Claims Paid';
  
  for (const mp of metricPatterns) {
    if (mp.pattern.test(q)) {
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
  const yearMatch = q.match(/20(1[7-9]|2[0-2])[-\s]*(1[8-9]|2[0-3])?/);
  if (yearMatch) {
    timeRange = yearMatch[0].includes('-') ? yearMatch[0] : `${yearMatch[0]}-${parseInt(yearMatch[0].slice(-2)) + 1}`;
  }
  
  // Detect specific insurers
  const insurerPatterns = [
    { pattern: /\blic\b/i, name: 'LIC' },
    { pattern: /\bhdfc\s*life?\b/i, name: 'HDFC Life' },
    { pattern: /\bicici\s*(pru|prudential)?\b/i, name: 'ICICI Prudential' },
    { pattern: /\bsbi\s*life?\b/i, name: 'SBI Life' },
    { pattern: /\bmax\s*life?\b/i, name: 'Max Life' },
    { pattern: /\bkotak\b/i, name: 'Kotak Mahindra' },
    { pattern: /\bbajaj\s*(allianz)?\b/i, name: 'Bajaj Allianz' },
    { pattern: /\btata\s*(aia)?\b/i, name: 'Tata AIA' },
  ];
  
  const filters: Record<string, string | string[]> = {};
  const matchedInsurers: string[] = [];
  for (const ip of insurerPatterns) {
    if (ip.pattern.test(q)) {
      matchedInsurers.push(ip.name);
    }
  }
  if (matchedInsurers.length > 0) {
    filters.life_insurer = matchedInsurers.length === 1 ? matchedInsurers[0] : matchedInsurers;
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
  
  // Build dimensions
  const dimensions: string[] = action === 'trend' ? ['year'] : ['life_insurer'];
  if (action === 'trend' && matchedInsurers.length > 0) {
    dimensions.push('life_insurer');
  }
  
  // Sort order
  const sortOrder = bottomMatch || /worst|lowest|minimum/.test(q) ? 'asc' as const : 'desc' as const;
  
  // Build chart title
  let chartTitle = metricLabel;
  if (action === 'trend') {
    chartTitle = `${metricLabel} Over Years`;
  } else if (action === 'compare' && matchedInsurers.length > 1) {
    chartTitle = `${metricLabel}: ${matchedInsurers.join(' vs ')}`;
  } else if (action === 'rank' && limit) {
    chartTitle = `Top ${limit} Insurers by ${metricLabel}`;
  } else {
    chartTitle = `${metricLabel} by Insurer`;
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
    narrative: `Showing ${metricLabel.toLowerCase()} ${action === 'trend' ? 'trends over years' : 'by insurer'}${timeRange ? ` for ${timeRange}` : ''}.${matchedInsurers.length > 0 ? ` Filtered to: ${matchedInsurers.join(', ')}.` : ''}`,
    suggestions: [
      action !== 'trend' ? 'Show trends over years' : 'Compare across insurers',
      selectedMetric !== 'claims_paid_ratio_no' ? 'Show settlement ratio' : 'Show claims paid',
      selectedMetric !== 'claims_repudiated_rejected_ratio_no' ? 'Show rejection rate' : 'Show settlement ratio',
      !timeRange ? 'Filter by 2021-22' : 'Show all years',
      'Compare LIC vs HDFC Life',
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
