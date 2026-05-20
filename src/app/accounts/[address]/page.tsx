import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccountByAddress, getProviderByAddress } from '@/lib/data';
import { MOCK_VAULTS } from '@/lib/mock-data';
import {
  MOCK_COLLATERAL_POSITIONS,
  MOCK_PORTFOLIO_POSITIONS,
} from '@/lib/mock-aave-activity';
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

  // Depositor role detection (EOA + has deposited vaults + not a Provider)
  const isDepositor = !provider && account.type === 'EOA' && depositorTotalVaults > 0;

  // Outstanding loans (mock) — drives the Total Loans KPI for Depositors
  const totalLoans = isDepositor
    ? MOCK_COLLATERAL_POSITIONS.filter((p) => p.borrowed > 0).length
    : 0;

  // Aggregate risk metrics across portfolio positions
  const portfolioInterest = isDepositor
    ? MOCK_PORTFOLIO_POSITIONS.reduce((s, p) => s + (p.interest ?? 0), 0)
    : 0;
  const portfolioBorrowed = isDepositor
    ? MOCK_PORTFOLIO_POSITIONS.reduce((s, p) => s + p.borrowed, 0)
    : 0;
  // Collateral-weighted LTV (mock — use raw collateral count as weight)
  const portfolioLtv = isDepositor
    ? (() => {
        const weighted = MOCK_PORTFOLIO_POSITIONS.reduce(
          (acc, p) => {
            if (p.ltv == null) return acc;
            acc.num += p.ltv * p.collateral;
            acc.den += p.collateral;
            return acc;
          },
          { num: 0, den: 0 },
        );
        return weighted.den > 0 ? weighted.num / weighted.den : 0;
      })()
    : 0;
  // Lowest non-null Health Factor across positions
  const portfolioHealth = isDepositor
    ? (() => {
        const hfs = MOCK_PORTFOLIO_POSITIONS.map((p) => p.healthFactor).filter(
          (h): h is number => h != null,
        );
        return hfs.length > 0 ? Math.min(...hfs) : null;
      })()
    : null;

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

        <DevNoteSection heading="역할 표기">
          <p>Account 타입 배지(EOA / CA / Module)와 Provider 역할 배지를 함께 노출.</p>
          <p>이름이 있는 계정은 이름만, 주소는 hover 시 툴팁.</p>
        </DevNoteSection>

        <DevNoteSection heading="Provider 헤더 우측">
          <p>Provider인 경우 Total BTC를 최우선 지표로 강조하고 관리 vault 수를 함께 표기.</p>
        </DevNoteSection>

        <DevNoteSection heading="Summary 카드 (Depositor)">
          <p>Aave 차입 활동 중심 4개 KPI: Total Loans / LTV / Health Factor / Interest Accrued.</p>
          <p>vault 수·잔고 같은 Depositor 일반 지표는 카드에서 빼고 차입 리스크를 우선 노출.</p>
          <p>LTV는 가중평균(담보 BTC 기준), Health Factor는 포지션 중 최저값, Interest는 누적 합산.</p>
          <p>임계 구간에서는 컬러 분기(LTV 75%↑ amber/90%↑ red, HF 1.5↓ amber/1.0↓ red).</p>
        </DevNoteSection>

        <DevNoteSection heading="Summary 카드 (그 외 계정)">
          <p>역할 없는 계정: Total BTC / Total Vaults / Active Vaults / Txn Count 기본 4개.</p>
          <p>Provider는 별도 ProviderDashboard로 분기되어 이 영역 미사용.</p>
        </DevNoteSection>

        <DevNoteSection heading="Provider Dashboard">
          <p>Active Vaults / Total Vaults / Commission / Connected DApp 운영 지표 4개 카드.</p>
          <p>Overview에 식별 정보, Vault Status에 상태별 분포를 2열로 배치.</p>
          <p>Active Vaults는 그린 컬러로 강조해 현재 운영 규모를 직관적으로 파악.</p>
        </DevNoteSection>

        <DevNoteSection heading="Positions 탭 (Depositor)">
          <p>자산(Asset) 단위 포트폴리오 뷰. 향후 다중 담보 자산 확장을 고려해 array 구조 유지.</p>
          <p>카드 헤더는 아코디언 토글: 자산명 아래 Health Factor + 상태 뱃지(Safe/Healthy/Caution/At Risk/Liquidation), 우측에 total collateral.</p>
          <p>HF가 null(부채 없음)이면 헤더 보조줄을 숨겨 노이즈 제거.</p>
          <p>펼친 본문은 세로 행 리스트(Collateral/Borrowed/LTV/Interest): 좌측 라벨+보조정보, 우측 값. 우선순위 순서.</p>
          <p>LTV 행에는 0~100% 진행 바를 함께 표시해 위험 수준 시각화.</p>
        </DevNoteSection>

        <DevNoteSection heading="Activity 탭 (Depositor)">
          <p>btcVaultAaveV4Activities GraphQL API 기반 Aave 이벤트 타임라인.</p>
          <p>이벤트 타입: ADD_COLLATERAL / REMOVE_COLLATERAL / BORROW / REPAY / LIQUIDATION.</p>
          <p>타임라인은 UTC 날짜별 그룹핑, 헤더에 "N days ago (Mon DD, YYYY)" 표기로 절대·상대 시간을 동시 제공.</p>
          <p>패널 상단에는 타입 필터(All/Add/Remove/Borrow/Repay/Liquidation)만 좌측 정렬, 별도 타이틀 없음(탭이 타이틀 역할).</p>
          <p>LIQUIDATION 카드는 빨간 배경+⚠ 아이콘으로 강조, amount는 ±prefix와 컬러로 자금 흐름 방향 인지.</p>
          <p>이벤트 행 부가 정보는 tx hash · #block만 노출(시간은 그룹 헤더와 중복이라 제거).</p>
        </DevNoteSection>

        <DevNoteSection heading="역할별 탭">
          <p>Provider: Transactions + Vaults.</p>
          <p>Depositor: Positions + Deposited Vaults + Activity.</p>
          <p>역할 없는 계정: Transactions만 제공.</p>
        </DevNoteSection>

        <DevNoteSection heading="정책 / 예외">
          <p>DApp 전용 상세 페이지는 없음. 역할은 Provider 또는 Depositor만 유의미.</p>
          <p>모든 주소 링크는 이 통합 페이지로 일원화.</p>
        </DevNoteSection>
      </DevNote>

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-xs text-[rgba(56,112,133,0.55)]">
        <Link href="/providers" className="hover:text-[#cd6332] transition-colors">Accounts</Link>
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

      </div>

      {/* Summary cards — Depositor (borrow-focused) */}
      {isDepositor && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total Loans</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{totalLoans.toLocaleString()}</p>
            <p className="mt-0.5 text-[10px] text-[#387085]/40">outstanding loans</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">LTV</p>
            <p
              className={`mt-0.5 text-lg font-semibold ${
                portfolioLtv >= 90
                  ? 'text-red-500'
                  : portfolioLtv >= 75
                    ? 'text-amber-600'
                    : 'text-[#14140f]'
              }`}
            >
              {portfolioLtv.toFixed(1)}%
            </p>
            <p className="mt-0.5 text-[10px] text-[#387085]/40">weighted avg</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Health Factor</p>
            {portfolioHealth != null ? (
              <p
                className={`mt-0.5 text-lg font-semibold ${
                  portfolioHealth < 1
                    ? 'text-red-500'
                    : portfolioHealth < 1.5
                      ? 'text-amber-600'
                      : 'text-green-600'
                }`}
              >
                {portfolioHealth.toFixed(2)}
              </p>
            ) : (
              <p className="mt-0.5 text-lg font-semibold text-[#387085]/30">—</p>
            )}
            <p className="mt-0.5 text-[10px] text-[#387085]/40">lowest across positions</p>
          </div>
          <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Interest Accrued</p>
            <p className="mt-0.5 text-lg font-semibold text-[#cd6332]">
              {portfolioInterest.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="mt-0.5 text-[10px] text-[#387085]/40">
              across {portfolioBorrowed > 0 ? 'open loans' : 'positions'}
            </p>
          </div>
        </div>
      )}

      {/* Summary cards — fallback (non-Provider, non-Depositor accounts) */}
      {!provider && !isDepositor && (
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
        isDepositor={isDepositor}
      />
    </div>
  );
}
