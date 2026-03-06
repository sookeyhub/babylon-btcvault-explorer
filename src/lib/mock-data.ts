import type { Vault, DashboardKPIs, AnalyticsData, TimeSeriesPoint } from './types';

/**
 * Mock vault data — generated to match the spec sheet schema.
 * In production, this would be replaced by real indexer/API data.
 */

const DAPPS = ['Lombard', 'SolvBTC', 'Pumpkin', 'Bedrock', 'Avalon', 'BitStable', 'Lorenzo', 'BounceBit'];
const PROVIDERS = ['Cobo', 'Fireblocks', 'BitGo', 'Anchorage', 'Copper', 'Fordefi'];
const STATUSES: Vault['status'][] = ['Active', 'Active', 'Active', 'Closed', 'Pending', 'Liquidated'];

function randomBtcAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let addr = 'bc1q';
  for (let i = 0; i < 38; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function randomEthAddress(): string {
  const hex = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * hex.length)];
  return addr;
}

function randomTxHash(): string {
  const hex = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) hash += hex[Math.floor(Math.random() * hex.length)];
  return hash;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Seed-based pseudo-random for deterministic mock data
let _seed = 42;
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

export function generateMockVaults(count: number = 150): Vault[] {
  _seed = 42; // Reset seed for determinism
  const vaults: Vault[] = [];
  const startDate = new Date('2024-06-01');
  const endDate = new Date('2026-02-28');

  for (let i = 1; i <= count; i++) {
    const status = pick(STATUSES);
    const created = randomDate(startDate, endDate);
    const closed = status === 'Closed' ? randomDate(created, endDate) : null;
    const size = parseFloat((seededRandom() * 50 + 0.01).toFixed(4));

    vaults.push({
      id: `vault-${String(i).padStart(4, '0')}`,
      name: `${pick(DAPPS)} Vault #${i}`,
      status,
      btcAddress: randomBtcAddress(),
      ethAddress: randomEthAddress(),
      vaultSize: size,
      dappName: pick(DAPPS),
      providerName: pick(PROVIDERS),
      providerAddress: randomEthAddress(),
      createdAt: created.toISOString(),
      closedAt: closed?.toISOString() ?? null,
      btcPegInTxHash: randomTxHash(),
      ethPegInTxHash: randomTxHash(),
    });
  }

  return vaults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateMockKPIs(vaults: Vault[]): DashboardKPIs {
  const active = vaults.filter((v) => v.status === 'Active');
  const totalBtc = vaults.reduce((sum, v) => sum + v.vaultSize, 0);
  const activeBtc = active.reduce((sum, v) => sum + v.vaultSize, 0);
  const liquidated = vaults.filter((v) => v.status === 'Liquidated');

  return {
    currentTVL: parseFloat(activeBtc.toFixed(4)),
    activeVaultCount: active.length,
    totalValueProcessed: parseFloat(totalBtc.toFixed(4)),
    totalNumberOfVaults: vaults.length,
    totalFeesGenerated: null, // marked 불가능 in spec
    totalLiquidations: parseFloat(
      liquidated.reduce((sum, v) => sum + v.vaultSize, 0).toFixed(4),
    ),
    totalLiquidationCount: liquidated.length,
    lastUpdated: new Date().toISOString(),
  };
}

function generateTimeSeries(days: number, baseValue: number, volatility: number): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  let value = baseValue;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value = Math.max(0, value + (seededRandom() - 0.45) * volatility);
    points.push({
      date: date.toISOString().split('T')[0],
      value: parseFloat(value.toFixed(2)),
    });
  }
  return points;
}

export function generateMockAnalytics(): AnalyticsData {
  _seed = 100;
  return {
    tvlHistory: generateTimeSeries(180, 1200, 80),
    activeVaultHistory: generateTimeSeries(180, 60, 5),
    tvpHistory: generateTimeSeries(180, 2000, 120),
    tnvHistory: generateTimeSeries(180, 80, 3),
    liquidationHistory: generateTimeSeries(180, 50, 15),
    liquidationCountHistory: generateTimeSeries(180, 5, 2),
  };
}

// Pre-generated data singletons
export const MOCK_VAULTS = generateMockVaults(150);
export const MOCK_KPIS = generateMockKPIs(MOCK_VAULTS);
export const MOCK_ANALYTICS = generateMockAnalytics();
