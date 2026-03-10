// InsightGPT Enterprise - AI Insights API Route
import { NextResponse } from 'next/server';
import { generateInsights, generateNarrative, runSimulation, updateDataSchema } from '@/lib/gemini';
import { analyzeDataset } from '@/lib/dataLoader';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

let cachedData: Record<string, unknown>[] | null = null;

async function getData(): Promise<Record<string, unknown>[]> {
  if (cachedData) return cachedData;
  
  const csvPath = path.join(process.cwd(), 'src', 'data', 'insurance_claims.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (header: string) => header.trim(),
  });
  
  cachedData = result.data as Record<string, unknown>[];
  return cachedData;
}

export async function GET() {
  try {
    const data = await getData();
    const insights = await generateInsights(data);
    
    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Insights generation error:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, data, chartType, chartTitle, parameters } = body;
    
    switch (action) {
      case 'generateNarrative': {
        const narrative = await generateNarrative(data, chartType, chartTitle);
        return NextResponse.json({ narrative });
      }
      
      case 'runSimulation': {
        const simData = data || await getData();
        const result = await runSimulation(simData as Record<string, unknown>[], parameters);
        return NextResponse.json(result);
      }
      
      case 'analyzeDataset': {
        const dataset = data || await getData();
        if (data) updateDataSchema(data);
        const analysis = analyzeDataset(dataset as Record<string, unknown>[]);
        return NextResponse.json(analysis);
      }
      
      case 'generateInsights': {
        const dataset = data || await getData();
        if (data) updateDataSchema(data);
        const insights = await generateInsights(dataset as Record<string, unknown>[]);
        return NextResponse.json({ insights });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}
