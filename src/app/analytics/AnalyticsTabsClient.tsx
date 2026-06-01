'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DevNote, { DevNoteSection } from '@/components/DevNote';
import { VaultsTabContent } from './AnalyticsClient';
import type { TimeSeriesPoint, Vault, DashboardKPIs } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VaultCreationPoint { date: string; count: number; amount: number }

interface AnalyticsTabsClientProps {
  kpis: DashboardKPIs;
  tvlHistory: TimeSeriesPoint[];
  activeVaultHistory: TimeSeriesPoint[];
  tvpHistory: TimeSeriesPoint[];
  tnvHistory: TimeSeriesPoint[];
  topActiveVaults: Vault[];
  vaultCreationData: VaultCreationPoint[];
}

type TabKey = 'vaults' | 'borrowing';

// ── Borrowing tab mock data ───────────────────────────────────────────────────

const stats = {
  collateralBtc:       8.24,
  collateralUsd:       494_400,
  btcPrice:            60_000,
  currentLoanUsd:      1_245_000,
  cumulativeLoanCount: 89,
  cumulativeLoanUsd:   4_892_000,
  liquidationCount:    7,
  liquidationBtc:      0.48,
  liquidationUsd:      28_800,
};

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('en-US')}`;
}

function makeSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

interface DailyPoint { date: string; borrows: number; liquidations: number; liquidatedBtc: number }

function buildDailyData(): DailyPoint[] {
  const rand = makeSeededRandom(42);
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const liq = rand() < 0.15 ? 1 : 0;
    return {
      date:          d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      borrows:       Math.floor(rand() * 5),
      liquidations:  liq,
      liquidatedBtc: liq ? parseFloat((rand() * 0.15 + 0.02).toFixed(4)) : 0,
    };
  });
}

const topBorrowers = [
  { address: '0x5a6b...3a4b', borrows: 12, lastActivity: 'Apr 8, 2026' },
  { address: '0x13eb...a439', borrows:  9, lastActivity: 'Apr 6, 2026' },
  { address: '0x2bbf...4778', borrows:  8, lastActivity: 'Mar 30, 2026' },
  { address: '0xdba3...055d', borrows:  7, lastActivity: 'Apr 2, 2026' },
  { address: '0x3c4d...1c2d', borrows:  6, lastActivity: 'Apr 5, 2026' },
];

const TOOLTIP_STYLE = {
  border: '1px solid rgba(56,112,133,0.15)',
  borderRadius: 0,
  fontSize: 11,
  background: 'white',
  boxShadow: 'none',
};

const AXIS_TICK = { fontSize: 10, fill: '#387085', opacity: 0.5 };

// ── KPI card shared component ─────────────────────────────────────────────────

const HATCH_STYLE: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(56,112,133,0.18) 0, rgba(56,112,133,0.18) 1px, transparent 1px, transparent 8px)',
};

function KpiCard({ label, value, sub, pending = false, valueClassName }: {
  label: string; value: string | number; sub: string; pending?: boolean; valueClassName?: string;
}) {
  if (pending) {
    return (
      <div className="relative overflow-hidden border border-dashed border-[#387085]/15 bg-[#faf9f5]/50 p-3 opacity-60">
        <div className="pointer-events-none absolute inset-0" style={HATCH_STYLE} />
        <div className="relative">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">{label}</p>
          <p className="mt-0.5 text-lg font-semibold text-[#387085]/20">—</p>
          <p className="mt-0.5 text-[10px] italic text-[#387085]/25">{sub}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${valueClassName ?? 'text-[#14140f]'}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-[#387085]/40">{sub}</p>
    </div>
  );
}

// ── Borrowing tab content ─────────────────────────────────────────────────────

function BorrowingTabContent() {
  const daily = useMemo(() => buildDailyData(), []);

  const borrows30d       = daily.reduce((s, d) => s + d.borrows, 0);
  const liquidations30d  = daily.reduce((s, d) => s + d.liquidations, 0);
  const liquidatedBtc30d = daily.reduce((s, d) => s + d.liquidatedBtc, 0);

  return (
    <div className="space-y-5">
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Total Collateral"    value={`${stats.collateralBtc.toFixed(2)} sBTC`} sub="ADD − REMOVE − LIQUIDATION" valueClassName="text-[#cd6332]" />
        <KpiCard label="Collateral (USD)"    value={fmtUsd(stats.collateralUsd)}              sub={`@ $${stats.btcPrice.toLocaleString()} / BTC`} />
        <KpiCard label="Current Loan Volume" value={fmtUsd(stats.currentLoanUsd)}             sub="reserve × reserve price" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Cumulative Borrows" value={stats.cumulativeLoanCount} sub="count(BORROW events)" />
        <KpiCard label="Cumulative Volume"  value={fmtUsd(stats.cumulativeLoanUsd)} sub="sum(BORROW) · all-time" />
        <KpiCard label="Liquidations"       value={stats.liquidationCount} sub="count(LIQUIDATION)" valueClassName={stats.liquidationCount > 0 ? 'text-red-500' : 'text-[#14140f]'} />
        <KpiCard label="Liquidated BTC"     value={`${stats.liquidationBtc.toFixed(4)} sBTC`} sub={`≈ ${fmtUsd(stats.liquidationUsd)}`} valueClassName="text-red-500" />
      </div>

      {/* Chart: Daily Borrow Count */}
      <section className="border border-[#387085]/10 bg-white">
        <div className="flex items-start justify-between border-b border-[#387085]/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#14140f]">Daily Borrow Count</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">count(BORROW events) · last 30 days</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#14140f]">{borrows30d}</p>
            <p className="text-[10px] text-[#387085]/40">total (30d)</p>
          </div>
        </div>
        <div className="px-4 py-4">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#387085" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={(v, i) => (i % 7 === 0 ? v : '')} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v ?? 0, 'Borrows']} />
              <Bar dataKey="borrows" fill="#cd6332" opacity={0.75} radius={[2, 2, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Charts: Liquidation Count + Liquidated BTC */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="border border-[#387085]/10 bg-white">
          <div className="flex items-start justify-between border-b border-[#387085]/10 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#14140f]">Liquidation Count</h2>
              <p className="mt-0.5 text-[11px] text-[#387085]/50">count(LIQUIDATION events) · last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-red-500">{liquidations30d}</p>
              <p className="text-[10px] text-[#387085]/40">total (30d)</p>
            </div>
          </div>
          <div className="px-4 py-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#387085" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={(v, i) => (i % 7 === 0 ? v : '')} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={20} ticks={[0, 1]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [v ?? 0, 'Liquidations']} />
                <Bar dataKey="liquidations" fill="#dc2626" opacity={0.7} radius={[2, 2, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="border border-[#387085]/10 bg-white">
          <div className="flex items-start justify-between border-b border-[#387085]/10 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#14140f]">Liquidated BTC</h2>
              <p className="mt-0.5 text-[11px] text-[#387085]/50">sum(vault.amount) via JOIN · last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-red-500">{liquidatedBtc30d.toFixed(4)} sBTC</p>
              <p className="text-[10px] text-[#387085]/40">total (30d)</p>
            </div>
          </div>
          <div className="px-4 py-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#387085" strokeOpacity={0.08} vertical={false} />
                <XAxis dataKey="date" tick={AXIS_TICK} tickFormatter={(v, i) => (i % 7 === 0 ? v : '')} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => v === 0 ? '0' : v.toFixed(2)} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v ?? 0).toFixed(4)} sBTC`, 'Liquidated']} />
                <Bar dataKey="liquidatedBtc" fill="#dc2626" opacity={0.55} radius={[2, 2, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Top Borrowers */}
      <section className="border border-[#387085]/10 bg-white">
        <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#14140f]">Top Borrowers</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">count(BORROW events) per address · all-time</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#387085]/8">
              {['#', 'Address', 'Borrow Count', 'Last Activity'].map((h) => (
                <th key={h} className="py-2 pl-5 pr-3 text-left text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topBorrowers.map((b, i) => (
              <tr key={b.address} className="border-b border-[#387085]/8 transition-colors last:border-0 hover:bg-[#faf9f5]">
                <td className="py-2.5 pl-5 pr-3 text-sm text-[#387085]/40">{i + 1}</td>
                <td className="py-2.5 pr-3">
                  <Link href={`/accounts/${b.address}`} className="font-mono text-xs text-[#cd6332] hover:underline">{b.address}</Link>
                </td>
                <td className="py-2.5 pr-3 text-sm font-semibold text-[#14140f]">{b.borrows}</td>
                <td className="py-2.5 pr-5 text-[11px] text-[#387085]/50">{b.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// ── Main tabs wrapper ─────────────────────────────────────────────────────────

export default function AnalyticsTabsClient(props: AnalyticsTabsClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('vaults');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'vaults',    label: 'Vaults' },
    { key: 'borrowing', label: 'Borrowing' },
  ];

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Analytics 기획 의도">
        <DevNoteSection heading="탭 구조">
          <p>Vaults 탭: TVL/Active Vault 추이 차트, Vault Creation 콤보 차트, Top Active Vaults.</p>
          <p>Borrowing 탭: Collateral KPI, Daily Borrow/Liquidation 차트, Top Borrowers.</p>
        </DevNoteSection>
        <DevNoteSection heading="데이터 원칙 (Borrowing)">
          <p>✅ On-chain 이벤트로 집계 가능한 지표만 표시.</p>
          <p>⚠️ 시계열 가격 데이터 필요 항목은 scalar KPI만 제공.</p>
        </DevNoteSection>
      </DevNote>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-[#14140f]">Analytics</h1>

      {/* Tab bar */}
      <div className="flex border-b border-[#387085]/15">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-[#cd6332] text-[#cd6332]'
                : 'text-[#387085]/50 hover:text-[#14140f]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'vaults' && <VaultsTabContent {...props} />}
      {activeTab === 'borrowing' && <BorrowingTabContent />}
    </div>
  );
}
