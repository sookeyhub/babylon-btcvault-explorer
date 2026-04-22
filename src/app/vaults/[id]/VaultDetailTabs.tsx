'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { VaultLifecycleEvent, VaultEventType, VaultStatus } from '@/lib/types';
import CopyButton from '@/components/CopyButton';

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

function formatUtcDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +UTC`
  );
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds} secs ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

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
    <div className="flex flex-col gap-1 border-b border-[#387085]/10 py-3 sm:flex-row sm:items-start sm:gap-4 last:border-b-0">
      <span className="w-36 shrink-0 text-xs text-[rgba(56,112,133,0.55)]">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1 text-sm text-[#14140f]">
        {children}
      </div>
    </div>
  );
}

// ── Unified Timeline ─────────────────────────────────────────────────────────

type TimelineLayer = 'Bitcoin' | 'Ethereum';

interface TimelineEvent {
  key: string;
  label: string;
  description: string;
  layer: TimelineLayer;
  isCompleted: boolean;
  isCurrent: boolean;
  timestamp: string | null;
  blockNumber: number | null;
  txHash: string | null;
  depositor?: string;
  vaultProvider?: string;
  acker?: string;
  secret?: string;
  claimerPk?: string;
  expiredReason?: number;
  /** Set when this event causes a status transition */
  statusTransition?: { from: VaultStatus | null; to: VaultStatus };
}

// Cosmos event order
const COSMOS_ORDER: VaultEventType[] = [
  'SUBMITTED',
  'SIGNATURES_POSTED',
  'ACK_SUBMITTED',
  'REQUEST_VERIFIED',
  'ACTIVATED',
];

const COSMOS_LABELS: Record<VaultEventType, string> = {
  SUBMITTED: 'Submitted',
  SIGNATURES_POSTED: 'Signatures Posted',
  ACK_SUBMITTED: 'Ack Submitted',
  REQUEST_VERIFIED: 'Request Verified',
  ACTIVATED: 'Activated',
  CLAIMABLE_BY: 'Claimable By',
  EXPIRED: 'Expired',
  LIQUIDATED: 'Liquidated',
};

const EVENT_DESCRIPTIONS: Record<string, string> = {
  'btc-sent':        'Depositor sent BTC to the vault address',
  'btc-confirmed':   'BTC transaction confirmed with 6 blocks',
  SUBMITTED:         'Vault creation request submitted to the protocol',
  SIGNATURES_POSTED: 'Multi-party signatures collected and posted on-chain',
  ACK_SUBMITTED:     'Acknowledgment submitted by the acker to confirm receipt',
  REQUEST_VERIFIED:  'ZKP proof verified. Vault is ready to activate',
  ACTIVATED:         'Vault is now active. BTC is locked and usable as collateral',
  CLAIMABLE_BY:      'Vault is claimable. A claimer has been designated',
  LIQUIDATED:        'Vault liquidated due to undercollateralization',
};

function getExpiredDescription(reason?: number): string {
  if (reason === 0) return 'Vault expired: ACK not submitted within the timeout period';
  if (reason === 1) return 'Vault expired: Activation not completed within the timeout period';
  return 'Vault expired';
}

function getRedeemedDescription(): string {
  return 'Vault redeemed. BTC has been returned to the depositor';
}

function applyStatusTransitions(timeline: TimelineEvent[], vault: VaultData): void {
  // Find specific events and attach transitions
  const submitted = timeline.find((e) => e.key === 'SUBMITTED');
  if (submitted?.isCompleted) {
    submitted.statusTransition = { from: null, to: 'Pending' };
  }

  const activated = timeline.find((e) => e.key === 'ACTIVATED');
  if (activated?.isCompleted) {
    activated.statusTransition = { from: 'Pending', to: 'Active' };
  }

  const terminal = timeline.find((e) => e.key.startsWith('terminal-'));
  if (terminal?.isCompleted) {
    if (vault.status === 'Redeemed') {
      terminal.statusTransition = { from: 'Active', to: 'Redeemed' };
    } else if (vault.status === 'Expired') {
      // Expired can come from Pending (most common in mock data)
      terminal.statusTransition = { from: 'Pending', to: 'Expired' };
    } else if (vault.status === 'Liquidated') {
      terminal.statusTransition = { from: 'Active', to: 'Liquidated' };
    }
  }
}

function buildTimeline(vault: VaultData, lifecycle: VaultLifecycleEvent[]): TimelineEvent[] {
  const eventMap = new Map(lifecycle.map((e) => [e.event_type, e]));
  const completedTypes = new Set(lifecycle.map((e) => e.event_type));

  // Build Bitcoin layer events — always completed if btcPegInTxHash exists
  const btcExists = !!vault.btcPegInTxHash;
  const btcSent: TimelineEvent = {
    key: 'btc-sent',
    label: 'BTC Sent',
    description: EVENT_DESCRIPTIONS['btc-sent'],
    layer: 'Bitcoin',
    isCompleted: btcExists,
    isCurrent: false,
    timestamp: btcExists ? vault.createdAt : null,
    blockNumber: null,
    txHash: btcExists ? vault.btcPegInTxHash : null,
  };

  // BTC Confirmed: completed if the Cosmos side has processed (i.e. SUBMITTED or later)
  const btcConfirmed: TimelineEvent = {
    key: 'btc-confirmed',
    label: 'BTC Confirmed',
    description: EVENT_DESCRIPTIONS['btc-confirmed'],
    layer: 'Bitcoin',
    isCompleted: btcExists && completedTypes.has('SUBMITTED'),
    isCurrent: false,
    timestamp: btcExists && completedTypes.has('SUBMITTED') ? vault.createdAt : null,
    blockNumber: null,
    txHash: btcExists && completedTypes.has('SUBMITTED') ? vault.btcPegInTxHash : null,
  };

  // Cosmos events — each surfaces only the fields defined for its status
  const cosmosEvents: TimelineEvent[] = COSMOS_ORDER.map((type) => {
    const e = eventMap.get(type);
    const base: TimelineEvent = {
      key: type,
      label: COSMOS_LABELS[type],
      description: EVENT_DESCRIPTIONS[type] ?? '',
      layer: 'Ethereum',
      isCompleted: !!e,
      isCurrent: false,
      timestamp: e?.timestamp ?? null,
      blockNumber: e?.block_number ?? null,
      txHash: e?.tx_hash ?? null,
    };

    if (!e) return base;

    // Attach only the status-specific extra fields
    switch (type) {
      case 'SUBMITTED':
        base.depositor = e.depositor;
        break;
      case 'SIGNATURES_POSTED':
        base.vaultProvider = e.vault_provider;
        break;
      case 'ACK_SUBMITTED':
        base.acker = e.acker;
        break;
      case 'ACTIVATED':
        base.secret = e.secret;
        break;
      case 'REQUEST_VERIFIED':
      default:
        break;
    }

    return base;
  });

  const timeline: TimelineEvent[] = [btcSent, btcConfirmed, ...cosmosEvents];

  // Terminal event (if present)
  const terminalType: VaultEventType | null = completedTypes.has('EXPIRED')
    ? 'EXPIRED'
    : completedTypes.has('LIQUIDATED')
      ? 'LIQUIDATED'
      : completedTypes.has('CLAIMABLE_BY')
        ? 'CLAIMABLE_BY'
        : null;

  if (terminalType) {
    const e = eventMap.get(terminalType);
    // If the vault is Redeemed, label it as Redeemed rather than Claimable By
    const isRedeemed = vault.status === 'Redeemed';
    const label = isRedeemed ? 'Redeemed' : COSMOS_LABELS[terminalType];

    let description: string;
    if (isRedeemed) {
      description = getRedeemedDescription();
    } else if (terminalType === 'EXPIRED') {
      description = getExpiredDescription(e?.expired_reason);
    } else {
      description = EVENT_DESCRIPTIONS[terminalType] ?? '';
    }

    timeline.push({
      key: `terminal-${terminalType}`,
      label,
      description,
      layer: 'Ethereum',
      isCompleted: true,
      isCurrent: false,
      timestamp: e?.timestamp ?? vault.closedAt ?? null,
      blockNumber: e?.block_number ?? null,
      txHash: e?.tx_hash ?? null,
      // Only attach fields that belong to this terminal state
      claimerPk: terminalType === 'CLAIMABLE_BY' ? e?.claimer_pk : undefined,
      expiredReason: terminalType === 'EXPIRED' ? e?.expired_reason : undefined,
    });
  }

  // Determine current event — the last completed event
  let lastCompletedIdx = -1;
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (timeline[i].isCompleted) {
      lastCompletedIdx = i;
      break;
    }
  }
  if (lastCompletedIdx >= 0) {
    timeline[lastCompletedIdx].isCurrent = true;
  }

  applyStatusTransitions(timeline, vault);

  return timeline;
}

// Pill styles per status
const STATUS_PILL: Record<VaultStatus, string> = {
  Active:     'bg-green-100 text-green-700',
  Pending:    'bg-amber-100 text-amber-700',
  Redeemed:   'bg-blue-100 text-blue-700',
  Expired:    'bg-zinc-200 text-zinc-600',
  Liquidated: 'bg-red-100 text-red-700',
};

function StatusPill({ status }: { status: VaultStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_PILL[status]}`}>
      {status}
    </span>
  );
}

