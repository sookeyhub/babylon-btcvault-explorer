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

function truncateHash(hash: string, start = 6, end = 4): string {
  if (!hash) return '';
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

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

// ── Status-milestone timeline ────────────────────────────────────────────────

interface MilestoneEvent {
  key: string;
  status: VaultStatus;
  label: string;
  description: string;
  isCurrent: boolean;
  timestamp: string | null;
  blockNumber: number | null;
  txHash: string | null;
  depositor?: string;
}

const MILESTONE_DESCRIPTIONS: Record<string, string> = {
  Pending:               'Peg-in submitted. Collecting signatures from all required parties.',
  'Signature Collected': 'Signatures collected, awaiting acknowledgements (ACK).',
  Verified:              'All required signatures collected; awaiting activation by depositor.',
  Available:             'Activated — Locked and usable as collateral.',
  Redeemed:              'BTC ready to claim.',
  Expired:               'Vault expired before activation was completed.',
  Liquidated:            'Vault was undercollateralized and liquidated.',
};

// Status icon colors matching the page-level StatusIcon
const STATUS_ICON_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  Pending:               { bg: 'bg-amber-100',   color: 'text-amber-600',   icon: 'clock' },
  'Signature Collected': { bg: 'bg-yellow-100',  color: 'text-yellow-600',  icon: 'pencil' },
  Verified:              { bg: 'bg-green-100',   color: 'text-green-600',   icon: 'check' },
  Available:             { bg: 'bg-emerald-100', color: 'text-emerald-600', icon: 'check' },
  Redeemed:              { bg: 'bg-blue-100',    color: 'text-blue-600',    icon: 'check' },
  Expired:               { bg: 'bg-zinc-100',    color: 'text-zinc-500',    icon: 'x' },
  Liquidated:            { bg: 'bg-red-100',     color: 'text-red-600',     icon: 'alert' },
};

function MilestoneIcon({ status, isCurrent }: { status: string; isCurrent: boolean }) {
  const s = STATUS_ICON_STYLES[status] ?? STATUS_ICON_STYLES.Pending;
  const size = isCurrent ? 'h-9 w-9' : 'h-8 w-8';
  const iconSize = isCurrent ? 'h-4 w-4' : 'h-3.5 w-3.5';

  const iconEl = (() => {
    switch (s.icon) {
      case 'check':
        return (
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
          </svg>
        );
      case 'pencil':
        return (
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
          </svg>
        );
      case 'x':
        return (
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        );
      case 'alert':
        return (
          <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        );
      default:
        return null;
    }
  })();

  return (
    <div className={`flex ${size} shrink-0 items-center justify-center rounded-full ${s.bg} ${s.color}`}>
      {iconEl}
    </div>
  );
}

function buildMilestones(vault: VaultData, lifecycle: VaultLifecycleEvent[]): MilestoneEvent[] {
  const eventMap = new Map(lifecycle.map((e) => [e.event_type, e]));
  const completedTypes = new Set(lifecycle.map((e) => e.event_type));

  const milestones: MilestoneEvent[] = [];

  // 1. Pending — triggered by SUBMITTED
  if (completedTypes.has('SUBMITTED')) {
    const e = eventMap.get('SUBMITTED')!;
    milestones.push({
      key: 'Pending',
      status: 'Pending',
      label: 'Pending',
      description: MILESTONE_DESCRIPTIONS.Pending,
      isCurrent: false,
      timestamp: e.timestamp,
      blockNumber: e.block_number,
      txHash: e.tx_hash,
      depositor: e.depositor,
    });
  }

  // 2. Signature Collected — triggered by SIGNATURES_POSTED
  if (completedTypes.has('SIGNATURES_POSTED')) {
    const e = eventMap.get('SIGNATURES_POSTED')!;
    milestones.push({
      key: 'Signature Collected',
      status: 'Signature Collected',
      label: 'Signatures Collected',
      description: MILESTONE_DESCRIPTIONS['Signature Collected'],
      isCurrent: false,
      timestamp: e.timestamp,
      blockNumber: e.block_number,
      txHash: e.tx_hash,
    });
  }

  // 3. Verified — triggered by REQUEST_VERIFIED
  if (completedTypes.has('REQUEST_VERIFIED')) {
    const e = eventMap.get('REQUEST_VERIFIED')!;
    milestones.push({
      key: 'Verified',
      status: 'Verified',
      label: 'Verified',
      description: MILESTONE_DESCRIPTIONS.Verified,
      isCurrent: false,
      timestamp: e.timestamp,
      blockNumber: e.block_number,
      txHash: e.tx_hash,
    });
  }

  // 4. Available — triggered by ACTIVATED
  if (completedTypes.has('ACTIVATED')) {
    const e = eventMap.get('ACTIVATED')!;
    milestones.push({
      key: 'Available',
      status: 'Available',
      label: 'Available',
      description: MILESTONE_DESCRIPTIONS.Available,
      isCurrent: false,
      timestamp: e.timestamp,
      blockNumber: e.block_number,
      txHash: e.tx_hash,
    });
  }

  // 5. Terminal status (Redeemed / Expired / Liquidated)
  const terminalType: VaultEventType | null = completedTypes.has('EXPIRED')
    ? 'EXPIRED'
    : completedTypes.has('LIQUIDATED')
      ? 'LIQUIDATED'
      : completedTypes.has('CLAIMABLE_BY')
        ? 'CLAIMABLE_BY'
        : null;

  if (terminalType) {
    const e = eventMap.get(terminalType);
    const isRedeemed = vault.status === 'Redeemed';
    const statusKey = isRedeemed ? 'Redeemed' : terminalType === 'EXPIRED' ? 'Expired' : 'Liquidated';
    milestones.push({
      key: statusKey,
      status: statusKey as VaultStatus,
      label: statusKey,
      description: MILESTONE_DESCRIPTIONS[statusKey] ?? '',
      isCurrent: false,
      timestamp: e?.timestamp ?? vault.closedAt ?? null,
      blockNumber: e?.block_number ?? null,
      txHash: e?.tx_hash ?? null,
    });
  }

  // Mark current (last milestone = current status)
  if (milestones.length > 0) {
    milestones[milestones.length - 1].isCurrent = true;
  }

  // Reverse so newest is on top
  milestones.reverse();

  return milestones;
}

