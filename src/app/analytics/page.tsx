import { getAnalyticsData, getDashboardKPIs, getTopVaults } from '@/lib/data';
import { formatBTC, formatNumber } from '@/lib/utils';
import KPICard from '@/components/KPICard';
import AreaChartCard from '@/components/AreaChartCard';
import VaultTable from '@/components/VaultTable';

export const revalidate = 60;

export default async function AnalyticsPage() {
  const [analytics, kpis, topVaults] = await Promise.all([
    getAnalyticsData(),
    getDashboardKPIs(),
    getTopVaults(10),
  ]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-lg font-semibold text-[#14140f]">Analytics</h1>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard label="Current TVL" value={formatBTC(kpis.currentTVL)} accent />
        <KPICard label="Active Vaults" value={formatNumber(kpis.activeVaultCount)} />
        <KPICard label="Total Value Processed" value={formatBTC(kpis.totalValueProcessed)} />
        <KPICard label="Total Vaults" value={formatNumber(kpis.totalNumberOfVaults)} />
      </div>

      {/* TVL vs Active Vault */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[#14140f]">
          TVL vs. Active Vaults
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <AreaChartCard
            title="Total Value Locked"
            data={analytics.tvlHistory}
            color="#cd6332"
            valueSuffix=" BTC"
          />
          <AreaChartCard
            title="Active Vault Count"
            data={analytics.activeVaultHistory}
            color="#5a8a3c"
          />
        </div>
      </div>

      {/* TVP vs TNV */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[#14140f]">
          TVP vs. Total Vaults
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <AreaChartCard
            title="Total Value Processed"
            data={analytics.tvpHistory}
            color="#387085"
            valueSuffix=" BTC"
          />
          <AreaChartCard
            title="Total Number of Vaults"
            data={analytics.tnvHistory}
            color="#4a8fa5"
          />
        </div>
      </div>

      {/* Liquidation */}
      <div>
        <p className="mb-3 text-sm font-semibold text-[#14140f]">
          Liquidation
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <AreaChartCard
            title="Total Liquidation Amount"
            data={analytics.liquidationHistory}
            color="#c83232"
            valueSuffix=" BTC"
          />
          <AreaChartCard
            title="Number of Liquidations"
            data={analytics.liquidationCountHistory}
            color="#cd6332"
          />
        </div>
      </div>

      {/* Top Vaults */}
      <VaultTable
        vaults={topVaults}
        compact
        title="Top Active Vaults"
      />
    </div>
  );
}
