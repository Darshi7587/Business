// InsightGPT Enterprise - Data API Route
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { InsuranceClaim } from '@/types';

let cachedData: InsuranceClaim[] | null = null;
let cachedAnalysis: Record<string, unknown> | null = null;

function analyzeDataset(data: InsuranceClaim[]) {
  if (data.length === 0) return null;
  
  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => {
    const val = data[0][col];
    return typeof val === 'number' || !isNaN(Number(val));
  });
  const categoricalColumns = columns.filter(col => !numericColumns.includes(col));
  
  // Get unique values for categorical columns
  const uniqueInsurers = [...new Set(data.map(row => row.life_insurer))];
  const uniqueYears = [...new Set(data.map(row => row.year))].sort();
  const uniqueCategories = [...new Set(data.map(row => row.category))];
  
  // Calculate summary stats
  const totalClaimsPaid = data.reduce((sum, row) => sum + (Number(row.claims_paid_amt) || 0), 0);
  const totalClaimsNo = data.reduce((sum, row) => sum + (Number(row.claims_paid_no) || 0), 0);
  const avgSettlementRatio = data.reduce((sum, row) => sum + (Number(row.claims_paid_ratio_no) || 0), 0) / data.length;
  
  return {
    rowCount: data.length,
    columnCount: columns.length,
    columns: columns.map(col => ({
      name: col,
      type: numericColumns.includes(col) ? 'numeric' : 'categorical',
    })),
    numericColumns,
    categoricalColumns,
    uniqueInsurers,
    uniqueYears,
    uniqueCategories,
    summary: {
      totalClaimsPaid,
      totalClaimsNo,
      avgSettlementRatio: avgSettlementRatio * 100,
      insurerCount: uniqueInsurers.length,
      yearRange: `${uniqueYears[0]} - ${uniqueYears[uniqueYears.length - 1]}`,
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
    
    const result = Papa.parse<InsuranceClaim>(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => header.trim(),
    });
    
    cachedData = result.data;
    cachedAnalysis = analyzeDataset(result.data);
    
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
