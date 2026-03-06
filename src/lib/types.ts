/** Vault status values derived from the spec sheet */
export type VaultStatus = 'Active' | 'Closed' | 'Pending' | 'Liquidated';

/** Core vault entity — maps to the "Vault List" / "Vault Details" section of the spec */
export interface Vault {
  id: string;
  name: string;
  status: VaultStatus;
  btcAddress: string;
  ethAddress: string;
  /** Vault size in BTC */
  vaultSize: number;
  dappName: string;
  providerName: string;
  providerAddress: string;
  createdAt: string;
  closedAt: string | null;
  btcPegInTxHash: string;
  ethPegInTxHash: string;
}

/** Dashboard KPI summary — maps to "Home > TVL / Summary" section */
export interface DashboardKPIs {
  currentTVL: number;
  activeVaultCount: number;
  totalValueProcessed: number;
  totalNumberOfVaults: number;
  /** null when data is unavailable (marked 불가능 in spec) */
  totalFeesGenerated: number | null;
  totalLiquidations: number;
  totalLiquidationCount: number;
  lastUpdated: string;
}

/** Time-series data point for charts */
export interface TimeSeriesPoint {
  date: string;
  value: number;
}

/** Analytics chart dataset */
export interface AnalyticsData {
  tvlHistory: TimeSeriesPoint[];
  activeVaultHistory: TimeSeriesPoint[];
  tvpHistory: TimeSeriesPoint[];
  tnvHistory: TimeSeriesPoint[];
  liquidationHistory: TimeSeriesPoint[];
  liquidationCountHistory: TimeSeriesPoint[];
}

/** Filter/sort options for vault list */
export interface VaultListParams {
  search: string;
  status: VaultStatus | 'All';
  sortBy: 'newest' | 'oldest' | 'size_desc' | 'size_asc';
  page: number;
  pageSize: number;
}

/** Paginated response wrapper */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
