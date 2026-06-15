'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { truncateAddress, formatRelativeTime, toUsd } from '@/lib/utils';

// ── Period types & helpers ──────────────────────────────────────────────────

type Period = '7D' | '30D' | '180D' | 'YTD' | '1Y' | 'ALL';
const PERIODS: Period[] = ['7D', '30D', '180D', 'YTD', '1Y', 'ALL'];

function filterByPeriod<T extends { date: string }>(data: T[], period: Period): T[] {
  if (period === 'ALL') return data;
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case '7D': cutoff = new Date(now.getTime() - 7 * 86400000); break;
    case '30D': cutoff = new Date(now.getTime() - 30 * 86400000); break;
    case '180D': cutoff = new Date(now.getTime() - 180 * 86400000); break;
    case 'YTD': cutoff = new Date(now.getUTCFullYear(), 0, 1); break;
    case '1Y': cutoff = new Date(now.getTime() - 365 * 86400000); break;
    default: return data;
  }
  return data.filter((d) => new Date(d.date) >= cutoff);
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Corner brackets ─────────────────────────────────────────────────────────

function CornerBrackets() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#387085]/40" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#387085]/40" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[#387085]/40" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#387085]/40" />
    </>
  );
}

// ── Period toggles ──────────────────────────────────────────────────────────

