'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ── Mock data ────────────────────────────────────────────────────────────────

const lendingStats = {
  currentLoanCount: 23,
  cumulativeLoanCount: 89,
  liquidationCount: 7,
  loanVolumeUsd: 1_245_000,
  cumulativeVolumeUsd: 4_892_000,
  interestAccruedUsd: 48_250,
  liquidationVolumeUsd: 182_400,
};

function fmtUsd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

// Seeded pseudo-random so charts are deterministic across renders
function makeSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

interface DailyPoint {
  date: string;
  borrows: number;
  repayments: number;
  liquidations: number;
}

function buildDailyActivity(): DailyPoint[] {
  const rand = makeSeededRandom(42);
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      borrows: Math.floor(rand() * 5),
      repayments: Math.floor(rand() * 4),
      liquidations: rand() < 0.15 ? 1 : 0,
    };
  });
}

// aave_position_collateral + vault_activity mock
const mockLoanPositions = [
  {
    depositor: '0x5a6b...3a4b',
    collateralBtc: 1.02,
    borrowed: 'USDC',
    borrowedAmount: 42000,
    repaidAmount: 20000,
    outstanding: 22000,
    ltv: 18.5,
    healthFactor: 3.2,
    lastActivity: 'Apr 8, 2026',
    hasLiquidation: false,
  },
  {
    depositor: '0x13eb...a439',
    collateralBtc: 0.88,
    borrowed: 'USDT',
    borrowedAmount: 35000,
    repaidAmount: 35000,
    outstanding: 0,
    ltv: 0,
    healthFactor: null,
    lastActivity: 'Apr 6, 2026',
    hasLiquidation: false,
  },
  {
    depositor: '0x2bbf...4778',
    collateralBtc: 1.45,
    borrowed: 'USDC',
    borrowedAmount: 58000,
    repaidAmount: 20000,
    outstanding: 38000,
    ltv: 27.4,
    healthFactor: 2.1,
    lastActivity: 'Apr 5, 2026',
    hasLiquidation: false,
  },
  {
    depositor: '0xdba3...055d',
    collateralBtc: 0.62,
    borrowed: 'USDC',
    borrowedAmount: 25000,
    repaidAmount: 10000,
    outstanding: 15000,
    ltv: 92.3,
    healthFactor: 0.85,
    lastActivity: 'Mar 30, 2026',
    hasLiquidation: true,
  },
  {
    depositor: '0x3c4d...1c2d',
    collateralBtc: 1.15,
    borrowed: 'USDT',
    borrowedAmount: 44000,
    repaidAmount: 44000,
    outstanding: 0,
    ltv: 0,
    healthFactor: null,
    lastActivity: 'Mar 22, 2026',
    hasLiquidation: false,
  },
];

const topBorrowers = [
  { address: '0x5a6b...3a4b', borrows: 12, repayments: 8, outstanding: 4, lastActivity: 'Apr 8, 2026' },
  { address: '0x13eb...a439', borrows: 9, repayments: 6, outstanding: 3, lastActivity: 'Apr 6, 2026' },
  { address: '0x2bbf...4778', borrows: 8, repayments: 8, outstanding: 0, lastActivity: 'Mar 30, 2026' },
  { address: '0xdba3...055d', borrows: 7, repayments: 4, outstanding: 3, lastActivity: 'Apr 2, 2026' },
  { address: '0x3c4d...1c2d', borrows: 6, repayments: 3, outstanding: 3, lastActivity: 'Apr 5, 2026' },
];

// ── KPI card ─────────────────────────────────────────────────────────────────

const HATCH_STYLE: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(56,112,133,0.18) 0, rgba(56,112,133,0.18) 1px, transparent 1px, transparent 8px)',
};

interface CardProps {
  label: string;
  value: string | number;
  sub: string;
  pending?: boolean;
  valueClassName?: string;
}

