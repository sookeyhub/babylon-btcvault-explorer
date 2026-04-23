/** Vault status values matching the live explorer */
export type VaultStatus = 'Active' | 'Expired' | 'Pending' | 'Liquidated' | 'Redeemed';

/** Core vault entity — maps to the live BTCVault explorer schema */
export interface Vault {
  id: string;
  name?: string;
  status: VaultStatus;
  btcAddress: string;
  ethAddress?: string;
  depositorAddress: string;
  /** Vault size in sBTC */
  vaultSize: number;
  dappName: string;
  providerName: string;
  providerAddress: string;
  createdAt: string;
  closedAt: string | null;
  btcPegInTxHash: string;
  ethPegInTxHash?: string;
  /** HTLC hashlock */
  hashlock: string;
  /** Block number of creation tx */
  blockNumber: number;
  /** Creation transaction hash */
  createdTxHash: string;
}

/** Vault lifecycle event types (btcv_vault_lifecycle table) */
export type VaultEventType =
  | 'SUBMITTED'
  | 'SIGNATURES_POSTED'
  | 'ACK_SUBMITTED'
  | 'REQUEST_VERIFIED'
  | 'ACTIVATED'
  | 'CLAIMABLE_BY'
  | 'EXPIRED'
  | 'LIQUIDATED';

/** Single vault lifecycle event */
export interface VaultLifecycleEvent {
  event_type: VaultEventType;
  timestamp: string;
  tx_hash: string;
  block_number: number;
  depositor: string;
  vault_provider: string;
  /** ACTIVATED 시 공개되는 secret */
  secret?: string;
  /** CLAIMABLE_BY 시 claimer 공개키 */
  claimer_pk?: string;
  /** ACK_SUBMITTED 시 acker 주소 */
  acker?: string;
  /** EXPIRED 시 사유 (0=ack_timeout, 1=activation_timeout) */
  expired_reason?: number;
}

/** Account entity for the account list / detail pages */
export type AccountType = 'EOA' | 'Contract' | 'Module';

export interface Account {
  address: string;
  /** Display name — null for unnamed EOA accounts */
  name: string | null;
  type: AccountType;
  /** Balance in sBTC */
  balance: number;
  /** Percentage of total supply */
  percentage: number;
  /** Number of transactions */
  txnCount: number;
  /** Number of vaults as depositor */
  vaultCount: number;
  /** Total BTC deposited across vaults */
  totalBtc: number;
}

/** Provider info from btcv_provider_events */
export interface ProviderInfo {
  address: string;
  name: string;
  appAddress: string;
  appName: string;
  /** Commission in basis points (e.g. 500 = 5%) */
  commission: number;
  /** Number of vaults managed */
  vaultCount: number;
  /** Total BTC managed */
  totalBtc: number;
  /** Active vault count */
  activeVaults: number;
}

/** Depositor info aggregated from btcv_vaults */
export interface DepositorInfo {
  address: string;
  /** Total vault count as depositor */
  totalVaults: number;
  /** Active vault count */
  activeVaults: number;
  /** Total BTC deposited */
  totalBtc: number;
  /** ISO timestamp of first deposit */
  firstDeposit: string;
}

/** DApp info from btcv_applications */
export interface DAppInfo {
  appAddress: string;
  name: string;
  /** Connected provider count */
  providerCount: number;
  /** Total vault count */
  vaultCount: number;
  /** Total BTC */
  totalBtc: number;
  /** Active vault count */
  activeVaults: number;
}

/** Dashboard KPI summary */
export interface DashboardKPIs {
  /** Total Value Locked in sBTC */
  currentTVL: number;
  activeVaultCount: number;
  /** Total Value Processed in sBTC */
  totalValueProcessed: number;
  totalNumberOfVaults: number;
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
}

/** Transaction entity — maps to the live explorer tx list/detail */
export type TxStatus = 'SUCCESS' | 'FAILED';

export interface Transaction {
  hash: string;
  status: TxStatus;
  /** Method signature (e.g. 0x2d4388c8) */
  method: string;
  blockNumber: number;
  timestamp: string;
  from: string;
  to: string;
  /** Amount in ETH */
  amount: number;
  /** Tx fee in ETH */
  txFee: number;
  /** Gas used */
  gasUsed: number;
  /** Gas limit */
  gasLimit: number;
  /** Gas price in Gwei */
  gasPrice: number;
  /** EIP-1559 base fee in Gwei */
  baseFee: number;
  /** EIP-1559 max fee per gas in Gwei */
  maxFeePerGas: number;
  /** EIP-1559 max priority fee in Gwei */
  maxPriorityFee: number;
  /** Burnt fees in ETH */
  burntFees: number;
  /** Tx type (2 = EIP-1559) */
  txType: number;
  nonce: number;
  /** Position in block */
  positionInBlock: number;
  /** From account type */
  fromType: 'EOA' | 'Contract';
  /** To account type */
  toType: 'EOA' | 'Contract';
  /** Raw input data hex */
  inputData: string;
  /** Event logs emitted by the transaction */
  logs: TransactionLog[];
}

/** Event log emitted by a transaction */
export interface TransactionLog {
  /** Log index in the block */
  logIndex: number;
  /** Contract address that emitted the event */
  address: string;
  /** Event name hash */
  name: string;
  /** Indexed topics */
  topics: string[];
  /** Non-indexed data */
  data: string;
}

/** Filter/sort options for transaction list */
export interface TxListParams {
  search: string;
  page: number;
  pageSize: number;
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