function StatusTransitionBanner({
  from,
  to,
  emphasized,
}: {
  from: VaultStatus | null;
  to: VaultStatus;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`mb-2 flex items-center gap-2 rounded border px-2.5 py-1.5 ${
        emphasized
          ? 'border-[#cd6332]/30 bg-[#cd6332]/5'
          : 'border-[#387085]/15 bg-[#faf9f5]'
      }`}
    >
      <svg className="h-3.5 w-3.5 shrink-0 text-[#cd6332]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#cd6332]">
        Status Change
      </span>
      <div className="flex items-center gap-1.5">
        {from ? (
          <StatusPill status={from} />
        ) : (
          <span className="text-[10px] text-[#387085]/40">—</span>
        )}
        <svg className="h-3 w-3 text-[#387085]/40" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
        </svg>
        <StatusPill status={to} />
      </div>
    </div>
  );
}

// ── Tx confirmation badge (Pending / Confirmed / Submitted) ─────────────────

type TxConfirmation = 'Pending' | 'Confirmed' | 'Submitted';

function TxConfirmationBadge({ kind }: { kind: TxConfirmation }) {
  const styles: Record<TxConfirmation, string> = {
    Pending:   'bg-amber-50 text-amber-600',
    Confirmed: 'bg-green-50 text-green-600',
    Submitted: 'bg-[#387085]/8 text-[#387085]',
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[kind]}`}>
      {kind}
    </span>
  );
}

// ── Secret field with reveal/hide ────────────────────────────────────────────

function SecretField({ secret }: { secret: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <span className="flex w-14 shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-amber-500/70">
        <svg
          className="h-3 w-3 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
          />
        </svg>
        <span>Secret</span>
      </span>
      {visible ? (
        <>
          <span className="font-mono text-[11px] text-amber-600">
            {truncateTx(secret)}
          </span>
          <CopyButton text={secret} />
          <button
            onClick={() => setVisible(false)}
            className="ml-1 text-[10px] text-[#387085]/40 hover:text-[#387085]"
          >
            hide
          </button>
        </>
      ) : (
        <>
          <span className="select-none font-mono text-[11px] tracking-widest text-[#387085]/20">
            ••••••••••••••••
          </span>
          <button
            onClick={() => setVisible(true)}
            className="ml-1 text-[10px] text-[#cd6332] hover:underline"
          >
            reveal
          </button>
        </>
      )}
    </div>
  );
}

function LayerBadge({ layer }: { layer: TimelineLayer }) {
  const styles: Record<TimelineLayer, string> = {
    Bitcoin: 'bg-amber-50 text-amber-700',
    Ethereum: 'bg-[#387085]/10 text-[#387085]',
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${styles[layer]}`}>
      {layer}
    </span>
  );
}

