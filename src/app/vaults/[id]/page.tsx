import { notFound } from 'next/navigation';
import { getVaultById, getVaultLifecycle } from '@/lib/data';
import { truncateAddress } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';
import type { VaultStatus, VaultLifecycleEvent } from '@/lib/types';
import VaultDetailTabs from './VaultDetailTabs';
import DevNote, { DevNoteSection } from '@/components/DevNote';

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

// ── Status icon (varies by status) ───────────────────────────────────────────

function StatusIcon({ status }: { status: VaultStatus }) {
  switch (status) {
    case 'Active':
      return (
        <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      );
    case 'Redeemed':
      return (
        <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      );
    case 'Pending':
      return (
        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      );
    case 'Expired':
      return (
        <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9l-6 6M9 9l6 6" />
        </svg>
      );
    case 'Liquidated':
      return (
        <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      );
    default:
      return null;
  }
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
  border: string;
  dot: string;
  label: string;
  desc: string;
  labelText: string;
  subText: string;
  pulse?: boolean;
}

function getBannerConfig(status: VaultStatus, lifecycle: VaultLifecycleEvent[]): BannerConfig {
  switch (status) {
    case 'Active':
      return {
        bg: 'bg-green-50',
        border: 'border-green-500',
        dot: 'bg-green-500',
        label: 'Active',
        desc: 'Vault is live — BTC locked and usable as collateral',
        labelText: 'text-green-700',
        subText: 'text-green-600/70',
        pulse: true,
      };
    case 'Pending':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-500',
        dot: 'bg-amber-500',
        label: 'Pending',
        desc: 'Waiting for BTC confirmation and ZKP verification',
        labelText: 'text-amber-700',
        subText: 'text-amber-600/70',
        pulse: true,
      };
    case 'Expired': {
      const expiredEvent = lifecycle.find((e) => e.event_type === 'EXPIRED');
      const reason =
        expiredEvent?.expired_reason === 0
          ? 'ACK not submitted within timeout'
          : expiredEvent?.expired_reason === 1
            ? 'Activation not completed within timeout'
            : 'Timeout exceeded';
      return {
        bg: 'bg-[#387085]/5',
        border: 'border-[#387085]',
        dot: 'bg-[#387085]',
        label: 'Expired',
        desc: reason,
        labelText: 'text-[#387085]',
        subText: 'text-[#387085]/60',
      };
    }
    case 'Liquidated':
      return {
        bg: 'bg-red-50',
        border: 'border-red-500',
        dot: 'bg-red-500',
        label: 'Liquidated',
        desc: 'Vault was undercollateralized and liquidated',
        labelText: 'text-red-700',
        subText: 'text-red-600/70',
      };
    case 'Redeemed':
      return {
        bg: 'bg-[#387085]/5',
        border: 'border-[#387085]',
        dot: 'bg-[#387085]',
        label: 'Redeemed',
        desc: 'BTC has been successfully withdrawn',
        labelText: 'text-[#387085]',
        subText: 'text-[#387085]/60',
      };
    default:
      return {
        bg: 'bg-[#387085]/5',
        border: 'border-[#387085]',
        dot: 'bg-[#387085]',
        label: status,
        desc: '',
        labelText: 'text-[#387085]',
        subText: 'text-[#387085]/60',
      };
  }
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
  const timeText =
    status === 'Active' || status === 'Pending'
      ? `${formatRelativeTime(createdAt)} · created`
      : closedAt
        ? `${formatRelativeTime(closedAt)} · closed`
        : formatRelativeTime(createdAt);

  return (
    <div className={`flex items-center justify-between border-l-4 px-4 py-2.5 ${cfg.bg} ${cfg.border}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`inline-block h-2 w-2 shrink-0 rounded-full ${cfg.dot} ${
            cfg.pulse ? 'animate-pulse' : ''
          }`}
        />
        <span className={`text-sm font-semibold ${cfg.labelText}`}>{cfg.label}</span>
        {cfg.desc && (
          <span className={`hidden truncate text-xs sm:inline ${cfg.subText}`}>
            — {cfg.desc}
          </span>
        )}
      </div>
      <span className={`shrink-0 text-xs ${cfg.subText}`}>{timeText}</span>
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
    <div className="relative mx-auto max-w-[900px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Vault History 기획 의도">
        <DevNoteSection heading="목적">
          <p>개별 Vault가 어떤 단계를 거쳐 현재 상태에 도달했는지 한눈에 추적.</p>
          <p>Bitcoin 레이어에서 Ethereum 레이어로 넘어가는 2단계 프로토콜의 흐름을 하나의 타임라인으로 통합 가시화.</p>
        </DevNoteSection>

        <DevNoteSection heading="이벤트 흐름">
          <p>프로토콜 순서가 고정되어 있어 BTC 전송 → BTC 컨펌 → Submitted → 서명 → Ack → 검증 → Activated 흐름이 일관되게 표시됨.</p>
          <p>Vault가 종료되면 Redeemed / Expired / Liquidated 중 하나가 마지막 이벤트로 추가됨.</p>
        </DevNoteSection>

        <DevNoteSection heading="표시 정책">
          <p>실제로 발생한 이벤트만 노출. 아직 도달하지 않은 미래 이벤트는 숨겨 노이즈 제거.</p>
          <p>현재 상태가 최상단에 오도록 최신순 정렬.</p>
          <p>Current 이벤트는 시각적으로 강조해 "지금 여기"를 즉시 인지.</p>
        </DevNoteSection>

        <DevNoteSection heading="상태 전환 강조">
          <p>Vault 상태가 바뀌는 이벤트에는 이전 → 이후 상태를 인라인으로 함께 표시.</p>
          <p>타임라인만 보고도 어느 시점에 상태 변화가 일어났는지 바로 알 수 있음.</p>
        </DevNoteSection>

        <DevNoteSection heading="민감 정보 보호">
          <p>Activated 시 공개되는 Secret은 기본 숨김 처리.</p>
          <p>reveal 버튼으로 사용자가 명시적으로 열람하도록 유도.</p>
        </DevNoteSection>

        <DevNoteSection heading="TX 이동">
          <p>Ethereum TX는 내부 트랜잭션 상세로 이동.</p>
          <p>BTC TX는 외부 비트코인 익스플로러가 필요해 내부 링크 없이 해시 표기만 제공.</p>
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
          <StatusIcon status={vault.status} />
          <span className="font-mono text-base font-semibold text-[#14140f]">
            {truncateAddress(vault.id, 6, 4)}
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
        {[
          { label: 'Amount',   value: `${vault.vaultSize.toFixed(2)} sBTC` },
          { label: 'DApp',     value: vault.dappName },
          { label: 'Provider', value: vault.providerName },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="border border-[#387085]/10 bg-[#faf9f5] p-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">{label}</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Vault details + Transaction Flow + Raw Txs ────────────────────── */}
      <VaultDetailTabs vault={vault} lifecycle={lifecycle} />

    </div>
  );
}
