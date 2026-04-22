import { getAnalyticsData, getDashboardKPIs, getVaults } from '@/lib/data';
import AnalyticsClient from './AnalyticsClient';

export const revalidate = 60;

/** Group vaults by creation date and produce daily vault creation stats */
function buildVaultCreationData(vaults: import('@/lib/types').Vault[]) {
  const map = new Map<string, { count: number; amount: number }>();

  for (const v of vaults) {
    const date = v.createdAt.split('T')[0];
    const existing = map.get(date) ?? { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount = parseFloat((existing.amount + v.vaultSize).toFixed(8));
    map.set(date, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { count, amount }]) => ({ date, count, amount }));
}

export default async function AnalyticsPage() {
  const [analytics, kpis, allVaults] = await Promise.all([
    getAnalyticsData(),
    getDashboardKPIs(),
    getVaults(),
  ]);

  // Top 10 active vaults sorted by size descending
  const topActiveVaults = allVaults
    .filter((v) => v.status === 'Active')
    .sort((a, b) => b.vaultSize - a.vaultSize)
    .slice(0, 10);

  const vaultCreationData = buildVaultCreationData(allVaults);

  return (
    <AnalyticsClient
      kpis={kpis}
      tvlHistory={analytics.tvlHistory}
      activeVaultHistory={analytics.activeVaultHistory}
      tvpHistory={analytics.tvpHistory}
      tnvHistory={analytics.tnvHistory}
      topActiveVaults={topActiveVaults}
      vaultCreationData={vaultCreationData}
    />
  );
}
