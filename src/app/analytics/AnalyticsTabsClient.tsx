'use client';

import { useState } from 'react';
import { VaultsTabContent } from './AnalyticsClient';
import BorrowingTabContent from './BorrowingTabContent';
import DevNote, { DevNoteSection } from '@/components/DevNote';
import { toUsd } from '@/lib/utils';
import type { TimeSeriesPoint, Vault, DashboardKPIs } from '@/lib/types';

interface VaultCreationPoint { date: string; count: number; amount: number }

interface AnalyticsTabsClientProps {
  kpis: DashboardKPIs;
  tvlHistory: TimeSeriesPoint[];
  activeVaultHistory: TimeSeriesPoint[];
  tvpHistory: TimeSeriesPoint[];
  tnvHistory: TimeSeriesPoint[];
  topActiveVaults: Vault[];
  vaultCreationData: VaultCreationPoint[];
}

// ── Corner bracket decoration ────────────────────────────────────────────────

function CornerBrackets() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-[#387085]/40" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-[#387085]/40" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-[#387085]/40" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-[#387085]/40" />
    </>
  );
}

export default function AnalyticsTabsClient(props: AnalyticsTabsClientProps) {
  const { kpis } = props;
  const [activeTab, setActiveTab] = useState<'vaults' | 'borrowing'>('vaults');

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Analytics 기획 의도">
        <DevNoteSection heading="페이지 목적">
          <p>프로토콜 핵심 지표를 차트와 테이블로 심층 분석하는 페이지.</p>
          <p>KPI 요약 → 추이 차트 4종 → Vault 생성 차트 → Top Active Vaults 순서.</p>
        </DevNoteSection>
        <DevNoteSection heading="KPI 4카드">
          <p>Total Value Locked (TVL) (ℹ): 현재 Active Vault BTC 합계.</p>
          <p>Active Vaults: 현재 Active 상태인 Vault 수.</p>
          <p>Total Value Processed (TVP) (ℹ): 전체 누적 BTC (상태 무관).</p>
          <p>Total Vaults: 전체 누적 Vault 수.</p>
          <p>각 카드에 24h 변화율(%) 표시 (현재 API 미연동 — 0% 표기).</p>
        </DevNoteSection>
        <DevNoteSection heading="추이 차트 (2×2 Grid)">
          <p>TVL History / Active Vault Count History / TVP History / TNV History.</p>
          <p>각 차트에 기간 토글(7D / 30D / 180D / YTD / 1Y / ALL) 제공.</p>
          <p>CornerBrackets 장식으로 데이터 카드 스타일 적용.</p>
        </DevNoteSection>
        <DevNoteSection heading="Vault Creation 차트">
          <p>일별 신규 Vault 생성 수(Bar, 좌축)와 신규 Vault 총량(Bar, 우축)을 콤보 차트로 시각화.</p>
          <p>기간 토글 동일 적용.</p>
        </DevNoteSection>
        <DevNoteSection heading="Top Active Vaults">
          <p>현재 Active 상태 Vault 중 vaultSize 내림차순 상위 10개.</p>
          <p>컬럼: Vault ID / Amount / Depositor / Provider / DApp / Created (Age).</p>
          <p>Created (Age)는 상대 시간으로 표시.</p>
        </DevNoteSection>
      </DevNote>

      <h1 className="text-lg font-semibold text-[#14140f]">Analytics</h1>

      {/* ── 4 KPI cards (above tabs) ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Total Value Locked (TVL) */}
        <div className="relative rounded-none border border-[#387085]/20 bg-white px-5 py-4">
          <CornerBrackets />
          <p className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.55)]">
            Total Value Locked (TVL)
            <svg className="h-3.5 w-3.5 text-[rgba(56,112,133,0.3)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <title>Total number of BTC that are locked in currently active vaults</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-xl font-bold tabular-nums text-[#14140f]">{kpis.currentTVL.toFixed(2)} sBTC</p>
            <span className="text-xs text-green-600">+3.42% (24h)</span>
          </div>
          <p className="mt-0.5 text-xs text-[#387085]/40">{toUsd(kpis.currentTVL)}</p>
        </div>

        {/* Card 2: Utilization */}
        <div className="relative rounded-none border border-[#387085]/20 bg-white px-5 py-4">
          <CornerBrackets />
          <p className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.55)]">
            Utilization
            <svg className="h-3.5 w-3.5 text-[rgba(56,112,133,0.3)]" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <title>Utilization = Total Borrowed / TVL * 100</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-xl font-bold tabular-nums text-[#14140f]">42.3%</p>
          </div>
          <p className="mt-0.5 text-xs text-[#387085]/40">$5,342.33 borrowed</p>
        </div>

        {/* Card 3: Liquidations */}
        <div className="relative rounded-none border border-[#387085]/20 bg-white px-5 py-4">
          <CornerBrackets />
          <p className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.55)]">
            Liquidations
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-xl font-bold tabular-nums text-[#14140f]">0.3842 sBTC</p>
            <span className="text-xs text-green-600">+1.28% (24h)</span>
          </div>
          <p className="mt-0.5 text-xs text-[#387085]/40">{toUsd(0.3842)}</p>
        </div>

        {/* Card 4: Active Vaults */}
        <div className="relative rounded-none border border-[#387085]/20 bg-white px-5 py-4">
          <CornerBrackets />
          <p className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.55)]">
            Active Vaults
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-xl font-bold tabular-nums text-[#14140f]">{kpis.activeVaultCount}</p>
            <span className="text-xs text-green-600">+0.45% (24h)</span>
          </div>
          <p className="mt-0.5 text-xs text-[#387085]/40">of {kpis.totalNumberOfVaults}</p>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#387085]/15">
        {([
          { key: 'vaults' as const, label: 'Vaults' },
          { key: 'borrowing' as const, label: 'Borrowing' },
        ]).map((tab) => (
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
          </button>
        ))}
      </div>

      {activeTab === 'vaults' && <VaultsTabContent {...props} />}
      {activeTab === 'borrowing' && <BorrowingTabContent />}
    </div>
  );
}
