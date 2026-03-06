import { formatBTC, formatNumber, truncateAddress, formatDate, queryVaults, getStatusColor } from '@/lib/utils';
import type { Vault, VaultListParams } from '@/lib/types';

describe('formatBTC', () => {
  test('formats large amounts with k suffix', () => {
    expect(formatBTC(1500)).toBe('1.50k BTC');
    expect(formatBTC(1000)).toBe('1.00k BTC');
  });

  test('formats normal amounts with 4 decimals', () => {
    expect(formatBTC(10.5)).toBe('10.5000 BTC');
    expect(formatBTC(1)).toBe('1.0000 BTC');
  });

  test('formats small amounts with 8 decimals', () => {
    expect(formatBTC(0.001)).toBe('0.00100000 BTC');
  });
});

describe('truncateAddress', () => {
  test('truncates long addresses', () => {
    const addr = 'bc1q1234567890abcdefghijklmnopqrstuvwxyz';
    const result = truncateAddress(addr);
    expect(result).toContain('...');
    expect(result.length).toBeLessThan(addr.length);
  });

  test('returns short addresses unchanged', () => {
    expect(truncateAddress('short')).toBe('short');
  });

  test('handles empty string', () => {
    expect(truncateAddress('')).toBe('');
  });
});

describe('formatDate', () => {
  test('formats ISO date string', () => {
    const result = formatDate('2025-01-15T00:00:00.000Z');
    expect(result).toContain('Jan');
    expect(result).toContain('2025');
  });

  test('returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('queryVaults', () => {
  const mockVaults: Vault[] = [
    {
      id: 'v-001', name: 'Vault 1', status: 'Active', btcAddress: 'bc1q1',
      ethAddress: '0x1', vaultSize: 10, dappName: 'Lombard', providerName: 'Cobo',
      providerAddress: '0xp1', createdAt: '2025-06-01T00:00:00Z', closedAt: null,
      btcPegInTxHash: 'tx1', ethPegInTxHash: 'etx1',
    },
    {
      id: 'v-002', name: 'Vault 2', status: 'Closed', btcAddress: 'bc1q2',
      ethAddress: '0x2', vaultSize: 5, dappName: 'SolvBTC', providerName: 'BitGo',
      providerAddress: '0xp2', createdAt: '2025-03-01T00:00:00Z', closedAt: '2025-07-01T00:00:00Z',
      btcPegInTxHash: 'tx2', ethPegInTxHash: 'etx2',
    },
    {
      id: 'v-003', name: 'Vault 3', status: 'Active', btcAddress: 'bc1q3',
      ethAddress: '0x3', vaultSize: 20, dappName: 'Lombard', providerName: 'Fireblocks',
      providerAddress: '0xp3', createdAt: '2025-09-01T00:00:00Z', closedAt: null,
      btcPegInTxHash: 'tx3', ethPegInTxHash: 'etx3',
    },
  ];

  test('filters by search query', () => {
    const params: VaultListParams = { search: 'Lombard', status: 'All', sortBy: 'newest', page: 1, pageSize: 10 };
    const result = queryVaults(mockVaults, params);
    expect(result.data).toHaveLength(2);
    expect(result.data.every(v => v.dappName === 'Lombard')).toBe(true);
  });

  test('filters by status', () => {
    const params: VaultListParams = { search: '', status: 'Active', sortBy: 'newest', page: 1, pageSize: 10 };
    const result = queryVaults(mockVaults, params);
    expect(result.data).toHaveLength(2);
    expect(result.data.every(v => v.status === 'Active')).toBe(true);
  });

  test('sorts by size descending', () => {
    const params: VaultListParams = { search: '', status: 'All', sortBy: 'size_desc', page: 1, pageSize: 10 };
    const result = queryVaults(mockVaults, params);
    expect(result.data[0].vaultSize).toBe(20);
    expect(result.data[2].vaultSize).toBe(5);
  });

  test('paginates correctly', () => {
    const params: VaultListParams = { search: '', status: 'All', sortBy: 'newest', page: 1, pageSize: 2 };
    const result = queryVaults(mockVaults, params);
    expect(result.data).toHaveLength(2);
    expect(result.totalPages).toBe(2);
    expect(result.total).toBe(3);
  });

  test('returns empty for non-matching search', () => {
    const params: VaultListParams = { search: 'nonexistent', status: 'All', sortBy: 'newest', page: 1, pageSize: 10 };
    const result = queryVaults(mockVaults, params);
    expect(result.data).toHaveLength(0);
  });
});

describe('getStatusColor', () => {
  test('returns correct colors for each status', () => {
    expect(getStatusColor('Active').text).toContain('emerald');
    expect(getStatusColor('Closed').text).toContain('zinc');
    expect(getStatusColor('Pending').text).toContain('amber');
    expect(getStatusColor('Liquidated').text).toContain('red');
  });
});
