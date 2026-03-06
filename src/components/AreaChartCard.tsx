'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';
import type { TimeSeriesPoint } from '@/lib/types';

const RANGES = ['7D', '30D', '180D', 'All'] as const;

interface AreaChartCardProps {
  title: string;
  data: TimeSeriesPoint[];
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

function filterByRange(data: TimeSeriesPoint[], range: string): TimeSeriesPoint[] {
  if (range === 'All') return data;
  const days = range === '7D' ? 7 : range === '30D' ? 30 : 180;
  return data.slice(-days);
}

export default function AreaChartCard({
  title,
  data,
  color = '#cd6332',
  valuePrefix = '',
  valueSuffix = '',
}: AreaChartCardProps) {
  const [range, setRange] = useState<string>('30D');
  const filtered = filterByRange(data, range);
  const latestValue = filtered.length > 0 ? filtered[filtered.length - 1].value : 0;
  const gradId = `grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="rounded-none border border-[#cd6332]/20 bg-white p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[#387085]">
            {title}
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums" style={{ color }}>
            {valuePrefix}{latestValue.toLocaleString()}{valueSuffix}
          </p>
        </div>
        <div className="flex gap-0.5 rounded-none border border-[#cd6332]/15 bg-[#faf9f5] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-none px-2 py-0.5 text-[10px] font-medium transition-colors ${
                range === r
                  ? 'bg-white text-[#cd6332] shadow-sm'
                  : 'text-[rgba(56,112,133,0.45)] hover:text-[#387085]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.35)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: string) => v.slice(5)}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid rgba(205,99,50,0.2)',
                borderRadius: '0',
                fontSize: '11px',
                color: '#387085',
              }}
              labelStyle={{ color: 'rgba(56,112,133,0.5)', fontSize: '10px' }}
              formatter={(value) => [`${valuePrefix}${Number(value).toLocaleString()}${valueSuffix}`, '']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
