import { MOCK_VAULTS, MOCK_KPIS, MOCK_ANALYTICS } from './mock-data';
import type { Vault, DashboardKPIs, AnalyticsData, VaultListParams, PaginatedResult } from './types';
import { queryVaults } from './utils';

/**
 * Data access layer — abstracts the data source.
 * Currently uses mock data; swap with real API/CSV fetch when available.
 *
 * All functions simulate server-side data fetching with cache compatibility.
 */

export async function getVaults(): Promise<Vault[]> {
  // In production: fetch from API/CSV, parse with parser.ts
  return MOCK_VAULTS;
}

export async function getVaultById(id: string): Promise<Vault | null> {
  const vaults = await getVaults();
  return vaults.find((v) => v.id === id) ?? null;
}

export async function getVaultList(params: VaultListParams): Promise<PaginatedResult<Vault>> {
  const vaults = await getVaults();
  return queryVaults(vaults, params);
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  return MOCK_KPIS;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  return MOCK_ANALYTICS;
}

export async function getTopVaults(limit: number = 10): Promise<Vault[]> {
  const vaults = await getVaults();
  return vaults
    .filter((v) => v.status === 'Active')
    .sort((a, b) => b.vaultSize - a.vaultSize)
    .slice(0, limit);
}

/** Get status distribution for dashboard chart */
export async function getStatusDistribution(): Promise<{ status: string; count: number; btc: number }[]> {
  const vaults = await getVaults();
  const map = new Map<string, { count: number; btc: number }>();

  for (const v of vaults) {
    const existing = map.get(v.status) ?? { count: 0, btc: 0 };
    existing.count++;
    existing.btc += v.vaultSize;
    map.set(v.status, existing);
  }

  return Array.from(map.entries()).map(([status, data]) => ({
    status,
    count: data.count,
    btc: parseFloat(data.btc.toFixed(4)),
  }));
}