function PeriodToggles({ active, onChange }: { active: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`rounded-none px-2 py-1 text-[11px] font-medium transition-colors ${
            active === p
              ? 'bg-[#cd6332] text-white'
              : 'text-[rgba(56,112,133,0.55)] hover:text-[#cd6332]'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ── Mock data ───────────────────────────────────────────────────────────────

// 180 days of borrow data (daily count + cumulative)
const MOCK_BORROWS = (() => {
  let cumulative = 0;
  return Array.from({ length: 180 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (179 - i));
    const count = Math.floor(Math.random() * 5) + (i > 10 ? 1 : 0);
    cumulative += count;
    return {
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
      cumulative,
    };
  });
})();

// 180 days of liquidation data (daily count + cumulative BTC)
const MOCK_LIQUIDATIONS = (() => {
  let cumulativeBtc = 0;
  return Array.from({ length: 180 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (179 - i));
    const count = Math.random() > 0.75 ? Math.floor(Math.random() * 3) + 1 : 0;
    const btc = count > 0 ? parseFloat((Math.random() * 0.15).toFixed(4)) : 0;
    cumulativeBtc += btc;
    return {
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
      btc: parseFloat(cumulativeBtc.toFixed(4)),
    };
  });
})();

const TOTAL_LIQ_BTC = MOCK_LIQUIDATIONS[MOCK_LIQUIDATIONS.length - 1]?.btc ?? 0;

// Sorted by totalBorrowed (sBTC) desc — economic size defines "top"
const MOCK_TOP_BORROWERS = [
  { address: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b', totalBorrowed: 0.8420, borrowCount: 12, totalLiquidated: 0.0620, liquidations: 2, lastActivity: '2026-06-14T08:22:00Z' },
  { address: '0x13eb4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9ca439', totalBorrowed: 0.5135, borrowCount: 9,  totalLiquidated: 0,      liquidations: 0, lastActivity: '2026-06-12T14:30:00Z' },
  { address: '0x2bbf5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d4778', totalBorrowed: 0.3780, borrowCount: 8,  totalLiquidated: 0.0210, liquidations: 1, lastActivity: '2026-06-10T03:15:00Z' },
  { address: '0xdba35a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d055d', totalBorrowed: 0.2210, borrowCount: 7,  totalLiquidated: 0,      liquidations: 0, lastActivity: '2026-06-08T19:45:00Z' },
  { address: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d', totalBorrowed: 0.1540, borrowCount: 6,  totalLiquidated: 0,      liquidations: 0, lastActivity: '2026-06-05T11:00:00Z' },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function BorrowingTabContent() {
  const [borrowPeriod, setBorrowPeriod] = useState<Period>('ALL');
  const [liqPeriod, setLiqPeriod] = useState<Period>('ALL');

  const filteredBorrows = filterByPeriod(MOCK_BORROWS, borrowPeriod);
  const filteredLiqs = filterByPeriod(MOCK_LIQUIDATIONS, liqPeriod);

  // X-axis tick thinning
  const borrowXTicks: string[] = [];
  if (filteredBorrows.length > 0) {
    const step = Math.max(1, Math.floor(filteredBorrows.length / 6));
    for (let i = 0; i < filteredBorrows.length; i += step) borrowXTicks.push(filteredBorrows[i].date);
  }
  const liqXTicks: string[] = [];
  if (filteredLiqs.length > 0) {
    const step = Math.max(1, Math.floor(filteredLiqs.length / 6));
    for (let i = 0; i < filteredLiqs.length; i += step) liqXTicks.push(filteredLiqs[i].date);
  }

  return (
    <div className="space-y-4">
      {/* ── Liquidations combo chart ──────────────────────────────────── */}
      <div className="relative border border-[#387085]/20 bg-white">
        <CornerBrackets />
        <div className="px-4 py-3">
          <div className="flex items-start justify-between">
            <h3 className="text-xs font-semibold text-[#14140f]">Liquidations</h3>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums text-[#14140f]">{TOTAL_LIQ_BTC.toFixed(4)} sBTC</p>
              <p className="text-[11px] text-[#387085]/40">{toUsd(TOTAL_LIQ_BTC)}</p>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <PeriodToggles active={liqPeriod} onChange={setLiqPeriod} />
          </div>
        </div>
        <div className="px-4 pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={filteredLiqs} margin={{ top: 4, right: 52, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="date"
                ticks={liqXTicks}
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="count"
                orientation="left"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <YAxis
                yAxisId="btc"
                orientation="right"
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(56,112,133,0.2)', borderRadius: 0, fontSize: 11 }}
                labelFormatter={(label) => formatDateLabel(String(label))}
                formatter={(value: number, name: string) => {
                  if (name === 'count') return [`${value}`, 'Liquidation Count'];
                  return [`${value.toFixed(4)} sBTC`, 'Liquidated BTC'];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: 'rgba(56,112,133,0.6)' }}
                formatter={(value: string) => (value === 'count' ? 'Liquidation Count' : 'Liquidated BTC')}
              />
              <Bar yAxisId="count" dataKey="count" fill="#cd6332" opacity={0.85} maxBarSize={12} />
              <Line
                yAxisId="btc"
                type="monotone"
                dataKey="btc"
                stroke="#387085"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#387085' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Borrows combo chart ───────────────────────────────────────── */}
      <div className="relative border border-[#387085]/20 bg-white">
        <CornerBrackets />
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-[#14140f]">Borrows</h3>
          <div className="mt-2 flex justify-end">
            <PeriodToggles active={borrowPeriod} onChange={setBorrowPeriod} />
          </div>
        </div>
        <div className="px-4 pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={filteredBorrows} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="date"
                ticks={borrowXTicks}
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="count"
                orientation="left"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <YAxis
                yAxisId="cumulative"
                orientation="right"
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(56,112,133,0.2)', borderRadius: 0, fontSize: 11 }}
                labelFormatter={(label) => formatDateLabel(String(label))}
                formatter={(value: number, name: string) => {
                  if (name === 'count') return [`${value}`, 'Borrow Count'];
                  return [`${value}`, 'Total Borrows'];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: 'rgba(56,112,133,0.6)' }}
                formatter={(value: string) => (value === 'count' ? 'Borrow Count' : 'Total Borrows')}
              />
              <Bar yAxisId="count" dataKey="count" fill="#cd6332" opacity={0.85} maxBarSize={12} />
              <Line
                yAxisId="cumulative"
                type="monotone"
                dataKey="cumulative"
                stroke="#387085"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: '#387085' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Top Borrowers table ───────────────────────────────────────── */}
      <div className="relative border border-[#387085]/20 bg-white">
        <CornerBrackets />
        <div className="px-5 py-3">
          <h3 className="text-xs font-semibold text-[#14140f]">Top Borrowers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-y border-[#387085]/10 bg-[#387085]/[0.03] text-[10px] font-semibold uppercase tracking-wider text-[#387085]/50">
                <th className="whitespace-nowrap px-5 py-2 font-medium">#</th>
                <th className="whitespace-nowrap px-4 py-2 font-medium">Address</th>
                <th className="whitespace-nowrap px-4 py-2 text-right font-medium">Total Borrowed</th>
                <th className="whitespace-nowrap px-4 py-2 text-right font-medium">Borrow Count</th>
                <th className="whitespace-nowrap px-4 py-2 text-right font-medium">Total Liquidated</th>
                <th className="whitespace-nowrap px-4 py-2 text-right font-medium">Liquidations</th>
                <th className="whitespace-nowrap px-4 py-2 text-right font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TOP_BORROWERS.map((b, i) => (
                <tr key={b.address} className="border-b border-[#387085]/6 transition-colors hover:bg-[#faf9f5]">
                  <td className="whitespace-nowrap px-5 py-2.5 text-[#387085]/40">{i + 1}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Link href={`/accounts/${b.address}`} className="font-mono text-[11px] text-[#cd6332] hover:underline">
                      {truncateAddress(b.address, 6, 4)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <p className="font-semibold text-[#14140f]">{b.totalBorrowed.toFixed(4)} sBTC</p>
                    <p className="text-[10px] text-[#387085]/40">{toUsd(b.totalBorrowed)}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[#14140f]">{b.borrowCount}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    {b.totalLiquidated > 0
                      ? <>
                          <p className="font-semibold text-[#14140f]">{b.totalLiquidated.toFixed(4)} sBTC</p>
                          <p className="text-[10px] text-[#387085]/40">{toUsd(b.totalLiquidated)}</p>
                        </>
                      : <span className="text-[#387085]/30">&mdash;</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[#14140f]">
                    {b.liquidations > 0 ? b.liquidations : <span className="text-[#387085]/30">&mdash;</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[#387085]/50">
                    {formatRelativeTime(b.lastActivity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
