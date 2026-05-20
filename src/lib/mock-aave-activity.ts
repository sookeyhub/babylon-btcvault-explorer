/**
 * Mock Aave-style DeFi activity for Depositor accounts.
 * Stand-in until btcv_vault_activity / Aave events are wired up.
 */
export type AaveActivityType = 'ADD COLLATERAL' | 'BORROW' | 'REPAY' | 'LIQUIDATION';

export interface AaveActivity {
  type: AaveActivityType;
  txHash: string;
  asset: string;
  amount: string;
  age: string;
  txFee: string;
}

export const MOCK_AAVE_ACTIVITY: AaveActivity[] = [
  {
    type: 'ADD COLLATERAL',
    txHash: '0x6ced3a8b9c2d4e1f5a7b9c8d6e3f2a1b4c5d7e8f9a0b1c2d3e4f5a6b7c8d1d58',
    asset: 'BTC',
    amount: '+ 1.02 sBTC',
    age: 'Apr 8, 2026',
    txFee: '0.00009 ETH',
  },
  {
    type: 'BORROW',
    txHash: '0x676a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e280c',
    asset: 'USDC',
    amount: '- 45,000 USDC',
    age: 'Apr 6, 2026',
    txFee: '0.00006 ETH',
  },
  {
    type: 'REPAY',
    txHash: '0x473b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1f4f',
    asset: 'USDC',
    amount: '+ 20,000 USDC',
    age: 'Mar 30, 2026',
    txFee: '0.00009 ETH',
  },
  {
    type: 'LIQUIDATION',
    txHash: '0x69aa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e3417',
    asset: 'BTC',
    amount: '- 0.15 sBTC',
    age: 'Mar 29, 2026',
    txFee: '0.00014 ETH',
  },
  {
    type: 'BORROW',
    txHash: '0x3bc04f5e6d7c8b9a0e1f2d3c4b5a6987f6e5d4c3b2a190f8e7d6c5b4a3f2ee48',
    asset: 'USDT',
    amount: '- 30,000 USDT',
    age: 'Mar 26, 2026',
    txFee: '0.00012 ETH',
  },
];

/**
 * btcVaultAaveV4Activities GraphQL API stand-in.
 * Each entry is one on-chain activity event tied to a Depositor.
 */
export type AaveV4ActivityType =
  | 'ADD_COLLATERAL'
  | 'REMOVE_COLLATERAL'
  | 'BORROW'
  | 'REPAY'
  | 'LIQUIDATION';

export interface TokenAmount {
  symbol: string;
  decimals: number;
  amount: string; // raw base units
  contractAddress: string | null;
}

export interface AaveV4Activity {
  blockNumber: number;
  logIndex: number;
  txHash: string;
  blockTime: string;
  type: AaveV4ActivityType;
  vaultId: string | null;
  depositorAddress: string;
  tokenAmount: TokenAmount;
}