function KpiCard({ label, value, sub, pending = false, valueClassName }: CardProps) {
  if (pending) {
    return (
      <div className="relative overflow-hidden border border-dashed border-[#387085]/15 bg-[#faf9f5]/50 p-3 opacity-60">
        <div className="pointer-events-none absolute inset-0" style={HATCH_STYLE} />
        <div className="relative">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            {label}
          </p>
          <p className="mt-0.5 text-lg font-semibold text-[#387085]/20">—</p>
          <p className="mt-0.5 text-[10px] italic text-[#387085]/25">{sub}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${valueClassName ?? 'text-[#14140f]'}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-[#387085]/40">{sub}</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BorrowingAnalyticsPage() {
  const dailyLoanActivity = useMemo(() => buildDailyActivity(), []);

  const totalBorrows = dailyLoanActivity.reduce((s, d) => s + d.borrows, 0);
  const totalRepayments = dailyLoanActivity.reduce((s, d) => s + d.repayments, 0);
  const repaymentRate = totalBorrows > 0 ? (totalRepayments / totalBorrows) * 100 : 0;
  const totalLiquidations30d = dailyLoanActivity.reduce((s, d) => s + d.liquidations, 0);

  const rateColor =
    repaymentRate >= 80
      ? 'text-green-600'
      : repaymentRate >= 60
        ? 'text-amber-600'
        : 'text-red-500';

  const rateLabel =
    repaymentRate >= 80
      ? '✓ Healthy'
      : repaymentRate >= 60
        ? '⚠ Moderate'
        : '✕ High risk';

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[rgba(56,112,133,0.55)]">
        <Link href="/analytics" className="transition-colors hover:text-[#cd6332]">
          Analytics
        </Link>
        <span>/</span>
        <span className="font-medium text-[#14140f]">Borrowing</span>
      </nav>

      {/* Title */}
      <div>
        <h1 className="text-lg font-semibold text-[#14140f]">Borrowing Analytics</h1>
        <p className="mt-0.5 text-[11px] text-[#387085]/50">
          Aave lending activity powered by BTC Vault collateral
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <KpiCard
          label="Current Loans"
          value={lendingStats.currentLoanCount}
          sub="active borrow positions"
        />
        <KpiCard
          label="Loan Volume"
          value={fmtUsd(lendingStats.loanVolumeUsd)}
          sub="outstanding"
        />
        <KpiCard
          label="Cumulative Loans"
          value={lendingStats.cumulativeLoanCount}
          sub="all-time borrow count"
        />
        <KpiCard
          label="Cumulative Volume"
          value={fmtUsd(lendingStats.cumulativeVolumeUsd)}
          sub="all-time borrowed"
        />
        <KpiCard
          label="Interest Accrued"
          value={fmtUsd(lendingStats.interestAccruedUsd)}
          sub="protocol-wide"
        />
        <KpiCard
          label="Liquidations"
          value={lendingStats.liquidationCount}
          sub="all-time count"
          valueClassName={
            lendingStats.liquidationCount > 0 ? 'text-red-500' : 'text-[#14140f]'
          }
        />
        <KpiCard
          label="Liquidation Volume"
          value={fmtUsd(lendingStats.liquidationVolumeUsd)}
          sub="all-time liquidated"
          valueClassName="text-red-500"
        />
      </div>

      {/* Section 1 — Loan Activity + Repayment Rate (2-col) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Loan Activity chart */}
        <section className="border border-[#387085]/10 bg-white lg:col-span-2">
          <div className="flex items-start justify-between border-b border-[#387085]/10 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#14140f]">Loan Activity</h2>
              <p className="mt-0.5 text-[11px] text-[#387085]/50">
                Daily borrows and repayments · last 30 days
              </p>
            </div>
          </div>
          <div className="px-4 py-4">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={dailyLoanActivity}
                margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#387085"
                  strokeOpacity={0.08}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#387085', opacity: 0.5 }}
                  tickFormatter={(v, i) => (i % 7 === 0 ? v : '')}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#387085', opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip
                  contentStyle={{
                    border: '1px solid rgba(56,112,133,0.15)',
                    borderRadius: 0,
                    fontSize: 11,
                    background: 'white',
                    boxShadow: 'none',
                  }}
                  formatter={(value: number | undefined, name: string | undefined) => [
                    value ?? 0,
                    name === 'borrows' ? 'Borrows' : 'Repayments',
                  ]}
                />
                <Bar
                  dataKey="borrows"
                  fill="#cd6332"
                  opacity={0.75}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={12}
                  name="borrows"
                />
                <Bar
                  dataKey="repayments"
                  fill="#387085"
                  opacity={0.5}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={12}
                  name="repayments"
                />
                <Legend
                  iconSize={8}
                  iconType="square"
                  formatter={(v) => (
                    <span style={{ fontSize: 11, color: '#387085', opacity: 0.6 }}>
                      {v === 'borrows' ? 'Borrows' : 'Repayments'}
                    </span>
                  )}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Repayment Rate */}
        <section className="border border-[#387085]/10 bg-white">
          <div className="border-b border-[#387085]/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-[#14140f]">Repayment Rate</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">
              Repayments vs borrows (30d)
            </p>
          </div>
          <div className="flex h-[200px] flex-col items-center justify-center gap-4 px-5 py-6">
            <div className="text-center">
              <p className={`text-4xl font-semibold ${rateColor}`}>
                {repaymentRate.toFixed(1)}%
              </p>
              <p className="mt-1 text-[11px] text-[#387085]/50">
                {totalRepayments} repaid / {totalBorrows} borrowed
              </p>
            </div>
            <div className="w-full">
              <div className="h-2 w-full bg-[#387085]/8">
                <div
                  className="h-full bg-green-500 opacity-70 transition-all"
                  style={{ width: `${Math.min(repaymentRate, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-[10px] text-[#387085]/40">0%</span>
                <span className="text-[10px] text-[#387085]/40">100%</span>
              </div>
            </div>
            <p className={`text-xs font-medium ${rateColor}`}>{rateLabel}</p>
          </div>
        </section>
      </div>

      {/* Section 2 — Liquidation History */}
      <section className="border border-[#387085]/10 bg-white">
        <div className="flex items-start justify-between border-b border-[#387085]/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#14140f]">Liquidation History</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">
              Daily liquidation events · last 30 days
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-red-500">{totalLiquidations30d}</p>
            <p className="text-[10px] text-[#387085]/40">total (30d)</p>
          </div>
        </div>
        <div className="px-4 py-4">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart
              data={dailyLoanActivity}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#387085"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#387085', opacity: 0.5 }}
                tickFormatter={(v, i) => (i % 7 === 0 ? v : '')}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#387085', opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
                width={20}
                ticks={[0, 1]}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid rgba(56,112,133,0.15)',
                  borderRadius: 0,
                  fontSize: 11,
                  background: 'white',
                  boxShadow: 'none',
                }}
                formatter={(value: number | undefined) => [value ?? 0, 'Liquidations']}
              />
              <Bar
                dataKey="liquidations"
                fill="#dc2626"
                opacity={0.7}
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Section 3 — Top Borrowers */}
      <section className="border border-[#387085]/10 bg-white">
        <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-[#14140f]">Top Borrowers</h2>
          <span className="text-[11px] text-[#387085]/40">
            by borrow count · last 30 days
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#387085]/8">
              {['#', 'Address', 'Borrows', 'Repayments', 'Outstanding', 'Last Activity'].map(
                (h) => (
                  <th
                    key={h}
                    className="py-2 pl-5 pr-3 text-left text-[11px] font-medium uppercase tracking-wide text-[#387085]/50"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {topBorrowers.map((b, i) => (
              <tr
                key={b.address}
                className="border-b border-[#387085]/8 transition-colors last:border-0 hover:bg-[#faf9f5]"
              >
                <td className="py-2.5 pl-5 pr-3 text-sm text-[#387085]/40">{i + 1}</td>
                <td className="py-2.5 pr-3">
                  <Link
                    href={`/accounts/${b.address}`}
                    className="font-mono text-xs text-[#cd6332] hover:underline"
                  >
                    {b.address}
                  </Link>
                </td>
                <td className="py-2.5 pr-3 text-sm font-medium text-[#14140f]">{b.borrows}</td>
                <td className="py-2.5 pr-3 text-sm text-green-600">{b.repayments}</td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`text-sm font-semibold ${
                      b.outstanding > 0 ? 'text-[#cd6332]' : 'text-[#387085]/40'
                    }`}
                  >
                    {b.outstanding}
                  </span>
                </td>
                <td className="py-2.5 pr-5 text-[11px] text-[#387085]/50">
                  {b.lastActivity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Active Loan Positions */}
      <section className="border border-[#387085]/10 bg-white">
        <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#14140f]">Active Loan Positions</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">
              Per depositor collateral and borrowing activity
            </p>
          </div>
          <span className="text-[11px] text-[#387085]/40">
            {mockLoanPositions.length} positions
          </span>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#387085]/8">
              {[
                { label: 'Depositor', tip: null },
                { label: 'Collateral', tip: 'BTC deposited as collateral in Aave' },
                { label: 'Borrowed', tip: 'Total borrowed via vault_activity' },
                { label: 'Repaid', tip: 'Total repaid via vault_activity' },
                { label: 'Outstanding', tip: 'Borrowed minus repaid' },
                { label: 'LTV', tip: 'Loan-to-Value — contract view pending' },
                { label: 'Health', tip: 'Health Factor — contract view pending' },
                { label: 'Last Active', tip: null },
              ].map((h) => (
                <th
                  key={h.label}
                  className="py-2 pl-5 pr-3 text-left text-[11px] font-medium uppercase tracking-wide text-[#387085]/50"
                >
                  <span className="flex items-center gap-1">
                    {h.label}
                    {h.tip && (
                      <span
                        title={h.tip}
                        className="cursor-help text-xs text-[#387085]/30"
                      >
                        ⓘ
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockLoanPositions.map((p) => (
              <tr
                key={p.depositor}
                className={`border-b border-[#387085]/8 transition-colors last:border-0 ${
                  p.hasLiquidation
                    ? 'bg-red-50/40 hover:bg-red-50/60'
                    : 'hover:bg-[#faf9f5]'
                }`}
              >
                {/* Depositor */}
                <td className="py-2.5 pl-5 pr-3">
                  <div className="flex items-center gap-1.5">
                    {p.hasLiquidation && (
                      <span className="text-xs text-red-500" title="Liquidation detected">
                        ⚠
                      </span>
                    )}
                    <Link
                      href={`/accounts/${p.depositor}`}
                      className="font-mono text-xs text-[#cd6332] hover:underline"
                    >
                      {p.depositor}
                    </Link>
                  </div>
                </td>

                {/* Collateral BTC */}
                <td className="py-2.5 pr-3">
                  <span className="text-sm font-semibold text-[#14140f]">
                    {p.collateralBtc.toFixed(2)}
                  </span>
                  <span className="ml-1 text-[11px] text-[#387085]/40">sBTC</span>
                </td>

                {/* Borrowed */}
                <td className="py-2.5 pr-3">
                  <span className="text-sm text-[#cd6332]">
                    {p.borrowedAmount.toLocaleString()}
                  </span>
                  <span className="ml-1 text-[11px] text-[#387085]/40">{p.borrowed}</span>
                </td>

                {/* Repaid */}
                <td className="py-2.5 pr-3">
                  <span className="text-sm text-green-600">
                    {p.repaidAmount.toLocaleString()}
                  </span>
                  <span className="ml-1 text-[11px] text-[#387085]/40">{p.borrowed}</span>
                </td>

                {/* Outstanding */}
                <td className="py-2.5 pr-3">
                  <span
                    className={`text-sm font-semibold ${
                      p.outstanding > 0 ? 'text-[#14140f]' : 'text-[#387085]/30'
                    }`}
                  >
                    {p.outstanding > 0 ? p.outstanding.toLocaleString() : '—'}
                  </span>
                  {p.outstanding > 0 && (
                    <span className="ml-1 text-[11px] text-[#387085]/40">{p.borrowed}</span>
                  )}
                </td>

                {/* LTV */}
                <td className="py-2.5 pr-3">
                  {p.outstanding > 0 ? (
                    <span
                      className={`text-sm font-semibold ${
                        p.ltv >= 90
                          ? 'text-red-500'
                          : p.ltv >= 75
                            ? 'text-amber-600'
                            : 'text-[#14140f]'
                      }`}
                    >
                      {p.ltv.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-sm text-[#387085]/30">—</span>
                  )}
                </td>

                {/* Health Factor */}
                <td className="py-2.5 pr-3">
                  {p.healthFactor != null ? (
                    <span
                      className={`text-sm font-semibold ${
                        p.healthFactor < 1
                          ? 'text-red-500'
                          : p.healthFactor < 1.5
                            ? 'text-amber-600'
                            : 'text-green-600'
                      }`}
                    >
                      {p.healthFactor.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm text-[#387085]/30">—</span>
                  )}
                </td>

                {/* Last Active */}
                <td className="py-2.5 pr-5 text-[11px] text-[#387085]/50">
                  {p.lastActivity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </section>
    </div>
  );
}
