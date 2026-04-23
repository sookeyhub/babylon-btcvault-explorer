'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import DevNote, { DevNoteSection } from '@/components/DevNote';
import type { Account, AccountType } from '@/lib/types';
import {
  MOCK_ACCOUNTS,
  MOCK_VAULTS,
  MOCK_DEPOSITORS,
  MOCK_PROVIDERS,
  MOCK_DAPPS,
} from '@/lib/mock-data';
import { truncateAddress } from '@/lib/utils';

const PAGE_SIZE = 25;

function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1 inline-flex shrink-0 text-[rgba(56,112,133,0.3)] hover:text-[#387085]"
      title={copied ? 'Copied!' : 'Copy'}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        {copied ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
        )}
      </svg>
    </button>
  );
}

const TYPE_BADGE: Record<Account['type'], string> = {
  EOA:      'bg-[#387085]/10 text-[#387085]',
  Contract: 'bg-[#cd6332]/10 text-[#cd6332]',
  Module:   'bg-[#5a8a3c]/10 text-[#5a8a3c]',
};

const TYPE_OPTIONS: AccountType[] = ['EOA', 'Contract'];

// ── Enriched account data (Role / Vaults / Active / Total BTC / DApp) ───────

type AccountRole = 'Depositor' | 'Provider';

interface EnrichedAccount extends Account {
  roles: AccountRole[];
  vaultCountDerived: number;
  activeVaultsDerived: number;
  totalBtcDerived: number;
  primaryDApp: string | null;
  extraDAppCount: number;
}

// Precompute depositor / provider / dapp sets from mock data
const DEPOSITOR_VAULTS = new Map<string, { total: number; active: number; btc: number; dapps: Map<string, number> }>();
for (const v of MOCK_VAULTS) {
  const addr = v.depositorAddress?.toLowerCase();
  const entry = DEPOSITOR_VAULTS.get(addr) ?? { total: 0, active: 0, btc: 0, dapps: new Map<string, number>() };
  entry.total++;
  if (v.status === 'Active') entry.active++;
  entry.btc += v.vaultSize;
  entry.dapps.set(v.dappName, (entry.dapps.get(v.dappName) ?? 0) + 1);
  DEPOSITOR_VAULTS.set(addr, entry);
}

const PROVIDER_VAULTS = new Map<string, { total: number; active: number; btc: number; dapps: Map<string, number> }>();
for (const v of MOCK_VAULTS) {
  const addr = v.providerAddress.toLowerCase();
  const entry = PROVIDER_VAULTS.get(addr) ?? { total: 0, active: 0, btc: 0, dapps: new Map<string, number>() };
  entry.total++;
  if (v.status === 'Active') entry.active++;
  entry.btc += v.vaultSize;
  entry.dapps.set(v.dappName, (entry.dapps.get(v.dappName) ?? 0) + 1);
  PROVIDER_VAULTS.set(addr, entry);
}

// Build enriched + sorted list (descending by totalBtc; no-role accounts at the bottom)
const ENRICHED_ACCOUNTS: EnrichedAccount[] = MOCK_ACCOUNTS
  .filter((a) => a.type !== 'Module')
  .map((a) => {
    const lc = a.address.toLowerCase();
    const dep = DEPOSITOR_VAULTS.get(lc);
    const prov = PROVIDER_VAULTS.get(lc);

    const roles: AccountRole[] = [];
    if (dep) roles.push('Depositor');
    if (prov) roles.push('Provider');

    // Vault count — use the larger side; if both roles, take max (not sum)
    const vaultCountDerived = Math.max(dep?.total ?? 0, prov?.total ?? 0);
    const activeVaultsDerived = Math.max(dep?.active ?? 0, prov?.active ?? 0);
    const totalBtcDerived = Math.max(dep?.btc ?? 0, prov?.btc ?? 0);

    // Primary DApp: most-used; prefer provider's perspective if both
    const dappMap = prov?.dapps ?? dep?.dapps ?? new Map<string, number>();
    let primaryDApp: string | null = null;
    let maxCount = 0;
    for (const [name, count] of dappMap) {
      if (count > maxCount) {
        maxCount = count;
        primaryDApp = name;
      }
    }
    const extraDAppCount = Math.max(0, dappMap.size - 1);

    return {
      ...a,
      roles,
      vaultCountDerived,
      activeVaultsDerived,
      totalBtcDerived,
      primaryDApp,
      extraDAppCount,
    };
  })
  .sort((a, b) => {
    // No-role accounts sink to the bottom
    const aHasRole = a.roles.length > 0 ? 1 : 0;
    const bHasRole = b.roles.length > 0 ? 1 : 0;
    if (aHasRole !== bHasRole) return bHasRole - aHasRole;
    return b.totalBtcDerived - a.totalBtcDerived;
  });