function MilestoneRow({ event, isLast }: { event: MilestoneEvent; isLast: boolean }) {
  return (
    <div className="relative flex gap-4 pb-7 last:pb-0">
      {/* Left: icon + connector */}
      <div className="flex w-9 flex-shrink-0 flex-col items-center">
        <MilestoneIcon status={event.status} isCurrent={event.isCurrent} />
        {!isLast && <div className="mt-1 w-px flex-1 bg-[#387085]/15" />}
      </div>

      {/* Right: content */}
      <div className="min-w-0 flex-1 pb-1">
        {/* Row 1: label + Current badge + right-aligned timestamp */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#14140f]">{event.label}</span>
            {event.isCurrent && (
              <span className="rounded-full bg-[#cd6332] px-2 py-0.5 text-[10px] font-medium text-white">
                Current
              </span>
            )}
          </div>
          {event.timestamp && (
            <span className="shrink-0 whitespace-nowrap text-[11px] text-[#387085]/50">
              {formatRelativeTime(event.timestamp)} ({formatDateTime(event.timestamp)})
            </span>
          )}
        </div>

        {/* Row 2: description */}
        <p className="mt-0.5 text-[11px] leading-relaxed text-[#387085]/60">
          {event.description}
        </p>

        {/* Row 3: BLOCK + TXN + DEPOSITOR inline */}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {event.blockNumber !== null && (
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#387085]/35">Block</span>
              <span className="font-mono text-[11px] text-[#387085]/50">#{event.blockNumber.toLocaleString()}</span>
            </span>
          )}
          {event.txHash && (
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#387085]/35">TXN</span>
              <Link
                href={`/tx/${event.txHash}`}
                className="font-mono text-[11px] text-[#cd6332] hover:underline"
              >
                {truncateTx(event.txHash)}
              </Link>
              <CopyButton text={event.txHash} />
            </span>
          )}
          {event.depositor && (
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#387085]/35">Depositor</span>
              <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-3.02a4.5 4.5 0 0 0-1.242-7.244l4.5-4.5a4.5 4.5 0 1 1 6.364 6.364l-1.757 1.757" />
              </svg>
              <Link
                href={`/accounts/${event.depositor}`}
                className="font-mono text-[11px] text-[#cd6332] hover:underline"
              >
                {truncateTx(event.depositor)}
              </Link>
              <CopyButton text={event.depositor} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Main Component ───────────────────────────────────────────────────────────

type TabKey = 'overview' | 'transaction';

export default function VaultDetailTabs({ vault, lifecycle }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const milestones = buildMilestones(vault, lifecycle);

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
            {milestones.length}
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
        <div className="border border-[#387085]/10 bg-white px-5 py-5">
          {milestones.map((event, idx) => (
            <MilestoneRow
              key={event.key}
              event={event}
              isLast={idx === milestones.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