export const MOCK_AAVE_V4_ACTIVITIES: AaveV4Activity[] = [
  {
    blockNumber: 10591568,
    logIndex: 12,
    txHash: '0x6ced930f4e8a2b1c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f31d58',
    blockTime: '2026-04-08T14:23:11Z',
    type: 'ADD_COLLATERAL',
    vaultId: '933af5bdaff811ee4a62601b215b754bc81a1961645df40b7cb4625415a5b127',
    depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '102306076', contractAddress: null },
  },
  {
    blockNumber: 10567960,
    logIndex: 5,
    txHash: '0x676a2801c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d280c',
    blockTime: '2026-04-06T09:17:44Z',
    type: 'BORROW',
    vaultId: null,
    depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    tokenAmount: {
      symbol: 'USDC',
      decimals: 6,
      amount: '42000000000',
      contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
  },
  {
    blockNumber: 10512976,
    logIndex: 3,
    txHash: '0x473b1f4e8a2b1c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a11f4f',
    blockTime: '2026-03-30T21:05:33Z',
    type: 'REPAY',
    vaultId: null,
    depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    tokenAmount: {
      symbol: 'USDC',
      decimals: 6,
      amount: '20000000000',
      contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
  },
  {
    blockNumber: 10509875,
    logIndex: 8,
    txHash: '0x69aa3401c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c341700',
    blockTime: '2026-03-29T18:44:02Z',
    type: 'LIQUIDATION',
    vaultId: null,
    depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '15000000', contractAddress: null },
  },
  {
    blockNumber: 10574932,
    logIndex: 2,
    txHash: '0x3bc0ee4e8a2b1c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3aeee48',
    blockTime: '2026-03-26T11:30:58Z',
    type: 'BORROW',
    vaultId: null,
    depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    tokenAmount: {
      symbol: 'USDT',
      decimals: 6,
      amount: '30000000000',
      contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
  },
  {
    blockNumber: 10591268,
    logIndex: 7,
    txHash: '0xaa13b701c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5cbb877f',
    blockTime: '2026-03-20T08:12:37Z',
    type: 'REPAY',
    vaultId: null,
    depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    tokenAmount: {
      symbol: 'USDT',
      decimals: 6,
      amount: '30000000000',
      contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    },
  },
  {
    blockNumber: 10598000,
    logIndex: 1,
    txHash: '0xa72351c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6113c0ff',
    blockTime: '2026-03-16T15:44:21Z',
    type: 'ADD_COLLATERAL',
    vaultId: '84b105afcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604d9a87',
    depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '83344622', contractAddress: null },
  },
  {
    blockNumber: 10520222,
    logIndex: 4,
    txHash: '0x72356a51c9d7e6f3a4b5c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6a5b01',
    blockTime: '2026-03-13T07:22:15Z',
    type: 'REMOVE_COLLATERAL',
    vaultId: 'b01957afcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604f4f44',
    depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '79789793', contractAddress: null },
  },
];

/**
 * Per-vault aave_position_collateral + outstanding loan from vault_activity.
 * Used by the Depositor "Positions" tab.
 */
export type CollateralPositionStatus = 'ACTIVE' | 'PENDING' | 'REDEEMED' | 'EXPIRED' | 'LIQUIDATED';

export interface CollateralPosition {
  vaultId: string;
  vaultIdFull: string;
  collateral: number;
  borrowed: number;
  borrowedAsset: string;
  interest: number | null;
  status: CollateralPositionStatus;
}

/**
 * Asset-aggregated portfolio view for the Depositor "Positions" tab.
 * Each entry is one asset (e.g. sBTC) summed across all of the depositor's vaults.
 * Today the protocol only supports sBTC collateral but the structure is array-shaped
 * for forward compatibility.
 */
export interface PortfolioPosition {
  asset: string;
  assetIcon: string;
  collateral: number;
  collateralVaults: number;
  activeVaults: number;
  borrowed: number;
  borrowedAsset: string;
  totalBorrowed: number;
  totalRepaid: number;
  interest: number | null;
  ltv: number | null;
  healthFactor: number | null;
}

