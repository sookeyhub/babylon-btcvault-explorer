import Link from 'next/link';
import { getAnalyticsData, getVaults } from '@/lib/data';
import { truncateAddress, formatRelativeTime, toUsd } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import HeroBanner from '@/components/HeroBanner';
import TVLHistorySection from '@/components/TVLHistorySection';
import CopyButton from '@/components/CopyButton';
import DevNote, { DevNoteSection } from '@/components/DevNote';

export const revalidate = 60;

export default async function HomePage() {
  const [analytics, allVaults] = await Promise.all([
    getAnalyticsData(),
    getVaults(),
  ]);

  const recentVaults = allVaults.slice(0, 10);

  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner />

      {/* Main content */}
      <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6">
        <DevNote title="Home 기획 의도">
          <DevNoteSection heading="페이지 목적">
            <p>프로토콜 전체 상태를 한눈에 파악하는 대시보드.</p>
            <p>Hero Banner → TVL 추이 차트 → 최근 Vault 순서로 정보를 점층적으로 제공.</p>
          </DevNoteSection>
          <DevNoteSection heading="Hero Banner">
            <p>프로토콜 핵심 KPI(Total BTC Locked, Active Vaults, Total Value USD, Block Height)를 시각적으로 요약.</p>
            <p>"Deposit & Borrow" CTA로 실제 서비스 이동 유도.</p>
          </DevNoteSection>
          <DevNoteSection heading="TVL History">
            <p>기간별 토글(7D / 30D / 180D / YTD / 1Y / ALL) 제공.</p>
            <p>Active Vault의 BTC 일별 합산을 라인 차트로 시각화.</p>
          </DevNoteSection>
          <DevNoteSection heading="Recent Vaults">
            <p>최근 생성 10개를 createdAt 내림차순으로 표시.</p>
            <p>"View All →"으로 /vaults 전체 목록 이동.</p>
            <p>컬럼: Vault ID(🔒) / Created (Age) / Status / Amount / Depositor(👤) / DApp.</p>
            <p>Created (Age)는 상대 시간(e.g. "2 hours ago")으로 표시.</p>
            <p>Amount는 원본 소수점 그대로 노출 (toFixed 없음).</p>
          </DevNoteSection>
        </DevNote>

        {/* TVL History Chart */}
        <TVLHistorySection data={analytics.tvlHistory} />

        {/* Recent Vaults Table */}
        <div className="rounded-none border border-[#cd6332]/20 bg-white">
          {/* Section heading */}
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-semibold text-[#14140f]">Recent Vaults</h2>
            <Link
              href="/vaults"
              className="text-xs font-medium text-[#cd6332] hover:text-[#b8562b]"
            >
              View All Vaults →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Created (Age)</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Depositor</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">DApp</th>
                </tr>
              </thead>
              <tbody>
                {recentVaults.map((vault) => (
                  <tr
                    key={vault.id}
                    className="border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center">
                        <svg className="mr-1 h-3.5 w-3.5 text-[#387085]/40" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        <Link
                          href={`/vaults/${vault.id}`}
                          className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                        >
                          {truncateAddress(vault.id, 6, 4)}
                        </Link>
                        <CopyButton text={vault.id} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[11px] text-[rgba(56,112,133,0.5)]">
                      {vault.createdAt ? formatRelativeTime(vault.createdAt) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <StatusBadge status={vault.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium tabular-nums text-[#14140f]">
                      {vault.vaultSize} sBTC <span className="text-[10px] font-normal text-[#387085]/40">{toUsd(vault.vaultSize)}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center">
                        <svg className="mr-1 h-3.5 w-3.5 text-[#387085]/40" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                        </svg>
                        <Link
                          href={`/accounts/${vault.depositorAddress}`}
                          className="font-mono text-[11px] text-[rgba(56,112,133,0.5)] hover:text-[#cd6332]"
                        >
                          {truncateAddress(vault.depositorAddress, 6, 4)}
                        </Link>
                        <CopyButton text={vault.depositorAddress} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[#387085]">{vault.dappName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
