// InsightGPT Enterprise - Query Engine
import type { InsuranceClaim, QueryIntent, ChartConfig } from '@/types';
import { filterData, aggregateData, sortData, getTopN } from './dataLoader';

export function executeQuery(
  data: InsuranceClaim[],
  intent: QueryIntent
): Record<string, unknown>[] {
  console.log('[QueryEngine] Input data rows:', data.length);
  console.log('[QueryEngine] Intent:', JSON.stringify(intent, null, 2));
  
  let result: Record<string, unknown>[] = [...data];
  
  // Apply filters
  if (intent.filters && Object.keys(intent.filters).length > 0) {
    result = filterData(result, intent.filters);
  }
  
  // Apply time range filter
  if (intent.timeRange) {
    result = result.filter(row => {
      const year = (row as Record<string, unknown>).year as string;
      return year && year.includes(intent.timeRange!);
    });
  }
  
  // Filter out aggregate rows (Industry, Private Total) unless specifically requested
  const aggregatePatterns = ['Industry', 'PVT.', 'Private Total', 'Industry Total'];
  const wantsAggregates = Object.values(intent.filters || {}).some(v => 
    typeof v === 'string' && aggregatePatterns.some(p => v.includes(p))
  );
  
  if (!wantsAggregates) {
    result = result.filter(row => {
      const insurer = (row as Record<string, unknown>).life_insurer as string;
      return !aggregatePatterns.some(p => insurer?.includes(p));
    });
  }
  
  // Handle different actions
  switch (intent.action) {
    case 'aggregate':
    case 'breakdown':
      if (intent.dimensions.length > 0 && intent.metrics.length > 0) {
        result = performAggregation(result, intent);
      }
      break;
      
    case 'compare':
      result = performComparison(result, intent);
      break;
      
    case 'trend':
      result = performTrendAnalysis(result, intent);
      break;
      
    case 'rank':
      result = performRanking(result, intent);
      break;
      
    case 'filter':
      // Already applied above
      break;
  }
  
  // Apply sorting
  if (intent.sortBy) {
    result = sortData(result, intent.sortBy, intent.sortOrder || 'desc');
  }
  
  // Apply limit
  if (intent.limit && intent.limit > 0) {
    result = result.slice(0, intent.limit);
  }
  
  console.log('[QueryEngine] Result rows:', result.length);
  if (result.length > 0) {
    console.log('[QueryEngine] Sample result:', JSON.stringify(result[0], null, 2));
  }
  
  return result;
}

function performAggregation(
  data: Record<string, unknown>[],
  intent: QueryIntent
): Record<string, unknown>[] {
  const { dimensions, metrics } = intent;
  
  console.log('[Aggregation] Dimensions:', dimensions);
  console.log('[Aggregation] Metrics:', metrics);
  console.log('[Aggregation] Input data rows:', data.length);
  
  // Group by dimensions
  const grouped = new Map<string, Record<string, unknown>[]>();
  
  data.forEach(row => {
    const key = dimensions.map(d => row[d]).join('|');
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  });
  
  console.log('[Aggregation] Groups created:', grouped.size);
  
  const result: Record<string, unknown>[] = [];
  
  grouped.forEach((rows, key) => {
    const record: Record<string, unknown> = {};
    
    // Add dimension values
    const keyParts = key.split('|');
    dimensions.forEach((dim, i) => {
      record[dim] = keyParts[i];
    });
    
    // Aggregate metrics
    metrics.forEach(metric => {
      const rawValues = rows.map(r => r[metric]);
      const values = rawValues.filter(v => typeof v === 'number') as number[];
      
      if (values.length === 0) {
        console.log(`[Aggregation] Warning: No numeric values for metric "${metric}". Raw values:`, rawValues.slice(0, 3));
      }
      
      if (values.length > 0) {
        // Use sum for counts/amounts, average for ratios
        if (metric.includes('ratio')) {
          record[metric] = values.reduce((a, b) => a + b, 0) / values.length;
        } else {
          record[metric] = values.reduce((a, b) => a + b, 0);
        }
      }
    });
    
    result.push(record);
  });
  
  return result;
}

