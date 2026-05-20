'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_TRANSACTIONS, MOCK_VAULTS } from '@/lib/mock-data';
import {
  MOCK_PORTFOLIO_POSITIONS,
  MOCK_AAVE_V4_ACTIVITIES,
  type AaveV4Activity,
  type AaveV4ActivityType,
  type TokenAmount,
} from '@/lib/mock-aave-activity';
import { truncateAddress, formatRelativeTime } from '@/lib/utils';
import type { Transaction, Vault, AccountType } from '@/lib/types';

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

const STATUS_COLORS: Record<string, string> = {
  Active:     '#5a8a3c',
  Expired:    '#6b7280',
  Pending:    '#cd6332',
  Liquidated: '#c83232',
  Redeemed:   '#387085',
};

interface Props {
  address: string;
  accountType: AccountType;
  isProvider: boolean;
  isDepositor?: boolean;
}

type TabKey = 'transactions' | 'deposited' | 'managed' | 'collateral' | 'aave_activity';

export default function AccountDetailTabs({
  address,
  accountType,
  isProvider,
  isDepositor = false,
}: Props) {
  // Check whether this EOA actually deposited any vaults
  const lcAddr = address.toLowerCase();
  const hasDepositedVaults = MOCK_VAULTS.some(
    (v) => v.depositorAddress?.toLowerCase() === lcAddr,
  );

  // Build available tabs based on role
  const tabs: { key: TabKey; label: string }[] = [];

  if (isDepositor) {
    // Depositor view: Positions | Deposited Vaults | Aave Activity
    tabs.push({ key: 'collateral', label: 'Positions' });
    tabs.push({ key: 'deposited', label: 'Deposited Vaults' });
    tabs.push({ key: 'aave_activity', label: 'Activity' });
  } else {
    tabs.push({ key: 'transactions', label: 'Transactions' });
    if (accountType === 'EOA') {
      if (hasDepositedVaults) {
        tabs.push({ key: 'deposited', label: 'Deposited Vaults' });
      }
      if (isProvider) {
        tabs.push({ key: 'managed', label: 'Vaults' });
      }
    }
  }

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0]?.key ?? 'transactions');
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [depositedVaults, setDepositedVaults] = useState<Vault[]>([]);
  const [managedVaults, setManagedVaults] = useState<Vault[]>([]);

  useEffect(() => {
    const addr = address.toLowerCase();
    setTxs(
      MOCK_TRANSACTIONS.filter(
        (t) => t.from.toLowerCase() === addr || t.to.toLowerCase() === addr,
      ),
    );
    setDepositedVaults(
      MOCK_VAULTS.filter((v) => v.depositorAddress?.toLowerCase() === addr),
    );
    setManagedVaults(
      MOCK_VAULTS.filter((v) => v.providerAddress.toLowerCase() === addr),
    );
  }, [address]);

  // Get the count for each tab
  const getTabCount = (key: TabKey): number => {
    switch (key) {
      case 'transactions': return txs.length;
      case 'deposited': return depositedVaults.length;
      case 'managed': return managedVaults.length;
      case 'collateral': return MOCK_PORTFOLIO_POSITIONS.length;
      case 'aave_activity': return MOCK_AAVE_V4_ACTIVITIES.length;
      default: return 0;
    }
  };

  return (
    <>
      {/* Tab headers */}
      <div className="flex border-b border-[#387085]/15">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-[#cd6332] text-[#cd6332]'
                : 'text-[rgba(56,112,133,0.5)] hover:text-[#14140f]'
            }`}
          >
            {tab.label} ({getTabCount(tab.key)})
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'transactions' && (
        <TransactionsTable txs={txs} address={address} />
      )}

      {activeTab === 'deposited' && (
        <VaultsTable vaults={depositedVaults} address={address} roleLabel="Depositor" />
      )}

      {activeTab === 'managed' && (
        <ManagedVaultsPanel vaults={managedVaults} address={address} />
      )}

      {activeTab === 'collateral' && (
        <CollateralPositionsTable
          onSwitchTab={(key) => setActiveTab(key)}
        />
      )}

      {activeTab === 'aave_activity' && <AaveActivityTable />}
    </>
  );
}

/* ── Aave Activity (btcVaultAaveV4Activities API stand-in) ────────────── */

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
    label: 'Add Collateral',
    bg: 'bg-[#387085]/8',
    text: 'text-[#387085]',
    dot: '#387085',
    amountColor: 'text-green-600',
    amountPrefix: '+',
  },
  REMOVE_COLLATERAL: {
    label: 'Remove Collateral',
    bg: 'bg-[#387085]/8',
    text: 'text-[#387085]/70',
    dot: '#387085',
    amountColor: 'text-amber-600',
    amountPrefix: '-',
  },
  BORROW: {
    label: 'Borrow',
    bg: 'bg-[#cd6332]/8',
    text: 'text-[#cd6332]',
    dot: '#cd6332',
    amountColor: 'text-[#cd6332]',
    amountPrefix: '+',
  },
  REPAY: {
    label: 'Repay',
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: '#16a34a',
    amountColor: 'text-[#387085]',
    amountPrefix: '-',
  },
  LIQUIDATION: {
    label: 'Liquidation',
    bg: 'bg-red-50',
    text: 'text-red-600',
    dot: '#dc2626',
    amountColor: 'text-red-500',
    amountPrefix: '-',
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

function formatTokenAmount(t: TokenAmount): string {
  const raw = parseFloat(t.amount);
  const value = raw / Math.pow(10, t.decimals);
  if (t.symbol === 'sBTC') return `${value.toFixed(6)} sBTC`;
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${t.symbol}`;
}

