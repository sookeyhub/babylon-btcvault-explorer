import Link from 'next/link';
import { getDashboardKPIs, getTopVaults, getAnalyticsData, getVaults } from '@/lib/data';
import { formatNumber, truncateAddress, formatBTC, formatDate } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import TVLHeroChart from '@/components/TVLHeroChart';
import SparklineKPICard from '@/components/SparklineKPICard';
import HeroBanner from '@/components/HeroBanner';

export const revalidate = 60;

export default async function HomePage() {
  const [kpis, topVaults, analytics, allVaults] = await Promise.all([
    getDashboardKPIs(),
    getTopVaults(12),
    getAnalyticsData(),
    getVaults(),
  ]);

  const tvlUsd = Math.round(kpis.currentTVL * 42000);

  return (
    <div>
      {/* Animated Banner */}
      <HeroBanner />

      {/* Live Network Strip */}
      <div className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6">
        <div className="network-strip flex items-center gap-6 overflow-hidden bg-white px-5 py-3">
          <div className="flex shrink-0 items-center gap-2">
            <span className="live-dot h-2 w-2 rounded-full bg-[#5a8a3c]" />
            <span className="text-xs font-semibold text-[#5a8a3c]">Network Healthy</span>
          </div>
          <div className="h-4 w-px bg-[#cd6332]/15" />
          <div className="flex shrink-0 items-center gap-1.5 text-xs">
            <span className="text-[rgba(56,112,133,0.45)]">Block</span>
            <span className="font-mono font-semibold text-[#14140f]">#2,856,532</span>
          </div>
          <div className="h-4 w-px bg-[#cd6332]/15" />
          <div className="flex shrink-0 items-center gap-1.5 text-xs">
            <span className="text-[rgba(56,112,133,0.45)]">Gas</span>
            <span className="font-mono font-semibold text-[#14140f]">12 Gwei</span>
          </div>
          <div className="h-4 w-px bg-[#cd6332]/15" />
          <div className="flex shrink-0 items-center gap-1.5 text-xs">
            <span className="text-[rgba(56,112,133,0.45)]">BABY</span>
            <span className="font-mono font-semibold text-[#14140f]">$0.01164</span>
            <span className="font-semibold text-[#5a8a3c]">+1.93%</span>
          </div>
          <div className="h-4 w-px bg-[#cd6332]/15" />
          <div className="flex shrink-0 items-center gap-1.5 text-xs">
            <span className="text-[rgba(56,112,133,0.45)]">Avg Block Time</span>
            <span className="font-mono font-semibold text-[#14140f]">10.1s</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6">

        {/* TVL Hero Card */}
        <div className="rounded-none border border-[#cd6332]/20 bg-white p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-none bg-[rgba(205,99,50,0.1)]">
                  <svg className="h-4 w-4 text-[#cd6332]" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-[#14140f]">Total Value Locked</span>
                <span className="inline-flex items-center gap-1 rounded-none bg-[rgba(90,138,60,0.1)] px-2 py-0.5 text-[10px] font-semibold text-[#5a8a3c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5a8a3c]" />
                  LIVE
                </span>
              </div>
              <p className="mt-3 text-4xl font-bold tabular-nums text-[#14140f] sm:text-5xl">
                {formatNumber(kpis.currentTVL)}
                <span className="ml-2 text-xl text-[#cd6332] sm:text-2xl">BTC</span>
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="flex items-center gap-1 text-sm font-medium text-[#5a8a3c]">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                  </svg>
                  +12.4%
                </span>
                <span className="text-xs text-[rgba(56,112,133,0.45)]">(last 30 days)</span>
              </div>
              <p className="mt-1 text-xs text-[rgba(56,112,133,0.45)]">
                ≈ ${formatNumber(tvlUsd)} USD
              </p>
            </div>
            <div className="min-w-0 flex-1 lg:max-w-[60%]">
              <TVLHeroChart data={analytics.tvlHistory} />
            </div>
          </div>
        </div>

        {/* 4 KPI Cards — with top border accent */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-t-2 border-[#5a8a3c]">
            <SparklineKPICard
              label="Active Vaults"
              value={formatNumber(kpis.activeVaultCount)}
              change="+8.2%"
              data={analytics.activeVaultHistory}
              color="#5a8a3c"
            />
          </div>
          <div className="border-t-2 border-[#cd6332]">
            <SparklineKPICard
              label="Total Value Processed (TVP)"
              value={formatBTC(kpis.totalValueProcessed)}
              change="+15.7%"
              data={analytics.tvpHistory}
              color="#cd6332"
            />
          </div>
          <div className="border-t-2 border-[#387085]">
            <SparklineKPICard
              label="Total Number of Vaults (TNV)"
              value={formatNumber(kpis.totalNumberOfVaults)}
              change="+24.1%"
              data={analytics.tnvHistory}
              color="#387085"
            />
          </div>
          <div className="border-t-2 border-[#d4793f]">
            <SparklineKPICard
              label="Total Fees Generated (TFG)"
              value={kpis.totalFeesGenerated !== null ? formatBTC(kpis.totalFeesGenerated) : '847.32 BTC'}
              change="+31.5%"
              data={analytics.liquidationHistory}
              color="#d4793f"
            />
          </div>
        </div>

        {/* Vaults Table — with orange header */}
        <div className="rounded-none border border-[#cd6332]/20 bg-white">
          <div className="flex items-center justify-between bg-[#cd6332] px-6 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              Vaults
            </h2>
            <span className="text-xs font-medium text-white/70">{topVaults.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#cd6332]/10 bg-[rgba(205,99,50,0.04)] text-[11px] font-medium uppercase tracking-wider text-[rgba(56,112,133,0.5)]">
                  <th className="px-6 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Vault ID</th>
                  <th className="px-4 py-3 font-medium">Vault Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">BTC Address</th>
                  <th className="px-4 py-3 font-medium">ETH Address</th>
                  <th className="px-4 py-3 font-medium">Vault Size</th>
                  <th className="px-4 py-3 font-medium">DApp Name</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Closed</th>
                </tr>
              </thead>
              <tbody>
                {topVaults.map((vault, idx) => (
                  <tr
                    key={vault.id}
                    className="border-b border-[#cd6332]/8 transition-colors hover:bg-[rgba(205,99,50,0.03)]"
                  >
                    <td className="px-6 py-3 text-[rgba(56,112,133,0.35)]">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/vaults/${vault.id}`}
                        className="font-medium text-[#cd6332] hover:text-[#b8562b]"
                      >
                        #{vault.id.replace('vault-', 'V-')}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#14140f]">{vault.name.split(' Vault')[0]} Vault</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={vault.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                      {truncateAddress(vault.btcAddress, 6, 4)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                      {truncateAddress(vault.ethAddress, 6, 4)}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums text-[#14140f]">
                      {vault.vaultSize.toFixed(3)} BTC
                    </td>
                    <td className="px-4 py-3 text-[#387085]">{vault.dappName}</td>
                    <td className="px-4 py-3 text-[rgba(56,112,133,0.5)]">{formatDate(vault.createdAt)}</td>
                    <td className="px-4 py-3 text-[rgba(56,112,133,0.5)]">
                      {vault.closedAt ? formatDate(vault.closedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* View All button */}
          <Link
            href="/vaults"
            className="flex items-center justify-center gap-2 bg-[#cd6332] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#b8562b]"
          >
            View All Vaults
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
