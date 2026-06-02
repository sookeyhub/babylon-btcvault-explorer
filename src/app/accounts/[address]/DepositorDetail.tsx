'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_VAULTS, MOCK_DEPOSITORS } from '@/lib/mock-data';
import {
  MOCK_PORTFOLIO_POSITIONS,
  MOCK_AAVE_V4_ACTIVITIES,
  MOCK_DEPOSITOR_AAVE_POSITION,
  type AaveV4Activity,
  type AaveV4ActivityType,
  type TokenAmount,
} from '@/lib/mock-aave-activity';
import { truncateAddress, formatDate, formatRelativeTime } from '@/lib/utils';
import type { Vault } from '@/lib/types';

const BTC_USD_RATE = 65000;

/* ── CopyIcon ──────────────────────────────────────────────────────────── */

function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 inline-flex shrink-0 text-[rgba(56,112,133,0.3)] hover:text-[#387085]"
      title={copied ? 'Copied!' : 'Copy'}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        {copied
          ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
        }
      </svg>
    </button>
  );
}

/* ── Tab types ─────────────────────────────────────────────────────────── */

type TabKey = 'collateral' | 'deposited' | 'aave_activity';

/* ── Aave Activity helpers (reused from AccountDetailTabs) ─────────────── */

interface ActivityStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
  amountColor: string;
  amountPrefix: string;
}

const ACTIVITY_STYLES: Record<AaveV4ActivityType, ActivityStyle> = {
  ADD_COLLATERAL: {
    label: 'Add Collateral', bg: 'bg-[#387085]/8', text: 'text-[#387085]',
    dot: '#387085', amountColor: 'text-green-600', amountPrefix: '+',
  },
  REMOVE_COLLATERAL: {
    label: 'Remove Collateral', bg: 'bg-[#387085]/8', text: 'text-[#387085]/70',
    dot: '#387085', amountColor: 'text-amber-600', amountPrefix: '-',
  },
  BORROW: {
    label: 'Borrow', bg: 'bg-[#cd6332]/8', text: 'text-[#cd6332]',
    dot: '#cd6332', amountColor: 'text-[#cd6332]', amountPrefix: '+',
  },
  REPAY: {
    label: 'Repay', bg: 'bg-green-50', text: 'text-green-700',
    dot: '#16a34a', amountColor: 'text-[#387085]', amountPrefix: '-',
  },
  LIQUIDATION: {
    label: 'Liquidation', bg: 'bg-red-50', text: 'text-red-600',
    dot: '#dc2626', amountColor: 'text-red-500', amountPrefix: '-',
  },
};

const FILTER_OPTIONS: { value: AaveV4ActivityType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ADD_COLLATERAL', label: 'Add' },
  { value: 'REMOVE_COLLATERAL', label: 'Remove' },
  { value: 'BORROW', label: 'Borrow' },
  { value: 'REPAY', label: 'Repay' },
  { value: 'LIQUIDATION', label: 'Liquidation' },
];

const STATUS_COLORS: Record<string, string> = {
  Active:     '#5a8a3c',
  Expired:    '#6b7280',
  Pending:    '#cd6332',
  Liquidated: '#c83232',
  Redeemed:   '#387085',
};