function formatFull(iso: string): string {
  return (
    new Date(iso)
      .toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        hour12: false,
      })
      .replace(',', '') + ' UTC'
  );
}

function formatDateGroupHeader(dateKey: string): string {
  const day = new Date(dateKey);
  const today = new Date();
  // Compare in UTC, day-level
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
    (groups[key] ||= []).push(a);
  }
  return Object.entries(groups).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
  );
}

function AaveActivityTable() {
  const [filter, setFilter] = useState<AaveV4ActivityType | 'ALL'>('ALL');

  const filtered =
    filter === 'ALL'
      ? MOCK_AAVE_V4_ACTIVITIES
      : MOCK_AAVE_V4_ACTIVITIES.filter((a) => a.type === filter);

  const grouped = groupByDate(filtered);

  return (
    <div className="border border-[#cd6332]/20 bg-white">
      {/* Header — filters only (left aligned) */}
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

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#387085]/40">
            No activity found
            {filter !== 'ALL' && (
              <>
                {' '}
                for <span className="font-medium">{filter}</span>
              </>
            )}
          </p>
          {filter !== 'ALL' && (
            <button
              onClick={() => setFilter('ALL')}
              className="mx-auto mt-1 block text-xs text-[#cd6332] hover:underline"
            >
              Show all activity
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 px-5 py-4">
          {grouped.map(([date, activities]) => (
            <div key={date}>
              {/* Date divider */}
              <div className="mb-3 flex items-center gap-3">
                <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-[#387085]/50">
                  {formatDateGroupHeader(date)}
                </span>
                <div className="h-px flex-1 bg-[#387085]/10" />
              </div>

              {/* Events for this date */}
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
                      {/* Type dot */}
                      <div className="mt-1 flex-shrink-0">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ background: style.dot }}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Row 1: type badge + vault id (left) + amount (right) */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}
                            >
                              {isLiquidation && <span className="text-red-500">⚠</span>}
                              {style.label}
                            </span>
                            {activity.vaultId && (
                              <Link
                                href={`/vaults/${activity.vaultId}`}
                                title={`Vault ${activity.vaultId}`}
                                className="font-mono text-[10px] text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline"
                              >
                                {activity.vaultId.slice(0, 6)}...
                                {activity.vaultId.slice(-4)}
                              </Link>
                            )}
                          </div>
                          <span
                            className={`flex-shrink-0 font-mono text-sm font-semibold ${style.amountColor}`}
                          >
                            {style.amountPrefix}
                            {formattedAmount}
                          </span>
                        </div>

                        {/* Row 2: tx hash + block */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          <Link
                            href={`/tx/${activity.txHash}`}
                            title={activity.txHash}
                            className="font-mono text-[10px] text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline"
                          >
                            {activity.txHash.slice(0, 6)}...{activity.txHash.slice(-4)}
                          </Link>
                          <span className="text-[10px] text-[#387085]/20">·</span>
                          <span
                            title={formatFull(activity.blockTime)}
                            className="font-mono text-[10px] text-[#387085]/40"
                          >
                            #{activity.blockNumber.toLocaleString()}
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

/* ── Portfolio Positions — asset-aggregated card view ─────────────────── */

function CollateralPositionsTable({
  onSwitchTab,
}: {
  onSwitchTab: (key: TabKey) => void;
}) {
  // Default: first asset expanded
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(MOCK_PORTFOLIO_POSITIONS[0] ? [MOCK_PORTFOLIO_POSITIONS[0].asset] : []),
  );

  const toggle = (asset: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(asset)) next.delete(asset);
      else next.add(asset);
      return next;
    });
  };

  if (MOCK_PORTFOLIO_POSITIONS.length === 0) {
    return (
      <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
        <div className="py-12 text-center text-sm text-[#387085]/40">
          No positions found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {MOCK_PORTFOLIO_POSITIONS.map((position) => {
        const isOpen = expanded.has(position.asset);

        return (
          <div key={position.asset} className="border border-[#387085]/10 bg-white">
            {/* Header — toggle button */}
            <button
              type="button"
              onClick={() => toggle(position.asset)}
              aria-expanded={isOpen}
              className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#faf9f5] ${
                isOpen ? 'border-b border-[#387085]/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cd6332]/10 text-sm font-semibold text-[#cd6332]">
                  {position.assetIcon}
                </div>
                <div>
                  <p className="text-base font-semibold text-[#14140f]">{position.asset}</p>
                  {position.healthFactor != null &&
                    (() => {
                      const hf = position.healthFactor;
                      const hfMeta =
                        hf < 1
                          ? { label: 'Liquidation', color: 'text-red-500', bg: 'bg-red-50' }
                          : hf < 1.2
                            ? { label: 'At Risk', color: 'text-red-500', bg: 'bg-red-50' }
                            : hf < 1.5
                              ? { label: 'Caution', color: 'text-amber-600', bg: 'bg-amber-50' }
                              : hf < 2
                                ? { label: 'Healthy', color: 'text-green-600', bg: 'bg-green-50' }
                                : { label: 'Safe', color: 'text-green-600', bg: 'bg-green-50' };
                      return (
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                          <span className="text-[#387085]/50">Health Factor</span>
                          <span className={`font-semibold ${hfMeta.color}`}>{hf.toFixed(2)}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${hfMeta.bg} ${hfMeta.color}`}
                          >
                            {hfMeta.label}
                          </span>
                        </p>
                      );
                    })()}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-semibold text-[#14140f]">
                    {position.collateral.toFixed(4)}
                  </p>
                  <p className="text-[11px] text-[#387085]/40">total collateral</p>
                </div>
                <svg
                  className={`h-4 w-4 text-[#387085]/60 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </button>

            {/* Body — vertical row list (collapsible) */}
            {isOpen && (
              <div>
                {/* Collateral */}
                <div className="flex items-center justify-between border-b border-[#387085]/8 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-24 flex-shrink-0 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
                      Collateral
                    </span>
                    <button
                      type="button"
                      onClick={() => onSwitchTab('deposited')}
                      title="View these vaults"
                      className="text-[11px] text-[#387085]/40 transition-colors hover:text-[#cd6332] hover:underline"
                    >
                      {position.activeVaults}/{position.collateralVaults} vaults active
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#14140f]">
                      {position.collateral.toFixed(6)}
                    </span>
                    <span className="ml-1 text-[11px] text-[#387085]/40">{position.asset}</span>
                  </div>
                </div>

                {/* Borrowed */}
                <div className="flex items-center justify-between border-b border-[#387085]/8 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-24 flex-shrink-0 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
                      Borrowed
                    </span>
                    {position.borrowed > 0 && (
                      <span className="text-[11px] text-[#387085]/40">
                        {position.totalRepaid.toLocaleString()} repaid of{' '}
                        {position.totalBorrowed.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {position.borrowed > 0 ? (
                      <>
                        <span className="text-sm font-semibold text-[#cd6332]">
                          {position.borrowed.toLocaleString()}
                        </span>
                        <span className="ml-1 text-[11px] text-[#387085]/40">
                          {position.borrowedAsset}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-[#387085]/30">—</span>
                    )}
                  </div>
                </div>

                {/* LTV */}
                <div className="flex items-center justify-between border-b border-[#387085]/8 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-24 flex-shrink-0 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
                      LTV
                    </span>
                    {position.ltv != null && position.borrowed > 0 && (
                      <div className="flex w-40 max-w-[200px] items-center gap-1.5">
                        <div className="h-1.5 flex-1 overflow-hidden bg-[#387085]/8">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(position.ltv, 100)}%`,
                              background:
                                position.ltv >= 90
                                  ? '#dc2626'
                                  : position.ltv >= 75
                                    ? '#d97706'
                                    : '#16a34a',
                              opacity: 0.75,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {position.ltv != null && position.borrowed > 0 ? (
                    <span
                      className={`text-sm font-semibold ${
                        position.ltv >= 90
                          ? 'text-red-500'
                          : position.ltv >= 75
                            ? 'text-amber-600'
                            : 'text-[#14140f]'
                      }`}
                    >
                      {position.ltv.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-sm text-[#387085]/30">—</span>
                  )}
                </div>

                {/* Interest */}
                <div className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-24 flex-shrink-0 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
                      Interest
                    </span>
                    {position.interest != null && position.interest > 0 && (
                      <span className="text-[11px] text-[#387085]/40">accrued interest</span>
                    )}
                  </div>
                  {position.interest != null && position.interest > 0 ? (
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#cd6332]">
                        {position.interest.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="ml-1 text-[11px] text-[#387085]/40">
                        {position.borrowedAsset}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-[#387085]/30">—</span>
                  )}
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Transactions Table ───────────────────────────────────────────────── */
function TransactionsTable({ txs, address }: { txs: Transaction[]; address: string }) {
  return (
    <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
      {txs.length === 0 ? (
        <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.5)]">
          No transactions found
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Txn Hash</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Method</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Block</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Age</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">From</th>
              <th className="px-2 py-2.5 font-medium"></th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">To</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Txn Fee</th>
            </tr>
          </thead>
          <tbody>
            {txs.slice(0, 25).map((tx) => (
              <tr
                key={tx.hash}
                className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
              >
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    <Link
                      href={`/tx/${tx.hash}`}
                      className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                    >
                      {truncateAddress(tx.hash, 6, 4)}
                    </Link>
                    <CopyIcon text={tx.hash} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                    {tx.method}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="text-[#387085]">{tx.blockNumber}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                  {formatRelativeTime(tx.timestamp)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    {tx.from.toLowerCase() === address.toLowerCase() ? (
                      <span className="font-mono text-[11px] font-medium text-[#14140f]">
                        {truncateAddress(tx.from, 6, 4)}
                      </span>
                    ) : (
                      <Link
                        href={`/accounts/${tx.from}`}
                        className="font-mono text-[11px] text-[#387085] hover:text-[#cd6332]"
                      >
                        {truncateAddress(tx.from, 6, 4)}
                      </Link>
                    )}
                    <CopyIcon text={tx.from} />
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <span className="text-[rgba(56,112,133,0.3)]">→</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    {tx.to.toLowerCase() === address.toLowerCase() ? (
                      <span className="font-mono text-[11px] font-medium text-[#14140f]">
                        {truncateAddress(tx.to, 6, 4)}
                      </span>
                    ) : (
                      <Link
                        href={`/accounts/${tx.to}`}
                        className="font-mono text-[11px] text-[#387085] hover:text-[#cd6332]"
                      >
                        {truncateAddress(tx.to, 6, 4)}
                      </Link>
                    )}
                    <CopyIcon text={tx.to} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#14140f]">
                  {tx.amount} ETH
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                  {tx.txFee.toFixed(10)} ETH
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Vaults Table ─────────────────────────────────────────────────────── */
function VaultsTable({ vaults, address, roleLabel }: { vaults: Vault[]; address: string; roleLabel?: string }) {
  return (
    <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
      {vaults.length === 0 ? (
        <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.5)]">
          No vaults found
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
              {!roleLabel && (
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Role</th>
              )}
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">DApp</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Provider</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {vaults.slice(0, 25).map((vault) => {
              const isDepositor = vault.depositorAddress?.toLowerCase() === address.toLowerCase();
              return (
                <tr
                  key={vault.id}
                  className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
                >
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <Link
                        href={`/vaults/${vault.id}`}
                        className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                      >
                        {truncateAddress(vault.id, 6, 4)}
                      </Link>
                      <CopyIcon text={vault.id} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[vault.status] }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: STATUS_COLORS[vault.status] }}
                      >
                        {vault.status}
                      </span>
                    </span>
                  </td>
                  {!roleLabel && (
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                          isDepositor
                            ? 'bg-[#387085]/10 text-[#387085]'
                            : 'bg-[#5a8a3c]/10 text-[#5a8a3c]'
                        }`}
                      >
                        {isDepositor ? 'Depositor' : 'Provider'}
                      </span>
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#14140f]">
                    {vault.vaultSize.toFixed(8)}{' '}
                    <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">
                    {vault.dappName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">
                    {vault.providerName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                    {formatRelativeTime(vault.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Managed Vaults Panel (for Provider accounts) ──────────────────────── */
const PAGE_SIZE_MANAGED = 20;

function ManagedVaultsPanel({ vaults, address }: { vaults: Vault[]; address: string }) {
  const [page, setPage] = useState(1);

  const totalVaults = vaults.length;

  const totalPages = Math.max(1, Math.ceil(totalVaults / PAGE_SIZE_MANAGED));
  const safePage = Math.min(page, totalPages);
  const pageVaults = vaults.slice(
    (safePage - 1) * PAGE_SIZE_MANAGED,
    safePage * PAGE_SIZE_MANAGED,
  );
  const rangeStart = totalVaults === 0 ? 0 : (safePage - 1) * PAGE_SIZE_MANAGED + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE_MANAGED, totalVaults);

  return (
    <div className="space-y-4">
      {/* Managed Vaults table */}
      <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
        {totalVaults === 0 ? (
          <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.5)]">
            No vaults found
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Amount (BTC)</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Depositor</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {pageVaults.map((vault) => {
                const usdValue = vault.vaultSize * 60000;
                return (
                  <tr
                    key={vault.id}
                    className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center">
                        <Link
                          href={`/vaults/${vault.id}`}
                          className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                        >
                          {truncateAddress(vault.id, 6, 4)}
                        </Link>
                        <CopyIcon text={vault.id} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[vault.status] }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: STATUS_COLORS[vault.status] }}
                        >
                          {vault.status}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                      <div className="font-semibold text-[#14140f]">
                        {vault.vaultSize.toFixed(8)}
                      </div>
                      <div className="text-[10px] text-[#387085]/40">
                        ≈ ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center">
                        <Link
                          href={`/accounts/${vault.depositorAddress}`}
                          className="font-mono text-xs text-[#387085] hover:text-[#cd6332]"
                        >
                          {truncateAddress(vault.depositorAddress, 6, 4)}
                        </Link>
                        <CopyIcon text={vault.depositorAddress} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                      {formatRelativeTime(vault.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalVaults > 0 && (
          <div className="flex items-center justify-between border-t border-[#cd6332]/10 px-4 py-2.5">
            <span className="text-xs text-[#387085]/60">
              Showing <span className="font-semibold text-[#14140f]">{rangeStart}</span>–
              <span className="font-semibold text-[#14140f]">{rangeEnd}</span> of{' '}
              <span className="font-semibold text-[#14140f]">{totalVaults}</span> vaults
            </span>
            <div className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">«</button>
              <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">‹</button>
              <span className="px-2 text-[#14140f]">
                Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span>
              </span>
              <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">›</button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
