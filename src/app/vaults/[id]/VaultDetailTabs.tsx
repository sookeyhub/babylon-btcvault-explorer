'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { VaultLifecycleEvent, VaultEventType, VaultStatus } from '@/lib/types';
import CopyButton from '@/components/CopyButton';
import { formatRelativeTime, formatDateTime } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

interface VaultData {
  id: string;
  status: VaultStatus;
  btcAddress: string;
  depositorAddress: string;
  vaultSize: number;
  dappName: string;
  providerName: string;
  providerAddress: string;
  createdAt: string;
  closedAt: string | null;
  btcPegInTxHash: string;
  hashlock: string;
  blockNumber: number;
  createdTxHash: string;
}

interface Props {
  vault: VaultData;
  lifecycle: VaultLifecycleEvent[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncateTx(hash: string): string {
  if (!hash) return '';
  if (hash.length <= 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

// ── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-36 shrink-0 text-xs text-[rgba(56,112,133,0.55)]">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1 text-sm text-[#14140f]">
        {children}
      </div>
    </div>
  );
}

// ── Dual-chain timeline ─────────────────────────────────────────────────────

// EVM event → display status mapping
const EVM_LABEL: Record<string, { status: VaultStatus; label: string; desc: string; role?: string }> = {
  SUBMITTED:         { status: 'Pending',              label: 'Pending',                desc: 'Peg-in submitted. Collecting signatures from all required parties.', role: 'Depositor' },
  SIGNATURES_POSTED: { status: 'Signature Collected',  label: 'Signatures Collected',   desc: 'Signatures collected, awaiting acknowledgement (ACK).' },
  ACK_SUBMITTED:     { status: 'Signature Collected',  label: 'Signatures Collected',   desc: 'Acknowledgement submitted by acker.' },
  REQUEST_VERIFIED:  { status: 'Verified',             label: 'Verified',               desc: 'All required signatures collected; awaiting activation by depositor.' },
  ACTIVATED:         { status: 'Available',            label: 'Available',              desc: 'Activated — Locked and usable as collateral.' },
  CLAIMABLE_BY:      { status: 'Redeemed',             label: 'Redeemed',               desc: 'BTC ready to claim.' },
  EXPIRED:           { status: 'Expired',              label: 'Expired',                desc: 'Vault expired before activation completed.' },
  LIQUIDATED:        { status: 'Liquidated',           label: 'Liquidated',             desc: 'Undercollateralized — vault liquidated.' },
};

// Status icon styles with icon type
const STATUS_ICON_STYLES: Record<string, { bg: string; color: string; icon: 'clock' | 'pencil' | 'check' | 'x' | 'alert' }> = {
  Pending:               { bg: 'bg-amber-100',   color: 'text-amber-600',   icon: 'clock' },
  'Signature Collected': { bg: 'bg-yellow-100',  color: 'text-yellow-600',  icon: 'pencil' },
  Verified:              { bg: 'bg-green-100',   color: 'text-green-600',   icon: 'check' },
  Available:             { bg: 'bg-emerald-100', color: 'text-emerald-600', icon: 'check' },
  Redeemed:              { bg: 'bg-blue-100',    color: 'text-blue-600',    icon: 'check' },
  Expired:               { bg: 'bg-zinc-100',    color: 'text-zinc-500',    icon: 'x' },
  Liquidated:            { bg: 'bg-red-100',     color: 'text-red-600',     icon: 'alert' },
};

// Milestone icon SVG component
function MilestoneIcon({ icon, bg, color, isCurrent }: { icon: string; bg: string; color: string; isCurrent?: boolean }) {
  const svgMap: Record<string, React.ReactNode> = {
    clock: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    pencil: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
      </svg>
    ),
    check: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
    ),
    x: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    ),
    alert: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
  };

  return (
    <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${bg} ${color} ${
      isCurrent ? 'ring-2 ring-[#cd6332] ring-offset-1' : ''
    }`}>
      {svgMap[icon] ?? svgMap.clock}
    </span>
  );
}

function formatDelta(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

interface TimelineRow {
  evmEvent: VaultLifecycleEvent;
  evmMeta: { status: VaultStatus; label: string; desc: string; role?: string };
  isCurrent: boolean;
  delta: number | null; // ms from previous event
}

function buildTimeline(vault: VaultData, lifecycle: VaultLifecycleEvent[]): TimelineRow[] {
  // Sort chronologically first to determine "current" (latest) and deltas
  const chrono = [...lifecycle].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const rows = chrono.map((e, i) => {
    const meta = EVM_LABEL[e.event_type] ?? { status: 'Pending' as VaultStatus, label: e.event_type, desc: '' };
    const nextTs = i < chrono.length - 1 ? new Date(chrono[i + 1].timestamp).getTime() : null;
    const curTs = new Date(e.timestamp).getTime();
    return {
      evmEvent: e,
      evmMeta: meta,
      isCurrent: i === chrono.length - 1,
      // delta = time until the next event (shown between rows in reverse order)
      delta: nextTs !== null ? nextTs - curTs : null,
    };
  });

  // Reverse: most recent first
  return rows.reverse();
}

/* ── Desktop dual-chain row ──────────────────────────────────────────────── */

function DualChainRow({ row, isLast }: { row: TimelineRow; isLast: boolean }) {
  const { evmEvent, evmMeta, isCurrent } = row;
  const btc = evmEvent.btc;
  const iconStyle = STATUS_ICON_STYLES[evmMeta.status] ?? STATUS_ICON_STYLES.Pending;

  return (
    <div className="relative grid grid-cols-[1fr_40px_1fr] gap-0">
      {/* ── LEFT: BTC L1 (mirrored layout) ────────────────────────── */}
      <div className="pr-4 py-3">
        {btc ? (
          <div className="text-right">
            <div className="flex items-start justify-between gap-2">
              <span className="shrink-0 whitespace-nowrap text-[10px] tabular-nums text-[#387085]/40 text-left">
                {formatRelativeTime(evmEvent.timestamp)} ({formatDateTime(evmEvent.timestamp)})
              </span>
              <span className="text-[12px] font-semibold text-[#14140f]">{btc.label}</span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#387085]/50">{btc.description}</p>
            <div className="mt-1.5 flex flex-wrap items-center justify-end gap-x-2.5 gap-y-0.5">
              <span className="inline-flex items-center gap-1">
                <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">TXN</span>
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[8px] font-bold text-orange-600">₿</span>
                <a
                  href={`https://mempool.space/signet/tx/${btc.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-orange-600/70 hover:text-orange-600 hover:underline"
                >
                  {truncateTx(btc.tx_hash)}
                </a>
                <CopyButton text={btc.tx_hash} />
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center py-2">
            <span className="text-[10px] italic text-[#387085]/20">—</span>
          </div>
        )}
      </div>

      {/* ── CENTER: Spine with milestone icon ────────────────────── */}
      <div className="relative flex flex-col items-center">
        <div className="w-px flex-1 bg-[#387085]/15" />
        <div className="relative z-10">
          <MilestoneIcon icon={iconStyle.icon} bg={iconStyle.bg} color={iconStyle.color} isCurrent={isCurrent} />
        </div>
        {!isLast ? <div className="w-px flex-1 bg-[#387085]/15" /> : <div className="w-px flex-1" />}
      </div>

      {/* ── RIGHT: EVM (mirrored from left) ──────────────────────── */}
      <div className="pl-4 py-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold text-[#14140f]">{evmMeta.label}</span>
              {isCurrent && (
                <span className="rounded-full bg-[#cd6332] px-1.5 py-0.5 text-[9px] font-medium text-white">Current</span>
              )}
            </div>
            <span className="shrink-0 whitespace-nowrap text-[10px] tabular-nums text-[#387085]/40">
              {formatRelativeTime(evmEvent.timestamp)} ({formatDateTime(evmEvent.timestamp)})
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-[#387085]/55">{evmMeta.desc}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span className="inline-flex items-center gap-1">
              <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Block</span>
              <span className="font-mono text-[10px] text-[#387085]/40">#{evmEvent.block_number.toLocaleString()}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">TXN</span>
              <Link
                href={`/tx/${evmEvent.tx_hash}`}
                className="font-mono text-[10px] text-[#cd6332] hover:underline"
              >
                {truncateTx(evmEvent.tx_hash)}
              </Link>
              <CopyButton text={evmEvent.tx_hash} />
            </span>
            {evmMeta.role && (
              <span className="inline-flex items-center gap-1">
                <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Depositor</span>
                <Link href={`/accounts/${evmEvent.depositor}`} className="font-mono text-[10px] text-[#387085]/40 hover:text-[#387085] hover:underline">{truncateTx(evmEvent.depositor)}</Link>
                <CopyButton text={evmEvent.depositor} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile single-column fallback ───────────────────────────────────────── */

function MobileTimelineRow({ row, isLast }: { row: TimelineRow; isLast: boolean }) {
  const { evmEvent, evmMeta, isCurrent, delta } = row;
  const btc = evmEvent.btc;
  const iconStyle = STATUS_ICON_STYLES[evmMeta.status] ?? STATUS_ICON_STYLES.Pending;

  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      {/* Spine — milestone icon */}
      <div className="flex flex-col items-center">
        <MilestoneIcon icon={iconStyle.icon} bg={iconStyle.bg} color={iconStyle.color} isCurrent={isCurrent} />
        {!isLast && <div className="mt-1 w-px flex-1 bg-[#387085]/15" />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pb-1">
        {delta !== null && (
          <span className="text-[8px] tabular-nums text-[#387085]/30">+{formatDelta(delta)}</span>
        )}
        {/* EVM */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#14140f]">{evmMeta.label}</span>
          {isCurrent && (
            <span className="rounded-full bg-[#cd6332] px-1.5 py-0.5 text-[9px] font-medium text-white">Current</span>
          )}
          {evmMeta.role && (
            <span className="text-[9px] text-[#387085]/40">
              by <Link href={`/accounts/${evmEvent.depositor}`} className="font-mono hover:text-[#387085] hover:underline">{truncateTx(evmEvent.depositor)}</Link>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[9px] text-[#387085]/30">
          {formatRelativeTime(evmEvent.timestamp)} ({formatDateTime(evmEvent.timestamp)})
        </p>
        <p className="text-[10px] text-[#387085]/55">{evmMeta.desc}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Block</span>
            <span className="font-mono text-[#387085]/40">#{evmEvent.block_number.toLocaleString()}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">TXN</span>
            <Link href={`/tx/${evmEvent.tx_hash}`} className="font-mono text-[#cd6332] hover:underline">
              {truncateTx(evmEvent.tx_hash)}
            </Link>
          </span>
          {evmMeta.role && (
            <span className="inline-flex items-center gap-1">
              <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/35">Depositor</span>
              <Link href={`/accounts/${evmEvent.depositor}`} className="font-mono text-[#387085]/40 hover:text-[#387085] hover:underline">{truncateTx(evmEvent.depositor)}</Link>
              <CopyButton text={evmEvent.depositor} />
            </span>
          )}
        </div>

        {/* BTC (inline card) */}
        {btc && (
          <div className="mt-2 rounded border border-orange-200/50 bg-orange-50/30 px-2.5 py-1.5">
            <span className="text-[10px] font-semibold text-[#14140f]">{btc.label}</span>
            <p className="mt-0.5 text-[9px] text-[#387085]/30">
              {formatRelativeTime(evmEvent.timestamp)} ({formatDateTime(evmEvent.timestamp)})
            </p>
            <p className="mt-0.5 text-[9px] text-[#387085]/50">{btc.description}</p>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-[8px] font-medium uppercase tracking-wide text-[#387085]/35">TXN</span>
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[8px] font-bold text-orange-600">₿</span>
              <a
                href={`https://mempool.space/signet/tx/${btc.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[9px] text-orange-600/70 hover:underline"
              >
                {truncateTx(btc.tx_hash)}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Main Component ───────────────────────────────────────────────────────────

type TabKey = 'overview' | 'transaction';

export default function VaultDetailTabs({ vault, lifecycle }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const timeline = buildTimeline(vault, lifecycle);

  return (
    <div className="space-y-5">
      {/* ── Tab headers ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#387085]/15">
        <button
          onClick={() => setActiveTab('overview')}
          className={`relative px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-[#cd6332]'
              : 'text-[#387085]/60 hover:text-[#14140f]'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <span className="absolute bottom-[-1px] left-5 right-5 h-[2px] bg-[#cd6332]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('transaction')}
          className={`relative px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'transaction'
              ? 'text-[#cd6332]'
              : 'text-[#387085]/60 hover:text-[#14140f]'
          }`}
        >
          Vault Activity
          <span className={`ml-1.5 text-[10px] ${activeTab === 'transaction' ? 'text-[#cd6332]/70' : 'text-[#387085]/40'}`}>
            {timeline.length}
          </span>
          {activeTab === 'transaction' && (
            <span className="absolute bottom-[-1px] left-5 right-5 h-[2px] bg-[#cd6332]" />
          )}
        </button>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' ? (
        <div className="space-y-5">
          <div className="border border-[#387085]/10 bg-white px-5 py-2">
            <DetailRow label="Provider">
              <svg className="h-3.5 w-3.5 shrink-0 text-[#387085]/40" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
              <Link
                href={`/accounts/${vault.providerAddress}`}
                className="break-all font-mono text-xs text-[#387085] hover:underline"
              >
                {vault.providerAddress}
              </Link>
              <CopyButton text={vault.providerAddress} />
            </DetailRow>

            {vault.btcAddress && (
              <DetailRow label="">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[9px] font-bold text-orange-600">₿</span>
                <span className="break-all font-mono text-xs text-[#387085]">{vault.btcAddress}</span>
                <CopyButton text={vault.btcAddress} />
              </DetailRow>
            )}

            <DetailRow label="Depositor">
              <svg className="h-3.5 w-3.5 shrink-0 text-[#387085]/40" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
              </svg>
              <Link
                href={`/accounts/${vault.depositorAddress}`}
                className="break-all font-mono text-xs text-[#387085] hover:underline"
              >
                {vault.depositorAddress}
              </Link>
              <CopyButton text={vault.depositorAddress} />
            </DetailRow>

            {vault.btcAddress && (
              <DetailRow label="">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[9px] font-bold text-orange-600">₿</span>
                <span className="break-all font-mono text-xs text-[#387085]">{vault.btcAddress}</span>
                <CopyButton text={vault.btcAddress} />
              </DetailRow>
            )}

            <div className="my-1 border-t border-[#387085]/10" />

            <DetailRow label="Requested">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">{formatRelativeTime(vault.createdAt)}</span>
                <span className="text-xs text-[rgba(56,112,133,0.55)]">{formatDateTime(vault.createdAt)}</span>
              </div>
            </DetailRow>

            <DetailRow label="Closed">
              {vault.closedAt ? (
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">{formatRelativeTime(vault.closedAt)}</span>
                  <span className="text-xs text-[rgba(56,112,133,0.55)]">{formatDateTime(vault.closedAt)}</span>
                </div>
              ) : (
                <span className="text-[rgba(20,20,15,0.35)]">—</span>
              )}
            </DetailRow>

            <div className="my-1 border-t border-[#387085]/10" />

            <DetailRow label="Block">
              <span>{vault.blockNumber.toLocaleString()}</span>
            </DetailRow>
          </div>

          {/* Raw Transactions — collapsible */}
          <details className="group border border-[#387085]/10 bg-white" open>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-sm font-medium text-[#387085]/60 transition-colors hover:text-[#14140f]">
              <svg
                className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <span>Raw Transactions</span>
            </summary>
            <div className="border-t border-[#387085]/10 px-5 py-2">
              <DetailRow label="BTC Pre Peg-in Txn">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[9px] font-bold text-orange-600">₿</span>
                <span className="break-all font-mono text-xs text-[#387085]">{vault.createdTxHash}</span>
                <CopyButton text={vault.createdTxHash} />
              </DetailRow>

              <DetailRow label="Requested Txn">
                <Link
                  href={`/tx/${vault.createdTxHash}`}
                  className="break-all font-mono text-xs text-[#387085] hover:underline"
                >
                  {vault.createdTxHash}
                </Link>
                <CopyButton text={vault.createdTxHash} />
              </DetailRow>

              <DetailRow label="BTC Peg-in Txn">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[9px] font-bold text-orange-600">₿</span>
                <span className="break-all font-mono text-xs text-[#387085]">{vault.btcPegInTxHash}</span>
                <CopyButton text={vault.btcPegInTxHash} />
              </DetailRow>

              <DetailRow label="HTLC Hashlock">
                <svg className="h-3.5 w-3.5 shrink-0 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <span className="break-all font-mono text-xs text-[#387085]">{vault.hashlock}</span>
                <CopyButton text={vault.hashlock} />
              </DetailRow>

              <DetailRow label="HTLC Output Index">
                <svg className="h-3.5 w-3.5 shrink-0 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <span>0</span>
              </DetailRow>

              <DetailRow label="Closed Txn">
                {vault.closedAt ? (
                  <>
                    <span className="break-all font-mono text-xs text-[#387085]">{vault.createdTxHash}</span>
                    <CopyButton text={vault.createdTxHash} />
                  </>
                ) : (
                  <span className="text-[rgba(20,20,15,0.35)]">—</span>
                )}
              </DetailRow>
            </div>
          </details>
        </div>
      ) : (
        <div className="border border-[#387085]/10 bg-white">
          {/* Desktop: dual-chain timeline */}
          <div className="hidden px-2 py-4 sm:block">
            {timeline.map((row, idx) => (
              <DualChainRow
                key={row.evmEvent.event_type + idx}
                row={row}
                isLast={idx === timeline.length - 1}
              />
            ))}
          </div>

          {/* Mobile: single-column fallback */}
          <div className="block px-4 py-4 sm:hidden">
            {timeline.map((row, idx) => (
              <MobileTimelineRow
                key={row.evmEvent.event_type + idx}
                row={row}
                isLast={idx === timeline.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
