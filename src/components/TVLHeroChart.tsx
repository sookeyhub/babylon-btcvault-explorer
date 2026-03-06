'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimeSeriesPoint } from '@/lib/types';

interface TVLHeroChartProps {
  data: TimeSeriesPoint[];
}

export default function TVLHeroChart({ data }: TVLHeroChartProps) {
  // Show last 12 months
  const filtered = data.slice(-365);

  return (
    <div className="flex h-[140.5px] w-full flex-col">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filtered} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="tvl-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cd6332" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#cd6332" stopOpacity={0.05} />
              </linearGradient>
            </defs>
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
              formatter={(value) => [`${Number(value).toLocaleString()} BTC`, '']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#cd6332"
              strokeWidth={1.5}
              fill="url(#tvl-grad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between px-1 pt-1">
        {(() => {
          const step = Math.floor(filtered.length / 6);
          const labels: string[] = [];
          for (let i = 0; i < filtered.length; i += step) {
            const d = new Date(filtered[i].date);
            labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
          }
          return labels.map((l, i) => (
            <span key={i} className="text-[10px] text-[rgba(56,112,133,0.35)]">{l}</span>
          ));
        })()}
      </div>
    </div>
  );
}
