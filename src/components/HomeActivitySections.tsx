'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MOCK_VAULT_ACTIVITIES,
  MOCK_GLOBAL_LENDING_ACTIVITIES,
  type VaultActivityEvent,
  type VaultEventType,
  type AaveV4Activity,
  type AaveV4ActivityType,
  type TokenAmount,
} from '@/lib/mock-aave-activity';
import { truncateAddress, formatRelativeTime, formatTimeUTC, toUsd, TOKEN_PRICES } from '@/lib/utils';

/* ── Shared helpers ──────────────────────────────────────────────────────── */

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

/* ── Vault Activity styles (same as /vaults page) ─────────────────────────── */

const VAULT_EVENT_STYLES: Record<VaultEventType, {
  label: string; status: string; pillClass: string;
}> = {
  VAULT_CREATED:    { label: 'Pending',    status: 'Pending',    pillClass: 'bg-amber-50 text-amber-600' },
  VAULT_ACTIVATED:  { label: 'Activated',  status: 'Available',  pillClass: 'bg-green-50 text-green-700' },
  VAULT_EXPIRED:    { label: 'Expired',    status: 'Expired',    pillClass: 'bg-gray-100 text-gray-500' },
  VAULT_REDEEMED:   { label: 'Redeemed',   status: 'Redeemed',   pillClass: 'bg-blue-50 text-blue-700' },
  VAULT_LIQUIDATED: { label: 'Liquidated', status: 'Liquidated', pillClass: 'bg-red-50 text-red-600' },
};

/* ── Lending Activity styles (same as /lending-activity page) ────────────── */

