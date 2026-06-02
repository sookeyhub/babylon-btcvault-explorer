'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Vault } from '@/lib/types';
import { truncateAddress, formatRelativeTime } from '@/lib/utils';

/* ── Mock data ──────────────────────────────────────────────────────────── */

const MOCK_PERF = {
  successRate: 94.7,
  successRateDelta: +2.3,
  successCount: 218,
  totalCount: 230,
  btcLockedUsdRate: 65000,
  weeklyVaultGrowth: 5,
  weeklyBtcGrowth: 4.8,
  avgActivation: '38 min',
};

const MOCK_STATUS = { status: 'Operational' as const, lastActivity: '8 min ago' };

/* ── Provider-specific activity mock data ───────────────────────────────── */
// Events a provider sees: vault activation success/failure, liquidations

type ProviderEventType = 'PEGIN_ACTIVATED' | 'VAULT_EXPIRED' | 'VAULT_LIQUIDATED';
type FailureReason = 'ack_timeout' | 'activation_timeout';

const PROVIDER_ADDR = '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5';

interface ProviderActivity {
  blockNumber: number;
  txHash: string;          // truncated for display
  fullTxHash: string;      // full for copy/link
  blockTime: string;       // ISO
  type: ProviderEventType;
  failureReason?: FailureReason;
  fromState: string;       // vault state before this event
  toState: string;         // vault state after this event
  vaultId: string;         // truncated
  fullVaultId: string;     // full
  amount: string;          // BTC amount string
  success: boolean;
  depositor: string;       // truncated
  fullDepositor: string;   // full
  dapp: string;
}

const MOCK_PROVIDER_ACTIVITIES: ProviderActivity[] = [
  {
    blockNumber: 10892304,
    txHash: '0xdead...0001', fullTxHash: '0xdead00015a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    blockTime: '2026-05-21T02:09:00Z',
    type: 'VAULT_LIQUIDATED', fromState: 'Active', toState: 'Liquidated',
    vaultId: '0x7e8f...9a0b', fullVaultId: '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    amount: '1.00000000', success: false,
    depositor: '0x8c52...e740', fullDepositor: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740',
    dapp: 'Aave',
  },
  {
    blockNumber: 10889150,
    txHash: '0xabcd...ef01', fullTxHash: '0xabcdef012b1c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
    blockTime: '2026-05-20T14:22:00Z',
    type: 'VAULT_EXPIRED', failureReason: 'ack_timeout', fromState: 'Pending', toState: 'Expired',
    vaultId: '0xe5f6...a7b8', fullVaultId: '0xe5f6a7b82b1c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e',
    amount: '0.80000000', success: false,
    depositor: '0x3d4e...e3f4', fullDepositor: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
    dapp: 'Compound',
  },
  {
    blockNumber: 10834210,
    txHash: '0xcafe...babe', fullTxHash: '0xcafebabe1c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    blockTime: '2026-05-03T09:17:00Z',
    type: 'PEGIN_ACTIVATED', fromState: 'Verified', toState: 'Active',
    vaultId: '0x1c2d...3e4f', fullVaultId: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    amount: '0.70000000', success: true,
    depositor: '0x7f4a...b281', fullDepositor: '0x7f4ae1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8b281',
    dapp: 'Aave',
  },
  {
    blockNumber: 10817640,
    txHash: '0xf1a2...b3c4', fullTxHash: '0xf1a2b3c4e8a2b1c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c8',
    blockTime: '2026-04-28T16:54:00Z',
    type: 'VAULT_EXPIRED', failureReason: 'activation_timeout', fromState: 'Verified', toState: 'Expired',
    vaultId: '0xf1a2...b3c4', fullVaultId: '0xf1a2b3c4e8a2b1c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c8',
    amount: '1.50000000', success: false,
    depositor: '0x5a6b...a4b5', fullDepositor: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5',
    dapp: 'Aave',
  },
  {
    blockNumber: 10781033,
    txHash: '0xfeed...beef', fullTxHash: '0xfeedbeef3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    blockTime: '2026-04-15T11:03:00Z',
    type: 'PEGIN_ACTIVATED', fromState: 'Verified', toState: 'Active',
    vaultId: '0x3a4b...5c6d', fullVaultId: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    amount: '0.30000000', success: true,
    depositor: '0x8c52...e740', fullDepositor: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740',
    dapp: 'Compound',
  },
  {
    blockNumber: 10547310,
    txHash: '0xd523...424e', fullTxHash: '0xd523721ea5c314ddfe56afafb0562318fdddf57cd6b6c6750baa61e78387424e',
    blockTime: '2026-04-09T05:48:00Z',
    type: 'PEGIN_ACTIVATED', fromState: 'Verified', toState: 'Active',
    vaultId: '0xd388...5031', fullVaultId: '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031',
    amount: '1.00000000', success: true,
    depositor: '0x8c52...e740', fullDepositor: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740',
    dapp: 'Aave',
  },
  {
    blockNumber: 10547088,
    txHash: '0x9876...5432', fullTxHash: '0x98765432c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e280c',
    blockTime: '2026-04-09T03:31:00Z',
    type: 'PEGIN_ACTIVATED', fromState: 'Verified', toState: 'Active',
    vaultId: '0xc9d0...e1f2', fullVaultId: '0xc9d0e1f2c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e280c',
    amount: '2.10000000', success: true,
    depositor: '0x7f4a...b281', fullDepositor: '0x7f4ae1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8b281',
    dapp: 'Aave',
  },
  {
    blockNumber: 10547001,
    txHash: '0x1234...5678', fullTxHash: '0x123456781c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
    blockTime: '2026-04-09T01:14:00Z',
    type: 'VAULT_EXPIRED', failureReason: 'ack_timeout', fromState: 'Pending', toState: 'Expired',
    vaultId: '0xa1b2...c3d4', fullVaultId: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    amount: '0.50000000', success: false,
    depositor: '0x3d4e...e3f4', fullDepositor: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
    dapp: 'Compound',
  },
];

