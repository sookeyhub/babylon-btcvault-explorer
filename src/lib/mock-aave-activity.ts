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

/**
 * btcVaultAaveV4Position stand-in.
 * Per-depositor Aave position used by the Provider dashboard.
 */
export interface AaveV4PositionDebt {
  reserveId?: string;
  symbol: string;
  decimals: number;
  totalAmount: string;   // principal + accruedInterest (raw base units)
  principal: string;
  accruedInterest: string;
  borrowApy?: number;
}

export interface AaveV4Position {
  depositor: string;        // truncated for display
  depositorFull: string;
  proxyContract: string;
  totalCollateral: {
    symbol: string;
    decimals: number;
    amount: string;
    priceUsd: string | null;
  };
  healthFactor: string;
  currentLtv: string;
  riskPremium: string;
  /** Average collateral factor — effectively the liquidation LTV ceiling (e.g. '0.75' = 75%). */
  avgCollateralFactor?: string;
  debts: AaveV4PositionDebt[];
}

/**
 * Single Aave V4 position aggregate for the active Depositor (mock).
 * Drives the Positions-tab summary card.
 */
export const MOCK_DEPOSITOR_AAVE_POSITION: AaveV4Position = {
  depositor: '0x5a6b...3a4b',
  depositorFull: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
  proxyContract: '0x45df05cb7128227dabc8ff175219697a08d49233',
  totalCollateral: {
    symbol: 'vaultBTC',
    decimals: 8,
    amount: '5500000',
    priceUsd: '62794.36',
  },
  healthFactor: '2.41',
  currentLtv: '32.27',
  avgCollateralFactor: '0.78',
  riskPremium: '10.00',
  debts: [
    {
      reserveId: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      symbol: 'USDC',
      decimals: 6,
      totalAmount: '100000000',
      principal: '99990000',
      accruedInterest: '81',
      borrowApy: 4.2,
    },
    {
      reserveId: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      symbol: 'USDT',
      decimals: 6,
      totalAmount: '10000000',
      principal: '10000000',
      accruedInterest: '4',
      borrowApy: 5.1,
    },
    {
      reserveId: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      symbol: 'WBTC',
      decimals: 8,
      totalAmount: '1600004',
      principal: '1599894',
      accruedInterest: '146',
      borrowApy: 1.8,
    },
  ],
};

/* ── Multi-dApp positions for the Depositor Detail Positions tab ────────── */

export interface DAppPosition extends AaveV4Position {
  dappName: string;
}

