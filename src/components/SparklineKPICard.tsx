'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { TimeSeriesPoint } from '@/lib/types';

interface SparklineKPICardProps {
  label: string;
  value: string;
  change: string;
  data: TimeSeriesPoint[];
  color?: string;
}

export default function SparklineKPICard({ label, value, change, data, color = '#cd6332' }: SparklineKPICardProps) {
  const last30 = data.slice(-30);
  const gradId = `spark-${label.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '').toLowerCase()}`;

  return (
    <div className="rounded-none border border-[#387085]/12 bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs text-[rgba(56,112,133,0.55)]">{label}</p>
        <span className="flex items-center gap-1 text-xs font-medium text-[#5a8a3c]">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
          </svg>
          {change}
        </span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color }}>{value}</p>
      <div className="mt-3 h-[40px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={last30}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
