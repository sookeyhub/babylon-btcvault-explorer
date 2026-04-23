import { RawVaultRowSchema } from './schema';
import { buildHeaderMap, type InternalField } from './column-mapping';
import type { Vault, VaultStatus } from './types';

const VALID_STATUSES: VaultStatus[] = ['Active', 'Expired', 'Pending', 'Liquidated', 'Redeemed'];

/** Normalize a raw status string to a valid VaultStatus */
function normalizeStatus(raw: string): VaultStatus {
  const trimmed = raw.trim();
  const match = VALID_STATUSES.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase(),
  );
  return match ?? 'Active';
}

/** Normalize a timestamp string — handles empty, ISO, and Unix epoch */
function normalizeTimestamp(raw: string | null | undefined): string | null {
  if (!raw || raw.trim() === '' || raw === 'null' || raw === 'undefined') return null;
  const trimmed = raw.trim();
  // Unix epoch (seconds)
  if (/^\d{10,13}$/.test(trimmed)) {
    const ms = trimmed.length === 10 ? parseInt(trimmed) * 1000 : parseInt(trimmed);
    return new Date(ms).toISOString();
  }
  // Try ISO parse
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? trimmed : d.toISOString();
}

/**
 * Parse raw CSV rows into typed Vault objects.
 * Handles column mapping, validation, and outlier/missing value treatment.
 */
export function parseVaultRows(
  headers: string[],
  rows: Record<string, string>[],
): { vaults: Vault[]; errors: { row: number; error: string }[] } {
  const headerMap = buildHeaderMap(headers);
  const vaults: Vault[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const raw = rows[i];
      // Map raw columns to internal fields
      const mapped: Record<string, string> = {};
      for (const [rawCol, value] of Object.entries(raw)) {
        const field = headerMap[rawCol];
        if (field) {
          mapped[field] = value;
        }
      }

      // Validate with Zod
      const parsed = RawVaultRowSchema.parse({
        vault_id: mapped.vault_id ?? '',
        vault_name: mapped.vault_name ?? 'Unknown',
        status: mapped.status ?? 'Active',
        btc_address: mapped.btc_address ?? '',
        eth_address: mapped.eth_address ?? '',
        vault_size: mapped.vault_size ?? '0',
        dapp_name: mapped.dapp_name ?? '',
        provider_name: mapped.provider_name ?? '',
        provider_address: mapped.provider_address ?? '',
        created_at: mapped.created_at ?? '',
        closed_at: mapped.closed_at || null,
        btc_peg_in_tx_hash: mapped.btc_peg_in_tx_hash ?? '',
        eth_peg_in_tx_hash: mapped.eth_peg_in_tx_hash ?? '',
      });

      // Skip rows with no vault_id
      if (!parsed.vault_id) {
        errors.push({ row: i, error: 'Missing vault_id' });
        continue;
      }

      // Outlier check: vault_size > 1,000,000 BTC is suspicious
      const vaultSize = parsed.vault_size > 1_000_000 ? 0 : parsed.vault_size;

      const vault: Vault = {
        id: parsed.vault_id,
        name: parsed.vault_name,
        status: normalizeStatus(parsed.status),
        btcAddress: parsed.btc_address,
        ethAddress: parsed.eth_address,
        vaultSize,
        dappName: parsed.dapp_name,
        providerName: parsed.provider_name,
        providerAddress: parsed.provider_address,
        createdAt: normalizeTimestamp(parsed.created_at) ?? new Date().toISOString(),
        closedAt: normalizeTimestamp(parsed.closed_at),
        btcPegInTxHash: parsed.btc_peg_in_tx_hash,
        ethPegInTxHash: parsed.eth_peg_in_tx_hash,
        depositorAddress: "",
        hashlock: "",
        blockNumber: 0,
        createdTxHash: "",
      };

      vaults.push(vault);
    } catch (err) {
      errors.push({
        row: i,
        error: err instanceof Error ? err.message : 'Unknown parse error',
      });
    }
  }

  return { vaults, errors };
}

/**
 * Parse simple CSV text into headers + row objects.
 */
export function parseCSVText(csv: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = csv.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

/** Parse a single CSV line respecting quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}
