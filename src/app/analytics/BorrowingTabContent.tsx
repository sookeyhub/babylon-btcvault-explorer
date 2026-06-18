'use client';

import { useState } from 'react';
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
import { toUsd } from '@/lib/utils';

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
          className={`rounded-none px-2 py-1 text-xs font-medium transition-colors ${
            active === p
              ? 'bg-[#cd6332] text-white'
              : 'text-[rgba(56,112,133,0.7)] hover:text-[#cd6332]'
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

const MOCK_ASSETS = [
  { asset: 'USDC', totalBorrowed: 1_250_000, totalBorrowedUsd: 1_250_000, available: 760_000,  availableUsd: 760_000,   apy: 4.2, utilization: 62.2, active: true },
  { asset: 'USDT', totalBorrowed: 480_000,   totalBorrowedUsd: 480_000,   available: 520_000,  availableUsd: 520_000,   apy: 5.1, utilization: 48.0, active: true },
  { asset: 'WBTC', totalBorrowed: 3.20,      totalBorrowedUsd: 210_300,   available: 18.10,    availableUsd: 1_189_700, apy: 1.8, utilization: 15.0, active: true },
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
              <p className="text-xs text-[#387085]/80">{toUsd(TOTAL_LIQ_BTC)}</p>
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
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.6)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="count"
                orientation="left"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.6)' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <YAxis
                yAxisId="btc"
                orientation="right"
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.6)' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(56,112,133,0.2)', borderRadius: 0, fontSize: 11 }}
                labelFormatter={(label) => formatDateLabel(String(label))}
                formatter={(value, name) => {
                  const v = Number(value ?? 0);
                  if (name === 'count') return [`${v}`, 'Liquidation Count'];
                  return [`${v.toFixed(4)} sBTC`, 'Liquidated BTC'];
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
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.6)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="count"
                orientation="left"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.6)' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <YAxis
                yAxisId="cumulative"
                orientation="right"
                tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.6)' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid rgba(56,112,133,0.2)', borderRadius: 0, fontSize: 11 }}
                labelFormatter={(label) => formatDateLabel(String(label))}
                formatter={(value, name) => {
                  const v = Number(value ?? 0);
                  if (name === 'count') return [`${v}`, 'Borrow Count'];
                  return [`${v}`, 'Total Borrows'];
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

      {/* ── Borrowing Assets table ────────────────────────────────────── */}
      <div className="rounded-none border border-[#cd6332]/20 bg-white">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-[#14140f]">Borrow Markets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#cd6332] text-xs font-medium uppercase tracking-wider text-white">
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Asset</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Total Borrowed</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Available to Borrow</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Utilization</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">APR</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ASSETS.map((a) => (
                <tr key={a.asset} className="border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#387085]/10 text-[9px] font-bold text-[#387085]">
                        {a.asset.charAt(0)}
                      </span>
                      <span className="font-semibold text-[#14140f]">{a.asset}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                    <div className="font-medium text-[#14140f]">
                      {a.totalBorrowed >= 1 ? a.totalBorrowed.toLocaleString() : a.totalBorrowed}
                    </div>
                    <div className="text-xs text-[#387085]/80">${a.totalBorrowedUsd.toLocaleString()}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                    <div className="font-medium text-[#14140f]">
                      {a.available >= 1 ? a.available.toLocaleString() : a.available}
                    </div>
                    <div className="text-xs text-[#387085]/80">${a.availableUsd.toLocaleString()}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">{a.utilization}%</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">{a.apy}%</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <span className={`inline-block h-2 w-2 rounded-full ${a.active ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className={a.active ? 'text-green-700' : 'text-red-500'}>
                        {a.active ? 'Active' : 'Paused'}
                      </span>
                    </span>
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
