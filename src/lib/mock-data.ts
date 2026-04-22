import type { Vault, DashboardKPIs, AnalyticsData, TimeSeriesPoint, Transaction, Account, ProviderInfo, DAppInfo, DepositorInfo } from './types';

/**
 * Mock vault data — synced with live testnet explorer data patterns.
 * Provider: vault-provider-0, DApp: aave-v4, Unit: sBTC
 */

const PROVIDER_NAME = 'vault-provider-0';
const PROVIDER_ADDRESS = '0xaf8d9d665f4e27f3966a074dce5c50684bfbe358';
const DAPP_NAME = 'aave-v4';

// Additional providers (distributed across vaults for variety)
const PROVIDERS = [
  { name: 'vault-provider-0',  address: '0xaf8d9d665f4e27f3966a074dce5c50684bfbe358', commission: 500,  appAddress: '0x2ec4128df7c515ecfbcdcf8813e9471249e134e6', appName: 'aave-v4' },
  { name: 'fireblocks-vault',  address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5', commission: 750,  appAddress: '0x7f3a8b9c2d4e6f1a3b5c7d9e0f2a4b6c8d0e1f3a', appName: 'lorenzo'  },
  { name: 'cobo-custody',      address: '0x174338e0dfd272e5f52b8dd3d7e1831d3e970abc', commission: 400,  appAddress: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e', appName: 'avalon'   },
  { name: 'anchorage-vault',   address: '0x7a3c1102bfae5a31dfd0b3cc012e87fe6721411f', commission: 600,  appAddress: '0x8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a', appName: 'bedrock'  },
  { name: 'ceffu-secure',      address: '0x9e4b2c1a3d5e7f8a0b9c1d2e3f4a5b6c7d8e9f0a', commission: 350,  appAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', appName: 'bouncebit'},
];

const STATUSES: Vault['status'][] = ['Active', 'Active', 'Expired', 'Expired', 'Expired', 'Pending', 'Liquidated', 'Redeemed'];

const DEPOSITORS = [
  '0x8c5283a3f2995ecf78319bb1ca3bd9a179b3e740',
  '0xdba3377f3505e1e34b01b40f6385649b5ca4055d',
  '0xf7e3252b6e869c798d09c8d2502185db5ddd41ee',
  '0x2bbf3dfbcd3b0722dd14d6c567e3ee6396c84778',
  '0x13eb14589c9760150662450811acfd3d0d75a439',
  '0x4a7b9c2e1d8f6a3b5c4d9e2f1a6b7c8d9e3f1a2b',
  '0x9e8d7c6b5a4f3e2d1c0b9a8e7f6d5c4b3a2f1e0d',
  '0x1f2e3d4c5b6a7e8f9d0c1b2a3e4f5d6c7b8a9e0f',
  '0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
  '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
  '0x7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e',
  '0xf1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0',
  '0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
  '0x6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
  '0xc9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8',
  '0x0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
  '0x5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c',
  '0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
  '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
  '0xe3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
  '0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
  '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
  '0xd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
  '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
  '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e',
  '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
  '0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
  '0xa4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
  '0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
  '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
];

// Seed-based pseudo-random for deterministic mock data
let _seed = 42;
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function randomHex(length: number): string {
  const hex = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) result += hex[Math.floor(seededRandom() * hex.length)];
  return result;
}

function randomTestnetBtcAddress(): string {
  return `tb1p${randomHex(58)}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + seededRandom() * (end.getTime() - start.getTime()));
}

export function generateMockVaults(count: number = 240): Vault[] {
  _seed = 42; // Reset seed for determinism
  const vaults: Vault[] = [];
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-04-10');

  for (let i = 1; i <= count; i++) {
    const status = pick(STATUSES);
    const created = randomDate(startDate, endDate);
    // Vary vault sizes to match live data patterns (0.001 - 1.1 sBTC)
    const size = parseFloat((seededRandom() * 1.05 + 0.001).toFixed(8));
    const blockNumber = 10500000 + Math.floor(seededRandom() * 100000);

    // Weighted provider selection: vault-provider-0 gets ~50%, others split rest
    const roll = seededRandom();
    const providerIdx =
      roll < 0.5 ? 0 :
      roll < 0.68 ? 1 :
      roll < 0.82 ? 2 :
      roll < 0.93 ? 3 : 4;
    const provider = PROVIDERS[providerIdx];

    vaults.push({
      id: randomHex(64),
      status,
      btcAddress: randomTestnetBtcAddress(),
      depositorAddress: pick(DEPOSITORS),
      vaultSize: size,
      dappName: provider.appName,
      providerName: provider.name,
      providerAddress: provider.address,
      createdAt: created.toISOString(),
      closedAt: null,
      btcPegInTxHash: randomHex(64),
      hashlock: `0x${randomHex(64)}`,
      blockNumber,
      createdTxHash: `0x${randomHex(64)}`,
    });
  }

  return vaults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateMockKPIs(vaults: Vault[]): DashboardKPIs {
  return {
    currentTVL: 1.12937239,
    activeVaultCount: vaults.filter((v) => v.status === 'Active').length,
    totalValueProcessed: 4.11339688,
    totalNumberOfVaults: vaults.length,
    lastUpdated: new Date().toISOString(),
  };
}

function generateTimeSeries(days: number, baseValue: number, volatility: number): TimeSeriesPoint[] {
  _seed = (_seed * 16807 + 0) % 2147483647; // advance seed
  const points: TimeSeriesPoint[] = [];
  let value = baseValue;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value = Math.max(0, value + (seededRandom() - 0.45) * volatility);
    points.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(value.toFixed(4)),
    });
  }
  return points;
}

export function generateMockAnalytics(): AnalyticsData {
  _seed = 100;
  return {
    tvlHistory: generateTimeSeries(180, 0.8, 0.05),
    activeVaultHistory: generateTimeSeries(180, 60, 5),
    tvpHistory: generateTimeSeries(180, 2.5, 0.2),
    tnvHistory: generateTimeSeries(180, 140, 8),
  };
}

const TX_METHOD = '0x2d4388c8';
const CONTRACT_ADDRESS = '0x2ec4128df7c515ecfbcdcf8813e9471249e134e6';

function generateMockLog(contractAddr: string, logIndex: number): import('./types').TransactionLog {
  const eventName = `0x${randomHex(64)}`;
  return {
    logIndex,
    address: contractAddr,
    name: eventName,
    topics: [
      eventName,
      `0x${randomHex(64)}`,
      `0x000000000000000000000000${randomHex(40)}`,
      `0x000000000000000000000000${randomHex(40)}`,
    ],
    data: `0x${'0'.repeat(62)}${Math.floor(seededRandom() * 16).toString(16)}${Math.floor(seededRandom() * 16).toString(16)}`,
  };
}

export function generateMockTransactions(vaults: Vault[]): Transaction[] {
  _seed = 200;
  const txs: Transaction[] = [];

  // Generate transactions from vault creation txs
  for (const vault of vaults) {
    const gasUsed = 50000 + Math.floor(seededRandom() * 30000);
    const gasLimit = gasUsed + Math.floor(seededRandom() * 15000);
    const baseFee = parseFloat((seededRandom() * 0.003 + 0.001).toFixed(9));
    const gasUsedPct = gasUsed / gasLimit;

    txs.push({
      hash: vault.createdTxHash,
      status: 'SUCCESS',
      method: TX_METHOD,
      blockNumber: vault.blockNumber,
      timestamp: vault.createdAt,
      from: vault.depositorAddress,
      to: CONTRACT_ADDRESS,
      amount: 0,
      txFee: parseFloat((gasUsed * baseFee * 1e-9).toFixed(13)),
      gasUsed,
      gasLimit,
      gasPrice: baseFee,
      baseFee,
      maxFeePerGas: parseFloat((baseFee * 4).toFixed(9)),
      maxPriorityFee: parseFloat((0.001).toFixed(9)),
      burntFees: 0,
      txType: 2,
      nonce: Math.floor(seededRandom() * 1000),
      positionInBlock: Math.floor(seededRandom() * 300),
      fromType: 'EOA',
      toType: 'Contract',
      inputData: `0x2d4388c8${randomHex(128)}`,
      logs: [generateMockLog(CONTRACT_ADDRESS, 1000 + Math.floor(seededRandom() * 500))],
    });
  }

  // Add some extra non-vault txs
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-04-10');
  for (let i = 0; i < 300; i++) {
    const gasUsed = 50000 + Math.floor(seededRandom() * 30000);
    const gasLimit = gasUsed + Math.floor(seededRandom() * 15000);
    const baseFee = parseFloat((seededRandom() * 0.003 + 0.001).toFixed(9));
    const blockNumber = 10500000 + Math.floor(seededRandom() * 100000);
    const timestamp = randomDate(startDate, endDate);

    txs.push({
      hash: `0x${randomHex(64)}`,
      status: seededRandom() > 0.05 ? 'SUCCESS' : 'FAILED',
      method: TX_METHOD,
      blockNumber,
      timestamp: timestamp.toISOString(),
      // Mix in some provider-initiated txs so provider accounts show activity
      from: seededRandom() < 0.35 ? PROVIDERS[Math.floor(seededRandom() * PROVIDERS.length)].address : pick(DEPOSITORS),
      to: CONTRACT_ADDRESS,
      amount: 0,
      txFee: parseFloat((gasUsed * baseFee * 1e-9).toFixed(13)),
      gasUsed,
      gasLimit,
      gasPrice: baseFee,
      baseFee,
      maxFeePerGas: parseFloat((baseFee * 4).toFixed(9)),
      maxPriorityFee: parseFloat((0.001).toFixed(9)),
      burntFees: 0,
      txType: 2,
      nonce: Math.floor(seededRandom() * 1000),
      positionInBlock: Math.floor(seededRandom() * 300),
      fromType: 'EOA',
      toType: 'Contract',
      inputData: `0x2d4388c8${randomHex(128)}`,
      logs: [generateMockLog(CONTRACT_ADDRESS, 1000 + Math.floor(seededRandom() * 500))],
    });
  }

  return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateMockAccounts(vaults: Vault[], txs: Transaction[]): Account[] {
  _seed = 300;
  const accounts: Account[] = [];
  const addressSet = new Set<string>();

  // Helper: count vaults & total BTC for a depositor address
  const depositorStats = (addr: string) => {
    const v = vaults.filter((x) => x.depositorAddress === addr);
    return { vaultCount: v.length, totalBtc: parseFloat(v.reduce((s, x) => s + x.vaultSize, 0).toFixed(8)) };
  };

  // Module accounts (system-level)
  const moduleAccounts: { name: string; address: string; balance: number }[] = [
    { name: 'Vault Module Account', address: `0x${randomHex(40)}`, balance: parseFloat((seededRandom() * 500 + 100).toFixed(4)) },
    { name: 'Distribution Module Account', address: `0x${randomHex(40)}`, balance: parseFloat((seededRandom() * 200 + 50).toFixed(4)) },
    { name: 'Staking Module Account', address: `0x${randomHex(40)}`, balance: parseFloat((seededRandom() * 100 + 20).toFixed(4)) },
    { name: 'Fee Collector Account', address: `0x${randomHex(40)}`, balance: parseFloat((seededRandom() * 50 + 5).toFixed(4)) },
  ];

  for (const mod of moduleAccounts) {
    addressSet.add(mod.address);
    accounts.push({
      address: mod.address, name: mod.name, type: 'Module',
      balance: mod.balance, percentage: 0,
      txnCount: Math.floor(seededRandom() * 5000 + 500),
      vaultCount: 0, totalBtc: 0,
    });
  }

  // Contract accounts (DApp) — one per distinct DApp contract address
  const dappMap = new Map<string, { name: string }>();
  for (const p of PROVIDERS) {
    dappMap.set(p.appAddress, { name: p.appName });
  }
  for (const [appAddr, app] of dappMap) {
    if (addressSet.has(appAddr)) continue;
    addressSet.add(appAddr);
    const appVaults = vaults.filter((v) => v.dappName === app.name);
    accounts.push({
      address: appAddr, name: app.name, type: 'Contract',
      balance: parseFloat((seededRandom() * 30 + 5).toFixed(4)), percentage: 0,
      txnCount: txs.filter((t) => t.to === appAddr).length,
      vaultCount: appVaults.length,
      totalBtc: parseFloat(appVaults.reduce((s, v) => s + v.vaultSize, 0).toFixed(8)),
    });
  }

  // Provider accounts (EOA with provider role) — one per registered provider
  for (const p of PROVIDERS) {
    if (addressSet.has(p.address)) continue;
    addressSet.add(p.address);
    const pVaults = vaults.filter((v) => v.providerAddress === p.address);
    accounts.push({
      address: p.address, name: p.name, type: 'EOA',
      balance: parseFloat((seededRandom() * 10 + 1).toFixed(8)), percentage: 0,
      txnCount: Math.floor(seededRandom() * 200 + 50),
      vaultCount: pVaults.length,
      totalBtc: parseFloat(pVaults.reduce((s, v) => s + v.vaultSize, 0).toFixed(8)),
    });
  }

  // Depositor EOA accounts
  for (const addr of DEPOSITORS) {
    if (addressSet.has(addr)) continue;
    addressSet.add(addr);
    const stats = depositorStats(addr);
    accounts.push({
      address: addr, name: null, type: 'EOA',
      balance: parseFloat((seededRandom() * 5 + 0.01).toFixed(8)), percentage: 0,
      txnCount: txs.filter((t) => t.from === addr).length,
      vaultCount: stats.vaultCount, totalBtc: stats.totalBtc,
    });
  }

  // Additional random EOA accounts (no vaults)
  for (let i = 0; i < 40; i++) {
    const addr = `0x${randomHex(40)}`;
    accounts.push({
      address: addr, name: null, type: 'EOA',
      balance: parseFloat((seededRandom() * 2 + 0.0001).toFixed(8)), percentage: 0,
      txnCount: Math.floor(seededRandom() * 50),
      vaultCount: 0, totalBtc: 0,
    });
  }

  // Sort by balance descending & calculate percentage
  accounts.sort((a, b) => b.balance - a.balance);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  for (const acc of accounts) {
    acc.percentage = parseFloat(((acc.balance / totalBalance) * 100).toFixed(4));
  }
  return accounts;
}

export function generateMockDepositors(vaults: Vault[]): DepositorInfo[] {
  const map = new Map<string, { totalVaults: number; activeVaults: number; totalBtc: number; firstDeposit: string }>();

  for (const v of vaults) {
    const addr = v.depositorAddress;
    const existing = map.get(addr);
    if (!existing) {
      map.set(addr, {
        totalVaults: 1,
        activeVaults: v.status === 'Active' ? 1 : 0,
        totalBtc: v.vaultSize,
        firstDeposit: v.createdAt,
      });
    } else {
      existing.totalVaults++;
      if (v.status === 'Active') existing.activeVaults++;
      existing.totalBtc += v.vaultSize;
      if (new Date(v.createdAt).getTime() < new Date(existing.firstDeposit).getTime()) {
        existing.firstDeposit = v.createdAt;
      }
    }
  }

  return Array.from(map.entries())
    .map(([address, data]) => ({
      address,
      totalVaults: data.totalVaults,
      activeVaults: data.activeVaults,
      totalBtc: parseFloat(data.totalBtc.toFixed(8)),
      firstDeposit: data.firstDeposit,
    }))
    .sort((a, b) => b.totalBtc - a.totalBtc);
}

export function generateMockProviders(vaults: Vault[]): ProviderInfo[] {
  return PROVIDERS.map((p) => {
    const providerVaults = vaults.filter((v) => v.providerAddress === p.address);
    return {
      address: p.address,
      name: p.name,
      appAddress: p.appAddress,
      appName: p.appName,
      commission: p.commission,
      vaultCount: providerVaults.length,
      totalBtc: parseFloat(providerVaults.reduce((s, v) => s + v.vaultSize, 0).toFixed(8)),
      activeVaults: providerVaults.filter((v) => v.status === 'Active').length,
    };
  }).sort((a, b) => b.totalBtc - a.totalBtc);
}

export function generateMockDApps(vaults: Vault[], providers: ProviderInfo[]): DAppInfo[] {
  const byApp = new Map<string, { appAddress: string; name: string }>();
  for (const p of providers) {
    byApp.set(p.appAddress, { appAddress: p.appAddress, name: p.appName });
  }
  return Array.from(byApp.values()).map((app) => {
    const appVaults = vaults.filter((v) => v.dappName === app.name);
    const appProviders = providers.filter((p) => p.appAddress === app.appAddress);
    return {
      appAddress: app.appAddress,
      name: app.name,
      providerCount: appProviders.length,
      vaultCount: appVaults.length,
      totalBtc: parseFloat(appVaults.reduce((s, v) => s + v.vaultSize, 0).toFixed(8)),
      activeVaults: appVaults.filter((v) => v.status === 'Active').length,
    };
  }).sort((a, b) => b.totalBtc - a.totalBtc);
}

// Pre-generated data singletons
export const MOCK_VAULTS = generateMockVaults(240);
export const MOCK_KPIS = generateMockKPIs(MOCK_VAULTS);
export const MOCK_ANALYTICS = generateMockAnalytics();
export const MOCK_TRANSACTIONS = generateMockTransactions(MOCK_VAULTS);
export const MOCK_ACCOUNTS = generateMockAccounts(MOCK_VAULTS, MOCK_TRANSACTIONS);
export const MOCK_DEPOSITORS = generateMockDepositors(MOCK_VAULTS);
export const MOCK_PROVIDERS = generateMockProviders(MOCK_VAULTS);
export const MOCK_DAPPS = generateMockDApps(MOCK_VAULTS, MOCK_PROVIDERS);
