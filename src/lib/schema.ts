import { z } from 'zod';

/** Vault status enum for runtime validation */
export const VaultStatusSchema = z.enum(['Active', 'Closed', 'Pending', 'Liquidated']);

/** Raw vault row — what comes from CSV / API before mapping */
export const RawVaultRowSchema = z.object({
  vault_id: z.string().min(1),
  vault_name: z.string().default('Unknown'),
  status: z.string().default('Active'),
  btc_address: z.string().default(''),
  eth_address: z.string().default(''),
  vault_size: z.union([z.string(), z.number()]).transform((v) => {
    const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v;
    return isNaN(n) ? 0 : n;
  }),
  dapp_name: z.string().default(''),
  provider_name: z.string().default(''),
  provider_address: z.string().default(''),
  created_at: z.string().default(''),
  closed_at: z.string().nullable().default(null),
  btc_peg_in_tx_hash: z.string().default(''),
  eth_peg_in_tx_hash: z.string().default(''),
});

export type RawVaultRow = z.infer<typeof RawVaultRowSchema>;

/** Validated vault — after parsing and normalization */
export const VaultSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  status: VaultStatusSchema,
  btcAddress: z.string(),
  ethAddress: z.string(),
  vaultSize: z.number().min(0),
  dappName: z.string(),
  providerName: z.string(),
  providerAddress: z.string(),
  createdAt: z.string(),
  closedAt: z.string().nullable(),
  btcPegInTxHash: z.string(),
  ethPegInTxHash: z.string(),
});

/** Dashboard KPIs schema */
export const DashboardKPIsSchema = z.object({
  currentTVL: z.number(),
  activeVaultCount: z.number().int(),
  totalValueProcessed: z.number(),
  totalNumberOfVaults: z.number().int(),
  totalFeesGenerated: z.number().nullable(),
  totalLiquidations: z.number(),
  totalLiquidationCount: z.number().int(),
  lastUpdated: z.string(),
});
