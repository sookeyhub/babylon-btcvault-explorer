import Link from 'next/link';
import { getAnalyticsData } from '@/lib/data';
import HeroBanner from '@/components/HeroBanner';
import TVLHistorySection from '@/components/TVLHistorySection';
import DevNote, { DevNoteSection } from '@/components/DevNote';
import HomeActivitySections from '@/components/HomeActivitySections';

export const revalidate = 60;

export default async function HomePage() {
  const analytics = await getAnalyticsData();

  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner />

      {/* Main content */}
      <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6">
        <DevNote title="Home 기획 의도">
          <DevNoteSection heading="페이지 목적">
            <p>프로토콜 전체 상태를 한눈에 파악하는 대시보드.</p>
            <p>Hero Banner → TVL 추이 차트 → Vault History + Lending Activity 순서로 정보를 점층적으로 제공.</p>
          </DevNoteSection>
          <DevNoteSection heading="Hero Banner">
            <p>프로토콜 핵심 KPI(Total BTC Locked, Active Vaults, Total Value USD, Block Height)를 시각적으로 요약.</p>
            <p>&quot;Deposit &amp; Borrow&quot; CTA로 실제 서비스 이동 유도.</p>
          </DevNoteSection>
          <DevNoteSection heading="TVL History">
            <p>기간별 토글(7D / 30D / 180D / YTD / 1Y / ALL) 제공.</p>
            <p>Active Vault의 BTC 일별 합산을 라인 차트로 시각화.</p>
          </DevNoteSection>
          <DevNoteSection heading="Vault History & Lending Activity">
            <p>각각 최근 10건을 타임라인 형태로 표시.</p>
            <p>View All 링크로 각각 /vaults, /lending-activity 전체 목록 이동.</p>
          </DevNoteSection>
        </DevNote>

        {/* TVL History Chart */}
        <TVLHistorySection data={analytics.tvlHistory} />

        {/* Vault History + Lending Activity */}
        <HomeActivitySections />
      </div>
    </div>
  );
}