const MOCK_QUEUE = [
  { id: '0xd388...5031', fullId: '0xd388f2c3e1a94b7d5031', stage: 'verified',             timeInStage: '14 min', timeout: '46 min', urgency: 'safe' as const },
  { id: '0xa1b2...c3d4', fullId: '0xa1b2c3d4e5f6a7b8c3d4', stage: 'signatures_collected', timeInStage: '28 min', timeout: '32 min', urgency: 'warn' as const },
  { id: '0x9e0f...1z2w', fullId: '0x9e0f1a2b3c4d5e6f1a2b', stage: 'pending',              timeInStage: '5 min',  timeout: '55 min', urgency: 'safe' as const },
];

/* ── Types ──────────────────────────────────────────────────────────────── */

type TabKey = 'vaults' | 'activity';
type VaultSubTab = 'in_progress' | 'all';

const PROVIDER_EVENT_STYLES: Record<ProviderEventType, {
  label: (r?: FailureReason) => string;
  dot: string;
  amountColor: string;
  bg: string;
  text: string;
}> = {
  PEGIN_ACTIVATED:  {
    label: () => 'Vault activated',
    dot: '#16a34a',
    amountColor: 'text-[#16a34a]',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  VAULT_EXPIRED: {
    label: (r) => r === 'ack_timeout' ? 'Vault expired (ack_timeout)' : 'Vault expired (activation_timeout)',
    dot: '#dc2626',
    amountColor: 'text-red-500',
    bg: 'bg-red-50',
    text: 'text-red-600',
  },
  VAULT_LIQUIDATED: {
    label: () => 'Vault liquidated',
    dot: '#7f1d1d',
    amountColor: 'text-red-700',
    bg: 'bg-red-100',
    text: 'text-red-800',
  },
};

const VAULT_STATUS_COLORS: Record<string, string> = {
  Active:     '#16a34a',
  Pending:    '#d97706',
  Redeemed:   '#387085',
  Expired:    '#9ca3af',
  Liquidated: '#dc2626',
};

const VAULT_STATUS_ORDER = ['Active', 'Pending', 'Redeemed', 'Expired', 'Liquidated'] as const;
const PAGE_SIZE = 20;

const STATUS_DOT_COLOR: Record<string, string> = {
  Operational: '#16a34a',
  Degraded:    '#d97706',
  Inactive:    '#9ca3af',
};

/* ── CopyIcon ────────────────────────────────────────────────────────────── */

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

/* ── Activity date grouping helpers ─────────────────────────────────────── */

function formatDateGroup(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

function formatTimeUTC(isoDate: string): string {
  const d = new Date(isoDate);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${min} (UTC)`;
}

/* ── Activity Tab ──────────────────────────────────────────────────────────── */

// Event styles — same visual language as Depositor activity
const ACTIVITY_STYLE: Record<ProviderEventType, {
  label: (r?: FailureReason) => string;
  dot: string;
  bg: string;          // badge bg
  text: string;        // badge text
  rowBg: string;       // row background
  rowBorder: string;   // row border
  amountColor: string;
  amountPrefix: string;
}> = {
  PEGIN_ACTIVATED: {
    label: () => 'Vault activated',
    dot: '#16a34a',
    bg: 'bg-green-50', text: 'text-green-700',
    rowBg: 'bg-white hover:bg-[#faf9f5]', rowBorder: 'border-[#387085]/10',
    amountColor: 'text-green-600', amountPrefix: '+',
  },
  VAULT_EXPIRED: {
    label: (r) => r === 'ack_timeout' ? 'Vault expired · ack_timeout' : 'Vault expired · activation_timeout',
    dot: '#d97706',
    bg: 'bg-amber-50', text: 'text-amber-700',
    rowBg: 'bg-amber-50/40 hover:bg-amber-50/60', rowBorder: 'border-amber-200/60',
    amountColor: 'text-amber-600', amountPrefix: '',
  },
  VAULT_LIQUIDATED: {
    label: () => 'Vault liquidated',
    dot: '#dc2626',
    bg: 'bg-red-50', text: 'text-red-600',
    rowBg: 'bg-red-50/50 hover:bg-red-50/70', rowBorder: 'border-red-200/60',
    amountColor: 'text-red-600', amountPrefix: '-',
  },
};

// State pill colors
const STATE_PILL: Record<string, string> = {
  Active:     'bg-green-50 text-green-700',
  Verified:   'bg-[#387085]/8 text-[#387085]',
  Pending:    'bg-amber-50 text-amber-600',
  Expired:    'bg-gray-100 text-gray-500',
  Liquidated: 'bg-red-50 text-red-600',
};

function groupProviderActivities(activities: ProviderActivity[]): [string, ProviderActivity[]][] {
  const groups: Record<string, ProviderActivity[]> = {};
  for (const a of activities) {
    const key = formatDateGroup(a.blockTime);
    (groups[key] ||= []).push(a);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function ActivityTab() {
  const grouped = groupProviderActivities(MOCK_PROVIDER_ACTIVITIES);

  return (
    <div className="border border-[#cd6332]/20 bg-white">
      {grouped.length === 0 ? (
        <div className="py-12 text-center text-sm text-[#387085]/40">No activity found</div>
      ) : (
        <div className="space-y-6 px-5 py-4">
          {grouped.map(([dateKey, activities]) => (
            <div key={dateKey}>
              {/* Date divider — same as Depositor */}
              <div className="mb-3 flex items-center gap-3">
                <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-[#387085]/50">
                  {dateKey}
                </span>
                <div className="h-px flex-1 bg-[#387085]/10" />
              </div>

              <div className="space-y-2">
                {activities.map((activity) => {
                  const s = ACTIVITY_STYLE[activity.type];
                  const evtLabel = s.label(activity.failureReason);
                  const d = new Date(activity.blockTime);
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const timeUTC = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} (UTC)`;

                  return (
                    <div
                      key={activity.fullTxHash}
                      className={`flex items-start gap-3 border px-4 py-3 transition-colors ${s.rowBg} ${s.rowBorder}`}
                    >
                      {/* Type dot */}
                      <div className="mt-1 shrink-0">
                        <div className="h-2 w-2 rounded-full" style={{ background: s.dot }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Row 1: badge + time | amount */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}>
                              {evtLabel}
                            </span>
                            <span className="text-[10px] text-[#387085]/45">{timeUTC}</span>
                          </div>
                          <span className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${s.amountColor}`}>
                            {s.amountPrefix}{activity.amount} sBTC
                          </span>
                        </div>

                        {/* Row 2: State transition pill */}
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${STATE_PILL[activity.fromState] ?? 'bg-gray-100 text-gray-500'}`}>
                            {activity.fromState}
                          </span>
                          <svg className="h-3 w-3 shrink-0 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${STATE_PILL[activity.toState] ?? 'bg-gray-100 text-gray-500'}`}>
                            {activity.toState}
                          </span>
                        </div>

                        {/* Row 3: Tx · Block · Vault */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[#387085]/50">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Tx</span>
                            <Link
                              href={`/tx/${activity.fullTxHash}`}
                              className="font-mono text-[#cd6332]/70 hover:text-[#cd6332] hover:underline"
                            >
                              {activity.txHash}
                            </Link>
                            <CopyIcon text={activity.fullTxHash} />
                          </span>
                          <span className="text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Block</span>
                            <span className="font-mono text-[#387085]/40">#{activity.blockNumber.toLocaleString()}</span>
                          </span>
                          <span className="text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Vault</span>
                            <Link
                              href={`/vaults/${activity.fullVaultId}`}
                              className="font-mono text-[#cd6332]/70 hover:text-[#cd6332] hover:underline"
                            >
                              {activity.vaultId}
                            </Link>
                            <CopyIcon text={activity.fullVaultId} />
                          </span>
                        </div>

                        {/* Row 4: Provider-specific — Depositor · dApp */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[#387085]/50">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Depositor</span>
                            <Link
                              href={`/accounts/${activity.fullDepositor}`}
                              className="font-mono text-[#387085]/60 hover:text-[#cd6332] hover:underline"
                            >
                              {activity.depositor}
                            </Link>
                            <CopyIcon text={activity.fullDepositor} />
                          </span>
                          <span className="text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">dApp</span>
                            <span className="font-medium text-[#387085]/60">{activity.dapp}</span>
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

/* ── Vaults Tab (Status chart + In Progress / All sub-tabs) ─────────────── */

function VaultsTab({ vaults }: { vaults: Vault[] }) {
  const [subTab, setSubTab] = useState<VaultSubTab>('in_progress');
  const [page, setPage] = useState(1);

  const totalVaults = vaults.length;
  const totalBtc = vaults.reduce((s, v) => s + v.vaultSize, 0);

  const statusDist = VAULT_STATUS_ORDER
    .map((status) => ({
      status,
      count: vaults.filter((v) => v.status === status).length,
      btc:   vaults.filter((v) => v.status === status).reduce((s, v) => s + v.vaultSize, 0),
    }))
    .filter((s) => s.count > 0);

  const totalPages = Math.max(1, Math.ceil(totalVaults / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageVaults = vaults.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = totalVaults === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, totalVaults);

  return (
    <div className="space-y-0">
      {/* Vault Status bar chart */}
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
            {/* Stacked bar */}
            <div className="flex h-3 w-full overflow-hidden">
              {statusDist.map((s) => (
                <div
                  key={s.status}
                  className="h-full"
                  style={{ width: `${(s.count / totalVaults) * 100}%`, background: VAULT_STATUS_COLORS[s.status] }}
                  title={`${s.status}: ${s.count}`}
                />
              ))}
            </div>
            {/* Status rows */}
            <div className="mt-3 space-y-0">
              {statusDist.map((s) => {
                const pct = Math.round((s.count / totalVaults) * 100);
                return (
                  <div key={s.status} className="flex items-center justify-between border-b border-[#387085]/6 py-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: VAULT_STATUS_COLORS[s.status] }} />
                      <span className="text-sm text-[#14140f]">{s.status}</span>
                      <span className="text-[11px] text-[#387085]/40">{s.btc.toFixed(2)} sBTC</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-[11px] font-medium text-[#387085]/50">{pct}%</span>
                      <span className="w-20 text-sm font-semibold text-[#14140f]">{s.count.toLocaleString()} vaults</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-tab bar */}
          <div className="flex border-t border-[#387085]/10">
            {([
              { key: 'in_progress' as VaultSubTab, label: 'In Progress', count: MOCK_QUEUE.length },
              { key: 'all' as VaultSubTab, label: 'All', count: totalVaults },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setSubTab(t.key)}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium transition-colors ${
                  subTab === t.key
                    ? 'border-b-2 border-[#cd6332] text-[#cd6332]'
                    : 'text-[#387085]/50 hover:text-[#14140f]'
                }`}
              >
                {t.key === 'in_progress' && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#cd6332] opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#cd6332]" />
                  </span>
                )}
                {t.label}
                <span className="text-[10px] text-[#387085]/40">({t.count})</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* In Progress sub-tab — live queue */}
      {subTab === 'in_progress' && (
        <div className="border border-t-0 border-[#387085]/10 bg-white">
          {MOCK_QUEUE.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#387085]/40">No vaults currently in progress</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#387085]/6 text-[11px] font-medium uppercase tracking-wider text-[#387085]/50">
                    <th className="whitespace-nowrap px-4 py-2.5">Vault</th>
                    <th className="whitespace-nowrap px-4 py-2.5">Stage</th>
                    <th className="whitespace-nowrap px-4 py-2.5">Time in Stage</th>
                    <th className="whitespace-nowrap px-4 py-2.5">Timeout</th>
                    <th className="px-4 py-2 text-right">
                      <button className="rounded border border-[#387085]/15 bg-white px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-[#387085] hover:bg-[#faf9f5]">
                        Refresh
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...MOCK_QUEUE].sort((a, b) => parseInt(b.timeInStage) - parseInt(a.timeInStage)).map((q) => (
                    <tr key={q.id} className="h-10 border-b border-[#387085]/8 last:border-0 hover:bg-[#faf9f5]">
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center">
                          <Link href={`/vaults/${q.fullId}`} className="font-mono text-[11px] text-[#cd6332] hover:underline">
                            {q.id}
                          </Link>
                          <CopyIcon text={q.fullId} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className="font-mono text-[11px] text-[#387085]/70">{q.stage}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">{q.timeInStage}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span className={`font-medium ${q.urgency === 'warn' ? 'text-amber-500' : 'text-[#387085]/60'}`}>
                          {q.timeout}
                        </span>
                      </td>
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* All sub-tab — full vault table */}
      {subTab === 'all' && (
        <div className="overflow-x-auto border border-t-0 border-[#cd6332]/20 bg-white">
          {totalVaults === 0 ? (
            <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.5)]">No vaults found</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
                  <th className="whitespace-nowrap px-4 py-2.5">Vault ID</th>
                  <th className="whitespace-nowrap px-4 py-2.5">Status</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-right">Amount (BTC)</th>
                  <th className="whitespace-nowrap px-4 py-2.5">Depositor</th>
                  <th className="whitespace-nowrap px-4 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {pageVaults.map((vault) => {
                  const usdValue = vault.vaultSize * 60000;
                  return (
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
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: VAULT_STATUS_COLORS[vault.status] }} />
                          <span className="text-xs font-medium" style={{ color: VAULT_STATUS_COLORS[vault.status] }}>{vault.status}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                        <div className="font-semibold text-[#14140f]">{vault.vaultSize.toFixed(8)}</div>
                        <div className="text-[10px] text-[#387085]/40">≈ ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center">
                          <Link href={`/accounts/${vault.depositorAddress}`} className="font-mono text-xs text-[#387085] hover:text-[#cd6332]">
                            {truncateAddress(vault.depositorAddress, 6, 4)}
                          </Link>
                          <CopyIcon text={vault.depositorAddress} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                        {new Date(vault.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
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
                <span className="px-2 text-[#14140f]">Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span></span>
                <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">›</button>
                <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main ProviderDetail component ──────────────────────────────────────── */

interface ProviderDetailProps {
  address: string;
  providerName: string;
  commission: number;
  joinedDate: string;
  vaults: Vault[];
}

export default function ProviderDetail({
  address,
  providerName,
  commission,
  joinedDate,
  vaults,
}: ProviderDetailProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('vaults');

  const totalVaults = vaults.length;
  const totalBtc = vaults.reduce((s, v) => s + v.vaultSize, 0);
  const commissionPct = (commission / 100).toFixed(2);
  const joinedFormatted = new Date(joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const statusColor = STATUS_DOT_COLOR[MOCK_STATUS.status] ?? '#9ca3af';

  // Display name: use providerName if present, else truncated address
  const displayName = providerName || truncateAddress(address, 6, 4);
  const addrShort = truncateAddress(address, 6, 4);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'vaults',   label: 'Vaults' },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <div className="space-y-4">

      {/* ── Page label ──────────────────────────────────────────────────── */}
      <p className="text-[11px] font-medium uppercase tracking-widest text-[#387085]/35">Provider</p>

      {/* ── Row A: Identity strip ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-[#14140f]">{displayName}</h1>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#387085]/55">
            <span className="font-mono">{addrShort}</span>
            <CopyIcon text={address} />
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1 text-xs text-[#387085]/55">
          <span>commission <span className="font-medium text-[#14140f]">{commissionPct}%</span></span>
          <span>joined <span className="font-medium text-[#14140f]">{joinedFormatted}</span></span>
        </div>
      </div>

      {/* ── Row B: Status bar ────────────────────────────────────────────── */}
      <button
        onClick={() => setActiveTab('activity')}
        className="flex w-full items-center justify-between border border-[#387085]/12 bg-white px-4 py-2.5 text-left transition-colors hover:bg-[#faf9f5]"
      >
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: statusColor }} />
          <span className="text-sm font-medium text-[#14140f]">{MOCK_STATUS.status}</span>
          <span className="text-xs text-[#387085]/50">last activity {MOCK_STATUS.lastActivity}</span>
        </div>
        <span className="text-[#387085]/40">›</span>
      </button>

      {/* ── Row C: 4 stat cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1 — Vaults */}
        <button
          onClick={() => setActiveTab('vaults')}
          className="group relative border border-[#387085]/10 bg-white p-4 text-left transition-colors hover:border-[#cd6332]/20 hover:bg-[#faf9f5]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#387085]/45">Vaults</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">{totalVaults}</p>
          <span className="absolute bottom-2 right-2 text-[10px] text-[#cd6332] opacity-0 transition-opacity group-hover:opacity-100">View details ›</span>
        </button>

        {/* Card 2 — BTC Locked */}
        <button
          onClick={() => setActiveTab('vaults')}
          className="group relative border border-[#387085]/10 bg-white p-4 text-left transition-colors hover:border-[#cd6332]/20 hover:bg-[#faf9f5]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#387085]/45">BTC Locked</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">{totalBtc.toFixed(2)}</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">≈ ${(totalBtc * MOCK_PERF.btcLockedUsdRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          <span className="absolute bottom-2 right-2 text-[10px] text-[#cd6332] opacity-0 transition-opacity group-hover:opacity-100">View details ›</span>
        </button>

        {/* Card 3 — Success Rate */}
        <button
          onClick={() => setActiveTab('activity')}
          className="group relative border border-[#387085]/10 bg-white p-4 text-left transition-colors hover:border-[#cd6332]/20 hover:bg-[#faf9f5]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#387085]/45">Success Rate</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">{MOCK_PERF.successRate}%</p>
          {/* Success / Fail bar */}
          <div className="mt-2 flex h-1 w-full overflow-hidden rounded-full bg-red-200">
            <div
              className="h-full rounded-full bg-[#16a34a]"
              style={{ width: `${MOCK_PERF.successRate}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[10px]">
            <span className="text-[#16a34a]">✓ {MOCK_PERF.successCount}</span>
            <span className="text-[#387085]/25">·</span>
            <span className="text-red-500">✗ {MOCK_PERF.totalCount - MOCK_PERF.successCount}</span>
          </div>
          <span className="absolute bottom-2 right-2 text-[10px] text-[#cd6332] opacity-0 transition-opacity group-hover:opacity-100">View details ›</span>
        </button>

        {/* Card 4 — Avg Activation */}
        <button
          onClick={() => setActiveTab('vaults')}
          className="group relative border border-[#387085]/10 bg-white p-4 text-left transition-colors hover:border-[#cd6332]/20 hover:bg-[#faf9f5]"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#387085]/45">Avg Activation</p>
          <p className="mt-1.5 text-2xl font-bold text-[#14140f]">{MOCK_PERF.avgActivation}</p>
          <span className="absolute bottom-2 right-2 text-[10px] text-[#cd6332] opacity-0 transition-opacity group-hover:opacity-100">View details ›</span>
        </button>
      </div>

      {/* ── Row D: Tab bar ───────────────────────────────────────────────── */}
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
            {tab.key === 'vaults' && (
              <span className="ml-1 text-[10px] text-[#387085]/40">({totalVaults})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {activeTab === 'vaults'   && <VaultsTab vaults={vaults} />}
      {activeTab === 'activity' && <ActivityTab />}
    </div>
  );
}
