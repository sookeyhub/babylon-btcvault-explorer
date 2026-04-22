'use client';

import { useState } from 'react';
import TVLHeroChart from '@/components/TVLHeroChart';
import type { TimeSeriesPoint } from '@/lib/types';

type Period = '7D' | '30D' | '180D' | 'YTD' | '1Y' | 'ALL';

const PERIODS: Period[] = ['7D', '30D', '180D', 'YTD', '1Y', 'ALL'];

function filterByPeriod(data: TimeSeriesPoint[], period: Period): TimeSeriesPoint[] {
  if (period === 'ALL') return data;
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case '7D':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30D':
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '180D':
      cutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case 'YTD':
      cutoff = new Date(now.getFullYear(), 0, 1);
      break;
    case '1Y':
      cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }
  return data.filter((d) => new Date(d.date) >= cutoff);
}

interface TVLHistorySectionProps {
  data: TimeSeriesPoint[];
}

export default function TVLHistorySection({ data }: TVLHistorySectionProps) {
  const [activePeriod, setActivePeriod] = useState<Period>('30D');
  const filtered = filterByPeriod(data, activePeriod);

  return (
    <div className="border border-[#387085]/20 bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-semibold text-[#14140f]">TVL History</h2>
        <div className="flex items-center gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`rounded-none px-2.5 py-1 text-[11px] font-medium transition-colors ${
                activePeriod === p
                  ? 'bg-[#cd6332] text-white'
                  : 'text-[rgba(56,112,133,0.6)] hover:text-[#cd6332]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 pb-5">
        <TVLHeroChart data={filtered} />
      </div>
    </div>
  );
}
