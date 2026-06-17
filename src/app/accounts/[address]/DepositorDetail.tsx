'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_VAULTS, MOCK_DEPOSITORS } from '@/lib/mock-data';
import { toUsd, TOKEN_PRICES } from '@/lib/utils';
import {
  MOCK_PORTFOLIO_POSITIONS,
  MOCK_AAVE_V4_ACTIVITIES,
  MOCK_DEPOSITOR_AAVE_POSITION,
  MOCK_DEPOSITOR_DAPP_POSITIONS,
  type AaveV4Activity,
  type AaveV4ActivityType,
  type AaveV4Position,
  type TokenAmount,
  type DAppPosition,
} from '@/lib/mock-aave-activity';
import { truncateAddress, formatDateTime, formatRelativeTime, formatTimeUTC } from '@/lib/utils';
import type { Vault } from '@/lib/types';

const BTC_USD_RATE = TOKEN_PRICES['sBTC'];

/* ── CopyIcon ──────────────────────────────────────────────────────────── */

function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 inline-flex shrink-0 text-[rgba(56,112,133,0.7)] hover:text-[#387085]"
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
  Available:            '#5a8a3c',
  Pending:              '#cd6332',
  Verified:             '#7c3aed',
  'Signature Collected':'#ca8a04',
  Redeemed:             '#2563eb',
  Expired:              '#6b7280',
  Liquidated:           '#c83232',
};