function TimelineRow({
  event,
  nextCompleted,
  isLast,
}: {
  event: TimelineEvent;
  nextCompleted: boolean;
  isLast: boolean;
}) {
  const { isCompleted, isCurrent } = event;

  // Three-state styling: past (completed + not current) / current / future
  const stateClasses = isCurrent
    ? {
        dotWrapper: 'h-9 w-9 bg-[#cd6332] ring-4 ring-[#cd6332]/20',
        dotIcon: 'h-5 w-5 text-white',
        label: 'text-sm font-semibold text-[#14140f]',
        desc: 'text-[11px] text-[#387085]/70',
        timestamp: 'text-[11px] text-[#387085]/60',
        relTime: 'text-[11px] text-[#387085]/50',
        connectorToNext:
          nextCompleted
            ? 'bg-[#cd6332]/30'
            : 'border-l-2 border-dashed border-[#387085]/15',
      }
    : isCompleted
      ? {
          dotWrapper: 'h-8 w-8 bg-[#cd6332]/70',
          dotIcon: 'h-4 w-4 text-white/90',
          label: 'text-sm font-medium text-[#387085]/60',
          desc: 'text-[11px] text-[#387085]/35',
          timestamp: 'text-[11px] text-[#387085]/35',
          relTime: 'text-[11px] text-[#387085]/30',
          connectorToNext:
            nextCompleted
              ? 'bg-[#cd6332]/20'
              : 'border-l-2 border-dashed border-[#387085]/15',
        }
      : {
          dotWrapper: 'h-8 w-8 border-2 border-[#387085]/15 bg-white',
          dotIcon: '',
          label: 'text-sm text-[#387085]/30',
          desc: 'text-[11px] text-[#387085]/20',
          timestamp: 'text-[11px] text-[#387085]/25',
          relTime: 'text-[11px] text-[#387085]/25',
          connectorToNext: 'border-l-2 border-dashed border-[#387085]/10',
        };

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Left: dot + connector */}
      <div className="flex w-9 flex-shrink-0 flex-col items-center">
        {/* Dot */}
        <div
          className={`relative flex shrink-0 items-center justify-center rounded-full ${stateClasses.dotWrapper}`}
        >
          {isCompleted ? (
            <svg className={stateClasses.dotIcon} fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-[#387085]/30" />
          )}
          {isCurrent && (
            <span className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-[#cd6332]/30" />
          )}
        </div>

        {/* Connector line */}
        {!isLast && <div className={`mt-1 w-px flex-1 ${stateClasses.connectorToNext}`} />}
      </div>

      {/* Right: content — wrapped in highlight card when current */}
      <div
        className={`min-w-0 flex-1 ${
          isCurrent
            ? 'rounded border border-[#cd6332]/20 bg-[#faf9f5] px-3 py-2.5'
            : 'pb-1'
        }`}
      >
        {/* Inline status transition row (at top of card) */}
        {event.statusTransition && event.isCompleted && (
          <div className="mb-2 flex items-center gap-1.5 border-b border-[#387085]/10 pb-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#387085]/40">
              Status
            </span>
            {event.statusTransition.from ? (
              <StatusPill status={event.statusTransition.from} />
            ) : (
              <span className="text-[10px] text-[#387085]/30">—</span>
            )}
            <span className="text-[10px] text-[#387085]/30">→</span>
            <StatusPill status={event.statusTransition.to} />
          </div>
        )}

        {/* 1st row: label + Current pill + right-aligned timestamp */}
        <div className="mb-0.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={stateClasses.label}>{event.label}</span>
            {isCurrent && (
              <span className="rounded-full bg-[#cd6332] px-1.5 py-0.5 text-[10px] font-medium text-white">
                Current
              </span>
            )}
          </div>
          {event.timestamp && (
            <span className={`shrink-0 whitespace-nowrap ${stateClasses.timestamp}`}>
              {formatRelativeTime(event.timestamp)} ({formatUtcDate(event.timestamp).replace(' +UTC', ' UTC')})
            </span>
          )}
        </div>

        {/* Description row */}
        {event.description && (
          <p className={`mb-1 leading-relaxed ${stateClasses.desc}`}>
            {event.description}
          </p>
        )}

        {/* Block row */}
        {event.blockNumber !== null && (
          <LabeledRow label="BLOCK" labelColor="text-[#387085]/30">
            <span className="font-mono text-[11px] text-[#387085]/50">
              #{event.blockNumber.toLocaleString()}
            </span>
          </LabeledRow>
        )}

        {/* TX row */}
        {event.txHash && (
          <LabeledRow
            label={event.layer === 'Bitcoin' ? 'BTC TX' : 'TX'}
            labelColor={event.layer === 'Bitcoin' ? 'text-amber-600' : 'text-[#387085]/50'}
          >
            {event.layer === 'Ethereum' ? (
              <Link
                href={`/tx/${event.txHash}`}
                className="font-mono text-[11px] text-[#cd6332] hover:text-[#b8562b]"
              >
                {truncateTx(event.txHash)}
              </Link>
            ) : (
              <span className="font-mono text-[11px] text-[#cd6332]">
                {truncateTx(event.txHash)}
              </span>
            )}
            <TxConfirmationBadge
              kind={
                event.key === 'btc-sent'
                  ? 'Pending'
                  : event.key === 'btc-confirmed'
                    ? 'Confirmed'
                    : 'Submitted'
              }
            />
            <CopyButton text={event.txHash} />
          </LabeledRow>
        )}

        {/* Depositor (SUBMITTED only) */}
        {event.depositor && (
          <LabeledRow label="Depositor" labelColor="text-[#387085]/30">
            <span className="font-mono text-[11px] text-[#387085]">
              {truncateTx(event.depositor)}
            </span>
            <CopyButton text={event.depositor} />
          </LabeledRow>
        )}

        {/* Vault Provider (SIGNATURES_POSTED only) */}
        {event.vaultProvider && (
          <LabeledRow label="Provider" labelColor="text-[#387085]/30">
            <span className="font-mono text-[11px] text-[#387085]">
              {truncateTx(event.vaultProvider)}
            </span>
            <CopyButton text={event.vaultProvider} />
          </LabeledRow>
        )}

        {/* Acker (ACK_SUBMITTED only) */}
        {event.acker && (
          <LabeledRow label="Acker" labelColor="text-[#387085]/30">
            <span className="font-mono text-[11px] text-[#387085]">
              {truncateTx(event.acker)}
            </span>
            <CopyButton text={event.acker} />
          </LabeledRow>
        )}

        {/* Secret (ACTIVATED only) — with reveal */}
        {event.secret && <SecretField secret={event.secret} />}

        {/* Claimer PK (CLAIMABLE_BY only) */}
        {event.claimerPk && (
          <LabeledRow label="Claimer" labelColor="text-[#387085]/30">
            <span className="font-mono text-[11px] text-[#387085]">
              {truncateTx(event.claimerPk)}
            </span>
            <CopyButton text={event.claimerPk} />
          </LabeledRow>
        )}

        {/* Expired reason (EXPIRED only) */}
        {event.expiredReason !== undefined && (
          <LabeledRow label="Reason" labelColor="text-[#387085]/30">
            <span className="text-[11px] font-medium text-red-500">
              {event.expiredReason === 0 ? 'ack_timeout' : 'activation_timeout'}
            </span>
          </LabeledRow>
        )}

        {/* Pending placeholder */}
        {!isCompleted && (
          <p className="mt-0.5 text-[11px] italic text-[#387085]/30">Pending...</p>
        )}
      </div>
    </div>
  );
}

