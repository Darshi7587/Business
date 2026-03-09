// InsightGPT Enterprise - Search API Route
import { NextResponse } from 'next/server';
import type { InsuranceClaim } from '@/types';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  
  if (!query || query.length < 2) {
    return NextResponse.json({ 
      results: [],
      suggestions: [
        'Show claims by insurer',
        'Compare settlement ratios',
        'LIC claims analysis',
        'Year-wise trends',
      ]
    });
  }
  
  try {
    const data = await getData();
    
    // Search through data for matching records
    const dataResults = data.filter((row) => {
      const insurer = (row.life_insurer || '').toLowerCase();
      const year = (row.year || '').toLowerCase();
      return insurer.includes(query) || year.includes(query);
    }).slice(0, 10);
    
    // Generate quick suggestions based on search
    const suggestions: string[] = [];
    const matchedInsurers = [...new Set(dataResults.map(r => r.life_insurer))];
    const matchedYears = [...new Set(dataResults.map(r => r.year))];
    
    if (matchedInsurers.length > 0) {
      suggestions.push(`Show ${matchedInsurers[0]} claims analysis`);
      suggestions.push(`Compare ${matchedInsurers[0]} with other insurers`);
    }
    if (matchedYears.length > 0) {
      suggestions.push(`Show trends for ${matchedYears[0]}`);
    }
    
    // Add general suggestions
    if (query.includes('claim')) {
      suggestions.push('Show total claims by insurer');
      suggestions.push('Which insurer has highest claims?');
    }
    if (query.includes('ratio') || query.includes('settlement')) {
      suggestions.push('Compare settlement ratios');
      suggestions.push('Which insurer has best settlement ratio?');
    }
    
    return NextResponse.json({
      query,
      results: dataResults.map(row => ({
        type: 'data',
        title: `${row.life_insurer} - ${row.year}`,
        description: `Claims: ${row.claims_paid_no?.toLocaleString() || 'N/A'} paid, ${row.claims_rejected_no?.toLocaleString() || 'N/A'} rejected`,
        data: row,
      })),
      suggestions: suggestions.slice(0, 5),
      totalMatches: dataResults.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