function formatTokenAmount(t: TokenAmount): string {
  const raw = parseFloat(t.amount);
  const value = raw / Math.pow(10, t.decimals);
  if (t.symbol === 'sBTC') return `${value.toFixed(6)} sBTC`;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t.symbol}`;
}

function formatTokenUsd(t: TokenAmount): string {
  const raw = parseFloat(t.amount);
  const value = raw / Math.pow(10, t.decimals);
  const price = TOKEN_PRICES[t.symbol] ?? 0;
  const usd = value * price;
  if (usd < 0.01 && usd > 0) return '$<0.01';
  return `$${usd.toLocaleString('en-US', { maximumFractionDigits: usd >= 100 ? 0 : 2 })}`;
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
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#cd6332] text-white'
                  : 'bg-[#387085]/8 text-[#387085]/80 hover:bg-[#387085]/15'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#387085]/80">
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
                <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-[#387085]/70">
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
                      {/* Time column */}
                      <div className="w-24 shrink-0 pt-0.5">
                        <div className="text-xs font-medium text-[#387085]/80">{formatRelativeTime(activity.blockTime)}</div>
                        <div className="font-mono text-[9px] text-[#387085]/70">({formatTimeUTC(activity.blockTime)})</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                              {isLiquidation && <span className="text-red-500">⚠</span>}
                              {style.label}
                            </span>
                            {activity.vaultId && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Vault</span>
                                <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                <Link href={`/vaults/${activity.vaultId}`} title={`Vault ${activity.vaultId}`} className="font-mono text-xs text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline">
                                  {activity.vaultId.slice(0, 6)}...{activity.vaultId.slice(-4)}
                                </Link>
                              </span>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className={`font-mono text-sm font-semibold ${style.amountColor}`}>
                              {style.amountPrefix}{formattedAmount}
                            </div>
                            <div className="text-xs text-[#387085]/80">
                              {formatTokenUsd(activity.tokenAmount)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Tx</span>
                            <Link href={`/tx/${activity.txHash}`} title={activity.txHash} className="font-mono text-xs text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline">
                              {activity.txHash.slice(0, 6)}...{activity.txHash.slice(-4)}
                            </Link>
                          </span>
                          <span className="text-xs text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Block</span>
                            <span title={formatDateTime(activity.blockTime)} className="font-mono text-xs text-[#387085]/80">
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
        <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.7)]">No vaults found</div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-xs font-medium uppercase tracking-wider text-white">
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
                    <Link href={`/vaults/${vault.id}`} className="font-mono text-xs font-medium text-[#cd6332] hover:text-[#b8562b]">
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
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">
                  <div className="text-[#14140f]">{vault.vaultSize.toFixed(8)} <span className="text-[rgba(56,112,133,0.7)]">sBTC</span></div>
                  <div className="text-xs text-[#387085]/80">{toUsd(vault.vaultSize)}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">{vault.dappName}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">{vault.providerName}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.7)]">{formatRelativeTime(vault.createdAt)}</td>
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
  if (hf >= 3.0) return { label: 'Safe', color: '#16a34a', bg: 'bg-green-50', text: 'text-green-700' };
  if (hf >= 2.0) return { label: 'Healthy', color: '#16a34a', bg: 'bg-green-50', text: 'text-green-700' };
  if (hf >= 1.5) return { label: 'Caution', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' };
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
          <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/70">Collateral</p>
          <p className="mt-1 text-xl font-bold text-[#14140f]">
            {collateralAmount.toFixed(3)} <span className="text-sm font-normal text-[#387085]/70">{p.totalCollateral.symbol ?? 'sBTC'}</span>
          </p>
          {collateralUsd != null && (
            <p className="mt-0.5 text-xs text-[#387085]/80"> ${collateralUsd.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
          )}
        </div>
        <div className="border border-[#387085]/10 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/70">Current LTV</p>
          <p className="mt-1 text-xl font-bold text-[#14140f]">{currentLtv.toFixed(2)}%</p>
          <p className="mt-0.5 text-xs text-[#387085]/80">of {maxLtv.toFixed(0)}% max</p>
        </div>
        <div className="border border-[#387085]/10 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/70">Debt</p>
          <p className="mt-1 text-xl font-bold text-[#14140f]">
            {debtTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-[#387085]/70">{debtSymbol}</span>
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
          <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/70">Health Factor</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}>
            {hf < 1 && '⚠ '}{status.label}
          </span>
        </div>
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold" style={{ color: status.color }}>{hf.toFixed(2)}</p>
          <p className="text-xs text-[#387085]/80">
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
            <div key={m.label} className="absolute top-3 -translate-x-1/2 text-[9px] text-[#387085]/80" style={{ left: `${m.pct}%` }}>
              {m.label}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between text-xs text-[#387085]/80">
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
        <div className="py-12 text-center text-sm text-[#387085]/80">No debts</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="bg-[#cd6332] text-xs font-medium uppercase tracking-wider text-white">
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">Assets</th>
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount Borrowed</th>
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">Borrow APY</th>
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
                  <span className="ml-1 text-xs text-[#387085]/80">{d.symbol}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-sm text-[#14140f]">
                  {d.borrowApy != null ? `${d.borrowApy}%` : '—'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  <span className="text-sm text-[#14140f]">
                    {interest.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                  </span>
                  <span className="ml-1 text-xs text-[#387085]/80">{d.symbol}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                  <span className="text-sm font-semibold text-[#14140f]">
                    {totalRepay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="ml-1 text-xs text-[#387085]/80">{d.symbol}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Mock per-dApp positions ────────────────────────────────────────────── */

const MOCK_DAPP_POSITIONS = [
  {
    dapp: 'Aave v4',
    collateral: 0.02001685,
    collateralSymbol: 'sBTC',
    collateralUsd: 1382.44,
    debts: [
      { symbol: 'USDC', amountUsd: 498.15, interest: 0.002221, interestSymbol: 'USDC', principal: 498.148, totalRepay: 498.152221, borrowApy: 4.2 },
    ],
    ltv: 64.34,
    maxLtv: 75,
    healthFactor: 1.16,
  },
  {
    dapp: 'Compound v3',
    collateral: 0.01000000,
    collateralSymbol: 'sBTC',
    collateralUsd: 690.14,
    debts: [
      { symbol: 'USDT', amountUsd: 125.40, interest: 0.400000, interestSymbol: 'USDT', principal: 125.00, totalRepay: 125.40, borrowApy: 5.1 },
    ],
    ltv: 18.17,
    maxLtv: 75,
    healthFactor: 2.81,
  },
];

/* ── Positions by dApp ──────────────────────────────────────────────────── */

const HF_GAUGE_MAX = 3;

function HFBar({ hf, color }: { hf: number; color: string }) {
  const hfPct = Math.min((hf / HF_GAUGE_MAX) * 100, 100);
  const liqM = (1.0 / HF_GAUGE_MAX) * 100;
  const cautionM = (1.5 / HF_GAUGE_MAX) * 100;
  const safeM = (2.0 / HF_GAUGE_MAX) * 100;
  return (
    <div className="relative mt-2">
      <div className="h-1.5 w-full" style={{
        background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${liqM}%, #d97706 ${liqM}%, #d97706 ${cautionM}%, #387085 ${cautionM}%, #387085 ${safeM}%, #16a34a ${safeM}%, #16a34a 100%)`,
        opacity: 0.45,
      }} />
      <div className="absolute top-[-3px] h-[12px] w-[2px] rounded-full bg-[#14140f]"
        style={{ left: `calc(${hfPct}% - 1px)` }}
        title={`HF ${hf.toFixed(2)}`}
      />
      <div className="mt-1 flex justify-between text-[9px] text-[#387085]/70">
        <span>1.0</span><span>1.5</span><span>2.0</span><span>3.0+</span>
      </div>
    </div>
  );
}

