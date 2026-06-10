import { notFound } from 'next/navigation';
import { getVaultById, getVaultLifecycle } from '@/lib/data';
import { truncateAddress, toUsd } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';
import type { VaultStatus, VaultLifecycleEvent } from '@/lib/types';
import VaultDetailTabs from './VaultDetailTabs';
import DevNote, { DevNoteSection } from '@/components/DevNote';

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

// ── Status icon (circle with status-specific symbol) ────────────────────────

function StatusIcon({ status, size = 'md' }: { status: VaultStatus; size?: 'md' | 'lg' }) {
  const sizeClasses = size === 'lg' ? 'h-8 w-8' : 'h-5 w-5';
  const iconSize = size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';

  const configs: Record<VaultStatus, { bg: string; iconColor: string; icon: React.ReactNode }> = {
    Available: {
      bg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      icon: (
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ),
    },
    Pending: {
      bg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      icon: (
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      ),
    },
    Verified: {
      bg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      icon: (
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ),
    },
    'Signature Collected': {
      bg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: (
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      ),
    },
    Redeemed: {
      bg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: (
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    Expired: {
      bg: 'bg-zinc-100',
      iconColor: 'text-zinc-500',
      icon: (
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      ),
    },
    Liquidated: {
      bg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: (
        <svg className={iconSize} fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      ),
    },
  };

  const cfg = configs[status] ?? configs.Pending;

  return (
    <div className={`flex ${sizeClasses} items-center justify-center rounded-full ${cfg.bg} ${cfg.iconColor}`}>
      {cfg.icon}
    </div>
  );
}

// ── Status banner ────────────────────────────────────────────────────────────

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

interface BannerConfig {
  bg: string;
  label: string;
  desc: string;
  labelText: string;
  subText: string;
}

function getBannerConfig(status: VaultStatus, lifecycle: VaultLifecycleEvent[]): BannerConfig {
  switch (status) {
    case 'Available':
      return {
        bg: 'bg-green-50',
        label: 'Available',
        desc: 'Vault is live. BTC locked and usable as collateral.',
        labelText: 'text-green-700',
        subText: 'text-green-600/70',
      };
    case 'Pending':
      return {
        bg: 'bg-amber-50',
        label: 'Pending',
        desc: 'Waiting for BTC confirmation and ZKP verification.',
        labelText: 'text-amber-700',
        subText: 'text-amber-600/70',
      };
    case 'Verified':
      return {
        bg: 'bg-purple-50',
        label: 'Verified',
        desc: 'Vault verification completed by committee.',
        labelText: 'text-purple-700',
        subText: 'text-purple-600/70',
      };
    case 'Signature Collected':
      return {
        bg: 'bg-yellow-50',
        label: 'Signature Collected',
        desc: 'BTC signatures have been collected and posted.',
        labelText: 'text-yellow-700',
        subText: 'text-yellow-600/70',
      };
    case 'Expired': {
      const expiredEvent = lifecycle.find((e) => e.event_type === 'EXPIRED');
      const reason =
        expiredEvent?.expired_reason === 0
          ? 'ACK not submitted within timeout.'
          : expiredEvent?.expired_reason === 1
            ? 'Activation not completed within timeout.'
            : 'Timeout exceeded.';
      return {
        bg: 'bg-zinc-50',
        label: 'Expired',
        desc: reason,
        labelText: 'text-zinc-600',
        subText: 'text-zinc-500/60',
      };
    }
    case 'Liquidated':
      return {
        bg: 'bg-red-50',
        label: 'Liquidated',
        desc: 'Vault was undercollateralized and liquidated.',
        labelText: 'text-red-700',
        subText: 'text-red-600/70',
      };
    case 'Redeemed':
      return {
        bg: 'bg-blue-50',
        label: 'Redeemed',
        desc: 'BTC ready to claim.',
        labelText: 'text-blue-700',
        subText: 'text-blue-600/70',
      };
    default:
      return {
        bg: 'bg-[#387085]/5',
        label: status,
        desc: '',
        labelText: 'text-[#387085]',
        subText: 'text-[#387085]/60',
      };
  }
}

function formatUtcDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +UTC`
  );
}

function StatusBanner({
  status,
  createdAt,
  closedAt,
  lifecycle,
}: {
  status: VaultStatus;
  createdAt: string;
  closedAt: string | null;
  lifecycle: VaultLifecycleEvent[];
}) {
  const cfg = getBannerConfig(status, lifecycle);
  const isTerminal = ['Redeemed', 'Expired', 'Liquidated'].includes(status);
  const timeLabel = isTerminal ? 'Closed' : 'Created';
  const timeIso = isTerminal && closedAt ? closedAt : createdAt;

  return (
    <div className={`flex items-center justify-between rounded-lg px-5 py-3 ${cfg.bg}`}>
      <div className="flex min-w-0 items-center gap-3">
        <StatusIcon status={status} size="lg" />
        <div className="min-w-0">
          <span className={`text-sm font-semibold ${cfg.labelText}`}>{cfg.label}</span>
          {cfg.desc && (
            <p className={`text-xs ${cfg.subText}`}>{cfg.desc}</p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium text-[#14140f]">
          {timeLabel} {formatRelativeTime(timeIso)}
        </p>
        <p className="text-xs text-[#387085]/50">{formatUtcDate(timeIso)}</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VaultDetailPage({ params }: Props) {
  const { id } = await params;
  const vault = await getVaultById(id);

  if (!vault) {
    notFound();
  }

  const lifecycle = await getVaultLifecycle(id);

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Vault Detail 기획 의도">
        <DevNoteSection heading="식별 정보">
          <p>Vault ID와 현재 status 아이콘을 함께 노출해 즉시 식별 가능.</p>
          <p>ID는 truncate 표기, 복사 버튼으로 전체 ID 확보.</p>
        </DevNoteSection>

        <DevNoteSection heading="상태 배너">
          <p>현재 status와 created / closed 시점 등 핵심 라이프사이클 일자를 강조.</p>
          <p>사용자가 Vault의 현재 위치를 즉시 인지하도록 구성.</p>
        </DevNoteSection>

        <DevNoteSection heading="Summary 카드">
          <p>Amount / DApp / Provider 3개 핵심 메타데이터를 카드 형태로 노출.</p>
          <p>Vault 자체의 자산 규모와 연결 컨텍스트를 한눈에 파악.</p>
        </DevNoteSection>

        <DevNoteSection heading="Vault History 목적">
          <p>개별 Vault가 어떤 단계를 거쳐 현재 상태에 도달했는지 한눈에 추적.</p>
          <p>Bitcoin 레이어에서 Ethereum 레이어로 넘어가는 2단계 프로토콜 흐름을 하나의 타임라인으로 통합.</p>
        </DevNoteSection>

        <DevNoteSection heading="이벤트 흐름">
          <p>BTC 전송 → BTC 컨펌 → Submitted → 서명 → Ack → 검증 → Activated 순으로 표시.</p>
          <p>종료 시 Redeemed / Expired / Liquidated 중 하나가 마지막 이벤트로 추가됨.</p>
        </DevNoteSection>

        <DevNoteSection heading="표시 정책">
          <p>실제로 발생한 이벤트만 노출, 미래 이벤트는 숨김.</p>
          <p>최신순 정렬, Current 이벤트는 시각적으로 강조.</p>
        </DevNoteSection>

        <DevNoteSection heading="상태 전환 강조">
          <p>Vault status가 바뀌는 이벤트는 이전 → 이후 상태를 인라인으로 표시.</p>
        </DevNoteSection>

        <DevNoteSection heading="민감 정보 보호">
          <p>Activated 시 공개되는 Secret은 기본 숨김, reveal 버튼으로 명시적 열람.</p>
        </DevNoteSection>

        <DevNoteSection heading="TX 이동">
          <p>Ethereum TX는 내부 트랜잭션 상세로 이동.</p>
          <p>BTC TX는 외부 익스플로러 전용이라 해시 표기만 제공.</p>
        </DevNoteSection>
      </DevNote>

      {/* ── Header area ───────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
          {/* "Vault" label row */}
          <div className="flex items-center gap-1.5 text-xs text-[rgba(56,112,133,0.55)]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <rect x="3" y="11" width="18" height="10" rx="1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Vault</span>
          </div>

        {/* ID row */}
        <div className="flex items-center gap-2">
          <span className="break-all font-mono text-base font-semibold text-[#14140f]">
            {vault.id}
          </span>
          <CopyButton text={vault.id} />
        </div>
      </div>

      {/* ── Status banner ─────────────────────────────────────────────────── */}
      <StatusBanner
        status={vault.status}
        createdAt={vault.createdAt}
        closedAt={vault.closedAt}
        lifecycle={lifecycle}
      />

      {/* ── 3 summary cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Amount</p>
          <p className="mt-0.5 text-lg font-semibold text-[#14140f]">
            {vault.vaultSize.toFixed(2)} <span className="text-sm font-normal text-[#387085]/60">sBTC</span>
          </p>
        </div>
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">DApp</p>
          <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{vault.dappName}</p>
        </div>
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Provider</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-lg font-semibold text-[#14140f]">
            <svg className="h-4 w-4 text-[#387085]/40" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
            {vault.providerName}
          </p>
        </div>
      </div>

      {/* ── Vault details + Transaction Flow + Raw Txs ────────────────────── */}
      <VaultDetailTabs vault={vault} lifecycle={lifecycle} />
    </div>
  );
}
