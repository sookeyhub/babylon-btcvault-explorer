'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Transaction } from '@/lib/types';
import CopyButton from './CopyButton';
import { formatRelativeTime } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
type EventName = 'PeginActivated' | 'BORROW' | 'REPAY' | 'ADD_COLLATERAL' | 'REMOVE_COLLATERAL' | 'LIQUIDATION';
type TimelineStep = { state: string; time: string; note: string; current?: boolean };

type DecodedParam = { name: string; type: string; value: string; note?: string };
type DecodedLog = {
  logIndex: number;
  address: string;
  contractLabel: string;
  eventName: string;
  params: DecodedParam[];
};

// ── Per-event-type mock contexts ───────────────────────────────────────────────
const BASE = {
  vaultId:    '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031',
  vaultShort: '0xd388...5031',
  hashlock:   '0xa3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
  secret:     '0x71ad3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
  depositor:  { address: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740', short: '0x8c52...e740' },
  provider:   { name: 'vault-provider-0', address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5', commission: '0.5%' },
  keepers:    { acked: 3, total: 5, lastKeeper: '0xKeep3f1a...f8a2' },
  challengers: 'set v2 (active)',
};

const VAULT_MGR   = '0x2ec4128df7c515ecfbcdcf8813e9471249e134e6';
const AAVE_POOL   = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';
const USDC_ADDR   = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const SBTC_ADDR   = '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031';
const LIQR_ADDR   = '0xDEADBEEF5a6b7c8d9e0f1a2b3c4d5e6f00000001';

// One event occurrence inside a transaction (a tx can emit multiple)
type EventInstance = {
  depositor: { address: string };
  provider:  { address: string };
  vaultId:   string;
  dapp:      string;
  liquidator?: string | null;
  amount?: { btc: number; usd: number };   // per-event amount (overrides ctx.amount)
};

type CtxShape = {
  eventName: EventName;
  txStatus: 'SUCCESS' | 'FAILED';
  fromState: string;
  toState: string;
  secretRevealed: boolean;
  amount: { btc: number; usd: number };
  linkedDapp: { name: string; loan: string };
  liquidator: string | null;
  logs: DecodedLog[];
  vaultTimeline: TimelineStep[];
  eventInstances: EventInstance[];   // ← per-event-occurrence data
} & typeof BASE;

const MOCK_CONTEXTS: Record<EventName, CtxShape> = {
  PeginActivated: {
    ...BASE,
    eventName: 'PeginActivated',
    txStatus: 'SUCCESS',
    fromState: 'Verified', toState: 'Available',
    secretRevealed: true,
    amount: { btc: 1.0, usd: 65_000 },
    linkedDapp: { name: 'Aave', loan: '30,000 USDC' },
    liquidator: null,
    eventInstances: [
      { depositor: { address: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740' }, provider: { address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5' }, vaultId: '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031', dapp: 'Aave',     amount: { btc: 1.0, usd: 65_000 } },
      { depositor: { address: '0x7f4ae1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8b281' }, provider: { address: '0x9dc3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0cc14' }, vaultId: '0xef12a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d08a3b', dapp: 'Compound', amount: { btc: 0.5, usd: 32_500 } },
    ],
    logs: [
      {
        logIndex: 0,
        address: VAULT_MGR,
        contractLabel: 'BTCVaultManager',
        eventName: 'PeginActivated',
        params: [
          { name: 'vaultId',   type: 'bytes32', value: '0xd388...5031', note: 'Vault identifier' },
          { name: 'depositor', type: 'address', value: '0x8c52...e740' },
          { name: 'provider',  type: 'address', value: '0xbac4...80b5' },
          { name: 'amount',    type: 'uint256', value: '100000000', note: '1.0 BTC (satoshi)' },
          { name: 'hashlockId', type: 'bytes32', value: '0xa3f9...f0a1' },
          { name: 'secret',    type: 'bytes32', value: '0x71ad...c2d', note: 'Revealed preimage' },
        ],
      },
      {
        logIndex: 1,
        address: AAVE_POOL,
        contractLabel: 'AaveV3LendingPool',
        eventName: 'CollateralEnabled',
        params: [
          { name: 'user',   type: 'address', value: '0x8c52...e740' },
          { name: 'asset',  type: 'address', value: SBTC_ADDR.slice(0, 14) + '...' + SBTC_ADDR.slice(-4), note: 'sBTC' },
          { name: 'enabled', type: 'bool',   value: 'true' },
        ],
      },
    ],
    vaultTimeline: [
      { state: 'Pending',  time: 'Apr 9, 2026 · 03:14 UTC', note: 'Vault created' },
      { state: 'Verified', time: 'Apr 9, 2026 · 05:22 UTC', note: '3/5 keepers ACKed' },
      { state: 'Available',   time: 'Apr 9, 2026 · 05:48 UTC', note: 'Secret revealed · this tx', current: true },
    ] as TimelineStep[],
  },

  BORROW: {
    ...BASE,
    eventName: 'BORROW',
    txStatus: 'SUCCESS',
    fromState: 'Available', toState: 'Available',
    secretRevealed: false,
    amount: { btc: 1.0, usd: 65_000 },
    linkedDapp: { name: 'Aave', loan: '30,000 USDC' },
    liquidator: null,
    eventInstances: [
      { depositor: { address: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740' }, provider: { address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5' }, vaultId: '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031', dapp: 'Aave' },
    ],
    logs: [
      {
        logIndex: 0,
        address: AAVE_POOL,
        contractLabel: 'AaveV3LendingPool',
        eventName: 'Borrow',
        params: [
          { name: 'reserve',       type: 'address', value: USDC_ADDR.slice(0, 14) + '...6eB4', note: 'USDC' },
          { name: 'user',          type: 'address', value: '0x8c52...e740' },
          { name: 'onBehalfOf',    type: 'address', value: '0x8c52...e740' },
          { name: 'amount',        type: 'uint256', value: '30000000000', note: '30,000 USDC (6 decimals)' },
          { name: 'interestRateMode', type: 'uint8', value: '2', note: 'Variable rate' },
          { name: 'borrowRate',    type: 'uint128', value: '52500000000000000', note: '5.25% APY' },
          { name: 'referralCode',  type: 'uint16',  value: '0' },
        ],
      },
      {
        logIndex: 1,
        address: USDC_ADDR.slice(0, 14) + '...6eB4',
        contractLabel: 'USDC Token',
        eventName: 'Transfer',
        params: [
          { name: 'from',  type: 'address', value: AAVE_POOL.slice(0, 14) + '...aE9', note: 'Aave pool' },
          { name: 'to',    type: 'address', value: '0x8c52...e740' },
          { name: 'value', type: 'uint256', value: '30000000000', note: '30,000 USDC' },
        ],
      },
      {
        logIndex: 2,
        address: VAULT_MGR,
        contractLabel: 'BTCVaultManager',
        eventName: 'VaultBorrowed',
        params: [
          { name: 'vaultId', type: 'bytes32', value: '0xd388...5031' },
          { name: 'dApp',    type: 'address', value: AAVE_POOL.slice(0, 14) + '...aE9' },
          { name: 'amount',  type: 'uint256', value: '30000000000', note: '30,000 USDC' },
        ],
      },
    ],
    vaultTimeline: [
      { state: 'Pending',  time: 'Apr 9, 2026 · 03:14 UTC', note: 'Vault created' },
      { state: 'Verified', time: 'Apr 9, 2026 · 05:22 UTC', note: '3/5 keepers ACKed' },
      { state: 'Available',   time: 'Apr 9, 2026 · 05:48 UTC', note: 'Vault activated' },
      { state: 'Available',   time: 'Apr 15, 2026 · 11:03 UTC', note: 'Loan taken · this tx', current: true },
    ] as TimelineStep[],
  },

  REPAY: {
    ...BASE,
    eventName: 'REPAY',
    txStatus: 'FAILED',            // 잔액 부족으로 reverted
    fromState: 'Available', toState: 'Available',
    secretRevealed: false,
    amount: { btc: 1.0, usd: 65_000 },
    linkedDapp: { name: 'Aave', loan: '30,512 USDC' },
    liquidator: null,
    eventInstances: [
      { depositor: { address: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740' }, provider: { address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5' }, vaultId: '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031', dapp: 'Aave' },
    ],
    logs: [
      {
        logIndex: 0,
        address: USDC_ADDR.slice(0, 14) + '...6eB4',
        contractLabel: 'USDC Token',
        eventName: 'Transfer',
        params: [
          { name: 'from',  type: 'address', value: '0x8c52...e740' },
          { name: 'to',    type: 'address', value: AAVE_POOL.slice(0, 14) + '...aE9', note: 'Aave pool' },
          { name: 'value', type: 'uint256', value: '30512000000', note: '30,512 USDC (principal + interest)' },
        ],
      },
      {
        logIndex: 1,
        address: AAVE_POOL,
        contractLabel: 'AaveV3LendingPool',
        eventName: 'Repay',
        params: [
          { name: 'reserve',    type: 'address', value: USDC_ADDR.slice(0, 14) + '...6eB4', note: 'USDC' },
          { name: 'user',       type: 'address', value: '0x8c52...e740' },
          { name: 'repayer',    type: 'address', value: '0x8c52...e740' },
          { name: 'amount',     type: 'uint256', value: '30512000000', note: '30,512 USDC' },
          { name: 'useATokens', type: 'bool',    value: 'false' },
        ],
      },
      {
        logIndex: 2,
        address: VAULT_MGR,
        contractLabel: 'BTCVaultManager',
        eventName: 'VaultRepaid',
        params: [
          { name: 'vaultId',   type: 'bytes32', value: '0xd388...5031' },
          { name: 'principal', type: 'uint256', value: '30000000000', note: '30,000 USDC' },
          { name: 'interest',  type: 'uint256', value: '512000000',   note: '512 USDC accrued' },
        ],
      },
    ],
    vaultTimeline: [
      { state: 'Pending',  time: 'Apr 9, 2026 · 03:14 UTC', note: 'Vault created' },
      { state: 'Verified', time: 'Apr 9, 2026 · 05:22 UTC', note: '3/5 keepers ACKed' },
      { state: 'Available',   time: 'Apr 9, 2026 · 05:48 UTC', note: 'Vault activated' },
      { state: 'Available',   time: 'Apr 15, 2026 · 11:03 UTC', note: 'Loan taken' },
      { state: 'Available',   time: 'May 3, 2026 · 09:17 UTC',  note: 'Loan repaid · this tx', current: true },
    ] as TimelineStep[],
  },

  ADD_COLLATERAL: {
    ...BASE,
    eventName: 'ADD_COLLATERAL',
    txStatus: 'SUCCESS',
    fromState: 'Available', toState: 'Available',
    secretRevealed: false,
    amount: { btc: 0.5, usd: 32_500 },
    linkedDapp: { name: 'Aave', loan: '30,000 USDC' },
    liquidator: null,
    eventInstances: [
      { depositor: { address: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740' }, provider: { address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5' }, vaultId: '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031', dapp: 'Aave', amount: { btc: 0.3, usd: 19_500 } },
      { depositor: { address: '0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4' }, provider: { address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5' }, vaultId: '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', dapp: 'Aave', amount: { btc: 0.2, usd: 13_000 } },
    ],
    logs: [
      {
        logIndex: 0,
        address: VAULT_MGR,
        contractLabel: 'BTCVaultManager',
        eventName: 'CollateralAdded',
        params: [
          { name: 'vaultId',    type: 'bytes32', value: '0xd388...5031' },
          { name: 'depositor',  type: 'address', value: '0x8c52...e740' },
          { name: 'addedBTC',   type: 'uint256', value: '50000000', note: '0.5 BTC (satoshi)' },
          { name: 'totalBTC',   type: 'uint256', value: '150000000', note: '1.5 BTC total' },
          { name: 'newLTV',     type: 'uint256', value: '22857142', note: '22.86% LTV' },
        ],
      },
      {
        logIndex: 1,
        address: AAVE_POOL,
        contractLabel: 'AaveV3LendingPool',
        eventName: 'ReserveUsedAsCollateralEnabled',
        params: [
          { name: 'reserve', type: 'address', value: SBTC_ADDR.slice(0, 14) + '...5031', note: 'sBTC' },
          { name: 'user',    type: 'address', value: '0x8c52...e740' },
        ],
      },
    ],
    vaultTimeline: [
      { state: 'Pending',  time: 'Apr 9, 2026 · 03:14 UTC', note: 'Vault created' },
      { state: 'Verified', time: 'Apr 9, 2026 · 05:22 UTC', note: '3/5 keepers ACKed' },
      { state: 'Available',   time: 'Apr 9, 2026 · 05:48 UTC', note: 'Vault activated' },
      { state: 'Available',   time: 'Apr 20, 2026 · 14:30 UTC', note: '+0.5 BTC added · this tx', current: true },
    ] as TimelineStep[],
  },

  REMOVE_COLLATERAL: {
    ...BASE,
    eventName: 'REMOVE_COLLATERAL',
    txStatus: 'FAILED',            // LTV 초과로 reverted
    fromState: 'Available', toState: 'Available',
    secretRevealed: false,
    amount: { btc: 0.2, usd: 13_000 },
    linkedDapp: { name: 'Aave', loan: '15,000 USDC' },
    liquidator: null,
    eventInstances: [
      { depositor: { address: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740' }, provider: { address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5' }, vaultId: '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031', dapp: 'Aave' },
    ],
    logs: [
      {
        logIndex: 0,
        address: VAULT_MGR,
        contractLabel: 'BTCVaultManager',
        eventName: 'CollateralWithdrawn',
        params: [
          { name: 'vaultId',     type: 'bytes32', value: '0xd388...5031' },
          { name: 'depositor',   type: 'address', value: '0x8c52...e740' },
          { name: 'withdrawBTC', type: 'uint256', value: '20000000',  note: '0.2 BTC (satoshi)' },
          { name: 'remainBTC',   type: 'uint256', value: '80000000',  note: '0.8 BTC remaining' },
          { name: 'newLTV',      type: 'uint256', value: '28846153',  note: '28.85% LTV' },
        ],
      },
    ],
    vaultTimeline: [
      { state: 'Pending',  time: 'Apr 9, 2026 · 03:14 UTC', note: 'Vault created' },
      { state: 'Verified', time: 'Apr 9, 2026 · 05:22 UTC', note: '3/5 keepers ACKed' },
      { state: 'Available',   time: 'Apr 9, 2026 · 05:48 UTC', note: 'Vault activated' },
      { state: 'Available',   time: 'Apr 28, 2026 · 08:12 UTC', note: '-0.2 BTC withdrawn · this tx', current: true },
    ] as TimelineStep[],
  },

  LIQUIDATION: {
    ...BASE,
    eventName: 'LIQUIDATION',
    txStatus: 'SUCCESS',
    fromState: 'At-Risk', toState: 'Liquidated',
    secretRevealed: false,
    amount: { btc: 1.0, usd: 42_000 },
    linkedDapp: { name: 'Aave', loan: '35,000 USDC' },
    liquidator: LIQR_ADDR.slice(0, 14) + '...0001',
    eventInstances: [
      { depositor: { address: '0x8c52f3e1d4a7b9c0e2f1a3b5c7d9e8f0a1b2c3d4e740' }, provider: { address: '0xbac46a70f5b8cc87f053d0afe8e6fb9cfe5880b5' }, vaultId: '0xd388f2c3e1a94b7d5f6a8b9c0d1e2f3a4b5c6d7e5f8a1b2c3d4e5f6a7b8c5031', dapp: 'Aave', liquidator: LIQR_ADDR.slice(0, 14) + '...0001' },
    ],
    logs: [
      {
        logIndex: 0,
        address: AAVE_POOL,
        contractLabel: 'AaveV3LendingPool',
        eventName: 'LiquidationCall',
        params: [
          { name: 'collateralAsset',       type: 'address', value: SBTC_ADDR.slice(0, 14) + '...5031', note: 'sBTC' },
          { name: 'debtAsset',             type: 'address', value: USDC_ADDR.slice(0, 14) + '...6eB4', note: 'USDC' },
          { name: 'user',                  type: 'address', value: '0x8c52...e740' },
          { name: 'debtToCover',           type: 'uint256', value: '35000000000', note: '35,000 USDC' },
          { name: 'liquidatedCollateralAmount', type: 'uint256', value: '87500000', note: '0.875 BTC (satoshi)' },
          { name: 'liquidator',            type: 'address', value: LIQR_ADDR.slice(0, 14) + '...0001' },
          { name: 'receiveAToken',         type: 'bool',    value: 'false' },
        ],
      },
      {
        logIndex: 1,
        address: VAULT_MGR,
        contractLabel: 'BTCVaultManager',
        eventName: 'VaultLiquidated',
        params: [
          { name: 'vaultId',    type: 'bytes32', value: '0xd388...5031' },
          { name: 'liquidator', type: 'address', value: LIQR_ADDR.slice(0, 14) + '...0001' },
          { name: 'seizedBTC',  type: 'uint256', value: '87500000',  note: '0.875 BTC' },
          { name: 'bonus',      type: 'uint256', value: '4375000',   note: '0.04375 BTC liquidation bonus (5%)' },
        ],
      },
      {
        logIndex: 2,
        address: USDC_ADDR.slice(0, 14) + '...6eB4',
        contractLabel: 'USDC Token',
        eventName: 'Transfer',
        params: [
          { name: 'from',  type: 'address', value: LIQR_ADDR.slice(0, 14) + '...0001', note: 'Liquidator' },
          { name: 'to',    type: 'address', value: AAVE_POOL.slice(0, 14) + '...aE9',  note: 'Aave pool' },
          { name: 'value', type: 'uint256', value: '35000000000', note: '35,000 USDC debt repaid' },
        ],
      },
    ],
    vaultTimeline: [
      { state: 'Pending',    time: 'Apr 9, 2026 · 03:14 UTC',  note: 'Vault created' },
      { state: 'Verified',   time: 'Apr 9, 2026 · 05:22 UTC',  note: '3/5 keepers ACKed' },
      { state: 'Available',     time: 'Apr 9, 2026 · 05:48 UTC',  note: 'Vault activated' },
      { state: 'At-Risk',    time: 'May 20, 2026 · 17:44 UTC', note: 'HF dropped below 1.0' },
      { state: 'Liquidated', time: 'May 21, 2026 · 02:09 UTC', note: 'Liquidated by keeper · this tx', current: true },
    ] as TimelineStep[],
  },
};

// ── Event → human language ─────────────────────────────────────────────────────
const EVENT_COPY: Record<EventName, { h1: string; h2: (c: CtxShape) => string }> = {
  PeginActivated:    { h1: 'Vault activated',      h2: (c) => `${c.amount.btc} sBTC ($${c.amount.usd.toLocaleString()}) is now available as ${c.linkedDapp.name} collateral` },
  BORROW:            { h1: 'Loan taken out',       h2: (c) => `${c.linkedDapp.loan} borrowed against ${c.amount.btc} sBTC collateral` },
  REPAY:             { h1: 'Loan repaid',           h2: (c) => `${c.linkedDapp.loan} repaid, freeing ${c.amount.btc} sBTC collateral` },
  ADD_COLLATERAL:    { h1: 'Collateral added',     h2: (c) => `${c.amount.btc} sBTC added to ${c.linkedDapp.name} position` },
  REMOVE_COLLATERAL: { h1: 'Collateral withdrawn', h2: (c) => `${c.amount.btc} sBTC removed from ${c.linkedDapp.name} position` },
  LIQUIDATION:       { h1: 'Vault liquidated',     h2: (c) => `${c.amount.btc} sBTC collateral seized to cover ${c.linkedDapp.loan} debt` },
};

// ── Event type color coding ───────────────────────────────────────────────────
const EVENT_COLOR: Record<EventName, {
  border: string;   // left border color (inline style value)
  badge: string;    // badge bg + text classes
  headerBg: string; // accordion header bg (open)
  dot: string;      // accent dot color
}> = {
  PeginActivated:    { border: '#16a34a', badge: 'bg-green-50 text-green-700',   headerBg: 'bg-green-50/40',  dot: '#16a34a' },
  BORROW:            { border: '#cd6332', badge: 'bg-[#cd6332]/10 text-[#cd6332]', headerBg: 'bg-[#cd6332]/5', dot: '#cd6332' },
  REPAY:             { border: '#387085', badge: 'bg-[#387085]/10 text-[#387085]', headerBg: 'bg-[#387085]/5', dot: '#387085' },
  ADD_COLLATERAL:    { border: '#5a8a3c', badge: 'bg-[#5a8a3c]/10 text-[#5a8a3c]', headerBg: 'bg-[#5a8a3c]/5', dot: '#5a8a3c' },
  REMOVE_COLLATERAL: { border: '#d97706', badge: 'bg-amber-50 text-amber-700',    headerBg: 'bg-amber-50/40',  dot: '#d97706' },
  LIQUIDATION:       { border: '#dc2626', badge: 'bg-red-50 text-red-600',         headerBg: 'bg-red-50/40',    dot: '#dc2626' },
};

// ── State pill styles ─────────────────────────────────────────────────────────
const STATE_STYLE: Record<string, { bg: string; text: string }> = {
  Active:     { bg: 'bg-green-50',    text: 'text-green-700'  },
  Verified:   { bg: 'bg-[#387085]/5', text: 'text-[#387085]'  },
  Pending:    { bg: 'bg-amber-50',    text: 'text-amber-700'  },
  'At-Risk':  { bg: 'bg-orange-50',   text: 'text-orange-600' },
  Redeemed:   { bg: 'bg-blue-50',     text: 'text-blue-700'   },
  Expired:    { bg: 'bg-gray-50',     text: 'text-gray-500'   },
  Liquidated: { bg: 'bg-red-50',      text: 'text-red-600'    },
};

// ── Info table row (no bottom border by default — groups handle separators) ───
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3">
      <span className="w-36 shrink-0 text-sm text-[rgba(56,112,133,0.55)]">{label}</span>
      <div className="min-w-0 flex-1 text-sm text-[#14140f]">{children}</div>
    </div>
  );
}

// ── Address with copy ──────────────────────────────────────────────────────────
function AddrCopy({ full, display, href }: { full: string; display: string; href?: string }) {
  return (
    <span className="flex items-center gap-1">
      {href ? (
        <Link href={href} className="font-mono text-[#387085] hover:text-[#cd6332] hover:underline">
          {display}
        </Link>
      ) : (
        <span className="font-mono text-[#387085]">{display}</span>
      )}
      <CopyButton text={full} />
    </span>
  );
}

// ── Tab button ─────────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-5 py-3 text-[13px] font-medium transition-colors ${
        active ? 'text-[#cd6332]' : 'text-[#387085]/50 hover:text-[#387085]'
      }`}
    >
      {label}
      {active && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#cd6332]" />}
    </button>
  );
}

// ── Type switcher pill ────────────────────────────────────────────────────────
const EVENT_LABELS: { key: EventName; label: string }[] = [
  { key: 'PeginActivated',    label: 'Vault Activated' },
  { key: 'BORROW',            label: 'Borrow' },
  { key: 'REPAY',             label: 'Repay' },
  { key: 'ADD_COLLATERAL',    label: 'Add Collateral' },
  { key: 'REMOVE_COLLATERAL', label: 'Remove Collateral' },
  { key: 'LIQUIDATION',       label: 'Liquidation' },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function TransactionTabs({ tx }: { tx: Transaction }) {
  const [eventType, setEventType] = useState<EventName>('PeginActivated');
  const [activeTab, setActiveTab] = useState<'log' | 'raw'>('log');
  // Track which event accordion rows are open (first open by default)
  const [openEvents, setOpenEvents] = useState<Set<number>>(new Set([0]));
  const switchTab = (k: 'log' | 'raw') => setActiveTab(k);
  const toggleEvent = (idx: number) =>
    setOpenEvents((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  const ctx  = MOCK_CONTEXTS[eventType];
  const copy = EVENT_COPY[eventType];
  const relTime = formatRelativeTime(tx.timestamp);

  const d = new Date(tx.timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  // "27 days ago (2026/05/04 23:45:00 +UTC)" format
  const absoluteUTC =
    `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +UTC`;

  const fmt = (s: string) => `${s.slice(0, 6)}...${s.slice(-4)}`;
  const hashDisplay = `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`;

  const isSuccess = ctx.txStatus === 'SUCCESS';

  return (
    <div className="space-y-4">

      {/* ── Event type switcher (dev/demo) ─────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {EVENT_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setEventType(key); setActiveTab('log'); setOpenEvents(new Set([0])); }}
            className={`rounded border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              eventType === key
                ? 'border-[#cd6332] bg-[#cd6332] text-white'
                : 'border-[#387085]/15 bg-white text-[#387085]/55 hover:border-[#387085]/30 hover:text-[#387085]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ━━━━━━━━━━━ TRANSACTION TITLE (이미지 양식) ━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white px-6 py-5">
        {/* ⇄ Transaction label */}
        <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[#387085]/45">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <span className="font-medium uppercase tracking-widest">Transaction</span>
        </div>

        {/* Status circle + Tx hash (main identifier) */}
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
            isSuccess
              ? 'border-[#16a34a] text-[#16a34a]'
              : 'border-[#dc2626] text-[#dc2626]'
          }`}>
            {isSuccess ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
          </span>
          <span className="font-mono text-xl font-bold text-[#14140f]">{hashDisplay}</span>
          <CopyButton text={tx.hash} />
        </div>

        {/* Timestamp: "27 days ago (2026/05/04 23:45:00 +UTC)" */}
        <p className="mt-2 text-sm text-[#387085]/50">
          {relTime}{' '}
          <span className="text-[#387085]/35">({absoluteUTC})</span>
        </p>

        {/* Block — secondary meta */}
        <div className="mt-3 border-t border-[#387085]/8 pt-3">
          <Link
            href={`/blocks/${tx.blockNumber}`}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#387085]/50 hover:text-[#387085]"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            Block <span className="font-mono text-[#387085]/70">#{tx.blockNumber.toLocaleString()}</span>
          </Link>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━ EVENTS 아코디언 드롭다운 ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-2">
        {ctx.eventInstances.map((evt, idx) => {
          const evtAmount = evt.amount ?? ctx.amount;
          const evtH2 = copy.h2({ ...ctx, amount: evtAmount, linkedDapp: { ...ctx.linkedDapp, name: evt.dapp } });
          const isOpen = openEvents.has(idx);
          const ec = EVENT_COLOR[eventType];
          return (
            <div
              key={idx}
              className="overflow-hidden border border-[#387085]/12 bg-white"
              style={{ borderLeftWidth: 3, borderLeftColor: ec.border }}
            >
              {/* Accordion toggle row */}
              <button
                onClick={() => toggleEvent(idx)}
                className={`flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors ${
                  isOpen ? ec.headerBg : 'hover:bg-[#faf9f5]'
                }`}
              >
                <div className="min-w-0 flex items-start gap-2.5">
                  {/* Colored dot */}
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: ec.dot }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ec.badge}`}>
                        {copy.h1}
                      </span>
                      {ctx.eventInstances.length > 1 && (
                        <span className="rounded bg-[#387085]/8 px-1.5 py-0.5 text-[10px] font-medium text-[#387085]/45">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#14140f]/50 truncate pr-4">{evtH2}</p>
                  </div>
                </div>
                <svg
                  className={`h-4 w-4 shrink-0 text-[#387085]/35 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Accordion content */}
              {isOpen && (
                <div className="border-t border-[#387085]/8 bg-white divide-y divide-[#387085]/8 px-5">
                  <InfoRow label="Depositor">
                    <AddrCopy full={evt.depositor.address} display={fmt(evt.depositor.address)} href={`/accounts/${evt.depositor.address}`} />
                  </InfoRow>
                  <InfoRow label="Provider">
                    <span className="flex items-center gap-1">
                      <Link href={`/accounts/${evt.provider.address}`} className="font-mono text-[#387085] hover:text-[#cd6332] hover:underline">
                        {fmt(evt.provider.address)}
                      </Link>
                      <CopyButton text={evt.provider.address} />
                    </span>
                  </InfoRow>
                  <InfoRow label="Vault">
                    <AddrCopy full={evt.vaultId} display={fmt(evt.vaultId)} href={`/vaults/${evt.vaultId}`} />
                  </InfoRow>
                  <InfoRow label="dApp">
                    <span className="font-medium text-[#14140f]">{evt.dapp}</span>
                  </InfoRow>
                  {evt.liquidator && (
                    <InfoRow label="Liquidator">
                      <span className="font-mono text-red-600">{evt.liquidator}</span>
                    </InfoRow>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━ TABS: LOG / RAW DATA ━━━━━━━━━━━━━━━━━━ */}
      <div className="border border-[#387085]/12 bg-white">

        {/* Tab bar */}
        <div className="flex border-b border-[#387085]/10">
          <TabBtn label="Log"      active={activeTab === 'log'} onClick={() => switchTab('log')} />
          <TabBtn label="Txn Details" active={activeTab === 'raw'} onClick={() => switchTab('raw')} />
        </div>

        {/* ── Log tab: decoded event logs ─────────────────────────────── */}
        {activeTab === 'log' && (
          <div className="px-6 py-5">
            {ctx.logs.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#387085]/40">No logs for this transaction.</p>
            ) : (
              <div className="space-y-4">
                {ctx.logs.map((log, i) => (
                  <div key={i} className="rounded border border-[#387085]/12 bg-[#faf9f5]">
                    {/* Log header */}
                    <div className="flex items-center gap-2.5 border-b border-[#387085]/10 px-4 py-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-[#cd6332]/10 font-mono text-[10px] font-semibold text-[#cd6332]">
                        {log.logIndex}
                      </span>
                      <span className="font-mono text-[12px] font-semibold text-[#14140f]">{log.eventName}</span>
                      <span className="text-[#387085]/35">·</span>
                      <span className="font-mono text-[10px] text-[#387085]/50">{log.address}</span>
                      <span className="ml-1 rounded bg-[#387085]/8 px-1.5 py-0.5 text-[9px] font-medium text-[#387085]/55">
                        {log.contractLabel}
                      </span>
                    </div>
                    {/* Decoded params */}
                    <div className="divide-y divide-[#387085]/8 px-4">
                      {log.params.map((p, j) => (
                        <div key={j} className="flex items-start gap-3 py-2">
                          <span className="w-40 shrink-0 font-mono text-[11px] text-[#387085]/50">{p.name}</span>
                          <span className="w-16 shrink-0 rounded bg-[#387085]/6 px-1 py-0.5 text-center font-mono text-[9px] text-[#387085]/40">
                            {p.type}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="break-all font-mono text-[11px] text-[#14140f]/75">{p.value}</span>
                            {p.note && (
                              <span className="ml-2 text-[10px] text-[#387085]/40">({p.note})</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Raw Data tab ─────────────────────────────────────────────── */}
        {activeTab === 'raw' && (
          <div className="px-6 py-0">

            <InfoRow label="Transaction Hash">
              <AddrCopy full={tx.hash} display={fmt(tx.hash)} />
            </InfoRow>
            <InfoRow label="Method">
              <span className="inline-block rounded bg-[#cd6332] px-2.5 py-1 font-mono text-[10px] font-medium text-white">
                {tx.method}
              </span>
            </InfoRow>
            <InfoRow label="Block Height">
              <span className="font-mono text-[#387085]">#{tx.blockNumber.toLocaleString()}</span>
            </InfoRow>
            <InfoRow label="From">
              <AddrCopy full={tx.from} display={fmt(tx.from)} />
            </InfoRow>
            <InfoRow label="To">
              <AddrCopy full={tx.to} display={fmt(tx.to)} />
            </InfoRow>

            <div className="border-t border-[#387085]/12" />

            <InfoRow label="Amount">
              <span>{tx.amount} <span className="text-[#387085]/45">ETH</span></span>
            </InfoRow>
            <InfoRow label="Transaction Fee">
              <span>{tx.txFee.toFixed(10)} <span className="text-[#387085]/45">ETH</span></span>
            </InfoRow>
            <InfoRow label="Gas Price">
              <span>{tx.gasPrice.toFixed(9)} <span className="text-[#387085]/45">Gwei</span></span>
            </InfoRow>

            <div className="border-t border-[#387085]/12" />

            <InfoRow label="Gas Used (by Txn)">
              <span>
                {tx.gasUsed.toLocaleString()}{' '}
                <span className="text-[#387085]/40">({((tx.gasUsed / tx.gasLimit) * 100).toFixed(1)}%)</span>
              </span>
            </InfoRow>
            <InfoRow label="Gas Limit (by Txn)">
              {tx.gasLimit.toLocaleString()}
            </InfoRow>
            <InfoRow label="Gas Fees">
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                  Base: {tx.baseFee.toFixed(9)} Gwei
                </span>
                <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                  Max: {tx.maxFeePerGas.toFixed(9)} Gwei
                </span>
                <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                  Max Priority: {tx.maxPriorityFee.toFixed(3)} Gwei
                </span>
              </div>
            </InfoRow>
            <InfoRow label="Other Attributes">
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                  Txn Type: {tx.txType}
                </span>
                <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                  Nonce: {tx.nonce}
                </span>
                <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                  Position in Block: {tx.positionInBlock}
                </span>
              </div>
            </InfoRow>
            <InfoRow label="Input Data">
              <div className="max-h-28 overflow-auto rounded border border-[#cd6332]/10 bg-[#faf9f5] p-3 font-mono text-[10px] leading-relaxed text-[#387085]/55">
                {tx.inputData}
              </div>
            </InfoRow>

          </div>
        )}
      </div>
    </div>
  );
}