function PositionsByDApp() {
  return (
    <div className="space-y-4">
      {MOCK_DAPP_POSITIONS.map((pos) => {
        const hfStatus = getPositionHealthStatus(pos.healthFactor);
        const ltvPct = Math.min((pos.ltv / pos.maxLtv) * 100, 100);
        const ltvColor =
          pos.ltv >= pos.maxLtv * 0.9 ? '#dc2626'
          : pos.ltv >= pos.maxLtv * 0.7 ? '#d97706'
          : '#16a34a';
        const totalDebtUsd = pos.debts.reduce((s, d) => s + d.amountUsd, 0);
        const totalInterest = pos.debts.reduce((s, d) => s + d.interest, 0);

        return (
          <section key={pos.dapp} className="border border-[#387085]/10 bg-white">
            {/* dApp header — name only, no icon */}
            <div className="border-b border-[#387085]/10 px-5 py-3">
              <span className="text-sm font-semibold text-[#14140f]">{pos.dapp}</span>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-[#387085]/8 sm:grid-cols-4 sm:divide-y-0">
              {/* Collateral */}
              <div className="px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/80">Collateral</p>
                <p className="mt-1 text-xl font-bold text-[#14140f]">
                  {pos.collateral.toFixed(4)} <span className="text-xs font-normal text-[#387085]/70">{pos.collateralSymbol}</span>
                </p>
                <p className="mt-0.5 text-xs text-[#387085]/80"> ${pos.collateralUsd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              </div>

              {/* Debt — in USD */}
              <div className="px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/80">Debt</p>
                <p className="mt-1 text-xl font-bold text-[#14140f]">
                  ${totalDebtUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="mt-0.5 text-xs text-green-600">
                  Interest {totalInterest.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                </p>
              </div>

              {/* LTV */}
              <div className="px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/80">Current LTV</p>
                <p className="mt-1 text-xl font-bold text-[#14140f]">{pos.ltv.toFixed(2)}%</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="h-1.5 w-full bg-[#387085]/10">
                    <div className="h-full transition-all" style={{ width: `${ltvPct}%`, background: ltvColor }} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-[#387085]/80">max {pos.maxLtv}%</p>
              </div>

              {/* Health Factor with mini gradient bar */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/80">Health Factor</p>
                  <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                    <title>Liquidation occurs when Health Factor falls below 1.0</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xl font-bold" style={{ color: hfStatus.color }}>{pos.healthFactor.toFixed(2)}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${hfStatus.bg} ${hfStatus.text}`}>
                    {hfStatus.label}
                  </span>
                </div>
                <HFBar hf={pos.healthFactor} color={hfStatus.color} />
              </div>
            </div>

            {/* Assets table */}
            <div className="border-t border-[#387085]/8">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#387085]/8 bg-[#faf9f5]">
                    <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wide text-[#387085]/80">Assets</th>
                    <th className="px-5 py-2 text-xs font-medium uppercase tracking-wide text-[#387085]/80">Amount Borrowed</th>
                    <th className="px-5 py-2 text-xs font-medium uppercase tracking-wide text-[#387085]/80">Borrow APY</th>
                    <th className="px-5 py-2 text-xs font-medium uppercase tracking-wide text-[#387085]/80">Interest</th>
                    <th className="px-5 py-2 text-xs font-medium uppercase tracking-wide text-[#387085]/80">
                      <span className="inline-flex items-center gap-0.5">
                        Amount to Repay
                        <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pos.debts.map((d) => (
                    <tr key={d.symbol} className="border-b border-[#387085]/6 last:border-0 hover:bg-[#faf9f5]">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#387085]/8 text-[9px] font-bold text-[#387085]">
                            {d.symbol.charAt(0)}
                          </span>
                          <span className="font-medium text-[#14140f]">{d.symbol} ({d.symbol})</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 tabular-nums font-semibold text-[#14140f]">
                        {d.principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="ml-1 text-xs font-normal text-[#387085]/80">{d.symbol}</span>
                      </td>
                      <td className="px-5 py-2.5 tabular-nums text-[#14140f]">
                        {d.borrowApy != null ? `${d.borrowApy}%` : '—'}
                      </td>
                      <td className="px-5 py-2.5 tabular-nums text-[#14140f]">
                        {d.interest.toFixed(6)}
                        <span className="ml-1 text-xs text-[#387085]/80">{d.interestSymbol}</span>
                      </td>
                      <td className="px-5 py-2.5 tabular-nums font-semibold text-[#cd6332]">
                        {d.totalRepay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        <span className="ml-1 text-xs font-normal text-[#387085]/80">{d.symbol}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ── Single dApp position section ──────────────────────────────────────── */

function DAppPositionSection({ position, isFirst }: { position: DAppPosition; isFirst: boolean }) {
  const p = position;
  const collateral = parsePositionAmount(p.totalCollateral.amount, p.totalCollateral.decimals);
  const collateralUsdVal = p.totalCollateral.priceUsd
    ? collateral * parseFloat(p.totalCollateral.priceUsd)
    : null;
  const ltv = parseFloat(p.currentLtv);
  const maxLtv = p.avgCollateralFactor ? parseFloat(p.avgCollateralFactor) * 100 : 78;
  const ltvPct = Math.min((ltv / maxLtv) * 100, 100);
  const ltvColor = ltv >= maxLtv * 0.9 ? '#dc2626' : ltv >= maxLtv * 0.7 ? '#d97706' : '#16a34a';

  const debtUsd = p.debts.reduce((s, d) => {
    const amt = parsePositionAmount(d.totalAmount, d.decimals);
    const price = TOKEN_PRICES[d.symbol] ?? 1;
    return s + amt * price;
  }, 0);
  const debtBreakdown = p.debts.map((d) => {
    const amt = parsePositionAmount(d.totalAmount, d.decimals);
    return `${amt < 1 ? amt.toFixed(7) : amt.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${d.symbol}`;
  }).join(' / ');

  const hf = parseFloat(p.healthFactor);
  const hfStatus = getPositionHealthStatus(hf);
  const HF_MAX = 3;
  const hfPct = Math.min((hf / HF_MAX) * 100, 100);
  const markers = [
    { pct: (1.0 / HF_MAX) * 100, label: '1' },
    { pct: (1.5 / HF_MAX) * 100, label: '1.5' },
    { pct: (2.0 / HF_MAX) * 100, label: '2' },
    { pct: (3.0 / HF_MAX) * 100, label: '3+' },
  ];

  return (
    <section className={`border border-[#387085]/10 bg-white ${isFirst ? '' : 'mt-4'}`}>
      {/* dApp name header */}
      <div className="border-b border-[#387085]/10 px-5 py-3">
        <span className="text-sm font-semibold text-[#14140f]">{p.dappName}</span>
      </div>

      {/* 2×2 summary grid */}
      <div className="grid grid-cols-2 gap-0">
        {/* Collateral */}
        <div className="border-b border-r border-[#387085]/10 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/70">Collateral</p>
          <p className="mt-1.5 text-xl font-bold text-[#14140f]">
            {collateral.toFixed(3)} <span className="text-sm font-normal text-[#387085]/70">{p.totalCollateral.symbol}</span>
          </p>
          {collateralUsdVal != null && (
            <p className="mt-0.5 text-xs text-[#387085]/80"> $ {collateralUsdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          )}
        </div>

        {/* Debt */}
        <div className="border-b border-[#387085]/10 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/70">Debt</p>
          <p className="mt-1.5 text-xl font-bold text-[#14140f]">
            $ {debtUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-0.5 text-xs text-[#387085]/80">{p.debts.length} Asset{p.debts.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Current LTV */}
        <div className="border-r border-[#387085]/10 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/70">Current LTV</p>
          <p className="mt-1.5 text-xl font-bold text-[#14140f]">{ltv.toFixed(2)}%</p>
          <p className="mt-0.5 text-xs text-[#387085]/80">of {maxLtv.toFixed(0)}% max</p>
          <div className="mt-2 h-2 w-full bg-[#e5e7eb]">
            <div className="h-full transition-all" style={{ width: `${ltvPct}%`, background: ltvColor }} />
          </div>
        </div>

        {/* Health Factor */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[#387085]/70">Health Factor</p>
          <div className="mt-1.5 flex items-center gap-2">
            <p className="text-xl font-bold" style={{ color: hfStatus.color }}>{hf.toFixed(2)}</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${hfStatus.bg} ${hfStatus.text}`}>
              {hf < 1 && '⚠ '}{hfStatus.label}
            </span>
          </div>
          <div className="relative mt-3">
            <div className="flex h-2.5 w-full overflow-hidden">
              <div className="h-full" style={{ width: `${(1.0 / HF_MAX) * 100}%`, background: '#dc2626' }} />
              <div className="h-full" style={{ width: `${((1.5 - 1.0) / HF_MAX) * 100}%`, background: '#f97316' }} />
              <div className="h-full" style={{ width: `${((2.0 - 1.5) / HF_MAX) * 100}%`, background: '#eab308' }} />
              <div className="h-full" style={{ width: `${((HF_MAX - 2.0) / HF_MAX) * 100}%`, background: '#16a34a' }} />
            </div>
            <div
              className="absolute top-[-2px] h-[14px] w-[3px] rounded-sm bg-[#14140f]"
              style={{ left: `calc(${hfPct}% - 1.5px)` }}
            />
            <div className="mt-1 flex justify-between text-[9px] text-[#387085]/80">
              {markers.map((m) => (
                <span key={m.label} style={{ position: 'absolute', left: `${m.pct}%`, transform: 'translateX(-50%)' }}>{m.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Borrowed assets table */}
      <div className="overflow-x-auto border-t border-[#387085]/10">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#387085]/8 bg-[#faf9f5] text-xs font-medium uppercase tracking-wider text-[#387085]/70">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Assets</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount Borrowed</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Borrow APY</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Interest</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">
                <span className="inline-flex items-center gap-1">
                  Amount to Repay
                  <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {p.debts.map((d, i) => {
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
                      {principal < 1 ? principal.toFixed(8) : principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="ml-1 text-xs text-[#387085]/80">{d.symbol}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-sm text-[#14140f]">
                    {d.borrowApy != null ? `${d.borrowApy}%` : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    <span className="text-sm text-[#14140f]">
                      {interest < 0.001 ? interest.toFixed(6) : interest.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}
                    </span>
                    <span className="ml-1 text-xs text-[#387085]/80">{d.symbol}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                    <span className="text-sm font-semibold text-[#14140f]">
                      {totalRepay < 1 ? totalRepay.toFixed(7) : totalRepay.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </span>
                    <span className="ml-1 text-xs text-[#387085]/80">{d.symbol}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CollateralPositionsTab() {
  const positions = MOCK_DEPOSITOR_DAPP_POSITIONS;
  return (
    <div>
      {positions.map((pos, i) => (
        <DAppPositionSection key={pos.dappName} position={pos} isFirst={i === 0} />
      ))}
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
  const activeVaults = vaults.filter((v) => v.status === 'Available').length;
  const totalBtc = vaults.reduce((s, v) => s + v.vaultSize, 0);

  const joinedFormatted = depositor ? formatDateTime(depositor.firstDeposit) : '—';
  const addrDisplay = address;

  // Position data for stat cards
  const pos = MOCK_DEPOSITOR_AAVE_POSITION;
  const collateralAmount = parsePositionAmount(pos.totalCollateral.amount, pos.totalCollateral.decimals);
  const collateralUsd = pos.totalCollateral.priceUsd
    ? collateralAmount * parseFloat(pos.totalCollateral.priceUsd)
    : null;
  // Total debt in USD (assume stablecoin = 1:1 USD)
  const debtTotalUsd = pos.debts.reduce((s, d) => {
    const amt = parsePositionAmount(d.totalAmount, d.decimals);
    const price = TOKEN_PRICES[d.symbol] ?? 1;
    return s + amt * price;
  }, 0);
  const debtAssetCount = pos.debts.length;
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

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'collateral', label: 'Positions' },
    { key: 'deposited', label: 'Deposited Vaults' },
    { key: 'aave_activity', label: 'Lending Activity' },
  ];

  return (
    <div className="space-y-4">

      {/* ── Page label ──────────────────────────────────────────────── */}
      <p className="text-xs font-medium uppercase tracking-widest text-[#387085]/70">Depositor</p>

      {/* ── Identity strip ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-[#14140f] break-all">{addrDisplay}</h1>
        <CopyIcon text={address} />
      </div>

      {/* ── 4 stat cards: 2 left + 2 right ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {/* 1. Total BTC */}
        <div className="border border-[#387085]/10 bg-white p-4">
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#387085]/80">Total BTC</p>
            <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <title>Total BTC locked across all vaults</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">
            {totalBtc.toFixed(3)} <span className="text-sm font-normal text-[#387085]/70">sBTC</span>
          </p>
          <p className="mt-0.5 text-xs text-[#387085]/80">
             ${(totalBtc * BTC_USD_RATE).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* 2. Total Collateral */}
        <div className="border border-[#387085]/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#387085]/80">Total Collateral</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">
            {collateralAmount.toFixed(3)} <span className="text-sm font-normal text-[#387085]/70">vaultBTC</span>
          </p>
          <p className="mt-0.5 text-xs text-[#387085]/80">
            {collateralUsd != null ? ` $${collateralUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
          </p>
        </div>

        {/* 3. Total Debt */}
        <div className="border border-[#387085]/10 bg-white p-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#387085]/80">Total Debt</p>
            <button
              onClick={() => setActiveTab('collateral')}
              className="text-xs font-medium text-[#cd6332] hover:underline"
            >
              View all Assets ›
            </button>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">
            $ {debtTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-0.5 text-xs text-[#387085]/80">{debtAssetCount} Asset{debtAssetCount !== 1 ? 's' : ''}</p>
        </div>

        {/* 4. Vaults */}
        <div className="border border-[#387085]/10 bg-white p-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#387085]/80">Active Vaults</p>
            <button
              onClick={() => setActiveTab('deposited')}
              className="text-xs font-medium text-[#cd6332] hover:underline"
            >
              View all Vaults ›
            </button>
          </div>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">
            {activeVaults}
          </p>
          <p className="mt-0.5 text-xs text-[#387085]/80">out of {totalVaults} vault{totalVaults !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Last activity bar ─────────────────────────────────────────── */}
      {latestActivity && (() => {
        const style = ACTIVITY_STYLES[latestActivity.type];
        const formattedAmount = formatTokenAmount(latestActivity.tokenAmount);
        const bt = new Date(latestActivity.blockTime);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const fullTimestamp = `${bt.getUTCFullYear()}/${pad(bt.getUTCMonth() + 1)}/${pad(bt.getUTCDate())} ${pad(bt.getUTCHours())}:${pad(bt.getUTCMinutes())}:${pad(bt.getUTCSeconds())} +UTC`;
        return (
          <div className="flex items-center border border-[#387085]/12 bg-white px-4 py-2.5">
            {/* Left: activity info */}
            <div className="min-w-0 flex-1">
              {/* Row 1: title + timestamp inline */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#387085]/70">Latest Activity</span>
                <span className="text-xs text-[#387085]/70">{formatRelativeTime(latestActivity.blockTime)}</span>
                <span className="text-xs text-[#387085]/25">{fullTimestamp}</span>
              </div>
              {/* Row 2: status + amount */}
              <div className="mt-1.5 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <span className="text-sm font-medium text-[#14140f]">
                  {style.amountPrefix}{formattedAmount}
                </span>
                <span className="text-xs text-[#387085]/80">
                  {formatTokenUsd(latestActivity.tokenAmount)}
                </span>
              </div>
            </div>
            {/* Right: View all button — vertically centered */}
            <button
              onClick={() => setActiveTab('aave_activity')}
              className="shrink-0 text-xs font-medium text-[#cd6332] hover:underline"
            >
              View all Activities ›
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
                : 'text-[#387085]/70 hover:text-[#14140f]'
            }`}
          >
            {tab.label}
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