const LENDING_STYLES: Record<AaveV4ActivityType, {
  label: string; color: string; amountColor: string; amountPrefix: string;
}> = {
  ADD_COLLATERAL:    { label: 'Add Collateral',    color: 'text-[#387085]',    amountColor: 'text-green-600',   amountPrefix: '+' },
  REMOVE_COLLATERAL: { label: 'Remove Collateral', color: 'text-[#cd6332]',    amountColor: 'text-[#cd6332]',   amountPrefix: '-' },
  BORROW:            { label: 'Borrow',            color: 'text-[#cd6332]',    amountColor: 'text-[#cd6332]',   amountPrefix: '+' },
  REPAY:             { label: 'Repay',              color: 'text-green-700',    amountColor: 'text-[#387085]',   amountPrefix: '-' },
  LIQUIDATION:       { label: 'Liquidation',        color: 'text-red-600',      amountColor: 'text-red-500',     amountPrefix: '-' },
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

/* ── Vault Activity Row (same format as /vaults Vault Activity tab) ─────────── */

function VaultHistoryRow({ event }: { event: VaultActivityEvent }) {
  const style = VAULT_EVENT_STYLES[event.type];
  return (
    <div className="flex items-start gap-3 border border-[#387085]/10 bg-white px-4 py-3 transition-colors hover:bg-[#faf9f5]">
      {/* Time column */}
      <div className="w-28 shrink-0 pt-0.5">
        <div className="text-xs font-medium text-[#387085]/80">{formatRelativeTime(event.blockTime)}</div>
        <div className="font-mono text-[9px] text-[#387085]/70">({formatTimeUTC(event.blockTime)})</div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: Status chip + Vault + amount */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style.pillClass}`}>
              {style.status}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Vault</span>
              <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              <Link href={`/vaults/${event.vaultId}`} className="font-mono text-xs text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
                {truncateAddress(event.vaultId, 6, 4)}
              </Link>
            </span>
          </div>
        </div>

        {/* Row 2: Provider | Depositor */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Provider</span>
            <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            <span className="font-mono text-xs text-[#14140f]/70">{event.providerName}</span>
          </span>
          <span className="text-[#387085]/20">·</span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Depositor</span>
            <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
            <Link href={`/accounts/${event.depositorAddress}`} className="font-mono text-xs text-[#387085]/70 hover:text-[#cd6332] hover:underline">
              {truncateAddress(event.depositorAddress, 6, 4)}
            </Link>
          </span>
        </div>

        {/* Row 3: Txn | Block */}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Tx</span>
            <Link href={`/tx/${event.txHash}`} className="font-mono text-xs text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
              {truncateAddress(event.txHash, 6, 4)}
            </Link>
            <CopyIcon text={event.txHash} />
          </span>
          <span className="text-xs text-[#387085]/20">·</span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Block</span>
            <span className="font-mono text-xs text-[#387085]/80">
              #{event.blockNumber.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Lending Activity Row (same format as /lending-activity page) ─────────── */

function LendingActivityRow({ activity }: { activity: AaveV4Activity }) {
  const style = LENDING_STYLES[activity.type];
  const formattedAmount = formatTokenAmount(activity.tokenAmount);
  const hasVault = activity.type === 'ADD_COLLATERAL' || activity.type === 'REMOVE_COLLATERAL';
  return (
    <div className="flex items-start border-b border-[#387085]/8 py-3">
      {/* Time */}
      <div className="w-28 shrink-0 pt-0.5">
        <div className="text-xs font-medium text-[#387085]/80">{formatRelativeTime(activity.blockTime)}</div>
        <div className="font-mono text-[9px] text-[#387085]/70">({formatTimeUTC(activity.blockTime)})</div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: Action label + vault info + amount */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold ${style.color}`}>
              {style.label}
            </span>
            {hasVault && activity.vaultId && (
              <span className="inline-flex items-center gap-1">
                <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Vault</span>
                <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <Link href={`/vaults/${activity.vaultId}`} className="font-mono text-xs text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
                  {truncateAddress(activity.vaultId, 6, 4)}
                </Link>
                <CopyIcon text={activity.vaultId} />
              </span>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className={`font-mono text-sm font-semibold ${style.amountColor}`}>
              {style.amountPrefix}{formattedAmount}
            </div>
            <div className="text-xs text-[#387085]/80">{formatTokenUsd(activity.tokenAmount)}</div>
          </div>
        </div>

        {/* Row 2: Depositor */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Depositor</span>
            <svg className="h-3 w-3 text-[#387085]/70" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
            <Link href={`/accounts/${activity.depositorAddress}`} className="font-mono text-xs text-[#387085]/70 hover:text-[#cd6332] hover:underline">
              {truncateAddress(activity.depositorAddress, 6, 4)}
            </Link>
          </span>
        </div>

        {/* Row 3: Tx + Block */}
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Tx</span>
            <Link href={`/tx/${activity.txHash}`} className="font-mono text-xs text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
              {truncateAddress(activity.txHash, 6, 4)}
            </Link>
            <CopyIcon text={activity.txHash} />
          </span>
          <span className="text-xs text-[#387085]/20">·</span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/80">Block</span>
            <span className="font-mono text-xs text-[#387085]/80">
              #{activity.blockNumber.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export default function HomeActivitySections() {
  const recentVaultHistory = MOCK_VAULT_ACTIVITIES.slice(0, 10);
  const recentLendingActivity = MOCK_GLOBAL_LENDING_ACTIVITIES.slice(0, 10);

  return (
    <div className="grid grid-cols-2 items-stretch gap-5">
      {/* ── Vault Activity ──────────────────────────────────────────── */}
      <div className="flex flex-col border border-[#387085]/10 bg-white">
        <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-[#14140f]">Vault Activity</h2>
          <Link href="/vaults?tab=history" className="text-xs font-medium text-[#cd6332] hover:underline">
            View all Vault Activity ›
          </Link>
        </div>
        <div className="flex-1 space-y-2 overflow-auto p-4">
          {recentVaultHistory.map((event) => (
            <VaultHistoryRow key={`${event.txHash}-${event.logIndex}`} event={event} />
          ))}
        </div>
        <div className="border-t border-[#387085]/10 px-5 py-3">
          <Link
            href="/vaults?tab=history"
            className="flex w-full items-center justify-center gap-1 rounded-sm border border-[#387085]/15 py-2 text-xs font-medium text-[#387085]/80 transition-colors hover:border-[#cd6332]/30 hover:text-[#cd6332]"
          >
            View all Vault Activity
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Lending Activity ───────────────────────────────────────── */}
      <div className="flex flex-col border border-[#387085]/10 bg-white">
        <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-[#14140f]">Lending Activity</h2>
          <Link href="/lending-activity" className="text-xs font-medium text-[#cd6332] hover:underline">
            View all Lending Activity ›
          </Link>
        </div>
        <div className="flex-1 overflow-auto px-5 py-2">
          {recentLendingActivity.map((activity) => (
            <LendingActivityRow key={`${activity.txHash}-${activity.logIndex}`} activity={activity} />
          ))}
        </div>
        <div className="border-t border-[#387085]/10 px-5 py-3">
          <Link
            href="/lending-activity"
            className="flex w-full items-center justify-center gap-1 rounded-sm border border-[#387085]/15 py-2 text-xs font-medium text-[#387085]/80 transition-colors hover:border-[#cd6332]/30 hover:text-[#cd6332]"
          >
            View all Lending Activity
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