export const MOCK_DEPOSITOR_DAPP_POSITIONS: DAppPosition[] = [
  {
    dappName: 'Aave v4',
    depositor: '0x8c52...e740',
    depositorFull: '0x8c5283a3f2995ecf78319bb1ca3bd9a179b3e740',
    proxyContract: '0x45df05cb7128227dabc8ff175219697a08d49233',
    totalCollateral: { symbol: 'vaultBTC', decimals: 8, amount: '5500000', priceUsd: '62794.36' },
    healthFactor: '2.41',
    currentLtv: '32.27',
    avgCollateralFactor: '0.78',
    riskPremium: '10.00',
    debts: [
      { reserveId: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', decimals: 6, totalAmount: '100000000', principal: '99990000', accruedInterest: '81', borrowApy: 4.2 },
      { reserveId: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', decimals: 6, totalAmount: '10000000', principal: '10000000', accruedInterest: '4', borrowApy: 5.1 },
      { reserveId: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', decimals: 8, totalAmount: '1600004', principal: '1599894', accruedInterest: '146', borrowApy: 1.8 },
    ],
  },
  {
    dappName: 'Compound v3',
    depositor: '0x8c52...e740',
    depositorFull: '0x8c5283a3f2995ecf78319bb1ca3bd9a179b3e740',
    proxyContract: '0x72ab3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9012',
    totalCollateral: { symbol: 'vaultBTC', decimals: 8, amount: '3200000', priceUsd: '62794.36' },
    healthFactor: '3.85',
    currentLtv: '19.48',
    avgCollateralFactor: '0.75',
    riskPremium: '8.00',
    debts: [
      { reserveId: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', decimals: 6, totalAmount: '391200000', principal: '390000000', accruedInterest: '1200000', borrowApy: 3.8 },
    ],
  },
  {
    dappName: 'Morpho Blue',
    depositor: '0x8c52...e740',
    depositorFull: '0x8c5283a3f2995ecf78319bb1ca3bd9a179b3e740',
    proxyContract: '0x93bc4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f901234',
    totalCollateral: { symbol: 'vaultBTC', decimals: 8, amount: '1800000', priceUsd: '62794.36' },
    healthFactor: '1.24',
    currentLtv: '60.48',
    avgCollateralFactor: '0.75',
    riskPremium: '12.00',
    debts: [
      { reserveId: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', decimals: 6, totalAmount: '684120000', principal: '680000000', accruedInterest: '4120000' },
      { symbol: 'WBTC', decimals: 8, totalAmount: '420015', principal: '420000', accruedInterest: '15' },
    ],
  },
];

export const MOCK_AAVE_POSITIONS: AaveV4Position[] = [
  {
    depositor: '0x5a6b...3a4b',
    depositorFull: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    proxyContract: '0x31cf0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6ddf1',
    totalCollateral: { symbol: 'sBTC', decimals: 8, amount: '3001229', priceUsd: '69014.43' },
    healthFactor: '9.71',
    currentLtv: '7.72',
    riskPremium: '10.00',
    debts: [
      {
        symbol: 'USDC',
        decimals: 6,
        totalAmount: '177876805',
        principal: '177876044',
        accruedInterest: '761',
      },
    ],
  },
  {
    depositor: '0x13eb...a439',
    depositorFull: '0x13eb4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a439',
    proxyContract: '0x42ab1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6dcd3',
    totalCollateral: { symbol: 'sBTC', decimals: 8, amount: '88344622', priceUsd: '69014.43' },
    healthFactor: '1.38',
    currentLtv: '52.40',
    riskPremium: '10.00',
    debts: [
      {
        symbol: 'USDC',
        decimals: 6,
        totalAmount: '3184200000',
        principal: '3180000000',
        accruedInterest: '4200000',
      },
    ],
  },
  {
    depositor: '0x2bbf...4778',
    depositorFull: '0x2bbf1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d4778',
    proxyContract: '0x8f121a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6dee9',
    totalCollateral: { symbol: 'sBTC', decimals: 8, amount: '145000000', priceUsd: '69014.43' },
    healthFactor: '1.08',
    currentLtv: '68.90',
    riskPremium: '10.00',
    debts: [
      {
        symbol: 'USDT',
        decimals: 6,
        totalAmount: '6901443000',
        principal: '6800000000',
        accruedInterest: '101443000',
      },
    ],
  },
  {
    depositor: '0xdba3...055d',
    depositorFull: '0xdba31a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d055d',
    proxyContract: '0x9c451a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6dfe2',
    totalCollateral: { symbol: 'sBTC', decimals: 8, amount: '62000000', priceUsd: '69014.43' },
    healthFactor: '0.94', // ← liquidation risk
    currentLtv: '79.10',
    riskPremium: '10.00',
    debts: [
      {
        symbol: 'USDC',
        decimals: 6,
        totalAmount: '3380806000',
        principal: '3250000000',
        accruedInterest: '130806000',
      },
    ],
  },
];

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

/**
 * Global lending activities across all depositors — used by the Lending Activity page.
 */
export const MOCK_GLOBAL_LENDING_ACTIVITIES: AaveV4Activity[] = ([
  ...MOCK_AAVE_V4_ACTIVITIES,
  {
    blockNumber: 10595000, logIndex: 3,
    txHash: '0xf1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f12',
    blockTime: '2026-04-09T10:15:22Z', type: 'ADD_COLLATERAL',
    vaultId: '84b105afcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604d9a87',
    depositorAddress: '0x13eb14589c9760150662450811acfd3d0d75a439',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '88344622', contractAddress: null },
  },
  {
    blockNumber: 10593200, logIndex: 6,
    txHash: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
    blockTime: '2026-04-09T02:44:11Z', type: 'BORROW',
    vaultId: null,
    depositorAddress: '0x13eb14589c9760150662450811acfd3d0d75a439',
    tokenAmount: { symbol: 'USDC', decimals: 6, amount: '31840000000', contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  },
  {
    blockNumber: 10590100, logIndex: 2,
    txHash: '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
    blockTime: '2026-04-08T18:32:05Z', type: 'ADD_COLLATERAL',
    vaultId: '6d6f1550aff811ee4a62601b215b754bc81a1961645df40b7cb4625415a2c254',
    depositorAddress: '0x2bbf3dfbcd3b0722dd14d6c567e3ee6396c84778',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '145000000', contractAddress: null },
  },
  {
    blockNumber: 10588500, logIndex: 9,
    txHash: '0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
    blockTime: '2026-04-08T11:05:33Z', type: 'BORROW',
    vaultId: null,
    depositorAddress: '0x2bbf3dfbcd3b0722dd14d6c567e3ee6396c84778',
    tokenAmount: { symbol: 'USDT', decimals: 6, amount: '68000000000', contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
  },
  {
    blockNumber: 10585000, logIndex: 1,
    txHash: '0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
    blockTime: '2026-04-07T22:18:47Z', type: 'REPAY',
    vaultId: null,
    depositorAddress: '0xdba3377f3505e1e34b01b40f6385649b5ca4055d',
    tokenAmount: { symbol: 'USDC', decimals: 6, amount: '15000000000', contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  },
  {
    blockNumber: 10582000, logIndex: 4,
    txHash: '0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f',
    blockTime: '2026-04-07T15:42:19Z', type: 'ADD_COLLATERAL',
    vaultId: '4a68a7bcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604bf7e8',
    depositorAddress: '0xdba3377f3505e1e34b01b40f6385649b5ca4055d',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '62000000', contractAddress: null },
  },
  {
    blockNumber: 10578000, logIndex: 7,
    txHash: '0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a',
    blockTime: '2026-04-06T08:30:55Z', type: 'BORROW',
    vaultId: null,
    depositorAddress: '0xdba3377f3505e1e34b01b40f6385649b5ca4055d',
    tokenAmount: { symbol: 'USDC', decimals: 6, amount: '32500000000', contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  },
  {
    blockNumber: 10575000, logIndex: 5,
    txHash: '0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    blockTime: '2026-04-05T19:11:42Z', type: 'LIQUIDATION',
    vaultId: null,
    depositorAddress: '0x2bbf3dfbcd3b0722dd14d6c567e3ee6396c84778',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '8500000', contractAddress: null },
  },
  {
    blockNumber: 10570000, logIndex: 10,
    txHash: '0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
    blockTime: '2026-04-04T14:55:08Z', type: 'REMOVE_COLLATERAL',
    vaultId: '933af5bdaff811ee4a62601b215b754bc81a1961645df40b7cb4625415a5b127',
    depositorAddress: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    tokenAmount: { symbol: 'sBTC', decimals: 8, amount: '25000000', contractAddress: null },
  },
  {
    blockNumber: 10565000, logIndex: 8,
    txHash: '0xc9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
    blockTime: '2026-04-03T09:22:31Z', type: 'REPAY',
    vaultId: null,
    depositorAddress: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    tokenAmount: { symbol: 'USDT', decimals: 6, amount: '10000000000', contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
  },
] as AaveV4Activity[]).sort((a, b) => new Date(b.blockTime).getTime() - new Date(a.blockTime).getTime());

/**
 * Global vault state-change events — used by the Vaults Activity tab.
 */
export type VaultEventType = 'VAULT_CREATED' | 'VAULT_ACTIVATED' | 'VAULT_EXPIRED' | 'VAULT_REDEEMED' | 'VAULT_LIQUIDATED';

export interface VaultActivityEvent {
  blockNumber: number;
  logIndex: number;
  txHash: string;
  blockTime: string;
  type: VaultEventType;
  vaultId: string;
  amount: string;
  depositorAddress: string;
  providerName: string;
  dappName: string;
}

export const MOCK_VAULT_ACTIVITIES: VaultActivityEvent[] = ([
  {
    blockNumber: 10596000, logIndex: 1,
    txHash: '0x1111a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    blockTime: '2026-04-09T16:30:00Z', type: 'VAULT_CREATED',
    vaultId: '933af5bdaff811ee4a62601b215b754bc81a1961645df40b7cb4625415a5b127',
    amount: '1.02306076', depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    providerName: 'vault-provider-0', dappName: 'aave-v4',
  },
  {
    blockNumber: 10594500, logIndex: 2,
    txHash: '0x2222b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
    blockTime: '2026-04-09T12:45:22Z', type: 'VAULT_ACTIVATED',
    vaultId: '933af5bdaff811ee4a62601b215b754bc81a1961645df40b7cb4625415a5b127',
    amount: '1.02306076', depositorAddress: '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    providerName: 'vault-provider-0', dappName: 'aave-v4',
  },
  {
    blockNumber: 10592000, logIndex: 5,
    txHash: '0x3333c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
    blockTime: '2026-04-09T05:18:11Z', type: 'VAULT_CREATED',
    vaultId: '84b105afcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604d9a87',
    amount: '0.83344622', depositorAddress: '0x13eb14589c9760150662450811acfd3d0d75a439',
    providerName: 'cobo-custody', dappName: 'avalon',
  },
  {
    blockNumber: 10589000, logIndex: 3,
    txHash: '0x4444d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
    blockTime: '2026-04-08T16:42:33Z', type: 'VAULT_EXPIRED',
    vaultId: 'b01957afcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604f4f44',
    amount: '0.79789793', depositorAddress: '0xdba3377f3505e1e34b01b40f6385649b5ca4055d',
    providerName: 'vault-provider-0', dappName: 'aave-v4',
  },
  {
    blockNumber: 10586000, logIndex: 4,
    txHash: '0x5555e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
    blockTime: '2026-04-08T02:11:55Z', type: 'VAULT_ACTIVATED',
    vaultId: '84b105afcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604d9a87',
    amount: '0.83344622', depositorAddress: '0x13eb14589c9760150662450811acfd3d0d75a439',
    providerName: 'cobo-custody', dappName: 'avalon',
  },
  {
    blockNumber: 10583000, logIndex: 6,
    txHash: '0x6666f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
    blockTime: '2026-04-07T18:33:42Z', type: 'VAULT_REDEEMED',
    vaultId: '6d6f1550aff811ee4a62601b215b754bc81a1961645df40b7cb4625415a2c254',
    amount: '0.74777066', depositorAddress: '0x2bbf3dfbcd3b0722dd14d6c567e3ee6396c84778',
    providerName: 'anchorage-vault', dappName: 'bedrock',
  },
  {
    blockNumber: 10580000, logIndex: 7,
    txHash: '0x7777a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
    blockTime: '2026-04-07T10:05:18Z', type: 'VAULT_LIQUIDATED',
    vaultId: '4a68a7bcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604bf7e8',
    amount: '0.56140771', depositorAddress: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    providerName: 'vault-provider-0', dappName: 'aave-v4',
  },
  {
    blockNumber: 10576000, logIndex: 2,
    txHash: '0x8888b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
    blockTime: '2026-04-06T04:22:09Z', type: 'VAULT_CREATED',
    vaultId: '4a68a7bcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604bf7e8',
    amount: '0.56140771', depositorAddress: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    providerName: 'vault-provider-0', dappName: 'aave-v4',
  },
  {
    blockNumber: 10572000, logIndex: 8,
    txHash: '0x9999c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
    blockTime: '2026-04-05T11:44:37Z', type: 'VAULT_ACTIVATED',
    vaultId: '4a68a7bcf9862e0009c86a84fb924dc558f6dbfca0916ab4366b1d4604bf7e8',
    amount: '0.56140771', depositorAddress: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    providerName: 'vault-provider-0', dappName: 'aave-v4',
  },
  {
    blockNumber: 10568000, logIndex: 3,
    txHash: '0xaaaad1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
    blockTime: '2026-04-04T06:15:51Z', type: 'VAULT_CREATED',
    vaultId: '6d6f1550aff811ee4a62601b215b754bc81a1961645df40b7cb4625415a2c254',
    amount: '0.74777066', depositorAddress: '0x2bbf3dfbcd3b0722dd14d6c567e3ee6396c84778',
    providerName: 'anchorage-vault', dappName: 'bedrock',
  },
] as VaultActivityEvent[]).sort((a, b) => new Date(b.blockTime).getTime() - new Date(a.blockTime).getTime());

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
