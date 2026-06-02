'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MOCK_GLOBAL_LENDING_ACTIVITIES,
  type AaveV4Activity,
  type AaveV4ActivityType,
  type TokenAmount,
} from '@/lib/mock-aave-activity';
import { truncateAddress, formatRelativeTime } from '@/lib/utils';

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
  { value: 'ADD_COLLATERAL', label: 'Add Collateral' },
  { value: 'REMOVE_COLLATERAL', label: 'Remove Collateral' },
  { value: 'BORROW', label: 'Borrow' },
  { value: 'REPAY', label: 'Repay' },
  { value: 'LIQUIDATION', label: 'Liquidation' },
];

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

export default function LendingActivityPage() {
  const [filter, setFilter] = useState<AaveV4ActivityType | 'ALL'>('ALL');

  const filtered =
    filter === 'ALL'
      ? MOCK_GLOBAL_LENDING_ACTIVITIES
      : MOCK_GLOBAL_LENDING_ACTIVITIES.filter((a) => a.type === filter);

  const grouped = groupByDate(filtered);

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <h1 className="text-lg font-semibold text-[#14140f]">Lending Activity</h1>
      <p className="text-sm text-[#387085]/50">All lending events across depositors, sorted by most recent</p>

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
          <span className="ml-auto text-[11px] text-[#387085]/40">{filtered.length} events</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#387085]/40">No activity found</p>
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
                                  <Link href={`/vaults/${activity.vaultId}`} className="font-mono text-[10px] text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline">
                                    {activity.vaultId.slice(0, 6)}...{activity.vaultId.slice(-4)}
                                  </Link>
                                </span>
                              )}
                            </div>
                            <span className={`flex-shrink-0 font-mono text-sm font-semibold ${style.amountColor}`}>
                              {style.amountPrefix}{formattedAmount}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[#387085]/50">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Depositor</span>
                              <Link href={`/accounts/${activity.depositorAddress}`} className="font-mono text-[#387085]/60 hover:text-[#cd6332] hover:underline">
                                {truncateAddress(activity.depositorAddress, 6, 4)}
                              </Link>
                              <CopyIcon text={activity.depositorAddress} />
                            </span>
                            <span className="text-[#387085]/20">·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Tx</span>
                              <Link href={`/tx/${activity.txHash}`} className="font-mono text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
                                {activity.txHash.slice(0, 6)}...{activity.txHash.slice(-4)}
                              </Link>
                            </span>
                            <span className="text-[#387085]/20">·</span>
                            <span className="inline-flex items-center gap-1">
                              <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Block</span>
                              <span title={formatFull(activity.blockTime)} className="font-mono text-[#387085]/40">
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
    </div>
  );
}