export const MOCK_PORTFOLIO_POSITIONS: PortfolioPosition[] = [
  {
    asset: 'sBTC',
    assetIcon: '₿',
    collateral: 7.4281,
    collateralVaults: 10,
    activeVaults: 4,
    borrowed: 87000,
    borrowedAsset: 'USDC',
    totalBorrowed: 145000,
    totalRepaid: 58000,
    interest: 432.18,
    ltv: 19.5,
    healthFactor: 4.1,
  },
  {
    asset: 'wBTC',
    assetIcon: '₿',
    collateral: 2.5104,
    collateralVaults: 3,
    activeVaults: 3,
    borrowed: 32500,
    borrowedAsset: 'USDT',
    totalBorrowed: 50000,
    totalRepaid: 17500,
    interest: 218.04,
    ltv: 21.6,
    healthFactor: 3.7,
  },
  {
    asset: 'ETH',
    assetIcon: 'Ξ',
    collateral: 18.42,
    collateralVaults: 2,
    activeVaults: 1,
    borrowed: 0,
    borrowedAsset: 'USDC',
    totalBorrowed: 24000,
    totalRepaid: 24000,
    interest: 0,
    ltv: 0,
    healthFactor: null, // no outstanding debt
  },
  {
    asset: 'cbBTC',
    assetIcon: '₿',
    collateral: 0.8842,
    collateralVaults: 1,
    activeVaults: 1,
    borrowed: 15000,
    borrowedAsset: 'USDC',
    totalBorrowed: 15000,
    totalRepaid: 0,
    interest: 49.27,
    ltv: 28.3,
    healthFactor: 2.83,
  },
  // Healthy (HF 1.5-2)
  {
    asset: 'stETH',
    assetIcon: 'Ξ',
    collateral: 12.5,
    collateralVaults: 4,
    activeVaults: 4,
    borrowed: 28500,
    borrowedAsset: 'USDC',
    totalBorrowed: 40000,
    totalRepaid: 11500,
    interest: 156.42,
    ltv: 52.4,
    healthFactor: 1.78,
  },
  // Caution (HF 1.2-1.5)
  {
    asset: 'tBTC',
    assetIcon: '₿',
    collateral: 1.5,
    collateralVaults: 2,
    activeVaults: 2,
    borrowed: 58000,
    borrowedAsset: 'USDC',
    totalBorrowed: 60000,
    totalRepaid: 2000,
    interest: 312.85,
    ltv: 64.5,
    healthFactor: 1.36,
  },
  // At Risk (HF 1.0-1.2)
  {
    asset: 'BNB',
    assetIcon: 'B',
    collateral: 25.0,
    collateralVaults: 1,
    activeVaults: 1,
    borrowed: 12000,
    borrowedAsset: 'USDT',
    totalBorrowed: 12000,
    totalRepaid: 0,
    interest: 84.31,
    ltv: 81.7,
    healthFactor: 1.08,
  },
  // Liquidation (HF < 1.0)
  {
    asset: 'AVAX',
    assetIcon: 'A',
    collateral: 150.0,
    collateralVaults: 3,
    activeVaults: 1,
    borrowed: 5500,
    borrowedAsset: 'USDC',
    totalBorrowed: 6000,
    totalRepaid: 500,
    interest: 62.74,
    ltv: 94.8,
    healthFactor: 0.92,
  },
];

export const MOCK_COLLATERAL_POSITIONS: CollateralPosition[] = [
  {
    vaultId: '933af5bd...5b127',
    vaultIdFull: '933af5bdaff811ee4a62601b215b754bc81a1961645df40b7cb4625415a5b127',
    collateral: 1.02306076,
    borrowed: 42000,
    borrowedAsset: 'USDC',
    interest: 217.45,
    status: 'ACTIVE',
  },
  {
    vaultId: '84b105af...d9a87',
    vaultIdFull: '84b105afcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604d9a87',
    collateral: 0.83344622,
    borrowed: 0,
    borrowedAsset: 'USDC',
    interest: 0,
    status: 'ACTIVE',
  },
  {
    vaultId: 'b01957af...f4f44',
    vaultIdFull: 'b01957afcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604f4f44',
    collateral: 0.79789793,
    borrowed: 30000,
    borrowedAsset: 'USDT',
    interest: 142.88,
    status: 'EXPIRED',
  },
  {
    vaultId: '6d6f1550...2c254',
    vaultIdFull: '6d6f1550aff811ee4a62601b215b754bc81a1961645df40b7cb4625415a2c254',
    collateral: 0.74777066,
    borrowed: 0,
    borrowedAsset: 'USDC',
    interest: 0,
    status: 'REDEEMED',
  },
  {
    vaultId: '4a68a7b...bf7e8',
    vaultIdFull: '4a68a7bcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604bf7e8',
    collateral: 0.56140771,
    borrowed: 15000,
    borrowedAsset: 'USDC',
    interest: 72.16,
    status: 'ACTIVE',
  },
];
