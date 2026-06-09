'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_TRANSACTIONS, MOCK_VAULTS } from '@/lib/mock-data';
import {
  MOCK_PORTFOLIO_POSITIONS,
  MOCK_AAVE_V4_ACTIVITIES,
  MOCK_DEPOSITOR_AAVE_POSITION,
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
  Available:            '#5a8a3c',
  Pending:              '#cd6332',
  Verified:             '#7c3aed',
  'Signature Collected':'#ca8a04',
  Redeemed:             '#2563eb',
  Expired:              '#6b7280',
  Liquidated:           '#c83232',
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
  // Provider accounts are fully handled by ProviderDetail component
  if (isProvider) return null;

  // Check whether this EOA actually deposited any vaults
  const lcAddr = address.toLowerCase();
  const hasDepositedVaults = MOCK_VAULTS.some(
    (v) => v.depositorAddress?.toLowerCase() === lcAddr,
  );

  // Build available tabs based on role
  const tabs: { key: TabKey; label: string }[] = [];

  if (isDepositor) {
    // Depositor view: Positions | Deposited Vaults | Activity
    tabs.push({ key: 'collateral', label: 'Positions' });
    tabs.push({ key: 'deposited', label: 'Deposited Vaults' });
    tabs.push({ key: 'aave_activity', label: 'Activity' });
  } else if (isProvider) {
    tabs.push({ key: 'managed', label: 'Vaults' });
    tabs.push({ key: 'transactions', label: 'Transactions' });
  } else {
    tabs.push({ key: 'transactions', label: 'Transactions' });
    if (accountType === 'EOA' && hasDepositedVaults) {
      tabs.push({ key: 'deposited', label: 'Deposited Vaults' });
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
      case 'transactions':       return txs.length;
      case 'deposited':          return depositedVaults.length;
      case 'managed':            return managedVaults.length;
      case 'collateral':    return MOCK_PORTFOLIO_POSITIONS.length;
      case 'aave_activity': return MOCK_AAVE_V4_ACTIVITIES.length;
      default:              return 0;
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
                              <span className="inline-flex items-center gap-1">
                                <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">
                                  Vault
                                </span>
                                <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                <Link
                                  href={`/vaults/${activity.vaultId}`}
                                  title={`Vault ${activity.vaultId}`}
                                  className="font-mono text-[10px] text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline"
                                >
                                  {activity.vaultId.slice(0, 6)}...
                                  {activity.vaultId.slice(-4)}
                                </Link>
                              </span>
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
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">
                              Tx
                            </span>
                            <Link
                              href={`/tx/${activity.txHash}`}
                              title={activity.txHash}
                              className="font-mono text-[10px] text-[#cd6332]/70 transition-colors hover:text-[#cd6332] hover:underline"
                            >
                              {activity.txHash.slice(0, 6)}...{activity.txHash.slice(-4)}
                            </Link>
                          </span>
                          <span className="text-[10px] text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">
                              Block
                            </span>
                            <span
                              title={formatFull(activity.blockTime)}
                              className="font-mono text-[10px] text-[#387085]/40"
                            >
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

/* ── Portfolio Positions — asset-aggregated card view ─────────────────── */

function CollateralPositionsTable({
  onSwitchTab: _onSwitchTab,
}: {
  onSwitchTab: (key: TabKey) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Aave-style position summary */}
      <PositionSummaryCard />

      {/* Debts table */}
      <PositionDebtsTable />
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

const VAULT_STATUS_ORDER = ['Available', 'Pending', 'Verified', 'Signature Collected', 'Redeemed', 'Expired', 'Liquidated'] as const;
const VAULT_STATUS_COLORS: Record<string, string> = {
  Available:            '#16a34a',
  Pending:              '#d97706',
  Verified:             '#7c3aed',
  'Signature Collected':'#ca8a04',
  Redeemed:             '#2563eb',
  Expired:              '#9ca3af',
  Liquidated:           '#dc2626',
};

function ManagedVaultsPanel({ vaults, address }: { vaults: Vault[]; address: string }) {
  const [page, setPage] = useState(1);

  const totalVaults = vaults.length;
  const totalBtc = vaults.reduce((s, v) => s + v.vaultSize, 0);

  // Status distribution
  const statusDist = VAULT_STATUS_ORDER
    .map((status) => ({
      status,
      count: vaults.filter((v) => v.status === status).length,
      btc:   vaults.filter((v) => v.status === status).reduce((s, v) => s + v.vaultSize, 0),
    }))
    .filter((s) => s.count > 0);

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
      {/* Vault Status — stacked bar + list */}
      {totalVaults > 0 && (
        <section className="border border-[#387085]/10 bg-white">
          <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[#14140f]">Vault Status</h2>
              <p className="mt-0.5 text-[11px] text-[#387085]/50">Distribution by vault count</p>
            </div>
            <span className="text-[11px] text-[#387085]/50">
              {totalVaults.toLocaleString()} vaults · {totalBtc.toFixed(2)} sBTC
            </span>
          </div>

          <div className="px-5 py-4">
            {/* Stacked horizontal bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-none">
              {statusDist.map((s) => (
                <div
                  key={s.status}
                  className="h-full"
                  style={{
                    width: `${(s.count / totalVaults) * 100}%`,
                    background: VAULT_STATUS_COLORS[s.status],
                  }}
                  title={`${s.status}: ${s.count}`}
                />
              ))}
            </div>

            {/* Status rows */}
            <div className="mt-3 space-y-0">
              {statusDist.map((s) => {
                const pct = Math.round((s.count / totalVaults) * 100);
                return (
                  <div
                    key={s.status}
                    className="flex items-center justify-between border-b border-[#387085]/6 py-2 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                        style={{ background: VAULT_STATUS_COLORS[s.status] }}
                      />
                      <span className="text-sm text-[#14140f]">{s.status}</span>
                      <span className="text-[11px] text-[#387085]/40">{s.btc.toFixed(2)} sBTC</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-[11px] font-medium text-[#387085]/50">{pct}%</span>
                      <span className="w-20 text-sm font-semibold text-[#14140f]">
                        {s.count.toLocaleString()} vaults
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

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

/* ── Positions tab — Aave-style summary card ───────────────────────────── */

function parsePositionAmount(amount: string, decimals: number): number {
  return parseFloat(amount) / Math.pow(10, decimals);
}

function getPositionHealthStatus(hf: number): {
  label: string;
  color: string;
  bg: string;
  text: string;
} {
  if (hf >= 2.0)
    return { label: 'Safe', color: '#16a34a', bg: 'bg-green-50', text: 'text-green-700' };
  if (hf >= 1.5)
    return { label: 'Healthy', color: '#387085', bg: 'bg-[#387085]/8', text: 'text-[#387085]' };
  if (hf >= 1.2)
    return { label: 'Caution', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' };
  if (hf >= 1.0)
    return { label: 'At Risk', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700' };
  return { label: 'Liquidation', color: '#dc2626', bg: 'bg-red-50', text: 'text-red-600' };
}

function PositionSummaryCard() {
  const p = MOCK_DEPOSITOR_AAVE_POSITION;

  const collateralAmount = parsePositionAmount(
    p.totalCollateral.amount,
    p.totalCollateral.decimals,
  );
  const collateralUsd = p.totalCollateral.priceUsd
    ? collateralAmount * parseFloat(p.totalCollateral.priceUsd)
    : null;

  const currentLtv = parseFloat(p.currentLtv);
  const maxLtv = p.avgCollateralFactor ? parseFloat(p.avgCollateralFactor) * 100 : 75;
  const ltvFillPct = Math.min((currentLtv / maxLtv) * 100, 100);
  const ltvColor =
    currentLtv >= maxLtv * 0.95
      ? '#dc2626'
      : currentLtv >= maxLtv * 0.7
        ? '#d97706'
        : '#16a34a';

  const debtTotal = p.debts.reduce(
    (s, d) => s + parsePositionAmount(d.totalAmount, d.decimals),
    0,
  );
  const interestTotal = p.debts.reduce(
    (s, d) => s + parsePositionAmount(d.accruedInterest, d.decimals),
    0,
  );
  const debtSymbol = p.debts[0]?.symbol ?? '';

  const hf = parseFloat(p.healthFactor);
  const status = getPositionHealthStatus(hf);
  // HF gauge: 0 → 3+ range, map to 0-100%
  const HF_GAUGE_MAX = 3;
  const hfPct = Math.min((hf / HF_GAUGE_MAX) * 100, 100);
  // Markers: 1.0 liquidation, 1.5 caution-safe, 2.0 safe
  const liquidationMarker = (1.0 / HF_GAUGE_MAX) * 100;
  const healthyMarker = (1.5 / HF_GAUGE_MAX) * 100;
  const safeMarker = (2.0 / HF_GAUGE_MAX) * 100;

  return (
    <div className="space-y-3">
      {/* 3-card row: Collateral | Current LTV | Debt */}
      <div className="grid grid-cols-3 gap-3">
        {/* Collateral */}
        <div className="border border-[#387085]/10 bg-white px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Collateral</p>
          <p className="mt-1 text-xl font-bold text-[#14140f]">
            {collateralAmount.toFixed(3)} <span className="text-sm font-normal text-[#387085]/50">{p.totalCollateral.symbol ?? 'sBTC'}</span>
          </p>
          {collateralUsd != null && (
            <p className="mt-0.5 text-xs text-[#387085]/40">≈ ${collateralUsd.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
          )}
        </div>

        {/* Current LTV */}
        <div className="border border-[#387085]/10 bg-white px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Current LTV</p>
          <p className="mt-1 text-xl font-bold text-[#14140f]">{currentLtv.toFixed(2)}%</p>
          <p className="mt-0.5 text-xs text-[#387085]/40">of {maxLtv.toFixed(0)}% max</p>
        </div>

        {/* Debt */}
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

      {/* Health Factor */}
      <div className="border border-[#387085]/10 bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            Health Factor
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}
          >
            {hf < 1 && '⚠ '}
            {status.label}
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-bold" style={{ color: status.color }}>
            {hf.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#387085]/40">
            {hf < 1
              ? 'subject to liquidation'
              : `${(hf - 1).toFixed(2)} above liquidation threshold`}
          </p>
        </div>

        {/* HF gauge */}
        <div className="relative mt-4">
          {/* Track — gradient red → amber → teal → green */}
          <div
            className="h-2 w-full"
            style={{
              background:
                'linear-gradient(to right, #dc2626 0%, #dc2626 ' +
                liquidationMarker +
                '%, #d97706 ' +
                liquidationMarker +
                '%, #d97706 ' +
                healthyMarker +
                '%, #387085 ' +
                healthyMarker +
                '%, #387085 ' +
                safeMarker +
                '%, #16a34a ' +
                safeMarker +
                '%, #16a34a 100%)',
              opacity: 0.5,
            }}
          />
          {/* Current HF pointer */}
          <div
            className="absolute top-[-3px] h-[14px] w-[3px] bg-[#14140f]"
            style={{ left: `calc(${hfPct}% - 1.5px)` }}
            title={`Health Factor ${hf.toFixed(2)}`}
          />
          {/* Threshold markers */}
          {[
            { pct: liquidationMarker, label: '1.0' },
            { pct: healthyMarker, label: '1.5' },
            { pct: safeMarker, label: '2.0' },
          ].map((m) => (
            <div
              key={m.label}
              className="absolute top-3 -translate-x-1/2 text-[9px] text-[#387085]/40"
              style={{ left: `${m.pct}%` }}
            >
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

/* ── Position Debts Table ───────────────────────────────────────────────── */

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
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">Reserve ID</th>
            <th className="whitespace-nowrap px-4 py-2.5 font-medium">Token</th>
            <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">Amount</th>
            <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">Principal</th>
            <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">
              Accrued Interest
            </th>
          </tr>
        </thead>
        <tbody>
          {debts.map((d, i) => {
            const amount = parsePositionAmount(d.totalAmount, d.decimals);
            const principal = parsePositionAmount(d.principal, d.decimals);
            const interest = parsePositionAmount(d.accruedInterest, d.decimals);
            const reserve = d.reserveId;
            const reserveLabel = reserve
              ? (reserve.length > 10 ? `${reserve.slice(0, 6)}...${reserve.slice(-4)}` : reserve)
              : '—';
            return (
              <tr
                key={`${d.symbol}-${i}`}
                className="h-10 border-b border-[#387085]/8 transition-colors last:border-0 hover:bg-[#faf9f5]"
              >
                {/* Reserve ID */}
                <td className="whitespace-nowrap px-4 py-2.5">
                  {reserve ? (
                    reserve.length > 10 ? (
                      <div className="flex items-center">
                        <span title={reserve} className="font-mono text-[11px] text-[#387085]">{reserveLabel}</span>
                        <CopyIcon text={reserve} />
                      </div>
                    ) : (
                      <span className="text-sm text-[#14140f]">{reserveLabel}</span>
                    )
                  ) : (
                    <span className="text-[#387085]/30">—</span>
                  )}
                </td>

                {/* Token */}
                <td className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-[#14140f]">
                  {d.symbol}
                </td>

                {/* Amount (principal + interest) */}
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                  <span className="text-sm font-semibold text-[#cd6332]">
                    {amount.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                  </span>
                  <span className="ml-1 text-[11px] text-[#387085]/40">{d.symbol}</span>
                </td>

                {/* Principal */}
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                  <span className="text-sm text-[#14140f]">
                    {principal.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                  </span>
                  <span className="ml-1 text-[11px] text-[#387085]/40">{d.symbol}</span>
                </td>

                {/* Accrued Interest */}
                <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                  {interest > 0 ? (
                    <>
                      <span className="text-sm text-[#387085]">
                        +{interest.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                      </span>
                      <span className="ml-1 text-[11px] text-[#387085]/40">
                        {d.symbol}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-[#387085]/30">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
