// InsightGPT Enterprise - Search API Route
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

let cachedData: Record<string, unknown>[] | null = null;

async function getData(): Promise<Record<string, unknown>[]> {
  if (cachedData) return cachedData;
  
  const csvPath = path.join(process.cwd(), 'src', 'data', 'insurance_claims.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const result = Papa.parse<Record<string, unknown>>(csvContent, {
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
        'Show data by category',
        'Compare top values',
        'Search for a specific record',
        'Show trends',
      ]
    });
  }
  
  try {
    const data = await getData();
    if (data.length === 0) {
      return NextResponse.json({ query, results: [], suggestions: [], totalMatches: 0 });
    }
    
    const cols = Object.keys(data[0]);
    
    // Search through all string columns for matching records
    const dataResults = data.filter((row) => {
      return cols.some(col => {
        const val = String(row[col] || '').toLowerCase();
        return val.includes(query);
      });
    }).slice(0, 10);
    
    // Generate dynamic suggestions
    const suggestions: string[] = [];
    const catCols = cols.filter(c => {
      const v = data[0][c];
      return typeof v === 'string';
    });
    if (catCols.length > 0 && dataResults.length > 0) {
      const firstVal = String(dataResults[0][catCols[0]] || '');
      if (firstVal) {
        suggestions.push(`Show analysis for ${firstVal}`);
        suggestions.push(`Compare ${firstVal} with others`);
      }
    }
    suggestions.push('Show summary statistics');
    suggestions.push('Which category has the highest values?');
    
    // Build result titles from first 2 columns
    const titleCol = cols[0];
    const subtitleCol = cols.length > 1 ? cols[1] : null;
    
    return NextResponse.json({
      query,
      results: dataResults.map(row => ({
        type: 'data',
        title: subtitleCol ? `${row[titleCol]} - ${row[subtitleCol]}` : String(row[titleCol]),
        description: cols.slice(2, 5).map(c => `${c}: ${row[c]}`).join(', '),
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
