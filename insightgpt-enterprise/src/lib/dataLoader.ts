// InsightGPT Enterprise - Data Loader
import Papa from 'papaparse';
import type { InsuranceClaim, DatasetAnalysis, ColumnAnalysis } from '@/types';

let cachedData: InsuranceClaim[] | null = null;

export async function loadInsuranceData(): Promise<InsuranceClaim[]> {
  if (cachedData) return cachedData;
  
  const response = await fetch('/api/data');
  const result = await response.json();
  if (result.success && Array.isArray(result.data)) {
    cachedData = result.data;
  } else {
    cachedData = [];
  }
  return cachedData!;
}

export function parseCSV<T>(csvText: string): T[] {
  const result = Papa.parse<T>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
  });
  return result.data;
}

export function analyzeDataset(data: Record<string, unknown>[]): DatasetAnalysis {
  if (!data.length) {
    return {
      totalRows: 0,
      totalColumns: 0,
      columns: [],
      missingValues: {},
      correlations: [],
      suggestedQuestions: [],
    };
  }

  const columns = Object.keys(data[0]);
  const columnAnalyses: ColumnAnalysis[] = columns.map((col) => {
    const values = data.map((row) => row[col]);
    const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
    const nullCount = values.length - nonNullValues.length;
    
    // Determine type
    const sampleNonNull = nonNullValues[0];
    let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
    if (typeof sampleNonNull === 'number') type = 'number';
    else if (typeof sampleNonNull === 'boolean') type = 'boolean';
    else if (typeof sampleNonNull === 'string' && !isNaN(Date.parse(sampleNonNull))) type = 'date';
    
    const uniqueValues = new Set(nonNullValues).size;
    const sampleValues = [...new Set(nonNullValues)].slice(0, 5) as (string | number)[];
    
    const analysis: ColumnAnalysis = {
      name: col,
      type,
      uniqueValues,
      nullCount,
      sampleValues,
    };
    
    if (type === 'number') {
      const numValues = nonNullValues as number[];
      analysis.min = Math.min(...numValues);
      analysis.max = Math.max(...numValues);
      analysis.mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      const sorted = [...numValues].sort((a, b) => a - b);
      analysis.median = sorted[Math.floor(sorted.length / 2)];
    }
    
    return analysis;
  });

  // Calculate missing values
  const missingValues: Record<string, number> = {};
  columnAnalyses.forEach((col) => {
    if (col.nullCount > 0) {
      missingValues[col.name] = col.nullCount;
    }
  });

  // Calculate correlations between numeric columns
  const numericColumns = columnAnalyses.filter((c) => c.type === 'number');
  const correlations: { pair: [string, string]; correlation: number }[] = [];
  
  for (let i = 0; i < numericColumns.length; i++) {
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col1 = numericColumns[i].name;
      const col2 = numericColumns[j].name;
      const correlation = calculateCorrelation(
        data.map((r) => r[col1] as number),
        data.map((r) => r[col2] as number)
      );
      if (!isNaN(correlation) && Math.abs(correlation) > 0.5) {
        correlations.push({ pair: [col1, col2], correlation });
      }
    }
  }

  // Generate suggested questions
  const suggestedQuestions = generateSuggestedQuestions(columnAnalyses, data);

  return {
    totalRows: data.length,
    totalColumns: columns.length,
    columns: columnAnalyses,
    missingValues,
    correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)).slice(0, 10),
    suggestedQuestions,
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + (b || 0), 0);
  const sumY = y.reduce((a, b) => a + (b || 0), 0);
  const sumXY = x.reduce((total, xi, i) => total + (xi || 0) * (y[i] || 0), 0);
  const sumX2 = x.reduce((total, xi) => total + (xi || 0) ** 2, 0);
  const sumY2 = y.reduce((total, yi) => total + (yi || 0) ** 2, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function generateSuggestedQuestions(columns: ColumnAnalysis[], data: Record<string, unknown>[]): string[] {
  const questions: string[] = [];
  
  const hasInsurer = columns.some((c) => c.name.includes('insurer'));
  const hasYear = columns.some((c) => c.name.includes('year'));
  const hasClaims = columns.some((c) => c.name.includes('claims'));
  const hasRatio = columns.some((c) => c.name.includes('ratio'));
  
  if (hasInsurer && hasClaims) {
    questions.push('Show total claims by insurance company');
    questions.push('Which insurer has the highest number of claims paid?');
    questions.push('Compare claims paid vs rejected by insurer');
  }
  
  if (hasYear && hasClaims) {
    questions.push('Show claims trend over the years');
    questions.push('Which year had the highest claim settlements?');
  }
  
  if (hasRatio) {
    questions.push('Show claim settlement ratio by insurer');
    questions.push('Which company has the best claim approval rate?');
    questions.push('Compare rejection rates across insurers');
  }
  
  if (hasInsurer && hasYear) {
    questions.push('Show year-over-year performance by insurer');
    questions.push('Which insurer improved the most over time?');
  }
  
  // Generic questions based on data structure
  const numericCols = columns.filter((c) => c.type === 'number');
  const categoricalCols = columns.filter((c) => c.type === 'string' && c.uniqueValues < 50);
  
  if (numericCols.length > 0 && categoricalCols.length > 0) {
    questions.push(`What is the average ${numericCols[0].name.replace(/_/g, ' ')} by ${categoricalCols[0].name.replace(/_/g, ' ')}?`);
  }
  
  return questions.slice(0, 8);
}

export function filterData(
  data: Record<string, unknown>[],
  filters: Record<string, unknown>
): Record<string, unknown>[] {
  return data.filter((row) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined || value === '') return true;
      if (Array.isArray(value)) return value.includes(row[key]);
      return row[key] === value;
    });
  });
}

export function aggregateData(
  data: Record<string, unknown>[],
  groupBy: string[],
  metrics: { column: string; aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' }[]
): Record<string, unknown>[] {
  const groups = new Map<string, Record<string, unknown>[]>();
  
  data.forEach((row) => {
    const key = groupBy.map((col) => row[col]).join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  });
  
  const result: Record<string, unknown>[] = [];
  
  groups.forEach((rows, key) => {
    const record: Record<string, unknown> = {};
    
    // Add group by columns
    groupBy.forEach((col, i) => {
      record[col] = key.split('|')[i];
    });
    
    // Calculate aggregations
    metrics.forEach(({ column, aggregation }) => {
      const values = rows.map((r) => r[column] as number).filter((v) => !isNaN(v));
      switch (aggregation) {
        case 'sum':
          record[`${column}_sum`] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          record[`${column}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          record[`${column}_count`] = values.length;
          break;
        case 'min':
          record[`${column}_min`] = Math.min(...values);
          break;
        case 'max':
          record[`${column}_max`] = Math.max(...values);
          break;
      }
    });
    
    result.push(record);
  });
  
  return result;
}

export function sortData(
  data: Record<string, unknown>[],
  sortBy: string,
  order: 'asc' | 'desc' = 'desc'
): Record<string, unknown>[] {
  return [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return order === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

export function getTopN(
  data: Record<string, unknown>[],
  n: number,
  sortBy: string,
  order: 'asc' | 'desc' = 'desc'
): Record<string, unknown>[] {
  return sortData(data, sortBy, order).slice(0, n);
}
