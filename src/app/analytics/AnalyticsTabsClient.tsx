'use client';

import { VaultsTabContent } from './AnalyticsClient';
import DevNote, { DevNoteSection } from '@/components/DevNote';
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

export default function AnalyticsTabsClient(props: AnalyticsTabsClientProps) {
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
      <VaultsTabContent {...props} />
    </div>
  );
}
