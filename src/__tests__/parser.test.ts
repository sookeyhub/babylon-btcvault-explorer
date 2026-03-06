import { parseVaultRows, parseCSVText } from '@/lib/parser';
import { resolveColumnName, buildHeaderMap } from '@/lib/column-mapping';

describe('Column Mapping', () => {
  test('resolves known column names', () => {
    expect(resolveColumnName('Vault ID')).toBe('vault_id');
    expect(resolveColumnName('BTC Address')).toBe('btc_address');
    expect(resolveColumnName('Vault Size')).toBe('vault_size');
    expect(resolveColumnName('Created (Timestamp)')).toBe('created_at');
    expect(resolveColumnName('ETH peg-in txn hash')).toBe('eth_peg_in_tx_hash');
  });

  test('resolves aliases case-insensitively', () => {
    expect(resolveColumnName('vault_id')).toBe('vault_id');
    expect(resolveColumnName('VAULT_ID')).toBe('vault_id');
    expect(resolveColumnName('btc_address')).toBe('btc_address');
  });

  test('returns undefined for unknown columns', () => {
    expect(resolveColumnName('unknown_column')).toBeUndefined();
    expect(resolveColumnName('')).toBeUndefined();
  });

  test('builds header map from raw headers', () => {
    const headers = ['Vault ID', 'Status', 'BTC Address', 'Unknown Col'];
    const map = buildHeaderMap(headers);
    expect(map['Vault ID']).toBe('vault_id');
    expect(map['Status']).toBe('status');
    expect(map['BTC Address']).toBe('btc_address');
    expect(map['Unknown Col']).toBeUndefined();
  });
});

describe('CSV Parser', () => {
  test('parses simple CSV text', () => {
    const csv = `Vault ID,Status,Vault Size
vault-001,Active,1.5
vault-002,Closed,3.2`;

    const { headers, rows } = parseCSVText(csv);
    expect(headers).toEqual(['Vault ID', 'Status', 'Vault Size']);
    expect(rows).toHaveLength(2);
    expect(rows[0]['Vault ID']).toBe('vault-001');
    expect(rows[1]['Vault Size']).toBe('3.2');
  });

  test('handles quoted fields with commas', () => {
    const csv = `Name,Value
"Hello, World",42`;

    const { rows } = parseCSVText(csv);
    expect(rows[0]['Name']).toBe('Hello, World');
  });

  test('handles empty CSV', () => {
    const { headers, rows } = parseCSVText('');
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });
});

describe('Vault Row Parser', () => {
  const headers = [
    'Vault ID', 'Vault Name', 'Status', 'BTC Address', 'ETH Address',
    'Vault Size', 'Dapp Name', 'Vault Provider Name', 'Vault Provider Address',
    'Created (Timestamp)', 'Closed (Timestamp)', 'BTC peg-in tx hash', 'ETH peg-in txn hash',
  ];

  test('parses valid vault rows', () => {
    const rows = [{
      'Vault ID': 'vault-001',
      'Vault Name': 'Test Vault',
      'Status': 'Active',
      'BTC Address': 'bc1qtest123',
      'ETH Address': '0xabc123',
      'Vault Size': '10.5',
      'Dapp Name': 'Lombard',
      'Vault Provider Name': 'Cobo',
      'Vault Provider Address': '0xprovider',
      'Created (Timestamp)': '2025-01-15T00:00:00Z',
      'Closed (Timestamp)': '',
      'BTC peg-in tx hash': 'txhash123',
      'ETH peg-in txn hash': 'ethtx456',
    }];

    const { vaults, errors } = parseVaultRows(headers, rows);
    expect(errors).toHaveLength(0);
    expect(vaults).toHaveLength(1);
    expect(vaults[0].id).toBe('vault-001');
    expect(vaults[0].status).toBe('Active');
    expect(vaults[0].vaultSize).toBe(10.5);
    expect(vaults[0].closedAt).toBeNull();
  });

  test('normalizes invalid status to Active', () => {
    const rows = [{
      'Vault ID': 'vault-002',
      'Status': 'InvalidStatus',
      'Vault Size': '5',
    }];

    const { vaults } = parseVaultRows(headers, rows as any);
    expect(vaults[0].status).toBe('Active');
  });

  test('handles comma-separated vault size', () => {
    const rows = [{
      'Vault ID': 'vault-003',
      'Vault Size': '1,234.56',
    }];

    const { vaults } = parseVaultRows(headers, rows as any);
    expect(vaults[0].vaultSize).toBe(1234.56);
  });

  test('treats outlier vault size > 1M as 0', () => {
    const rows = [{
      'Vault ID': 'vault-004',
      'Vault Size': '9999999',
    }];

    const { vaults } = parseVaultRows(headers, rows as any);
    expect(vaults[0].vaultSize).toBe(0);
  });

  test('skips rows with missing vault_id', () => {
    const rows = [{
      'Vault ID': '',
      'Status': 'Active',
    }];

    const { vaults, errors } = parseVaultRows(headers, rows as any);
    expect(vaults).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0].error).toContain('too_small');
  });

  test('normalizes Unix timestamp', () => {
    const rows = [{
      'Vault ID': 'vault-005',
      'Created (Timestamp)': '1700000000',
    }];

    const { vaults } = parseVaultRows(headers, rows as any);
    expect(vaults[0].createdAt).toContain('2023-11-14');
  });
});