function performComparison(
  data: Record<string, unknown>[],
  intent: QueryIntent
): Record<string, unknown>[] {
  // For comparison, group by primary dimension and show all metrics
  if (intent.dimensions.length === 0) {
    intent.dimensions = ['life_insurer'];
  }
  
  return performAggregation(data, intent);
}

function performTrendAnalysis(
  data: Record<string, unknown>[],
  intent: QueryIntent
): Record<string, unknown>[] {
  // Ensure year is in dimensions for trend analysis
  if (!intent.dimensions.includes('year')) {
    intent.dimensions = ['year', ...intent.dimensions];
  }
  
  const result = performAggregation(data, intent);
  
  // Sort by year for proper trend visualization
  return sortData(result, 'year', 'asc');
}

function performRanking(
  data: Record<string, unknown>[],
  intent: QueryIntent
): Record<string, unknown>[] {
  const aggregated = performAggregation(data, intent);
  
  // Sort by first metric descending
  const sortBy = intent.sortBy || intent.metrics[0];
  const sorted = sortData(aggregated, sortBy, intent.sortOrder || 'desc');
  
  // Add rank
  return sorted.map((row, index) => ({
    rank: index + 1,
    ...row,
  }));
}

export function buildChartData(
  queryResult: Record<string, unknown>[],
  chartConfig: Partial<ChartConfig>
): ChartConfig {
  const { type = 'bar', xAxis, yAxis, title = 'Chart' } = chartConfig;
  
  // Transform data for chart
  const chartData = queryResult.map(row => {
    const dataPoint: Record<string, unknown> = {};
    
    // X-axis value
    if (xAxis) {
      dataPoint.name = row[xAxis];
    }
    
    // Y-axis values
    const yAxes = Array.isArray(yAxis) ? yAxis : [yAxis].filter(Boolean);
    yAxes.forEach(y => {
      if (y) {
        const value = row[y];
        // Format large numbers
        if (typeof value === 'number') {
          dataPoint[y] = Math.round(value * 100) / 100;
        } else {
          dataPoint[y] = value;
        }
      }
    });
    
    // Include all numeric fields if no specific y-axis
    if (yAxes.length === 0) {
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'number') {
          dataPoint[key] = Math.round(value * 100) / 100;
        }
      });
    }
    
    return dataPoint;
  });
  
  return {
    type: type as ChartConfig['type'],
    title,
    description: chartConfig.description,
    xAxis,
    yAxis,
    data: chartData,
    colors: getChartColors(type),
  };
}

function getChartColors(type: string): string[] {
  const palettes = {
    default: [
      '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
      '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
    ],
    sequential: ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5'],
    diverging: ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#14b8a6'],
  };
  
  return palettes.default;
}

export function getUniqueValues(
  data: Record<string, unknown>[],
  column: string
): (string | number)[] {
  const values = new Set<string | number>();
  data.forEach(row => {
    const value = row[column];
    if (value !== null && value !== undefined) {
      values.add(value as string | number);
    }
  });
  return Array.from(values).sort();
}

export function calculateMetrics(data: InsuranceClaim[]): Record<string, number> {
  const filtered = data.filter(row => 
    !['Industry', 'PVT.', 'Private Total', 'Industry Total'].some(p => 
      row.life_insurer?.includes(p)
    )
  );
  
  const totalClaimsPaid = filtered.reduce((sum, row) => sum + (row.claims_paid_no || 0), 0);
  const totalClaimsRejected = filtered.reduce((sum, row) => 
    sum + (row.claims_rejected_no || 0) + (row.claims_repudiated_no || 0), 0);
  const totalClaimsAmount = filtered.reduce((sum, row) => sum + (row.claims_paid_amt || 0), 0);
  const avgSettlementRatio = filtered.reduce((sum, row) => 
    sum + (row.claims_paid_ratio_no || 0), 0) / filtered.length;
  
  const uniqueInsurers = new Set(filtered.map(r => r.life_insurer)).size;
  const uniqueYears = new Set(filtered.map(r => r.year)).size;
  
  return {
    totalClaimsPaid,
    totalClaimsRejected,
    totalClaimsAmount,
    avgSettlementRatio,
    uniqueInsurers,
    uniqueYears,
    totalRecords: filtered.length,
  };
}
