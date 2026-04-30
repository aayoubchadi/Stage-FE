import React, { useState } from 'react';
import { Badge, BadgeDot } from './ui/badge-2';
import { Card, CardContent, CardHeader } from './ui/card';
import { ChartContainer, ChartTooltip } from './ui/line-charts-6';
import { ArrowDown, ArrowUp, Package, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

/**
 * StockPro Inventory Dashboard Stats Component
 * Displays key metrics: Products, Stock Movements, Low Stock Alerts, Inventory Value
 */

// Sample inventory data (7 days of stock movements)
const inventoryData = [
  { date: '2024-04-11', products: 24, movements: 8, lowStock: 3, value: 4200 },
  { date: '2024-04-12', products: 25, movements: 12, lowStock: 2, value: 4850 },
  { date: '2024-04-13', products: 25, movements: 10, lowStock: 4, value: 4600 },
  { date: '2024-04-14', products: 26, movements: 15, lowStock: 1, value: 5200 },
  { date: '2024-04-15', products: 27, movements: 9, lowStock: 3, value: 5800 },
  { date: '2024-04-16', products: 28, movements: 14, lowStock: 2, value: 6100 },
  { date: '2024-04-17', products: 28, movements: 18, lowStock: 0, value: 6500 },
];

// Metric configurations for StockPro
const metrics = [
  {
    key: 'products',
    label: 'Total Products',
    value: 28,
    previousValue: 24,
    icon: Package,
    format: (val) => val.toString(),
  },
  {
    key: 'movements',
    label: 'Movements (Today)',
    value: 18,
    previousValue: 12,
    icon: TrendingUp,
    format: (val) => val.toString(),
  },
  {
    key: 'lowStock',
    label: 'Low Stock Alerts',
    value: 0,
    previousValue: 3,
    icon: AlertCircle,
    format: (val) => val.toString(),
    isNegative: true, // Lower is better
  },
  {
    key: 'value',
    label: 'Inventory Value',
    value: 6500,
    previousValue: 4200,
    icon: DollarSign,
    format: (val) => `$${(val / 1000).toFixed(1)}k`,
  },
];

// StockPro theme colors
const chartConfig = {
  products: {
    label: 'Products',
    color: '#3b82f6', // blue-500
  },
  movements: {
    label: 'Movements',
    color: '#10b981', // emerald-500
  },
  lowStock: {
    label: 'Low Stock',
    color: '#ef4444', // red-500
  },
  value: {
    label: 'Inventory Value',
    color: '#f59e0b', // amber-500
  },
};

// Custom tooltip matching StockPro theme
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const metric = metrics.find((m) => m.key === entry.dataKey);

    if (metric) {
      const Icon = metric.icon;
      return (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-md min-w-[140px]">
          <div className="flex items-center gap-2 text-sm">
            <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">{metric.label}:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{metric.format(entry.value)}</span>
          </div>
        </div>
      );
    }
  }
  return null;
};

export default function StockProDashboardStats() {
  const [selectedMetric, setSelectedMetric] = useState('movements');
  

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader className="p-0 mb-5">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 grow">
            {metrics.map((metric) => {
              const change = ((metric.value - metric.previousValue) / Math.max(metric.previousValue, 1)) * 100;
              const isPositive = metric.isNegative ? change < 0 : change > 0;
              const Icon = metric.icon;

              return (
                <button
                  key={metric.key}
                  onClick={() => setSelectedMetric(metric.key)}
                  className={cn(
                    'cursor-pointer flex-1 text-start p-4 last:border-b-0 border-b border-slate-200 dark:border-slate-700 md:border-b md:even:border-e md:dark:even:border-slate-700 lg:border-b-0 lg:border-e lg:dark:border-slate-700 lg:last:border-e-0 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    selectedMetric === metric.key && 'bg-slate-50 dark:bg-slate-800',
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{metric.label}</span>
                    </div>
                    <Badge variant={isPositive ? 'success' : 'destructive'} size="sm">
                      <BadgeDot />
                      {Math.abs(change).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metric.format(metric.value)}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    from {metric.format(metric.previousValue)}
                  </div>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="px-2.5 py-6">
          <ChartContainer
            config={chartConfig}
            className="h-80 w-full overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-300 dark:[&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-600"
          >
            <LineChart
              data={inventoryData}
              margin={{
                top: 20,
                right: 20,
                left: 5,
                bottom: 20,
              }}
              style={{ overflow: 'visible' }}
            >
              {/* Background gradients */}
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartConfig[selectedMetric]?.color} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={chartConfig[selectedMetric]?.color} stopOpacity={0} />
                </linearGradient>
                <filter id="lineShadow">
                  <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity={0.15} />
                </filter>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickMargin={10}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickMargin={10}
                tickCount={6}
                tickFormatter={(value) => {
                  const metric = metrics.find((m) => m.key === selectedMetric);
                  return metric ? metric.format(value) : value.toString();
                }}
              />

              <ChartTooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />

              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={chartConfig[selectedMetric]?.color}
                strokeWidth={2.5}
                filter="url(#lineShadow)"
                dot={false}
                isAnimationActive={true}
                activeDot={{
                  r: 6,
                  fill: chartConfig[selectedMetric]?.color,
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  filter: 'url(#lineShadow)',
                }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>

        {/* Forecast summary: top reorder suggestions */}
        
      </Card>
    </div>
  );
}
