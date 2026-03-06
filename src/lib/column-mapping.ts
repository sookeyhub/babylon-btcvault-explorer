/**
 * Column mapping layer — decouples raw CSV/API column names from internal field names.
 * When upstream column names change, only this file needs updating.
 */

export type InternalField = keyof typeof DEFAULT_COLUMN_MAP;

/**
 * Default mapping: raw column name → internal field name.
 * Supports multiple aliases per internal field for resilience.
 */
export const DEFAULT_COLUMN_MAP = {
  vault_id: ['Vault ID', 'vault_id', 'VaultID', 'id'],
  vault_name: ['Vault Name', 'vault_name', 'VaultName', 'name'],
  status: ['Status', 'status', 'vault_status'],
  btc_address: ['BTC Address', 'btc_address', 'BTCAddress', 'bitcoin_address'],
  eth_address: ['ETH Address', 'eth_address', 'ETHAddress', 'ethereum_address'],
  vault_size: ['Vault Size', 'vault_size', 'VaultSize', 'size', 'amount'],
  dapp_name: ['Dapp Name', 'dapp_name', 'DappName', 'dapp'],
  provider_name: ['Vault Provider Name', 'provider_name', 'ProviderName', 'provider'],
  provider_address: ['Vault Provider Address', 'provider_address', 'ProviderAddress'],
  created_at: ['Created (Timestamp)', 'created_at', 'CreatedAt', 'created', 'creation_time'],
  closed_at: ['Closed (Timestamp)', 'closed_at', 'ClosedAt', 'closed', 'close_time'],
  btc_peg_in_tx_hash: ['BTC peg-in tx hash', 'btc_peg_in_tx_hash', 'btc_tx_hash'],
  eth_peg_in_tx_hash: ['ETH peg-in txn hash', 'eth_peg_in_tx_hash', 'eth_tx_hash'],
} as const;

/**
 * Resolve a raw column header to an internal field name.
 * Returns undefined if no match found.
 */
export function resolveColumnName(
  rawHeader: string,
  mapping: typeof DEFAULT_COLUMN_MAP = DEFAULT_COLUMN_MAP,
): InternalField | undefined {
  const normalized = rawHeader.trim().toLowerCase();
  for (const [internalField, aliases] of Object.entries(mapping)) {
    if (aliases.some((alias) => alias.toLowerCase() === normalized)) {
      return internalField as InternalField;
    }
  }
  return undefined;
}

/**
 * Given raw CSV headers, produce a header → internal field map.
 */
export function buildHeaderMap(
  rawHeaders: string[],
  mapping: typeof DEFAULT_COLUMN_MAP = DEFAULT_COLUMN_MAP,
): Record<string, InternalField> {
  const result: Record<string, InternalField> = {};
  for (const header of rawHeaders) {
    const field = resolveColumnName(header, mapping);
    if (field) {
      result[header] = field;
    }
  }
  return result;
}
