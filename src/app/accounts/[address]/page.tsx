import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccountByAddress, getProviderByAddress } from '@/lib/data';
import { MOCK_VAULTS } from '@/lib/mock-data';
import { truncateAddress } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';
import AccountDetailTabs from './AccountDetailTabs';
import ProviderDetail from './ProviderDetail';
import DevNote, { DevNoteSection } from '@/components/DevNote';

export const revalidate = 60;

interface Props {
  params: Promise<{ address: string }>;
}

export default async function AccountDetailPage({ params }: Props) {
  const { address } = await params;
  const account = await getAccountByAddress(address);

  if (!account) {
    notFound();
  }

  const provider = await getProviderByAddress(account.address);
  const lcAddress = account.address.toLowerCase();

  // ── Provider vaults ──────────────────────────────────────────────────
  const providerVaults = provider
    ? MOCK_VAULTS.filter((v) => v.providerAddress.toLowerCase() === lcAddress)
    : [];

  // ── Depositor stats ─────────────────────────────────────────────
  const depositorVaults      = MOCK_VAULTS.filter((v) => v.depositorAddress?.toLowerCase() === lcAddress);
  const depositorTotalVaults = depositorVaults.length;
  const depositorActiveVaults = depositorVaults.filter((v) => v.status === 'Active').length;
  const depositorTotalBtc    = depositorVaults.reduce((s, v) => s + v.vaultSize, 0);
  const isDepositor          = !provider && account.type === 'EOA' && depositorTotalVaults > 0;


  // ── UI helpers ──────────────────────────────────────────────────
  const typeBadge: Record<string, string> = {
    EOA:      'bg-[#387085]/10 text-[#387085]',
    Contract: 'bg-[#cd6332]/10 text-[#cd6332]',
    Module:   'bg-[#5a8a3c]/10 text-[#5a8a3c]',
  };

  const MODULE_DESCRIPTIONS: Record<string, string> = {
    'Vault Module Account':       'Manages vault creation, lifecycle transitions, and sBTC custody for the BTCVault protocol.',
    'Distribution Module Account': 'Handles reward distribution and fee allocation across protocol participants.',
    'Staking Module Account':     'Manages staking deposits, delegation, and validator reward processing.',
    'Fee Collector Account':      'Collects transaction fees and protocol charges for redistribution.',
  };

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Account Detail 기획 의도">
        <DevNoteSection heading="페이지 목적">
          <p>모든 주소를 하나의 통합 라우트(/accounts/[address])로 접근.</p>
          <p>Provider / Depositor / EOA / Module 자동 분기 — 사용자가 구분할 필요 없음.</p>
        </DevNoteSection>
        <DevNoteSection heading="역할 배지">
          <p>Provider → "Provider"(초록), Depositor → "Depositor"(틸)로만 표기.</p>
          <p>그 외 일반 계정은 EOA / CA / Module 타입 배지.</p>
        </DevNoteSection>
        <DevNoteSection heading="Provider 헤더 (신규 ProviderDetail 컴포넌트)">
          <p>ProviderDetail.tsx 단일 클라이언트 컴포넌트가 Provider 계정의 헤더+탭 전체를 담당.</p>
          <p>Row A: 이름(h1) + 주소 · 커미션 · 가입일 (1줄 메타).</p>
          <p>Row B: 운영 상태 표시 바 (클릭 → Activity 탭).</p>
          <p>Row C: 4개 스탯 카드 — vaults / BTC locked / success rate / avg activation.</p>
          <p>Row D: 탭 바 — Overview | Performance | Activity | Live queue (점멸 점) | Vaults.</p>
        </DevNoteSection>
        <DevNoteSection heading="Depositor 헤더">
          <p>주소(truncated)만 표기. KPI 4카드: Total BTC / Total Vaults / Active Vaults / Txn Count.</p>
          <p>탭: Positions / Deposited Vaults / Activity.</p>
        </DevNoteSection>
        <DevNoteSection heading="Positions 탭 (Depositor)">
          <p>3카드: Collateral / Current LTV / Debt.</p>
          <p>Health Factor 카드(전체 너비): 값 + 상태 배지 + 그라디언트 게이지.</p>
          <p>Debt 테이블: Reserve ID / Token / Amount / Principal / Accrued Interest.</p>
        </DevNoteSection>
      </DevNote>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[rgba(56,112,133,0.55)]">
        <Link href="/providers" className="transition-colors hover:text-[#cd6332]">Accounts</Link>
        <span>/</span>
        <span className="font-medium text-[#14140f]">
          {account.name ?? truncateAddress(account.address, 6, 4)}
        </span>
      </nav>

      {/* ── Header (non-provider only) ────────────────────────────────── */}
      {!provider && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[rgba(56,112,133,0.55)]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
            {isDepositor ? (
              <span className="font-medium text-[#387085]">Depositor</span>
            ) : (
              <>
                <span>Account</span>
                <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeBadge[account.type]}`}>
                  {account.type === 'Contract' ? 'CA' : account.type}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {account.name ? (
              <span title={account.address} className="text-base font-semibold text-[#14140f]">
                {account.name}
              </span>
            ) : (
              <span title={account.address} className="font-mono text-base font-semibold text-[#14140f]">
                {truncateAddress(account.address, 6, 4)}
              </span>
            )}
            <CopyButton text={account.address} />
          </div>
        </div>
      )}

      {/* ── Depositor summary cards ───────────────────────────────────── */}
      {isDepositor && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total BTC</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{depositorTotalBtc.toFixed(4)} sBTC</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total Vaults</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{depositorTotalVaults.toLocaleString()}</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Active Vaults</p>
            <p className="mt-0.5 text-lg font-semibold text-green-600">{depositorActiveVaults.toLocaleString()}</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Txn Count</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{account.txnCount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* ── Fallback summary cards (non-Provider, non-Depositor) ──────── */}
      {!provider && !isDepositor && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total BTC</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{depositorTotalBtc.toFixed(4)} sBTC</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total Vaults</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{depositorTotalVaults.toLocaleString()}</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Active Vaults</p>
            <p className="mt-0.5 text-lg font-semibold text-green-600">{depositorActiveVaults.toLocaleString()}</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Txn Count</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{account.txnCount.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* ── Module role description ───────────────────────────────────── */}
      {account.type === 'Module' && account.name && MODULE_DESCRIPTIONS[account.name] && (
        <div className="rounded border border-[#5a8a3c]/20 bg-[#5a8a3c]/5 p-4">
          <p className="text-xs font-semibold text-[#5a8a3c]">Module Role</p>
          <p className="mt-1 text-sm text-[#14140f]/80">{MODULE_DESCRIPTIONS[account.name]}</p>
        </div>
      )}

      {/* ── Provider Detail (replaces header + tabs for providers) ──────── */}
      {provider && (
        <ProviderDetail
          address={account.address}
          providerName={provider.name}
          commission={provider.commission}
          joinedDate={providerVaults.length > 0
            ? providerVaults[providerVaults.length - 1].createdAt
            : new Date().toISOString()}
          vaults={providerVaults}
        />
      )}

      {/* ── Tabs (non-provider only) ──────────────────────────────────── */}
      {!provider && (
        <AccountDetailTabs
          address={account.address}
          accountType={account.type}
          isProvider={false}
          isDepositor={isDepositor}
        />
      )}
    </div>
  );
}
