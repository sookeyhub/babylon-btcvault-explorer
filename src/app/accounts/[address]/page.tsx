import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccountByAddress, getProviderByAddress } from '@/lib/data';
import { MOCK_VAULTS } from '@/lib/mock-data';
import { truncateAddress } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';
import AccountDetailTabs from './AccountDetailTabs';
import ProviderDashboard from './ProviderDashboard';
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

  // Determine provider role
  const provider = await getProviderByAddress(account.address);

  // Depositor stats (used when non-Provider account renders basic Summary)
  const lcAddress = account.address.toLowerCase();
  const depositorVaults = MOCK_VAULTS.filter(
    (v) => v.depositorAddress?.toLowerCase() === lcAddress,
  );
  const depositorTotalVaults = depositorVaults.length;
  const depositorActiveVaults = depositorVaults.filter((v) => v.status === 'Active').length;
  const depositorTotalBtc = depositorVaults.reduce((s, v) => s + v.vaultSize, 0);

  const typeBadge: Record<string, string> = {
    EOA:      'bg-[#387085]/10 text-[#387085]',
    Contract: 'bg-[#cd6332]/10 text-[#cd6332]',
    Module:   'bg-[#5a8a3c]/10 text-[#5a8a3c]',
  };

  const MODULE_DESCRIPTIONS: Record<string, string> = {
    'Vault Module Account': 'Manages vault creation, lifecycle transitions, and sBTC custody for the BTCVault protocol.',
    'Distribution Module Account': 'Handles reward distribution and fee allocation across protocol participants.',
    'Staking Module Account': 'Manages staking deposits, delegation, and validator reward processing.',
    'Fee Collector Account': 'Collects transaction fees and protocol charges for redistribution.',
  };

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Account Detail 기획 의도">
        <DevNoteSection heading="페이지 목적">
          <p>모든 주소를 하나의 통합 라우트로 접근.</p>
          <p>역할에 따라 뷰가 자동 분기되어 사용자가 주소 종류를 구분할 필요 없음.</p>
        </DevNoteSection>

        <DevNoteSection heading="역할별 뷰 분기">
          <p>Provider는 전용 대시보드, Depositor는 Vault 중심 요약 카드, 역할이 없는 계정은 Transactions 탭만 표시.</p>
        </DevNoteSection>

        <DevNoteSection heading="Provider Dashboard">
          <p>헤더 우측에 Total BTC를 최우선 지표로 강조.</p>
          <p>Active Vaults, Total Vaults, Commission, Connected DApp의 운영 지표 노출.</p>
          <p>Overview에 식별 정보, Vault Status에 상태별 분포를 2열로 배치.</p>
          <p>탭은 Transactions와 Vaults로 구성.</p>
        </DevNoteSection>

        <DevNoteSection heading="Depositor 요약">
          <p>Summary 카드는 Vault 활동을 중심으로 4개 지표 제공.</p>
          <p>Total BTC, Total Vaults, Active Vaults(녹색 강조), Txn Count.</p>
          <p>예치 규모와 현재 활성 상태를 한눈에 파악하도록 구성.</p>
          <p>탭은 Transactions와 Deposited Vaults로 구성.</p>
        </DevNoteSection>

        <DevNoteSection heading="역할 없는 계정">
          <p>Summary 카드는 동일하게 노출하되 Total BTC와 Vault 값은 0으로 표시.</p>
          <p>탭은 Transactions만 제공.</p>
        </DevNoteSection>

        <DevNoteSection heading="정책 / 예외">
          <p>DApp 전용 상세 페이지는 없음. 역할은 Provider 또는 Depositor만 유의미.</p>
          <p>이름이 있는 계정은 이름만 노출, 주소는 hover 시 툴팁.</p>
          <p>Contract 계정은 주소 앞 아이콘으로 구분.</p>
          <p>모든 주소 링크는 이 통합 페이지로 일원화.</p>
        </DevNoteSection>
      </DevNote>

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-[rgba(56,112,133,0.55)]">
        <Link href="/accounts" className="hover:text-[#cd6332] transition-colors">Accounts</Link>
        <span>/</span>
        <span className="text-[#14140f] font-medium">{account.name ?? truncateAddress(account.address, 6, 4)}</span>
      </nav>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[rgba(56,112,133,0.55)]">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
            <span>Account</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeBadge[account.type]}`}>
              {account.type === 'Contract' ? 'CA' : account.type}
            </span>
            {provider && (
              <span className="rounded-full bg-[#5a8a3c]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5a8a3c]">
                Provider
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {account.name ? (
              <span
                title={account.address}
                className="text-base font-semibold text-[#14140f]"
              >
                {account.name}
              </span>
            ) : (
              <span className="font-mono text-base font-semibold text-[#14140f]">
                {account.address}
              </span>
            )}
            <CopyButton text={account.address} />
          </div>
        </div>

        {/* Provider: right-aligned Total BTC + vaults managed */}
        {provider && (
          <div className="text-right">
            <p className="text-2xl font-semibold text-[#cd6332]">
              {provider.totalBtc.toFixed(2)} BTC
            </p>
            <p className="text-sm text-[#387085]/60">{provider.vaultCount} vaults managed</p>
          </div>
        )}
      </div>

      {/* ── Summary cards (non-Provider accounts only) ──────────────────── */}
      {!provider && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total BTC</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">
              {depositorTotalBtc.toFixed(4)} sBTC
            </p>
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

      {/* ── Module role description ────────────────────────────────────── */}
      {account.type === 'Module' && account.name && MODULE_DESCRIPTIONS[account.name] && (
        <div className="rounded border border-[#5a8a3c]/20 bg-[#5a8a3c]/5 p-4">
          <p className="text-xs font-semibold text-[#5a8a3c]">Module Role</p>
          <p className="mt-1 text-sm text-[#14140f]/80">{MODULE_DESCRIPTIONS[account.name]}</p>
        </div>
      )}

      {/* ── Provider dashboard (for EOA with provider role) ────────────── */}
      {provider && <ProviderDashboard provider={provider} />}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <AccountDetailTabs
        address={account.address}
        accountType={account.type}
        isProvider={!!provider}
      />
    </div>
  );
}