function DataField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <span className="flex w-16 shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-[#387085]/30">
        {icon}
        <span>{label}</span>
      </span>
      {children}
    </div>
  );
}

function LabeledRow({
  label,
  labelColor = 'text-[#387085]/30',
  children,
}: {
  label: string;
  labelColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <span className={`w-14 shrink-0 text-[10px] font-medium uppercase tracking-wide ${labelColor}`}>
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Vault Status Timeline — shows only status transitions ───────────────────

interface StatusTransitionEntry {
  key: string;
  from: VaultStatus | null;
  to: VaultStatus;
  timestamp: string | null;
  blockNumber: number | null;
  txHash: string | null;
  triggeredByLabel: string;
  triggeredByLayer: TimelineLayer;
  description: string;
  isCurrent: boolean;
}

function buildStatusTransitions(timeline: TimelineEvent[], currentStatus: VaultStatus): StatusTransitionEntry[] {
  const transitions: StatusTransitionEntry[] = [];

  for (const event of timeline) {
    if (!event.statusTransition || !event.isCompleted) continue;
    transitions.push({
      key: `st-${event.key}`,
      from: event.statusTransition.from,
      to: event.statusTransition.to,
      timestamp: event.timestamp,
      blockNumber: event.blockNumber,
      txHash: event.txHash,
      triggeredByLabel: event.label,
      triggeredByLayer: event.layer,
      description: event.description,
      isCurrent: event.statusTransition.to === currentStatus,
    });
  }

  return transitions;
}

function StatusTransitionRow({
  entry,
  isLast,
}: {
  entry: StatusTransitionEntry;
  isLast: boolean;
}) {
  const { isCurrent, from, to } = entry;

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Left: dot + connector */}
      <div className="flex w-9 flex-shrink-0 flex-col items-center">
        <div
          className={`relative flex shrink-0 items-center justify-center rounded-full ${
            isCurrent
              ? 'h-9 w-9 bg-[#cd6332] ring-4 ring-[#cd6332]/20'
              : 'h-8 w-8 bg-[#cd6332]/70'
          }`}
        >
          <svg
            className={`${isCurrent ? 'h-5 w-5 text-white' : 'h-4 w-4 text-white/90'}`}
            fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {isCurrent && (
            <span className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-[#cd6332]/30" />
          )}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-[#cd6332]/30" />}
      </div>

      {/* Right: transition details */}
      <div
        className={`min-w-0 flex-1 ${
          isCurrent ? 'rounded border border-[#cd6332]/20 bg-[#faf9f5] px-3 py-2.5' : 'pb-1'
        }`}
      >
        {/* Status transition pills */}
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {from ? <StatusPill status={from} /> : <span className="text-[10px] text-[#387085]/40">—</span>}
            <svg className="h-3 w-3 text-[#387085]/40" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
            <StatusPill status={to} />
            {isCurrent && (
              <span className="ml-1 rounded-full bg-[#cd6332] px-1.5 py-0.5 text-[10px] font-medium text-white">
                Current
              </span>
            )}
          </div>
          {entry.timestamp && (
            <span className="flex-shrink-0 text-[11px] text-[#387085]/50">
              {formatRelativeTime(entry.timestamp)}
            </span>
          )}
        </div>

        {/* Triggered by */}
        <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#387085]/60">
          <span>Triggered by</span>
          <span className="font-medium text-[#14140f]">{entry.triggeredByLabel}</span>
          <LayerBadge layer={entry.triggeredByLayer} />
        </div>

        {entry.description && (
          <p className="mb-1 text-[11px] leading-relaxed text-[#387085]/70">
            {entry.description}
          </p>
        )}

        {entry.timestamp && (
          <p className="mb-1.5 text-[11px] text-[#387085]/50">
            {formatUtcDate(entry.timestamp)}
            {entry.blockNumber !== null && (
              <span className="ml-2 text-[#387085]/30">#{entry.blockNumber.toLocaleString()}</span>
            )}
          </p>
        )}

        {entry.txHash && (
          <DataField label="Tx">
            {entry.triggeredByLayer === 'Ethereum' ? (
              <Link
                href={`/tx/${entry.txHash}`}
                className="font-mono text-[11px] text-[#cd6332] hover:text-[#b8562b]"
              >
                {truncateHash(entry.txHash, 6, 4)}
              </Link>
            ) : (
              <span className="font-mono text-[11px] text-[#cd6332]">
                {truncateHash(entry.txHash, 6, 4)}
              </span>
            )}
            <CopyButton text={entry.txHash} />
          </DataField>
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

  // Reversed for rendering — current state at top, oldest at bottom
  const reversedTimeline = [...timeline].reverse();

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
          Vault History
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
            <DetailRow label="Vault ID">
              <span className="break-all font-mono text-xs text-[#14140f]">{vault.id}</span>
            </DetailRow>

            <DetailRow label="Provider Address">
              <Link
                href={`/accounts/${vault.providerAddress}`}
                className="break-all font-mono text-xs text-[#387085] hover:underline"
              >
                {vault.providerAddress}
              </Link>
              <CopyButton text={vault.providerAddress} />
            </DetailRow>

            <DetailRow label="Depositor">
              <Link
                href={`/accounts/${vault.depositorAddress}`}
                className="break-all font-mono text-xs text-[#387085] hover:underline"
              >
                {vault.depositorAddress}
              </Link>
              <CopyButton text={vault.depositorAddress} />
            </DetailRow>

            <DetailRow label="BTC Address">
              <span className="break-all font-mono text-xs text-[#387085]">{vault.btcAddress}</span>
              <CopyButton text={vault.btcAddress} />
            </DetailRow>

            <DetailRow label="Block Height">
              <span>{vault.blockNumber}</span>
            </DetailRow>

            <DetailRow label="Created">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">{formatRelativeTime(vault.createdAt)}</span>
                <span className="text-xs text-[rgba(56,112,133,0.55)]">{formatUtcDate(vault.createdAt)}</span>
              </div>
            </DetailRow>

            <DetailRow label="Closed">
              {vault.closedAt ? (
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold">{formatRelativeTime(vault.closedAt)}</span>
                  <span className="text-xs text-[rgba(56,112,133,0.55)]">{formatUtcDate(vault.closedAt)}</span>
                </div>
              ) : (
                <span className="text-[rgba(20,20,15,0.35)]">—</span>
              )}
            </DetailRow>
          </div>

          {/* Raw Transactions — collapsible */}
          <details className="group rounded border border-[#387085]/10 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-medium text-[#387085]/60 transition-colors hover:text-[#14140f]">
              <span>Raw Transactions</span>
              <svg
                className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </summary>
            <div className="border-t border-[#387085]/10 px-5 py-2">
              <DetailRow label="BTC Peg-In Tx">
                <span className="break-all font-mono text-xs text-[#387085]">{vault.btcPegInTxHash}</span>
                <CopyButton text={vault.btcPegInTxHash} />
              </DetailRow>

              <DetailRow label="Created Tx">
                <Link
                  href={`/tx/${vault.createdTxHash}`}
                  className="break-all font-mono text-xs text-[#387085] hover:underline"
                >
                  {vault.createdTxHash}
                </Link>
                <CopyButton text={vault.createdTxHash} />
              </DetailRow>

              <DetailRow label="HTLC Hashlock">
                <span className="break-all font-mono text-xs text-[#387085]">{vault.hashlock}</span>
                <CopyButton text={vault.hashlock} />
              </DetailRow>

              <DetailRow label="HTLC Vout">
                <span>0</span>
              </DetailRow>

              <DetailRow label="Closed Tx">
                <span className="text-[rgba(20,20,15,0.35)]">—</span>
              </DetailRow>
            </div>
          </details>
        </div>
      ) : (
        <div>
          {/* Transaction Flow timeline — completed events only, newest first */}
          <div className="rounded border border-[#387085]/10 bg-white px-5 py-4">
            {(() => {
              const completedOnly = reversedTimeline.filter((e) => e.isCompleted);
              return completedOnly.map((event, i) => {
                const isLast = i === completedOnly.length - 1;
                const nextCompleted = !isLast && completedOnly[i + 1].isCompleted;
                return (
                  <TimelineRow
                    key={event.key}
                    event={event}
                    nextCompleted={nextCompleted}
                    isLast={isLast}
                  />
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