// Only include accounts with Depositor or Provider role in the list
const LISTED_ACCOUNTS = ENRICHED_ACCOUNTS.filter((a) =>
  a.roles.includes('Depositor') || a.roles.includes('Provider'),
);

// ── Dashboard helpers ───────────────────────────────────────────────────────

function truncateAddr(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border border-[#387085]/10 bg-[#faf9f5] p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#387085]/50">{sub}</p>
      <span className="pointer-events-none absolute right-3 top-3 text-[#387085]/20">
        {icon}
      </span>
    </div>
  );
}

function AccountDashboard() {
  const vaults = MOCK_VAULTS;
  const depositors = MOCK_DEPOSITORS;
  const providers = MOCK_PROVIDERS;
  const dapps = MOCK_DAPPS;

  const totalVaults = vaults.length;
  const totalBtc = vaults.reduce((s, v) => s + v.vaultSize, 0);

  // ── New Depositors — weekly first-time depositors (last 4 weeks) ─────
  const firstVaultByDepositor = new Map<string, Date>();
  for (const v of vaults) {
    const addr = v.depositorAddress?.toLowerCase();
    const date = new Date(v.createdAt);
    const existing = firstVaultByDepositor.get(addr);
    if (!existing || date < existing) {
      firstVaultByDepositor.set(addr, date);
    }
  }

  const today = new Date();
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(today.getDate() - (3 - i) * 7 - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const startLabel = weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return {
      week: `W${i + 1}`,
      label: i === 3 ? 'This week' : startLabel,
      weekStart,
      weekEnd,
      count: 0,
      cumulative: 0,
    };
  });

  firstVaultByDepositor.forEach((date) => {
    for (const w of weeks) {
      if (date >= w.weekStart && date <= w.weekEnd) {
        w.count++;
      }
    }
  });

  // Example-data fallback: if mock data is empty for the window, seed some
  const totalFromData = weeks.reduce((s, w) => s + w.count, 0);
  let cumulativeBase: number;
  if (totalFromData === 0) {
    const sampleCounts = [3, 7, 4, 9];
    weeks.forEach((w, i) => { w.count = sampleCounts[i]; });
    cumulativeBase = 142; // sample existing total depositors before the window
  } else {
    // Real data: count depositors who first appeared before the window
    cumulativeBase = 0;
    for (const date of firstVaultByDepositor.values()) {
      if (date < weeks[0].weekStart) cumulativeBase++;
    }
  }

  let running = cumulativeBase;
  for (const w of weeks) {
    running += w.count;
    w.cumulative = running;
  }

  const totalNewDepositors = weeks.reduce((s, w) => s + w.count, 0);

  const topDepositors = [...depositors]
    .sort((a, b) => b.totalBtc - a.totalBtc)
    .slice(0, 5);

  const topProviders = [...providers]
    .sort((a, b) => b.totalBtc - a.totalBtc)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Depositors"
          value={depositors.length}
          sub="unique BTC depositor addresses"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
        <KpiCard
          label="Providers"
          value={providers.length}
          sub="registered vault providers"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" />
            </svg>
          }
        />
        <KpiCard
          label="DApps"
          value={dapps.length}
          sub="integrated DeFi applications"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          }
        />
        <KpiCard
          label="Avg Vault Size"
          value={`${(totalBtc / Math.max(totalVaults, 1)).toFixed(2)} sBTC`}
          sub="average BTC per vault"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          }
        />
      </div>

      {/* ── New Depositors + Top tables ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* New Depositors — weekly (last 4 weeks) */}
        <section className="flex h-[440px] flex-col border border-[#387085]/10 bg-white lg:col-span-1">
          <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#14140f]">New Depositors</h2>
              <p className="mt-0.5 text-[11px] text-[#387085]/50">
                Weekly · last 4 weeks
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold text-[#cd6332]">
                +{totalNewDepositors}
              </span>
              <p className="text-[10px] text-[#387085]/40">new this month</p>
            </div>
          </div>

          {/* Chart — fills remaining vertical space */}
          <div className="flex-1 px-4 pb-2 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={weeks}
                margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
                barCategoryGap="35%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#387085"
                  strokeOpacity={0.08}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#387085', opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="bar"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#387085', opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <YAxis
                  yAxisId="line"
                  orientation="right"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#387085', opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    border: '1px solid rgba(56,112,133,0.15)',
                    borderRadius: 0,
                    fontSize: 11,
                    background: 'white',
                    boxShadow: 'none',
                    padding: '6px 10px',
                  }}
                  labelFormatter={(_label, payload) => {
                    const p = payload?.[0]?.payload as
                      | { weekStart?: Date; weekEnd?: Date }
                      | undefined;
                    if (!p?.weekStart || !p?.weekEnd) return _label as string;
                    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                    return `${p.weekStart.toLocaleDateString('en-US', opts)} – ${p.weekEnd.toLocaleDateString('en-US', opts)}`;
                  }}
                  formatter={(value: number | undefined, name: string | undefined) => [
  value ?? 0,
  name === 'count' ? 'New Depositors' : 'Total Depositors',
]}
                  labelStyle={{ color: '#14140f', fontWeight: 500, marginBottom: 4 }}
                  cursor={{ fill: 'rgba(56,112,133,0.04)' }}
                />
                <Bar
                  yAxisId="bar"
                  dataKey="count"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                  isAnimationActive={false}
                  name="count"
                >
                  {weeks.map((w, i) => (
                    <Cell
                      key={w.week}
                      fill="#cd6332"
                      fillOpacity={i === 3 ? 0.85 : 0.35 + i * 0.12}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="line"
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#387085"
                  strokeWidth={1.5}
                  dot={{ r: 3, fill: '#387085', strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  name="cumulative"
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 border-t border-[#387085]/8 px-5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 shrink-0 rounded-sm bg-[#cd6332] opacity-75" />
              <span className="text-[11px] text-[#387085]/60">New depositors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-6 shrink-0 bg-[#387085]" />
              <span className="text-[11px] text-[#387085]/60">Total (cumulative)</span>
            </div>
          </div>
        </section>

        {/* Top Providers + Top Depositors stacked — fixed heights */}
        <div className="flex h-[440px] flex-col gap-5 lg:col-span-2">
          {/* Top Providers (moved to top) */}
          <section className="flex h-[210px] flex-col overflow-hidden border border-[#387085]/10 bg-white">
            <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-[#14140f]">Top Providers</h2>
              <Link href="/providers" className="text-xs text-[#cd6332] hover:underline">
                View all →
              </Link>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-[#387085]/8">
                    <th className="py-2 pl-5 pr-3 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">#</th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Name / Address</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Commission</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Vaults</th>
                    <th className="px-3 py-2 pr-5 text-right text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total BTC</th>
                  </tr>
                </thead>
                <tbody>
                  {topProviders.map((p, i) => (
                    <tr
                      key={p.address}
                      className="border-b border-[#387085]/8 transition-colors last:border-0 hover:bg-[#faf9f5]"
                    >
                      <td className="py-2 pl-5 pr-3 text-sm text-[#387085]/50">{i + 1}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/accounts/${p.address}`}
                          title={p.address}
                          className={`text-xs font-medium text-[#cd6332] hover:underline ${p.name ? '' : 'font-mono'}`}
                        >
                          {p.name || truncateAddr(p.address)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-[#387085]">
                        {(p.commission / 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-[#14140f]">{p.vaultCount}</td>
                      <td className="px-3 py-2 pr-5 text-right text-sm font-semibold text-[#14140f]">
                        {p.totalBtc.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Top Depositors (moved below) */}
          <section className="flex h-[210px] flex-col overflow-hidden border border-[#387085]/10 bg-white">
            <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-[#14140f]">Top Depositors</h2>
              <Link href="/depositors" className="text-xs text-[#cd6332] hover:underline">
                View all →
              </Link>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-[#387085]/8">
                    <th className="py-2 pl-5 pr-3 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">#</th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Address</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Vaults</th>
                    <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Active</th>
                    <th className="px-3 py-2 pr-5 text-right text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total BTC</th>
                  </tr>
                </thead>
                <tbody>
                  {topDepositors.map((d, i) => (
                    <tr
                      key={d.address}
                      className="border-b border-[#387085]/8 transition-colors last:border-0 hover:bg-[#faf9f5]"
                    >
                      <td className="py-2 pl-5 pr-3 text-sm text-[#387085]/50">{i + 1}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/accounts/${d.address}`}
                          title={d.address}
                          className="font-mono text-xs font-medium text-[#cd6332] hover:underline"
                        >
                          {truncateAddr(d.address)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-[#14140f]">{d.totalVaults}</td>
                      <td className="px-3 py-2 text-right text-xs text-green-600">{d.activeVaults}</td>
                      <td className="px-3 py-2 pr-5 text-right text-sm font-semibold text-[#14140f]">
                        {d.totalBtc.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


export default function AccountsPage() {
  const [page, setPage] = useState(1);

  const total = LISTED_ACCOUNTS.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageAccounts = LISTED_ACCOUNTS.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Accounts 페이지 기획 의도">
        <DevNoteSection heading="페이지 목적">
          <p>BTCVault 생태계 참여자 전체를 조망하는 Account 중심 대시보드와 목록.</p>
          <p>누가 얼마를 예치·관리하고 있는지를 한 화면에서 파악하도록 설계.</p>
        </DevNoteSection>

        <DevNoteSection heading="상단 KPI">
          <p>Depositors / Providers / DApps / Avg Vault Size 4개의 네트워크 지표.</p>
          <p>Module(프로토콜 내부 주소)은 집계에서 제외.</p>
        </DevNoteSection>

        <DevNoteSection heading="New Depositors 차트">
          <p>최근 4주간 신규 Depositor 유입 추이를 주 단위로 표시.</p>
          <p>막대는 주별 신규 수, 라인은 누적 총 Depositor 수.</p>
          <p>우측 상단에 이번 달 총 신규 수를 강조해 노출.</p>
        </DevNoteSection>

        <DevNoteSection heading="Top Providers / Top Depositors">
          <p>Total BTC 기준 상위 5개 요약 테이블.</p>
          <p>클릭 시 해당 계정 상세로 이동. View all로 전체 목록 페이지 진입.</p>
        </DevNoteSection>

        <DevNoteSection heading="All Accounts 목록">
          <p>Depositor 또는 Provider 역할이 있는 계정만 노출.</p>
          <p>역할 없는 일반 주소나 Module, DApp-only는 제외.</p>
          <p>Total BTC 내림차순 정렬.</p>
          <p>Depositor·Provider 둘 다인 경우 Vault 수는 합산이 아닌 실제 관리 수로 표시.</p>
        </DevNoteSection>

        <DevNoteSection heading="주소 규칙">
          <p>이름이 등록된 계정은 이름만 노출, 없으면 축약 표시.</p>
          <p>Contract 계정은 주소 앞 아이콘으로 구분.</p>
          <p>클릭 시 모든 주소는 통합 Account 상세로 이동.</p>
        </DevNoteSection>
      </DevNote>
      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-lg font-semibold text-[#14140f]">Accounts</h1>
        <p className="mt-1 text-sm text-[#387085]/60">
          Network participants across depositors, providers, and DeFi applications
        </p>
      </div>

      {/* ── Account dashboard ──────────────────────────────────────────── */}
      <AccountDashboard />

      {/* ── All Accounts section ───────────────────────────────────────── */}
      <div className="mt-2 border-t border-[#387085]/10 pt-8">
        <h2 className="mb-4 text-base font-semibold text-[#14140f]">All Accounts</h2>
      </div>

      {/* Results count + Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgba(56,112,133,0.5)]">
          Showing <span className="font-semibold text-[#14140f]">{total}</span> results
        </p>
        <div className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
          <button onClick={() => setPage(1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">«</button>
          <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">‹</button>
          <span className="px-2 text-[#14140f]">Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span></span>
          <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">›</button>
          <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">»</button>
        </div>
      </div>

      {/* Table */}
      <div className="min-h-[500px] border border-[#387085]/10 bg-white">
        <table className="w-full table-fixed text-left">
          <colgroup>
            <col className="w-[6%]" />
            <col className="w-[32%]" />
            <col className="w-[24%]" />
            <col className="w-[18%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#387085]/8">
              <th className="py-2 pl-5 pr-3 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">#</th>
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Address</th>
              <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Role</th>
              <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Vaults</th>
              <th className="px-3 py-2 pr-5 text-right text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total BTC</th>
            </tr>
          </thead>
          <tbody>
            {pageAccounts.map((account, i) => {
              const rank = (safePage - 1) * PAGE_SIZE + i + 1;
              const hasRole = account.roles.length > 0;
              return (
                <tr
                  key={account.address}
                  className={`border-b border-[#387085]/8 last:border-0 ${
                    hasRole
                      ? 'transition-colors hover:bg-[#faf9f5]'
                      : 'opacity-50 transition-opacity hover:opacity-80'
                  }`}
                >
                  <td className="py-2.5 pl-5 pr-3 text-sm text-[#387085]/50">{rank}</td>

                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      {account.type === 'Contract' && (
                        <span
                          title="Contract Account (CA)"
                          className="inline-flex shrink-0 cursor-help text-[#cd6332]"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                          </svg>
                        </span>
                      )}
                      <Link
                        href={`/accounts/${account.address}`}
                        title={account.address}
                        className="text-xs font-medium text-[#cd6332] hover:underline"
                      >
                        {account.name ? (
                          account.name
                        ) : (
                          <span className="font-mono">{truncateAddr(account.address)}</span>
                        )}
                      </Link>
                      <CopyIcon text={account.address} />
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    {account.roles.length === 0 ? (
                      <span className="text-[#387085]/25">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1">
                        {account.roles.map((role) => {
                          const styles =
                            role === 'Depositor'
                              ? 'bg-[#cd6332]/8 text-[#cd6332]'
                              : 'bg-[#387085]/8 text-[#387085]';
                          return (
                            <span
                              key={role}
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${styles}`}
                            >
                              {role}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {account.vaultCountDerived > 0 ? (
                      <span className="text-sm">
                        <span className="text-[#14140f]">{account.vaultCountDerived}</span>
                        {account.activeVaultsDerived > 0 && (
                          <span className="ml-1 text-[11px] text-green-600">
                            ({account.activeVaultsDerived} active)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-[#387085]/25">—</span>
                    )}
                  </td>

                  <td className="px-3 py-2.5 pr-5 text-right tabular-nums">
                    {account.totalBtcDerived > 0 ? (
                      <span className="text-sm font-semibold text-[#14140f]">
                        {account.totalBtcDerived.toFixed(4)}{' '}
                        <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
                      </span>
                    ) : (
                      <span className="text-sm text-[#387085]/25">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
