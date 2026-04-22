import { MOCK_VAULTS, MOCK_KPIS, MOCK_ANALYTICS, MOCK_TRANSACTIONS, MOCK_ACCOUNTS, MOCK_PROVIDERS, MOCK_DAPPS } from './mock-data';
import type { Vault, Transaction, DashboardKPIs, AnalyticsData, VaultListParams, TxListParams, PaginatedResult, VaultLifecycleEvent, VaultEventType, Account, ProviderInfo, DAppInfo, AccountType } from './types';
import { queryVaults } from './utils';

/**
 * Data access layer — abstracts the data source.
 * Currently uses mock data; swap with real API fetch when available.
 */

export async function getVaults(): Promise<Vault[]> {
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
    .sort((a, b) => b.vaultSize - a.vaultSize)
    .slice(0, limit);
}

export async function getTransactions(): Promise<Transaction[]> {
  return MOCK_TRANSACTIONS;
}

export async function getTransactionByHash(hash: string): Promise<Transaction | null> {
  return MOCK_TRANSACTIONS.find((t) => t.hash === hash) ?? null;
}

export async function getTransactionList(params: TxListParams): Promise<PaginatedResult<Transaction>> {
  let filtered = [...MOCK_TRANSACTIONS];

  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.hash.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        String(t.blockNumber).includes(q),
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;
  const data = filtered.slice(start, start + params.pageSize);

  return { data, total, page, pageSize: params.pageSize, totalPages };
}

export async function getAccounts(): Promise<Account[]> {
  return MOCK_ACCOUNTS;
}

export async function getAccountByAddress(address: string): Promise<Account | null> {
  return MOCK_ACCOUNTS.find((a) => a.address.toLowerCase() === address.toLowerCase()) ?? null;
}

export async function getAccountTransactions(address: string): Promise<Transaction[]> {
  return MOCK_TRANSACTIONS.filter(
    (t) => t.from.toLowerCase() === address.toLowerCase() || t.to.toLowerCase() === address.toLowerCase(),
  );
}

export async function getAccountVaults(address: string): Promise<Vault[]> {
  return MOCK_VAULTS.filter(
    (v) =>
      v.depositorAddress.toLowerCase() === address.toLowerCase() ||
      v.providerAddress.toLowerCase() === address.toLowerCase(),
  );
}

/** Generate deterministic mock lifecycle events for a vault */
export async function getVaultLifecycle(vaultId: string): Promise<VaultLifecycleEvent[]> {
  const vault = await getVaultById(vaultId);
  if (!vault) return [];

  // Seed-based simple hash for determinism
  let seed = 0;
  for (let i = 0; i < vaultId.length; i++) seed = ((seed << 5) - seed + vaultId.charCodeAt(i)) | 0;
  const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const randHex = (len: number) => Array.from({ length: len }, () => Math.floor(rand() * 16).toString(16)).join('');

  const baseTime = new Date(vault.createdAt).getTime();
  const events: VaultLifecycleEvent[] = [];

  // Define lifecycle flow based on vault status
  const FULL_ACTIVE_FLOW: VaultEventType[] = [
    'SUBMITTED', 'SIGNATURES_POSTED', 'ACK_SUBMITTED', 'REQUEST_VERIFIED', 'ACTIVATED',
  ];
  const EXPIRED_FLOW: VaultEventType[] = [
    'SUBMITTED', 'SIGNATURES_POSTED', 'EXPIRED',
  ];
  const LIQUIDATED_FLOW: VaultEventType[] = [
    'SUBMITTED', 'SIGNATURES_POSTED', 'ACK_SUBMITTED', 'REQUEST_VERIFIED', 'ACTIVATED', 'LIQUIDATED',
  ];
  const CLAIMABLE_FLOW: VaultEventType[] = [
    'SUBMITTED', 'SIGNATURES_POSTED', 'ACK_SUBMITTED', 'REQUEST_VERIFIED', 'ACTIVATED', 'CLAIMABLE_BY',
  ];

  let flow: VaultEventType[];
  switch (vault.status) {
    case 'Expired':
      flow = EXPIRED_FLOW;
      break;
    case 'Liquidated':
      flow = LIQUIDATED_FLOW;
      break;
    case 'Redeemed':
      flow = CLAIMABLE_FLOW;
      break;
    case 'Pending':
      // Only first 1-2 steps
      flow = FULL_ACTIVE_FLOW.slice(0, 1 + Math.floor(rand() * 2));
      break;
    case 'Active':
    default:
      flow = FULL_ACTIVE_FLOW;
      break;
  }

  let elapsed = 0;
  for (const eventType of flow) {
    elapsed += Math.floor(rand() * 120 + 10) * 1000; // 10-130s between events
    const timestamp = new Date(baseTime + elapsed).toISOString();
    const event: VaultLifecycleEvent = {
      event_type: eventType,
      timestamp,
      tx_hash: `0x${randHex(64)}`,
      block_number: vault.blockNumber + Math.floor(elapsed / 12000),
      depositor: vault.depositorAddress,
      vault_provider: vault.providerAddress,
    };

    // Add conditional fields
    if (eventType === 'ACTIVATED') {
      event.secret = `0x${randHex(64)}`;
    }
    if (eventType === 'CLAIMABLE_BY') {
      event.claimer_pk = `0x${randHex(66)}`;
    }
    if (eventType === 'ACK_SUBMITTED') {
      event.acker = `0x${randHex(40)}`;
    }
    if (eventType === 'EXPIRED') {
      event.expired_reason = rand() > 0.5 ? 0 : 1;
    }

    events.push(event);
  }

  return events;
}

// ── Provider & DApp access ────────────────────────────────────────────

export async function getProviders(): Promise<ProviderInfo[]> {
  return MOCK_PROVIDERS;
}

export async function getProviderByAddress(address: string): Promise<ProviderInfo | null> {
  return MOCK_PROVIDERS.find((p) => p.address.toLowerCase() === address.toLowerCase()) ?? null;
}

export async function getDApps(): Promise<DAppInfo[]> {
  return MOCK_DAPPS;
}

export async function getDAppByAddress(appAddress: string): Promise<DAppInfo | null> {
  return MOCK_DAPPS.find((d) => d.appAddress.toLowerCase() === appAddress.toLowerCase()) ?? null;
}

export async function getFilteredAccounts(type?: AccountType): Promise<Account[]> {
  if (!type) return MOCK_ACCOUNTS;
  return MOCK_ACCOUNTS.filter((a) => a.type === type);
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
