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
    
    // Check if this is a non-data query (greeting, out of scope, etc.)
    const isNonDataQuery = analysis.intent.action === 'none' || 
      (!analysis.intent.metrics?.length && !analysis.intent.dimensions?.length);
    
    if (isNonDataQuery) {
      // Return analysis without trying to query data
      return NextResponse.json({
        ...analysis,
        charts: [],
        rawData: [],
        dataRowCount: 0,
      });
    }
    
    // Execute query against data
    const queryResult = executeQuery(data, analysis.intent);
    
    console.log('[API] Query result rows:', queryResult.length);
    
    // Build chart configurations with actual data
    const chartsWithData = analysis.charts.map((chartConfig) => {
      const xAxis = chartConfig.xAxis || analysis.intent.dimensions[0] || 'life_insurer';
      const yAxis = chartConfig.yAxis || analysis.intent.metrics;
      
      const builtChart = buildChartData(queryResult, {
        ...chartConfig,
        xAxis,
        yAxis: Array.isArray(yAxis) ? yAxis : [yAxis],
      });
      
      console.log('[API] Built chart:', {
        title: builtChart.title,
        xAxis: builtChart.xAxis,
        yAxis: builtChart.yAxis,
        dataRows: builtChart.data?.length || 0,
        sampleData: builtChart.data?.slice(0, 2),
      });
      
      return builtChart;
    });
    
    // If no charts were generated but we have data, create a default one
    if (chartsWithData.length === 0 && queryResult.length > 0) {
      const availableNumericKeys = Object.keys(queryResult[0]).filter(
        k => typeof queryResult[0][k] === 'number'
      );
      const defaultChart = buildChartData(queryResult, {
        type: 'bar',
        title: 'Query Results',
        xAxis: analysis.intent.dimensions[0] || Object.keys(queryResult[0])[0],
        yAxis: analysis.intent.metrics.length > 0 
          ? analysis.intent.metrics 
          : availableNumericKeys.slice(0, 2),
      });
      chartsWithData.push(defaultChart);
    }
    
    console.log('[API] Final response - charts:', chartsWithData.length, 'rawData rows:', queryResult.length);
    if (chartsWithData.length > 0 && chartsWithData[0].data) {
      console.log('[API] First chart data sample:', JSON.stringify(chartsWithData[0].data.slice(0, 3), null, 2));
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
        narrative: "I encountered an issue processing your request. This could be due to:\n\n• A complex query that needs simplification\n• The AI service being temporarily unavailable\n\nPlease try rephrasing your question or try one of the suggestions below.",
        suggestions: [
          'Show total claims by insurer',
          'Compare settlement ratios for top 5 insurers',
          'What was the claim rejection trend from 2019 to 2022?',
          'Which insurer has the best settlement ratio?',
        ],
      }, 
      { status: 500 }
    );
  }
}