function formatTokenAmount(t: TokenAmount): string {
  const raw = parseFloat(t.amount);
  const value = raw / Math.pow(10, t.decimals);
  if (t.symbol === 'sBTC') return `${value.toFixed(6)} sBTC`;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t.symbol}`;
}

function formatFull(iso: string): string {
  return (
    new Date(iso)
      .toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'UTC', hour12: false,
      })
      .replace(',', '') + ' UTC'
  );
}

function formatDateGroupHeader(dateKey: string): string {
  const day = new Date(dateKey);
  const today = new Date();
  const dayUtc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = Math.floor((todayUtc - dayUtc) / 86400000);
  const rel = days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  return `${rel} (${dateKey})`;
}

function groupByDate(activities: AaveV4Activity[]): [string, AaveV4Activity[]][] {
  const groups: Record<string, AaveV4Activity[]> = {};
  for (const a of activities) {
    const key = new Date(a.blockTime).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    });
    (groups[key] ||= []).push(a);
  }
  return Object.entries(groups).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
  );
}

/* ── Aave Activity Tab ─────────────────────────────────────────────────── */

function AaveActivityTable() {
  const [filter, setFilter] = useState<AaveV4ActivityType | 'ALL'>('ALL');

  const filtered =
    filter === 'ALL'
      ? MOCK_AAVE_V4_ACTIVITIES
      : MOCK_AAVE_V4_ACTIVITIES.filter((a) => a.type === filter);

  const grouped = groupByDate(filtered);

  return (
    <div className="border border-[#cd6332]/20 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#387085]/10 px-5 py-3">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#cd6332] text-white'
                  : 'bg-[#387085]/8 text-[#387085]/60 hover:bg-[#387085]/15'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#387085]/40">
            No activity found
            {filter !== 'ALL' && <> for <span className="font-medium">{filter}</span></>}
          </p>
          {filter !== 'ALL' && (
            <button onClick={() => setFilter('ALL')} className="mx-auto mt-1 block text-xs text-[#cd6332] hover:underline">
              Show all activity
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 px-5 py-4">
          {grouped.map(([date, activities]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-[#387085]/50">
                  {formatDateGroupHeader(date)}
                </span>
                <div className="h-px flex-1 bg-[#387085]/10" />
              </div>
              <div className="space-y-2">
                {activities.map((activity) => {
                  const style = ACTIVITY_STYLES[activity.type];
                  const formattedAmount = formatTokenAmount(activity.tokenAmount);
                  const isLiquidation = activity.type === 'LIQUIDATION';
                  return (
                    <div
                      key={`${activity.txHash}-${activity.logIndex}`}
                      className={`flex items-start gap-3 border px-4 py-3 transition-colors ${
                        isLiquidation
                          ? 'border-red-200/60 bg-red-50/50'
                          : 'border-[#387085]/10 bg-white hover:bg-[#faf9f5]'
                      }`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full" style={{ background: style.dot }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
                              {isLiquidation && <span className="text-red-500">⚠</span>}
                              {style.label}
                            </span>
                            {activity.vaultId && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Vault</span>
                                <Link href={`/vaults/${activity.vaultId}`} title={`Vault ${activity.vaultId}`} className="font-mono text-[10px] text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline">
                                  {activity.vaultId.slice(0, 6)}...{activity.vaultId.slice(-4)}
                                </Link>
                              </span>
                            )}
                          </div>
                          <span className={`flex-shrink-0 font-mono text-sm font-semibold ${style.amountColor}`}>
                            {style.amountPrefix}{formattedAmount}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Tx</span>
                            <Link href={`/tx/${activity.txHash}`} title={activity.txHash} className="font-mono text-[10px] text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline">
                              {activity.txHash.slice(0, 6)}...{activity.txHash.slice(-4)}
                            </Link>
                          </span>
                          <span className="text-[10px] text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Block</span>
                            <span title={formatFull(activity.blockTime)} className="font-mono text-[10px] text-[#387085]/40">
                              #{activity.blockNumber.toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Deposited Vaults Tab ──────────────────────────────────────────────── */

function DepositedVaultsTable({ vaults, address }: { vaults: Vault[]; address: string }) {
  return (
    <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
      {vaults.length === 0 ? (
        <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.5)]">No vaults found</div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">DApp</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Provider</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {vaults.slice(0, 25).map((vault) => (
              <tr key={vault.id} className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]">
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    <Link href={`/vaults/${vault.id}`} className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]">
                      {truncateAddress(vault.id, 6, 4)}
                    </Link>
                    <CopyIcon text={vault.id} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[vault.status] }} />
                    <span className="text-xs font-medium" style={{ color: STATUS_COLORS[vault.status] }}>{vault.status}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#14140f]">
                  {vault.vaultSize.toFixed(8)} <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">{vault.dappName}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">{vault.providerName}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">{formatRelativeTime(vault.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Positions Tab — Aave-style summary ────────────────────────────────── */

function parsePositionAmount(amount: string, decimals: number): number {
  return parseFloat(amount) / Math.pow(10, decimals);
}

function getPositionHealthStatus(hf: number): { label: string; color: string; bg: string; text: string } {
  if (hf >= 2.0) return { label: 'Safe', color: '#16a34a', bg: 'bg-green-50', text: 'text-green-700' };
  if (hf >= 1.5) return { label: 'Healthy', color: '#387085', bg: 'bg-[#387085]/8', text: 'text-[#387085]' };
  if (hf >= 1.2) return { label: 'Caution', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' };
  if (hf >= 1.0) return { label: 'At Risk', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700' };
  return { label: 'Liquidation', color: '#dc2626', bg: 'bg-red-50', text: 'text-red-600' };
}

function PositionSummaryCard() {
  const p = MOCK_DEPOSITOR_AAVE_POSITION;

  const collateralAmount = parsePositionAmount(p.totalCollateral.amount, p.totalCollateral.decimals);
  const collateralUsd = p.totalCollateral.priceUsd
    ? collateralAmount * parseFloat(p.totalCollateral.priceUsd)
    : null;

  const currentLtv = parseFloat(p.currentLtv);
  const maxLtv = p.avgCollateralFactor ? parseFloat(p.avgCollateralFactor) * 100 : 75;

  const debtTotal = p.debts.reduce((s, d) => s + parsePositionAmount(d.totalAmount, d.decimals), 0);
  const interestTotal = p.debts.reduce((s, d) => s + parsePositionAmount(d.accruedInterest, d.decimals), 0);
  const debtSymbol = p.debts[0]?.symbol ?? '';

  const hf = parseFloat(p.healthFactor);
  const status = getPositionHealthStatus(hf);
  const HF_GAUGE_MAX = 3;
  const hfPct = Math.min((hf / HF_GAUGE_MAX) * 100, 100);
  const liquidationMarker = (1.0 / HF_GAUGE_MAX) * 100;
  const healthyMarker = (1.5 / HF_GAUGE_MAX) * 100;
  const safeMarker = (2.0 / HF_GAUGE_MAX) * 100;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="border border-[#387085]/10 bg-white px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Collateral</p>
          <p className="mt-1 text-xl font-bold text-[#14140f]">
            {collateralAmount.toFixed(3)} <span className="text-sm font-normal text-[#387085]/50">{p.totalCollateral.symbol ?? 'sBTC'}</span>
          </p>
          {collateralUsd != null && (
            <p className="mt-0.5 text-xs text-[#387085]/40">≈ ${collateralUsd.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
          )}
        </div>
        <div className="border border-[#387085]/10 bg-white px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Current LTV</p>
          <p className="mt-1 text-xl font-bold text-[#14140f]">{currentLtv.toFixed(2)}%</p>
          <p className="mt-0.5 text-xs text-[#387085]/40">of {maxLtv.toFixed(0)}% max</p>
        </div>
        <div className="border border-[#387085]/10 bg-white px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Debt</p>
          <p className="mt-1 text-xl font-bold text-[#14140f]">
            {debtTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-[#387085]/50">{debtSymbol}</span>
          </p>
          {interestTotal > 0 && (
            <p className="mt-0.5 text-xs text-green-600">
              +{interestTotal.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })} {debtSymbol}
            </p>
          )}
        </div>
      </div>

      <div className="border border-[#387085]/10 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Health Factor</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}>
            {hf < 1 && '⚠ '}{status.label}
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold" style={{ color: status.color }}>{hf.toFixed(2)}</p>
          <p className="text-[11px] text-[#387085]/40">
            {hf < 1 ? 'subject to liquidation' : `${(hf - 1).toFixed(2)} above liquidation threshold`}
          </p>
        </div>
        <div className="relative mt-4">
          <div
            className="h-2 w-full"
            style={{
              background:
                `linear-gradient(to right, #dc2626 0%, #dc2626 ${liquidationMarker}%, #d97706 ${liquidationMarker}%, #d97706 ${healthyMarker}%, #387085 ${healthyMarker}%, #387085 ${safeMarker}%, #16a34a ${safeMarker}%, #16a34a 100%)`,
              opacity: 0.5,
            }}
          />
          <div
            className="absolute top-[-3px] h-[14px] w-[3px] bg-[#14140f]"
            style={{ left: `calc(${hfPct}% - 1.5px)` }}
            title={`Health Factor ${hf.toFixed(2)}`}
          />
          {[
            { pct: liquidationMarker, label: '1.0' },
            { pct: healthyMarker, label: '1.5' },
            { pct: safeMarker, label: '2.0' },
          ].map((m) => (
            <div key={m.label} className="absolute top-3 -translate-x-1/2 text-[9px] text-[#387085]/40" style={{ left: `${m.pct}%` }}>
              {m.label}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between text-[10px] text-[#387085]/40">
          <span>Liquidation</span>
          <span>Caution</span>
          <span>Healthy</span>
          <span>Safe</span>
        </div>
      </div>
    </div>
  );
}

function PositionDebtsTable() {
  const debts = MOCK_DEPOSITOR_AAVE_POSITION.debts;

  if (debts.length === 0) {
    return (
      <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
        <div className="py-12 text-center text-sm text-[#387085]/40">No debts</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">Assets</th>
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount Borrowed</th>
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">Interest</th>
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">
              <span className="inline-flex items-center gap-1">
                Amount to Repay
                <svg className="h-3 w-3 text-white/60" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {debts.map((d, i) => {
            const principal = parsePositionAmount(d.principal, d.decimals);
            const interest = parsePositionAmount(d.accruedInterest, d.decimals);
            const totalRepay = parsePositionAmount(d.totalAmount, d.decimals);
            return (
              <tr key={`${d.symbol}-${i}`} className="h-12 border-b border-[#387085]/8 transition-colors last:border-0 hover:bg-[#faf9f5]">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#387085]/10 text-[9px] font-bold text-[#387085]">
                      {d.symbol.charAt(0)}
                    </span>
                    <span className="text-sm font-medium text-[#14140f]">{d.symbol} ({d.symbol})</span>
                    {d.reserveId && <CopyIcon text={d.reserveId} />}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  <span className="text-sm font-semibold text-[#14140f]">
                    {principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="ml-1 text-[11px] text-[#387085]/40">{d.symbol}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  <span className="text-sm text-[#14140f]">
                    {interest.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                  </span>
                  <span className="ml-1 text-[11px] text-[#387085]/40">{d.symbol}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  <span className="text-sm font-semibold text-[#14140f]">
                    {totalRepay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="ml-1 text-[11px] text-[#387085]/40">{d.symbol}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CollateralPositionsTab() {
  return (
    <div className="space-y-4">
      <PositionSummaryCard />
      <PositionDebtsTable />
    </div>
  );
}

/* ── Main DepositorDetail component ────────────────────────────────────── */

interface DepositorDetailProps {
  address: string;
  vaults: Vault[];
}

export default function DepositorDetail({ address, vaults }: DepositorDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('collateral');

  const depositor = MOCK_DEPOSITORS.find(
    (d) => d.address.toLowerCase() === address.toLowerCase(),
  );

  const totalVaults = vaults.length;
  const activeVaults = vaults.filter((v) => v.status === 'Active').length;

  const joinedFormatted = depositor ? formatDate(depositor.firstDeposit) : '—';
  const addrShort = truncateAddress(address, 6, 4);

  // Position data for stat cards
  const pos = MOCK_DEPOSITOR_AAVE_POSITION;
  const collateralAmount = parsePositionAmount(pos.totalCollateral.amount, pos.totalCollateral.decimals);
  const collateralUsd = pos.totalCollateral.priceUsd
    ? collateralAmount * parseFloat(pos.totalCollateral.priceUsd)
    : null;
  const debtTotal = pos.debts.reduce((s, d) => s + parsePositionAmount(d.totalAmount, d.decimals), 0);
  const interestTotal = pos.debts.reduce((s, d) => s + parsePositionAmount(d.accruedInterest, d.decimals), 0);
  const debtSymbol = pos.debts[0]?.symbol ?? '';
  const currentLtv = parseFloat(pos.currentLtv);
  const maxLtv = pos.avgCollateralFactor ? parseFloat(pos.avgCollateralFactor) * 100 : 75;
  const hf = parseFloat(pos.healthFactor);
  const hfStatus = getPositionHealthStatus(hf);

  // Latest activity from Aave activities
  const latestActivity = MOCK_AAVE_V4_ACTIVITIES.length > 0
    ? [...MOCK_AAVE_V4_ACTIVITIES].sort(
        (a, b) => new Date(b.blockTime).getTime() - new Date(a.blockTime).getTime(),
      )[0]
    : null;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'collateral', label: 'Positions', count: MOCK_PORTFOLIO_POSITIONS.length },
    { key: 'deposited', label: 'Deposited Vaults', count: totalVaults },
    { key: 'aave_activity', label: 'Activity', count: MOCK_AAVE_V4_ACTIVITIES.length },
  ];

  return (
    <div className="space-y-4">

      {/* ── Page label ──────────────────────────────────────────────── */}
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#387085]/35">Depositor</p>

      {/* ── Identity strip ──────────────────────────────────────────── */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#14140f]">{addrShort}</h1>
          <CopyIcon text={address} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#387085]/55">
          <span>joined {joinedFormatted}</span>
          <span className="text-[#387085]/25">·</span>
          <span>{totalVaults} vaults to date</span>
        </div>
      </div>

      {/* ── 4 stat cards: Collateral · Total Debt · Current LTV · Health Factor ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Collateral */}
        <div className="border border-[#387085]/10 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#387085]/45">Collateral</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">
            {collateralAmount.toFixed(2)} <span className="text-sm font-normal text-[#387085]/50">BTC</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">
            {collateralUsd != null ? `≈ $${collateralUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : ''}
          </p>
          <p className="text-[11px] text-[#387085]/40">{activeVaults} active</p>
        </div>

        {/* Total Debt */}
        <div className="border border-[#387085]/10 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#387085]/45">Total Debt</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">
            {debtTotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-sm font-normal text-[#387085]/50">{debtSymbol}</span>
          </p>
          {interestTotal > 0 && (
            <p className="mt-0.5 text-[11px] text-green-600">+ interest</p>
          )}
        </div>

        {/* Current LTV */}
        <div className="border border-[#387085]/10 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#387085]/45">Current LTV</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">{currentLtv.toFixed(0)}%</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">max {maxLtv.toFixed(0)}%</p>
        </div>

        {/* Health Factor */}
        <div className="border border-[#387085]/10 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#387085]/45">Health Factor</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">{hf.toFixed(2)}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: hfStatus.color }} />
            <span style={{ color: hfStatus.color }}>{hfStatus.label.toLowerCase()}</span>
          </p>
        </div>
      </div>

      {/* ── Last activity bar ─────────────────────────────────────────── */}
      {latestActivity && (() => {
        const style = ACTIVITY_STYLES[latestActivity.type];
        const formattedAmount = formatTokenAmount(latestActivity.tokenAmount);
        return (
          <div className="flex items-center justify-between border border-[#387085]/12 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#387085]/50">Last activity:</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
                {style.label}
              </span>
              <span className="font-medium text-[#14140f]">
                {style.amountPrefix}{formattedAmount}
              </span>
              <span className="text-[#387085]/40">·</span>
              <span className="text-xs text-[#387085]/50">{formatRelativeTime(latestActivity.blockTime)}</span>
            </div>
            <button
              onClick={() => setActiveTab('aave_activity')}
              className="text-xs text-[#cd6332] hover:underline"
            >
              View All Activities ›
            </button>
          </div>
        );
      })()}

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
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
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      {activeTab === 'collateral' && <CollateralPositionsTab />}
      {activeTab === 'deposited' && <DepositedVaultsTable vaults={vaults} address={address} />}
      {activeTab === 'aave_activity' && <AaveActivityTable />}
    </div>
  );
}
