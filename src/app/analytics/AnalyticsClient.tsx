'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import CopyButton from '@/components/CopyButton';
import { truncateAddress, formatRelativeTime, toUsd } from '@/lib/utils';
import type { TimeSeriesPoint, Vault, DashboardKPIs } from '@/lib/types';

// ── Types ────────────────────────────────────────────────────────────────────

interface VaultCreationPoint {
  date: string;
  count: number;
  amount: number;
}

interface AnalyticsClientProps {
  kpis: DashboardKPIs;
  tvlHistory: TimeSeriesPoint[];
  activeVaultHistory: TimeSeriesPoint[];
  tvpHistory: TimeSeriesPoint[];
  tnvHistory: TimeSeriesPoint[];
  topActiveVaults: Vault[];
  vaultCreationData: VaultCreationPoint[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function filterCreationByPeriod(data: VaultCreationPoint[], period: Period): VaultCreationPoint[] {
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

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format ISO timestamp as YYYY/MM/DD HH:mm:ss (UTC) */
function formatDateUTC(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

// ── Corner bracket decoration ────────────────────────────────────────────────

function CornerBrackets() {
  return (
    <>
      {/* top-left */}
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#387085]/40" />
      {/* top-right */}
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#387085]/40" />
      {/* bottom-left */}
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[#387085]/40" />
      {/* bottom-right */}
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#387085]/40" />
    </>
  );
}

// ── Period toggle buttons ─────────────────────────────────────────────────────

function PeriodToggles({
  active,
  onChange,
}: {
  active: Period;
  onChange: (p: Period) => void;
}) {
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

// ── Single line chart card ────────────────────────────────────────────────────

interface LineChartCardProps {
  title: string;
  data: TimeSeriesPoint[];
  color: string;
  valueSuffix?: string;
  yTickFormatter?: (v: number) => string;
}

function LineChartCard({ title, data, color, valueSuffix = '', yTickFormatter }: LineChartCardProps) {
  const isBtc = valueSuffix.includes('sBTC') || valueSuffix.includes('BTC');
  const [period, setPeriod] = useState<Period>('ALL');
  const filtered = filterByPeriod(data, period);

  // Thin out x-axis labels
  const xTicks: string[] = [];
  if (filtered.length > 0) {
    const step = Math.max(1, Math.floor(filtered.length / 5));
    for (let i = 0; i < filtered.length; i += step) {
      xTicks.push(filtered[i].date);
    }
  }

  return (
    <div className="relative border border-[#387085]/20 bg-white">
      <CornerBrackets />
      <div className="px-4 py-3">
        <h3 className="text-xs font-semibold text-[#14140f]">{title}</h3>
        <div className="mt-2 flex justify-end">
          <PeriodToggles active={period} onChange={setPeriod} />
        </div>
      </div>
      <div className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={filtered} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yTickFormatter ?? ((v) => `${v}`)}
              tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: `1px solid ${color}33`,
                borderRadius: 0,
                fontSize: 11,
              }}
              labelFormatter={(label) => formatDateLabel(String(label))}
              formatter={(value) => {
                const v = Number(value);
                const base = `${v.toLocaleString()}${valueSuffix}`;
                return [isBtc ? `${base} ${toUsd(v)}` : base, ''];
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Vault Creation combo chart ────────────────────────────────────────────────

function VaultCreationChart({ data }: { data: VaultCreationPoint[] }) {
  const [period, setPeriod] = useState<Period>('ALL');
  const filtered = filterCreationByPeriod(data, period);

  const xTicks: string[] = [];
  if (filtered.length > 0) {
    const step = Math.max(1, Math.floor(filtered.length / 6));
    for (let i = 0; i < filtered.length; i += step) {
      xTicks.push(filtered[i].date);
    }
  }

  return (
    <div className="relative border border-[#387085]/20 bg-white">
      <CornerBrackets />
      <div className="px-4 py-3">
        <h3 className="text-xs font-semibold text-[#14140f]">Vault Creation</h3>
        <div className="mt-2 flex justify-end">
          <PeriodToggles active={period} onChange={setPeriod} />
        </div>
      </div>
      <div className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={filtered} margin={{ top: 4, right: 48, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              ticks={xTicks}
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
              axisLine={false}
              tickLine={false}
            />
            {/* Left Y-axis: vault count */}
            <YAxis
              yAxisId="count"
              orientation="left"
              tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(v) => String(v)}
            />
            {/* Right Y-axis: vault amount */}
            <YAxis
              yAxisId="amount"
              orientation="right"
              tick={{ fontSize: 10, fill: 'rgba(56,112,133,0.4)' }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v) => `${Number(v).toFixed(2)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid rgba(56,112,133,0.2)',
                borderRadius: 0,
                fontSize: 11,
              }}
              labelFormatter={(label) => formatDateLabel(String(label))}
              formatter={(value, name) => {
                if (name === 'count') return [`${value}`, 'Daily new vaults created'];
                return [`${Number(value).toFixed(4)} sBTC ${toUsd(Number(value))}`, 'Daily new vault amount'];
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={28}
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: 'rgba(56,112,133,0.6)' }}
              formatter={(value) =>
                value === 'count' ? 'Daily new vaults created' : 'Daily new vault amount'
              }
            />
            <Bar
              yAxisId="count"
              dataKey="count"
              fill="#cd6332"
              opacity={0.85}
              maxBarSize={16}
            />
            <Bar
              yAxisId="amount"
              dataKey="amount"
              fill="#387085"
              opacity={0.7}
              maxBarSize={16}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Vaults tab content (used by AnalyticsTabsClient) ─────────────────────────

export function VaultsTabContent({
  kpis,
  tvlHistory,
  activeVaultHistory,
  tvpHistory,
  tnvHistory,
  topActiveVaults,
  vaultCreationData,
}: AnalyticsClientProps) {
  return (
    <div className="space-y-5">

      {/* 2x2 chart grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <LineChartCard
          title="TVL History"
          data={tvlHistory}
          color="#cd6332"
          valueSuffix=" sBTC"
          yTickFormatter={(v) => `${v.toFixed(2)}`}
        />
        <LineChartCard
          title="Active Vault Count History"
          data={activeVaultHistory}
          color="#387085"
        />
        <LineChartCard
          title="TVP History"
          data={tvpHistory}
          color="#cd6332"
          valueSuffix=" sBTC"
          yTickFormatter={(v) => `${v.toFixed(2)}`}
        />
        <LineChartCard
          title="TNV History"
          data={tnvHistory}
          color="#387085"
        />
      </div>

      {/* Vault Creation chart (full width) */}
      <VaultCreationChart data={vaultCreationData} />

      {/* Top Active Vaults table */}
      <div className="rounded-none border border-[#cd6332]/20 bg-white">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-[#14140f]">Top Active Vaults</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Depositor</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Provider</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">DApp</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Created (Age)</th>
              </tr>
            </thead>
            <tbody>
              {topActiveVaults.map((vault) => (
                <tr
                  key={vault.id}
                  className="border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
                >
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <Link
                        href={`/vaults/${vault.id}`}
                        className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                      >
                        {truncateAddress(vault.id, 6, 4)}
                      </Link>
                      <CopyButton text={vault.id} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                    <div className="font-medium text-[#14140f]">{vault.vaultSize} sBTC</div>
                    <div className="text-[10px] text-[#387085]/40">{toUsd(vault.vaultSize)}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <Link
                        href={`/accounts/${vault.depositorAddress}`}
                        className="font-mono text-[11px] text-[rgba(56,112,133,0.5)] hover:text-[#cd6332]"
                      >
                        {truncateAddress(vault.depositorAddress, 6, 4)}
                      </Link>
                      <CopyButton text={vault.depositorAddress} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Link
                      href={`/accounts/${vault.providerAddress}`}
                      className="text-[11px] text-[#14140f] hover:text-[#cd6332]"
                    >
                      {vault.providerName}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#387085]">{vault.dappName}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[11px] text-[rgba(56,112,133,0.5)]">
                    {vault.createdAt ? formatRelativeTime(vault.createdAt) : '—'}
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

// ── Legacy default export (kept for backwards compat) ─────────────────────────
export default VaultsTabContent;
