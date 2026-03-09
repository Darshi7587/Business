// InsightGPT Enterprise - AI Analysis API Route
import { NextResponse } from 'next/server';
import { analyzeQuery, refineQuery } from '@/lib/gemini';
import { executeQuery, buildChartData } from '@/lib/queryEngine';
import type { InsuranceClaim, AIAnalysisResult } from '@/types';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

let cachedData: InsuranceClaim[] | null = null;

async function getData(): Promise<InsuranceClaim[]> {
  if (cachedData) return cachedData;
  
  const csvPath = path.join(process.cwd(), 'src', 'data', 'insurance_claims.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const result = Papa.parse<InsuranceClaim>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (header: string) => header.trim(),
  });
  
  cachedData = result.data;
  return cachedData;
}

export async function POST(request: Request) {
  try {
    const { query, conversationContext, previousResult } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    // Get dataset
    const data = await getData();
    
    // Analyze query using Gemini
    let analysis: AIAnalysisResult;
    
    if (previousResult && conversationContext) {
      // Refinement query (follow-up)
      analysis = await refineQuery(conversationContext, query, previousResult);
    } else {
      // New query
      analysis = await analyzeQuery(query);
    }
    
    // Execute query against data
    const queryResult = executeQuery(data, analysis.intent);
    
    // Build chart configurations with actual data
    const chartsWithData = analysis.charts.map((chartConfig) => {
      const xAxis = chartConfig.xAxis || analysis.intent.dimensions[0] || 'life_insurer';
      const yAxis = chartConfig.yAxis || analysis.intent.metrics;
      
      return buildChartData(queryResult, {
        ...chartConfig,
        xAxis,
        yAxis: Array.isArray(yAxis) ? yAxis : [yAxis],
      });
    });
    
    // If no charts were generated, create a default one
    if (chartsWithData.length === 0 && queryResult.length > 0) {
      const defaultChart = buildChartData(queryResult, {
        type: 'bar',
        title: 'Query Results',
        xAxis: analysis.intent.dimensions[0] || Object.keys(queryResult[0])[0],
        yAxis: analysis.intent.metrics.length > 0 
          ? analysis.intent.metrics 
          : Object.keys(queryResult[0]).filter(k => typeof queryResult[0][k] === 'number'),
      });
      chartsWithData.push(defaultChart);
    }
    
    return NextResponse.json({
      ...analysis,
      charts: chartsWithData,
      rawData: queryResult.slice(0, 50), // Limit raw data for performance
      dataRowCount: queryResult.length,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        charts: [],
        insights: [],
        narrative: 'I encountered an issue processing your request. Please try rephrasing your question.',
        suggestions: [
          'Show total claims by insurer',
          'Compare settlement ratios',
          'Which year had the most claims?',
        ],
      }, 
      { status: 500 }
    );
  }
}
