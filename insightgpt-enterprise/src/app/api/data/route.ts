// InsightGPT Enterprise - Data API Route
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

let cachedData: Record<string, unknown>[] | null = null;
let cachedAnalysis: Record<string, unknown> | null = null;

function analyzeDataset(data: Record<string, unknown>[]) {
  if (data.length === 0) return null;
  
  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => {
    const vals = data.slice(0, 20).map(r => r[col]).filter(v => v !== null && v !== undefined && v !== '');
    return vals.length > 0 && vals.every(v => typeof v === 'number' || (!isNaN(Number(v)) && v !== ''));
  });
  const categoricalColumns = columns.filter(col => !numericColumns.includes(col));
  
  // Auto-detect key columns
  const primaryCategorical = categoricalColumns[0] || '';
  const timeColumn = categoricalColumns.find(c => /year|date|time|month|quarter|period/i.test(c));
  
  // Get unique values for top categorical columns
  const uniqueValues: Record<string, string[]> = {};
  for (const col of categoricalColumns.slice(0, 3)) {
    uniqueValues[col] = [...new Set(data.map(row => String(row[col] || '')))].filter(v => v).sort();
  }
  
  // Calculate summary stats for numeric columns
  const summaryStats: Record<string, { sum: number; avg: number; min: number; max: number }> = {};
  for (const col of numericColumns.slice(0, 6)) {
    const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
    if (values.length > 0) {
      summaryStats[col] = {
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    }
  }
  
  return {
    rowCount: data.length,
    columnCount: columns.length,
    columns: columns.map(col => ({
      name: col,
      type: numericColumns.includes(col) ? 'numeric' : 'categorical',
    })),
    numericColumns,
    categoricalColumns,
    primaryCategorical,
    timeColumn: timeColumn || null,
    uniqueValues,
    summaryStats,
    summary: {
      totalRecords: data.length,
      numericColCount: numericColumns.length,
      categoricalColCount: categoricalColumns.length,
      primaryDimension: primaryCategorical,
      uniqueGroups: primaryCategorical ? new Set(data.map(r => r[primaryCategorical])).size : 0,
      timePeriods: timeColumn ? [...new Set(data.map(r => String(r[timeColumn] || '')))].filter(v => v).sort() : [],
    },
  };
}

export async function GET() {
  try {
    if (cachedData && cachedAnalysis) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        analysis: cachedAnalysis,
      });
    }
    
    const csvPath = path.join(process.cwd(), 'src', 'data', 'insurance_claims.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => header.trim(),
    });
    
    cachedData = result.data as Record<string, unknown>[];
    cachedAnalysis = analyzeDataset(cachedData);
    
    return NextResponse.json({
      success: true,
      data: cachedData,
      analysis: cachedAnalysis,
    });
  } catch (error) {
    console.error('Data loading error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load data',
      data: [],
      analysis: null,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    const csvContent = await file.text();
    
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_'),
    });
    
    return NextResponse.json({
      success: true,
      data: result.data,
      columns: result.meta.fields,
      rowCount: result.data.length,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
