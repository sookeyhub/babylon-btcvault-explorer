'use client';

import { useState, useCallback } from 'react';
import {
  Landmark, CheckCircle, XCircle, ChevronDown, Copy, FileText,
  HeartPulse, Receipt, AlertTriangle, ShieldCheck, ArrowRight,
  ArrowDownToLine, ArrowUpFromLine, Settings, Search, X
} from 'lucide-react';

/* ────────────────────────────────────────────
   Transaction Data
   ──────────────────────────────────────────── */
interface Transaction {
  id: string;
  type: 'supply' | 'borrow' | 'repay' | 'withdraw' | 'liquidation';
  status: 'success' | 'failed';
  token: string;
  tokenIcon: string;
  tokenLetter: string;
  label: string;
  amount: string;
  usd: string;
  time: string;
  apy?: string;
  apyType?: 'supply' | 'borrow';
  searchData: string;
  detail: TxDetail;
}

interface TxDetail {
  heroTitle: string;
  heroSubtitle: string;
  amountLabel: string;
  amountUsd: string;
  amountNative: string;
  txHash: string;
  txHashShort: string;
  block: string;
  flow: FlowData;
  overview: OverviewData;
  positionImpact?: PositionImpactData;
  feeBreakdown?: FeeBreakdownData;
  transfers: TransferRow[];
  logs: LogEntry[];
}

interface FlowData {
  fromToken?: { icon: string; letter: string; amount: string; sub: string };
  toToken?: { icon: string; letter: string; amount: string; sub: string };
  dest: string;
  destStyle?: 'success' | 'borrow' | 'repay' | 'withdraw' | 'error';
  flowDirection: 'supply' | 'borrow' | 'withdraw' | 'repay' | 'liquidation';
  rows: { key: string; val: string; valColor?: string; pill?: { text: string; type: string } }[];
  isFailed?: boolean;
  failedAmount?: string;
  failedSub?: string;
}

interface OverviewData {
  fee: string;
  feeEth: string;
  feePill: { text: string; type: string };
  time: string;
  timeDetail: string;
  confirmations: string;
  confirmPill: { text: string; type: string };
  network: string;
  gasPrice: string;
  gasUsed: string;
  gasPercent: string;
  gasPill: { text: string; type: string };
  value: string;
  nonce: string;
  inputData: string;
}

interface PositionImpactData {
  hf: { from: string; to: string; direction: 'up' | 'down' };
  hfBarWidth: string;
  rows: { key: string; from?: string; to?: string; val?: string; direction?: 'up' | 'down' }[];
  easyText: string;
}

interface FeeBreakdownData {
  gasUsed: string;
  gasTotal: string;
  gasPercent: string;
  baseFee: string;
  baseGwei: string;
  priorityFee: string;
  priorityGwei: string;
  totalFee: string;
  totalEth: string;
  wasted: string;
  wastedDetail: string;
  failReason: string;
  failCode: string;
  easyText: string;
}

interface TransferRow {
  from: string;
  to: string;
  type: 'IN' | 'OUT' | 'BURN';
  amount: string;
  tokenIcon: string;
  tokenLetter: string;
  tokenName: string;
}

interface LogEntry {
  idx: number;
  event: string;
  contract: string;
  address: string;
  topics: string[];
  data: string;
}

const TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1', type: 'supply', status: 'success', token: 'ETH', tokenIcon: 'icon-eth', tokenLetter: 'E',
    label: 'Supply ETH', amount: '2.5 ETH', usd: '$4,895', time: '2 mins ago',
    apy: '3.21% APY', apyType: 'supply',
    searchData: '0x8b4e21d93a17 eth supply aave',
    detail: {
      heroTitle: 'Supply Collateral', heroSubtitle: 'Transaction Confirmed',
      amountLabel: 'Supply Amount', amountUsd: '$4,895', amountNative: '2.5 ETH supplied to Aave V3',
      txHash: '0x8b4e21d93a17', txHashShort: '0x8b4e21...d93a17', block: '24,431,087',
      flow: {
        fromToken: { icon: 'icon-eth', letter: 'E', amount: '2.5 ETH', sub: '≈ $4,895' },
        dest: 'Aave V3 ETH Reserve', destStyle: 'success', flowDirection: 'supply',
        rows: [
          { key: 'Pool', val: 'ETH Reserve' },
          { key: 'Supply APY', val: '3.21%', valColor: '#387085' },
          { key: 'aToken Received', val: '2.5 aWETH' },
          { key: 'Collateral Enabled', val: 'Yes ✓', pill: { text: 'Yes ✓', type: 'success' } },
        ],
      },
      overview: {
        fee: '$4.12', feeEth: '0.00211 ETH', feePill: { text: 'Average', type: 'warning' },
        time: '2 mins ago', timeDetail: '2026.03.05 10:22 UTC',
        confirmations: '38 Blocks', confirmPill: { text: 'Safe', type: 'success' },
        network: 'Ethereum', gasPrice: '14.2 Gwei', gasUsed: '148,590 / 200,000',
        gasPercent: '74%', gasPill: { text: '74%', type: 'info' },
        value: '2.5 ETH ($4,895)', nonce: '124', inputData: '0x617ba037... (Supply)',
      },
      positionImpact: {
        hf: { from: '2.45', to: '2.82', direction: 'up' }, hfBarWidth: '94%',
        rows: [
          { key: 'Total Collateral', from: '$12,340', to: '$17,235', direction: 'up' },
          { key: 'Available to Borrow', from: '$5,120', to: '$9,156', direction: 'up' },
          { key: 'LTV Ratio', val: '45%' },
          { key: 'Liquidation Threshold', val: '82.5%' },
        ],
        easyText: 'Deposited <hl>2.5 ETH ($4,895)</hl> as collateral on Aave. Your health factor improved from 2.45 to <hl>2.82</hl> — position is healthy. You can now borrow up to <hl>$9,156</hl>.',
      },
      transfers: [
        { from: '0xAb3F...c210', to: 'Aave V3 Pool', type: 'OUT', amount: '2.5', tokenIcon: 'icon-eth', tokenLetter: 'E', tokenName: 'WETH' },
        { from: 'Aave V3 Pool', to: '0xAb3F...c210', type: 'IN', amount: '2.5', tokenIcon: 'icon-eth', tokenLetter: 'aE', tokenName: 'aWETH' },
      ],
      logs: [
        { idx: 0, event: 'Supply', contract: 'Aave V3 Pool', address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', topics: ['0x2b627736bca15cd5381dcf80b0bf11fd197d01a037c52b927a881a10fb73ba61', '0x000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'], data: '0x000000000000000000000000ab3fc21c9084fce16873ee1e2691698d2c041c10000000000000000000000000000000000000000000000002283...' },
        { idx: 1, event: 'Transfer', contract: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'], data: '0x00000000000000000000000000000000000000000000000022b1c8c1227a0000' },
        { idx: 2, event: 'Mint', contract: 'aWETH', address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8', topics: ['0x458f5fa412d0f69b08dd84872b0215675cc67bc1d5b6fd93300a1c3878b86196'], data: '0x00000000000000000000000000000000000000000000000022b1c8c1227a0000' },
      ],
    },
  },
  {
    id: 'tx2', type: 'borrow', status: 'success', token: 'USDC', tokenIcon: 'icon-usdc', tokenLetter: '$',
    label: 'Borrow USDC', amount: '3,000 USDC', usd: '$3,000', time: '6 mins ago',
    apy: '4.52% APY', apyType: 'borrow',
    searchData: '0x3c9f82a14b56 usdc borrow aave',
    detail: {
      heroTitle: 'Borrow', heroSubtitle: 'Transaction Confirmed',
      amountLabel: 'Borrow Amount', amountUsd: '$3,000', amountNative: '3,000 USDC borrowed from Aave V3',
      txHash: '0x3c9f82a14b56', txHashShort: '0x3c9f82...a14b56', block: '24,431,052',
      flow: {
        dest: 'Aave V3 USDC Pool', destStyle: 'borrow', flowDirection: 'borrow',
        toToken: { icon: 'icon-usdc', letter: '$', amount: '3,000 USDC', sub: '≈ $3,000' },
        rows: [
          { key: 'Pool', val: 'USDC Reserve' },
          { key: 'Borrow APY (Variable)', val: '4.52%', valColor: '#cd6332' },
          { key: 'Debt Token', val: 'variableDebtUSDC' },
          { key: 'Rate Mode', val: '', pill: { text: 'Variable', type: 'brand' } },
        ],
      },
      overview: {
        fee: '$3.56', feeEth: '0.00182 ETH', feePill: { text: 'Low', type: 'success' },
        time: '6 mins ago', timeDetail: '2026.03.05 10:18 UTC',
        confirmations: '73 Blocks', confirmPill: { text: 'Safe', type: 'success' },
        network: 'Ethereum', gasPrice: '12.8 Gwei', gasUsed: '142,200 / 200,000',
        gasPercent: '71%', gasPill: { text: '71%', type: 'info' },
        value: '0 ETH', nonce: '125', inputData: '0xa415bcad... (Borrow)',
      },
      positionImpact: {
        hf: { from: '2.82', to: '2.14', direction: 'down' }, hfBarWidth: '71%',
        rows: [
          { key: 'Total Debt', from: '$2,520', to: '$5,520', direction: 'down' },
          { key: 'Available to Borrow', from: '$9,156', to: '$6,156', direction: 'down' },
          { key: 'LTV Ratio', from: '14.6%', to: '32.0%' },
          { key: 'Liquidation Threshold', val: '82.5%' },
        ],
        easyText: 'Borrowed <hl>3,000 USDC</hl> from Aave at a variable rate of <hl>4.52% APY</hl>. Health factor decreased from 2.82 to <hl>2.14</hl> — still healthy. You can still borrow up to $6,156 more.',
      },
      transfers: [
        { from: 'Aave V3 Pool', to: '0xAb3F...c210', type: 'IN', amount: '3,000', tokenIcon: 'icon-usdc', tokenLetter: '$', tokenName: 'USDC' },
      ],
      logs: [
        { idx: 0, event: 'Borrow', contract: 'Aave V3 Pool', address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', topics: ['0xb3d084820fb1a9decffb176436bd02558d15fac9b0ddfed8c465bc7359d7dce0'], data: '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48...' },
        { idx: 1, event: 'Transfer', contract: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'], data: '0x00000000000000000000000000000000000000000000000000000000b2d05e00' },
      ],
    },
  },
  {
    id: 'tx3', type: 'repay', status: 'success', token: 'DAI', tokenIcon: 'icon-dai', tokenLetter: 'D',
    label: 'Repay DAI', amount: '1,500 DAI', usd: '$1,500', time: '12 mins ago',
    searchData: '0x6d1a45e82c93 dai repay aave',
    detail: {
      heroTitle: 'Repay Debt', heroSubtitle: 'Transaction Confirmed',
      amountLabel: 'Repay Amount', amountUsd: '$1,500', amountNative: '1,500 DAI repaid to Aave V3',
      txHash: '0x6d1a45e82c93', txHashShort: '0x6d1a45...e82c93', block: '24,431,015',
      flow: {
        fromToken: { icon: 'icon-dai', letter: 'D', amount: '1,500 DAI', sub: '≈ $1,500' },
        dest: 'Repay DAI Debt', destStyle: 'repay', flowDirection: 'repay',
        rows: [
          { key: 'Pool', val: 'DAI Reserve' },
          { key: 'Debt Repaid', val: '1,500 DAI' },
          { key: 'Remaining Debt', val: '4,020 DAI' },
          { key: 'Rate Mode', val: '', pill: { text: 'Variable', type: 'brand' } },
        ],
      },
      overview: {
        fee: '$2.94', feeEth: '0.00150 ETH', feePill: { text: 'Low', type: 'success' },
        time: '12 mins ago', timeDetail: '2026.03.05 10:12 UTC',
        confirmations: '109 Blocks', confirmPill: { text: 'Finalized', type: 'success' },
        network: 'Ethereum', gasPrice: '11.6 Gwei', gasUsed: '129,450 / 180,000',
        gasPercent: '72%', gasPill: { text: '72%', type: 'info' },
        value: '0 ETH', nonce: '126', inputData: '0x573ade81... (Repay)',
      },
      positionImpact: {
        hf: { from: '2.14', to: '2.56', direction: 'up' }, hfBarWidth: '85%',
        rows: [
          { key: 'Total Debt', from: '$5,520', to: '$4,020', direction: 'up' },
          { key: 'Available to Borrow', from: '$6,156', to: '$7,656', direction: 'up' },
          { key: 'LTV Ratio', from: '32.0%', to: '23.3%' },
          { key: 'Liquidation Threshold', val: '82.5%' },
        ],
        easyText: 'Repaid <hl>1,500 DAI</hl> of your Aave debt. Health factor improved from 2.14 to <hl>2.56</hl>. Remaining debt is 4,020 DAI. Your borrowing capacity increased by $1,500.',
      },
      transfers: [
        { from: '0xAb3F...c210', to: 'Aave V3 Pool', type: 'OUT', amount: '1,500', tokenIcon: 'icon-dai', tokenLetter: 'D', tokenName: 'DAI' },
      ],
      logs: [
        { idx: 0, event: 'Repay', contract: 'Aave V3 Pool', address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', topics: ['0xa534c8dbe71f871f9f3f77571e5032e1094d7c1a4d1024e6e0d7c8c2a59fe8a4'], data: '0x0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f...' },
        { idx: 1, event: 'Transfer', contract: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'], data: '0x00000000000000000000000000000000000000000000005150ae84a8cdf00000' },
      ],
    },
  },
  {
    id: 'tx4', type: 'withdraw', status: 'success', token: 'WBTC', tokenIcon: 'icon-wbtc', tokenLetter: 'B',
    label: 'Withdraw WBTC', amount: '0.25 WBTC', usd: '$16,250', time: '20 mins ago',
    searchData: '0xa2f7c93d14e8 wbtc withdraw aave',
    detail: {
      heroTitle: 'Withdraw Collateral', heroSubtitle: 'Transaction Confirmed',
      amountLabel: 'Withdraw Amount', amountUsd: '$16,250', amountNative: '0.25 WBTC withdrawn from Aave V3',
      txHash: '0xa2f7c93d14e8', txHashShort: '0xa2f7c9...3d14e8', block: '24,430,968',
      flow: {
        dest: 'Aave V3 WBTC Pool', destStyle: 'withdraw', flowDirection: 'withdraw',
        toToken: { icon: 'icon-wbtc', letter: 'B', amount: '0.25 WBTC', sub: '≈ $16,250' },
        rows: [
          { key: 'Pool', val: 'WBTC Reserve' },
          { key: 'aToken Burned', val: '0.25 aWBTC' },
          { key: 'Remaining Supply', val: '0.50 WBTC' },
          { key: 'Collateral Status', val: '', pill: { text: 'Active', type: 'success' } },
        ],
      },
      overview: {
        fee: '$3.28', feeEth: '0.00168 ETH', feePill: { text: 'Average', type: 'warning' },
        time: '20 mins ago', timeDetail: '2026.03.05 10:04 UTC',
        confirmations: '156 Blocks', confirmPill: { text: 'Finalized', type: 'success' },
        network: 'Ethereum', gasPrice: '13.1 Gwei', gasUsed: '128,100 / 180,000',
        gasPercent: '71%', gasPill: { text: '71%', type: 'info' },
        value: '0 ETH', nonce: '127', inputData: '0x69328dec... (Withdraw)',
      },
      positionImpact: {
        hf: { from: '2.56', to: '1.89', direction: 'down' }, hfBarWidth: '63%',
        rows: [
          { key: 'Total Collateral', from: '$17,235', to: '$985', direction: 'down' },
          { key: 'Available to Borrow', from: '$7,656', to: '$3,834', direction: 'down' },
          { key: 'LTV Ratio', from: '23.3%', to: '41.5%' },
          { key: 'Liquidation Threshold', val: '75.0%' },
        ],
        easyText: 'Withdrew <hl>0.25 WBTC ($16,250)</hl> from Aave collateral. Health factor decreased from 2.56 to <hl>1.89</hl> — still safe but reduced. Remaining WBTC collateral: 0.50 WBTC.',
      },
      transfers: [
        { from: 'Aave V3 Pool', to: '0xAb3F...c210', type: 'IN', amount: '0.25', tokenIcon: 'icon-wbtc', tokenLetter: 'B', tokenName: 'WBTC' },
        { from: '0xAb3F...c210', to: 'Aave V3 Pool', type: 'OUT', amount: '0.25', tokenIcon: 'icon-wbtc', tokenLetter: 'aB', tokenName: 'aWBTC' },
      ],
      logs: [
        { idx: 0, event: 'Withdraw', contract: 'Aave V3 Pool', address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', topics: ['0x3115d1449a7b732c986cba18244e897a145bcf99c08caf0d1f8e1dc41a4e0569'], data: '0x0000000000000000000000002260fac5e5542a773aa44fbcfedf7c193bc2c599...' },
        { idx: 1, event: 'Transfer', contract: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'], data: '0x0000000000000000000000000000000000000000000000000000000001312d00' },
      ],
    },
  },
  {
    id: 'tx5', type: 'supply', status: 'success', token: 'USDC', tokenIcon: 'icon-usdc', tokenLetter: '$',
    label: 'Supply USDC', amount: '10,000 USDC', usd: '$10,000', time: '30 mins ago',
    apy: '5.14% APY', apyType: 'supply',
    searchData: '0x5e8b12f47a39 usdc supply aave',
    detail: {
      heroTitle: 'Supply Collateral', heroSubtitle: 'Transaction Confirmed',
      amountLabel: 'Supply Amount', amountUsd: '$10,000', amountNative: '10,000 USDC supplied to Aave V3',
      txHash: '0x5e8b12f47a39', txHashShort: '0x5e8b12...f47a39', block: '24,430,905',
      flow: {
        fromToken: { icon: 'icon-usdc', letter: '$', amount: '10,000 USDC', sub: '≈ $10,000' },
        dest: 'Aave V3 USDC Reserve', destStyle: 'success', flowDirection: 'supply',
        rows: [
          { key: 'Pool', val: 'USDC Reserve' },
          { key: 'Supply APY', val: '5.14%', valColor: '#387085' },
          { key: 'aToken Received', val: '10,000 aUSDC' },
          { key: 'Collateral Enabled', val: '', pill: { text: 'Yes ✓', type: 'success' } },
        ],
      },
      overview: {
        fee: '$3.15', feeEth: '0.00161 ETH', feePill: { text: 'Low', type: 'success' },
        time: '30 mins ago', timeDetail: '2026.03.05 09:54 UTC',
        confirmations: '218 Blocks', confirmPill: { text: 'Finalized', type: 'success' },
        network: 'Ethereum', gasPrice: '12.2 Gwei', gasUsed: '131,900 / 180,000',
        gasPercent: '73%', gasPill: { text: '73%', type: 'info' },
        value: '0 ETH', nonce: '123', inputData: '0x617ba037... (Supply)',
      },
      positionImpact: {
        hf: { from: '1.89', to: '2.45', direction: 'up' }, hfBarWidth: '82%',
        rows: [
          { key: 'Total Collateral', from: '$985', to: '$10,985', direction: 'up' },
          { key: 'Available to Borrow', from: '$3,834', to: '$5,120', direction: 'up' },
          { key: 'LTV Ratio', from: '41.5%', to: '36.6%' },
          { key: 'Liquidation Threshold', val: '86.0%' },
        ],
        easyText: 'Deposited <hl>10,000 USDC</hl> as collateral on Aave earning <hl>5.14% APY</hl>. Health factor improved from 1.89 to <hl>2.45</hl>. Estimated yearly earnings: <hl>~$514</hl>.',
      },
      transfers: [
        { from: '0xAb3F...c210', to: 'Aave V3 Pool', type: 'OUT', amount: '10,000', tokenIcon: 'icon-usdc', tokenLetter: '$', tokenName: 'USDC' },
        { from: 'Aave V3 Pool', to: '0xAb3F...c210', type: 'IN', amount: '10,000', tokenIcon: 'icon-usdc', tokenLetter: 'a$', tokenName: 'aUSDC' },
      ],
      logs: [
        { idx: 0, event: 'Supply', contract: 'Aave V3 Pool', address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2', topics: ['0x2b627736bca15cd5381dcf80b0bf11fd197d01a037c52b927a881a10fb73ba61'], data: '0x000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48...' },
        { idx: 1, event: 'Mint', contract: 'aUSDC', address: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c', topics: ['0x458f5fa412d0f69b08dd84872b0215675cc67bc1d5b6fd93300a1c3878b86196'], data: '0x00000000000000000000000000000000000000000000000000000002540be400' },
      ],
    },
  },
  {
    id: 'tx6', type: 'liquidation', status: 'failed', token: 'AAVE', tokenIcon: 'icon-aave', tokenLetter: 'A',
    label: 'Liquidation', amount: '0xAb3F...c210 Position', usd: 'Failed', time: '45 mins ago',
    searchData: '0xf1c893a52d71 liquidation aave eth usdc',
    detail: {
      heroTitle: 'Liquidation Call', heroSubtitle: 'Transaction Reverted',
      amountLabel: 'Liquidation Attempt', amountUsd: 'Failed', amountNative: 'Attempted liquidation of 0xAb3F...c210',
      txHash: '0xf1c893a52d71', txHashShort: '0xf1c893...a52d71', block: '24,430,812',
      flow: {
        fromToken: { icon: 'icon-usdc', letter: '$', amount: '1,200 USDC', sub: 'Repay debt for target' },
        dest: 'Liquidation Rejected', destStyle: 'error', flowDirection: 'liquidation',
        isFailed: true,
        rows: [
          { key: 'Target Position', val: '0xAb3F...c210' },
          { key: 'Health Factor', val: '1.15 (Above threshold)', valColor: '#387085' },
          { key: 'Collateral Asset', val: 'ETH' },
          { key: 'Debt Asset', val: 'USDC' },
        ],
      },
      overview: {
        fee: '$5.42', feeEth: '0.00277 ETH', feePill: { text: 'Reverted', type: 'error' },
        time: '45 mins ago', timeDetail: '2026.03.05 09:39 UTC',
        confirmations: '', confirmPill: { text: 'Reverted', type: 'error' },
        network: 'Ethereum', gasPrice: '13.8 Gwei', gasUsed: '200,720 / 200,720',
        gasPercent: '100%', gasPill: { text: '100%', type: 'error' },
        value: '0 ETH', nonce: '342', inputData: '0x00a718a9... (LiquidationCall)',
      },
      feeBreakdown: {
        gasUsed: '200,720', gasTotal: '200,720', gasPercent: '100% exhausted',
        baseFee: '$4.89', baseGwei: '12.6 Gwei', priorityFee: '$0.53', priorityGwei: '1.2 Gwei',
        totalFee: '$5.42', totalEth: '0.00277 ETH',
        wasted: '$5.42 consumed (non-refundable)', wastedDetail: 'Gas was consumed before failure — fee cannot be recovered',
        failReason: "Target position's health factor (1.15) is above the liquidation threshold (1.0). Liquidation is not permitted.",
        failCode: 'Error: HEALTH_FACTOR_NOT_BELOW_THRESHOLD\nTarget HF: 1.15\nRequired: < 1.0',
        easyText: '<hlwarn>Liquidation attempt failed</hlwarn>. The target position has a health factor of 1.15 — still above the safe threshold. Only positions with HF below 1.0 can be liquidated. <hlwarn>$5.42 in gas fees was consumed</hlwarn> despite the failure.',
      },
      transfers: [],
      logs: [],
    },
  },
];

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */
function renderHighlightText(text: string) {
  const parts = text.split(/(<hl>.*?<\/hl>|<hlwarn>.*?<\/hlwarn>)/g);
  return parts.map((part, i) => {
    if (part.startsWith('<hl>')) return <span key={i} className="lending-hl">{part.replace(/<\/?hl>/g, '')}</span>;
    if (part.startsWith('<hlwarn>')) return <span key={i} className="lending-hl-warn">{part.replace(/<\/?hlwarn>/g, '')}</span>;
    return <span key={i}>{part}</span>;
  });
}

function getDestStyle(style?: string) {
  switch (style) {
    case 'success': return { bg: 'rgba(90,138,60,0.06)', border: 'rgba(90,138,60,0.1)', color: '#5a8a3c' };
    case 'borrow': return { bg: 'rgba(205,99,50,0.06)', border: 'rgba(205,99,50,0.1)', color: '#cd6332' };
    case 'repay': return { bg: 'rgba(56,112,133,0.06)', border: 'rgba(56,112,133,0.1)', color: '#387085' };
    case 'withdraw': return { bg: 'rgba(212,121,63,0.06)', border: 'rgba(212,121,63,0.1)', color: '#d4793f' };
    case 'error': return { bg: 'rgba(200,50,50,0.06)', border: 'rgba(200,50,50,0.1)', color: '#c83232' };
    default: return { bg: 'rgba(90,138,60,0.06)', border: 'rgba(90,138,60,0.1)', color: '#5a8a3c' };
  }
}

function getArrowStyle(style?: string) {
  switch (style) {
    case 'success': return { bg: 'rgba(90,138,60,0.08)', border: 'rgba(90,138,60,0.12)', color: '#5a8a3c' };
    case 'borrow': return { bg: 'rgba(205,99,50,0.08)', border: 'rgba(205,99,50,0.12)', color: '#cd6332' };
    case 'repay': return { bg: 'rgba(56,112,133,0.08)', border: 'rgba(56,112,133,0.12)', color: '#387085' };
    case 'withdraw': return { bg: 'rgba(212,121,63,0.08)', border: 'rgba(212,121,63,0.12)', color: '#d4793f' };
    case 'error': return { bg: 'rgba(200,50,50,0.08)', border: 'rgba(200,50,50,0.12)', color: '#c83232' };
    default: return { bg: 'rgba(90,138,60,0.08)', border: 'rgba(90,138,60,0.12)', color: '#5a8a3c' };
  }
}

/* ────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────── */
export default function LendingPage() {
  const [activeType, setActiveType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchVal, setSearchVal] = useState('');
  const [openTxId, setOpenTxId] = useState<string | null>('tx1');
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const [openLogs, setOpenLogs] = useState<Record<string, boolean>>({});
  const [lendingTab, setLendingTab] = useState<'supply' | 'borrow'>('supply');
  const [supplyAmount, setSupplyAmount] = useState('2.5');
  const [borrowAmount, setBorrowAmount] = useState('3000');
  const [submitState, setSubmitState] = useState<'idle' | 'loading' | 'success'>('idle');

  const getActiveTab = (txId: string) => activeTabs[txId] || 'overview';

  const toggleTx = useCallback((txId: string) => {
    setOpenTxId(prev => prev === txId ? null : txId);
  }, []);

  const filteredTxs = TRANSACTIONS.filter(tx => {
    if (activeType !== 'all' && tx.type !== activeType) return false;
    if (activeStatus !== 'all' && tx.status !== activeStatus) return false;
    if (searchVal && !tx.searchData.toLowerCase().includes(searchVal.toLowerCase())) return false;
    return true;
  });

  const supplyUsd = (parseFloat(supplyAmount.replace(/,/g, '')) || 0) * 1958;
  const supplyYearly = supplyUsd * 0.0321;
  const borrowNum = parseFloat(borrowAmount.replace(/,/g, '')) || 0;
  const newDebt = 5520 + borrowNum;
  const newHF = newDebt > 0 ? Math.round((17235 * 0.825) / newDebt * 100) / 100 : 99;
  const hfBarPct = Math.min(Math.max((newHF / 3) * 100, 5), 100);
  const hfClass = newHF >= 1.5 ? 'good' : newHF >= 1.0 ? 'warning' : 'danger';

  const executeLending = (action: string) => {
    setSubmitState('loading');
    setTimeout(() => {
      setSubmitState('success');
      setTimeout(() => setSubmitState('idle'), 2000);
    }, 1500);
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); };

  /* ── Render ── */
  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">

      {/* Page Header */}
      <h1 className="text-lg font-semibold text-[#14140f]">Lending</h1>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 border border-[#cd6332]/12 bg-white p-3">
        <div className="flex gap-1">
          {['all', 'supply', 'borrow', 'repay', 'withdraw'].map(type => (
            <button key={type} onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeType === type ? 'bg-[#cd6332] text-white' : 'text-[rgba(56,112,133,0.5)] hover:text-[#cd6332] hover:bg-[rgba(205,99,50,0.04)]'}`}>
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-[rgba(56,112,133,0.1)]" />
        <div className="flex gap-1">
          {['all', 'success', 'failed'].map(status => (
            <button key={status} onClick={() => setActiveStatus(status)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${activeStatus === status ? 'bg-[#cd6332] text-white' : 'text-[rgba(56,112,133,0.5)] hover:text-[#cd6332] hover:bg-[rgba(205,99,50,0.04)]'}`}>
              {status === 'success' && <CheckCircle className="h-2.5 w-2.5" />}
              {status === 'failed' && <XCircle className="h-2.5 w-2.5" />}
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 border border-[rgba(56,112,133,0.1)] bg-[#faf9f5] px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-[rgba(56,112,133,0.3)]" />
          <input type="text" placeholder="Search by hash, token, protocol..." value={searchVal} onChange={e => setSearchVal(e.target.value)}
            className="w-48 bg-transparent text-xs text-[#387085] outline-none placeholder:text-[rgba(56,112,133,0.3)]" />
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="flex gap-5 items-start">

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {filteredTxs.map(tx => (
            <div key={tx.id} className={`lending-tx-item ${openTxId === tx.id ? 'open' : ''}`}>
              {/* Row */}
              <div className="lending-tx-row" onClick={() => toggleTx(tx.id)}>
                <div className={`lending-row-status ${tx.status === 'success' ? 'ok' : 'fail'}`} />
                <div className="lending-row-pair">
                  <div className={`lending-row-icon ${tx.tokenIcon}`}>{tx.tokenLetter}</div>
                  <div><span className="lending-row-pair-label">{tx.label}</span><span className="lending-row-dex">Aave V3</span></div>
                </div>
                <div className="lending-row-amount">
                  {tx.amount}
                  {tx.apy && <span className={`lending-row-apy ${tx.apyType === 'borrow' ? 'borrow' : ''}`}>{tx.apy}</span>}
                </div>
                <div className="lending-row-value">
                  <div className={`lending-row-usd ${tx.status === 'failed' ? '!text-[#c83232]' : ''}`}>{tx.usd}</div>
                  <div className="lending-row-time">{tx.time}</div>
                </div>
                <div className="lending-row-chevron"><ChevronDown className="h-4 w-4" /></div>
              </div>

              {/* Detail */}
              <div className="lending-tx-detail">
                {/* Hero + Flow */}
                <div className="lending-top-horizontal">
                  {/* Hero Status Card */}
                  <div className={`lending-hero ${tx.status}`}>
                    <div className="lending-hero-top">
                      <div className="lending-hero-top-left">
                        <div className="lending-hero-type-icon"><Landmark className="h-5 w-5" /></div>
                        <div>
                          <div className="lending-hero-title">{tx.detail.heroTitle}</div>
                          <div className="lending-hero-subtitle">
                            {tx.status === 'success' ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            {tx.detail.heroSubtitle}
                          </div>
                        </div>
                      </div>
                      <span className="lending-hero-timestamp">{tx.time}</span>
                    </div>
                    <div className="lending-hero-amount-section">
                      <div className="lending-hero-amount-label">{tx.detail.amountLabel}</div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="lending-hero-usd">{tx.detail.amountUsd}</span>
                        <span className="lending-hero-native">{tx.detail.amountNative}</span>
                      </div>
                    </div>
                    <div className="lending-hero-identity">
                      <div className="lending-hero-row">
                        <span className="text-[11px] text-[rgba(56,112,133,0.45)]">Transaction</span>
                        <span className="lending-hero-hash" onClick={() => copyText(tx.detail.txHash)}>
                          {tx.detail.txHashShort} <Copy className="h-3 w-3" />
                        </span>
                      </div>
                      <div className="lending-hero-row">
                        <span className="text-[11px] text-[rgba(56,112,133,0.45)]">Block</span>
                        <span className="lending-hero-block">{tx.detail.block}</span>
                      </div>
                    </div>
                  </div>

                  {/* Lending Detail Card */}
                  <div className={`lending-detail-card ${tx.detail.flow.isFailed ? 'detail-failed' : ''}`}>
                    <div className="lending-card-header">
                      <span className="lending-card-title"><Landmark className="h-4 w-4" />{tx.type === 'liquidation' ? 'Liquidation Flow' : 'Lending Flow'}</span>
                      <span className="lending-card-badge">Aave V3</span>
                    </div>
                    <div className="lending-flow-visual">
                      {/* Determine flow direction */}
                      {(tx.detail.flow.flowDirection === 'supply' || tx.detail.flow.flowDirection === 'repay' || tx.detail.flow.flowDirection === 'liquidation') && tx.detail.flow.fromToken && (
                        <div className="lending-flow-token" style={tx.detail.flow.isFailed ? { borderColor: 'rgba(200,50,50,0.2)' } : {}}>
                          <div className={`lending-flow-icon ${tx.detail.flow.fromToken.icon}`}>{tx.detail.flow.fromToken.letter}</div>
                          <div>
                            <div className="lending-flow-amount" style={tx.detail.flow.isFailed ? { textDecoration: 'line-through', opacity: 0.5 } : {}}>{tx.detail.flow.fromToken.amount}</div>
                            <div className="lending-flow-sub">{tx.detail.flow.fromToken.sub}</div>
                          </div>
                        </div>
                      )}
                      {(tx.detail.flow.flowDirection === 'borrow' || tx.detail.flow.flowDirection === 'withdraw') && (
                        <div className="lending-flow-dest" style={{ background: getDestStyle(tx.detail.flow.destStyle).bg, borderColor: getDestStyle(tx.detail.flow.destStyle).border, color: getDestStyle(tx.detail.flow.destStyle).color }}>
                          <Landmark className="h-3 w-3" /> {tx.detail.flow.dest}
                        </div>
                      )}
                      <div className="lending-flow-arrow" style={{ background: getArrowStyle(tx.detail.flow.destStyle).bg, borderColor: getArrowStyle(tx.detail.flow.destStyle).border, color: getArrowStyle(tx.detail.flow.destStyle).color }}>
                        {tx.detail.flow.isFailed ? <X className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                      </div>
                      {(tx.detail.flow.flowDirection === 'supply' || tx.detail.flow.flowDirection === 'repay' || tx.detail.flow.flowDirection === 'liquidation') && (
                        <div className="lending-flow-dest" style={{ background: getDestStyle(tx.detail.flow.destStyle).bg, borderColor: getDestStyle(tx.detail.flow.destStyle).border, color: getDestStyle(tx.detail.flow.destStyle).color }}>
                          {tx.detail.flow.isFailed ? <AlertTriangle className="h-3 w-3" /> : <Landmark className="h-3 w-3" />} {tx.detail.flow.dest}
                        </div>
                      )}
                      {(tx.detail.flow.flowDirection === 'borrow' || tx.detail.flow.flowDirection === 'withdraw') && tx.detail.flow.toToken && (
                        <div className="lending-flow-token">
                          <div className={`lending-flow-icon ${tx.detail.flow.toToken.icon}`}>{tx.detail.flow.toToken.letter}</div>
                          <div>
                            <div className="lending-flow-amount">{tx.detail.flow.toToken.amount}</div>
                            <div className="lending-flow-sub">{tx.detail.flow.toToken.sub}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="lending-card-rows">
                      {tx.detail.flow.rows.map((row, i) => (
                        <div key={i} className="lending-c-row">
                          <span className="lending-c-row-key">{row.key}</span>
                          <span className="lending-c-row-val" style={row.valColor ? { color: row.valColor } : {}}>
                            {row.pill ? <span className={`lending-pill ${row.pill.type}`}>{row.pill.text}</span> : (row.val || '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Detail Tabs */}
                <div className="lending-detail-tabs">
                  <button className={getActiveTab(tx.id) === 'overview' ? 'active' : ''} onClick={() => setActiveTabs(p => ({ ...p, [tx.id]: 'overview' }))}>Overview</button>
                  <button className={getActiveTab(tx.id) === 'tokens' ? 'active' : ''} onClick={() => setActiveTabs(p => ({ ...p, [tx.id]: 'tokens' }))}>
                    Token Transfers {tx.detail.transfers.length > 0 && <span className="lending-tab-count">{tx.detail.transfers.length}</span>}
                  </button>
                  <button className={getActiveTab(tx.id) === 'logs' ? 'active' : ''} onClick={() => setActiveTabs(p => ({ ...p, [tx.id]: 'logs' }))}>
                    Logs {tx.detail.logs.length > 0 && <span className="lending-tab-count">{tx.detail.logs.length}</span>}
                  </button>
                </div>

                {/* Tab: Overview */}
                {getActiveTab(tx.id) === 'overview' && (
                  <div className={`lending-bento-grid ${tx.status === 'failed' && !tx.detail.positionImpact ? '' : ''}`}>
                    {/* Transaction Details */}
                    <div className="lending-bento-card">
                      <div className="lending-card-header"><span className="lending-card-title"><FileText className="h-4 w-4" />Transaction Details</span></div>
                      <div className="lending-detail-list">
                        <div className="lending-c-row"><span className="lending-c-row-key">{tx.status === 'failed' ? 'Fee (Consumed)' : 'Fee'}</span><span className="lending-c-row-val" style={tx.status === 'failed' ? { color: '#c83232' } : {}}>{tx.detail.overview.fee} <span className="font-mono text-[11px] text-[rgba(56,112,133,0.45)] ml-1">{tx.detail.overview.feeEth}</span> {tx.detail.overview.feePill.text && <span className={`lending-pill ${tx.detail.overview.feePill.type}`}>{tx.detail.overview.feePill.text}</span>}</span></div>
                        <div className="lending-c-row"><span className="lending-c-row-key">Time</span><span className="lending-c-row-val">{tx.detail.overview.time} <span className="text-[11px] text-[rgba(56,112,133,0.45)] ml-1">{tx.detail.overview.timeDetail}</span></span></div>
                        {tx.detail.overview.confirmations && <div className="lending-c-row"><span className="lending-c-row-key">Confirmations</span><span className="lending-c-row-val">{tx.detail.overview.confirmations} <span className={`lending-pill ${tx.detail.overview.confirmPill.type}`}>{tx.detail.overview.confirmPill.text}</span></span></div>}
                        {tx.status === 'failed' && <div className="lending-c-row"><span className="lending-c-row-key">Execution Result</span><span className="lending-c-row-val"><span className="lending-pill error">Reverted</span></span></div>}
                        <div className="lending-c-row"><span className="lending-c-row-key">Network</span><span className="lending-c-row-val">{tx.detail.overview.network} <span className="text-[11px] text-[rgba(56,112,133,0.45)] ml-1">Mainnet</span></span></div>
                      </div>
                      <div className="lending-detail-separator"><span className="lending-detail-separator-line" /><span className="lending-detail-separator-label">More Details</span><span className="lending-detail-separator-line" /></div>
                      <div className="lending-detail-list pb-2">
                        <div className="lending-c-row"><span className="lending-c-row-key">Gas Price</span><span className="lending-c-row-val font-mono">{tx.detail.overview.gasPrice}</span></div>
                        <div className="lending-c-row"><span className="lending-c-row-key">Gas Used</span><span className="lending-c-row-val"><span className="font-mono">{tx.detail.overview.gasUsed}</span><span className={`lending-pill ${tx.detail.overview.gasPill.type}`}>{tx.detail.overview.gasPill.text}</span></span></div>
                        <div className="lending-c-row"><span className="lending-c-row-key">Value</span><span className="lending-c-row-val font-mono">{tx.detail.overview.value}</span></div>
                        <div className="lending-c-row"><span className="lending-c-row-key">Nonce</span><span className="lending-c-row-val font-mono">{tx.detail.overview.nonce}</span></div>
                        <div className="lending-c-row"><span className="lending-c-row-key">Input Data</span><span className="lending-c-row-val font-mono">{tx.detail.overview.inputData}</span></div>
                      </div>
                    </div>

                    {/* Position Impact or Fee Breakdown */}
                    {tx.detail.positionImpact && (
                      <div className="lending-bento-card">
                        <div className="lending-card-header"><span className="lending-card-title"><HeartPulse className="h-4 w-4" />Position Impact</span></div>
                        <div className="lending-position-impact">
                          <div className="lending-pi-row">
                            <span className="lending-pi-key">Health Factor</span>
                            <span className="lending-pi-val">
                              <span>{tx.detail.positionImpact.hf.from}</span>
                              <span className="lending-pi-arrow">→</span>
                              <span className={tx.detail.positionImpact.hf.direction === 'up' ? 'lending-pi-up' : 'lending-pi-down'}>
                                {tx.detail.positionImpact.hf.to} {tx.detail.positionImpact.hf.direction === 'up' ? '↑' : '↓'}
                              </span>
                            </span>
                          </div>
                          <div className="py-1">
                            <div className="lending-hf-bar"><div className={`lending-hf-bar-fill good`} style={{ width: tx.detail.positionImpact.hfBarWidth }} /></div>
                          </div>
                          {tx.detail.positionImpact.rows.map((row, i) => (
                            <div key={i} className="lending-pi-row">
                              <span className="lending-pi-key">{row.key}</span>
                              <span className="lending-pi-val">
                                {row.val ? row.val : (<>
                                  <span>{row.from}</span>
                                  <span className="lending-pi-arrow">→</span>
                                  <span className={row.direction === 'up' ? 'lending-pi-up' : row.direction === 'down' ? 'lending-pi-down' : ''}>{row.to}</span>
                                </>)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="lending-easy-bubble">
                          <div className="lending-easy-label"><span className="lending-ai-dot" /> In Simple Terms</div>
                          <p>{renderHighlightText(tx.detail.positionImpact.easyText)}</p>
                        </div>
                      </div>
                    )}

                    {tx.detail.feeBreakdown && (
                      <div className="lending-bento-card">
                        <div className="lending-card-header"><span className="lending-card-title"><Receipt className="h-4 w-4" />Fee Breakdown</span></div>
                        <div className="p-4 space-y-3">
                          <div>
                            <div className="lending-gas-usage-header"><span className="lending-gas-usage-label">Gas Used</span><span className="lending-gas-usage-nums">{tx.detail.feeBreakdown.gasUsed} / {tx.detail.feeBreakdown.gasTotal}</span></div>
                            <div className="lending-gas-bar"><div className="lending-gas-bar-fill fail" style={{ width: '100%' }} /></div>
                            <div className="lending-gas-pct"><span className="lending-gas-pct-val">{tx.detail.feeBreakdown.gasPercent}</span><span className="lending-gas-eff-bad">Reverted</span></div>
                          </div>
                          <div>
                            <div className="lending-fee-row"><span className="lending-fee-key">Base Fee</span><span className="lending-fee-val">{tx.detail.feeBreakdown.baseFee} <span className="lending-fee-gwei">({tx.detail.feeBreakdown.baseGwei})</span></span></div>
                            <div className="lending-fee-row"><span className="lending-fee-key">Priority Fee (Tip)</span><span className="lending-fee-val">{tx.detail.feeBreakdown.priorityFee} <span className="lending-fee-gwei">({tx.detail.feeBreakdown.priorityGwei})</span></span></div>
                            <div className="lending-fee-row lending-fee-total"><span className="lending-fee-key lending-fee-total-key">Consumed Fee</span><span className="lending-fee-val" style={{ color: '#c83232' }}>{tx.detail.feeBreakdown.totalFee} <span className="lending-fee-sub">({tx.detail.feeBreakdown.totalEth})</span></span></div>
                          </div>
                          <div className="lending-fee-wasted">
                            <div className="wasted-main"><AlertTriangle className="h-3.5 w-3.5" /> {tx.detail.feeBreakdown.wasted}</div>
                            <div className="wasted-detail">{tx.detail.feeBreakdown.wastedDetail}</div>
                          </div>
                        </div>
                        <div className="lending-fail-reason-box">
                          <div className="lending-fail-reason-label"><AlertTriangle className="h-3.5 w-3.5" /> Failure Reason</div>
                          <p>{tx.detail.feeBreakdown.failReason}</p>
                          <div className="lending-fail-reason-code" style={{ whiteSpace: 'pre-line' }}>{tx.detail.feeBreakdown.failCode}</div>
                        </div>
                        <div className="lending-easy-bubble">
                          <div className="lending-easy-label"><span className="lending-ai-dot" /> In Simple Terms</div>
                          <p>{renderHighlightText(tx.detail.feeBreakdown.easyText)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Token Transfers */}
                {getActiveTab(tx.id) === 'tokens' && (
                  tx.detail.transfers.length > 0 ? (
                    <div className="border border-[rgba(56,112,133,0.08)] bg-white">
                      <table className="lending-data-table">
                        <thead><tr><th>From</th><th>To</th><th>Type</th><th>Amount</th><th>Token</th></tr></thead>
                        <tbody>
                          {tx.detail.transfers.map((tr, i) => (
                            <tr key={i}>
                              <td><span className="lending-addr">{tr.from}</span></td>
                              <td><span className="lending-addr">{tr.to}</span></td>
                              <td><span className={`lending-type-badge ${tr.type === 'IN' ? 'type-in' : 'type-out'}`}>{tr.type}</span></td>
                              <td className="font-mono text-[11px]">{tr.amount}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <span className={`lending-flow-icon ${tr.tokenIcon}`} style={{ width: 18, height: 18, fontSize: 8 }}>{tr.tokenLetter}</span>
                                  {tr.tokenName}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="lending-empty-state">
                      <XCircle className="mx-auto" /><div className="lending-empty-state-text">No Token Transfers</div>
                      <div className="lending-empty-state-sub">{tx.status === 'failed' ? 'Liquidation failed — no tokens were exchanged' : 'No transfers recorded'}</div>
                    </div>
                  )
                )}

                {/* Tab: Logs */}
                {getActiveTab(tx.id) === 'logs' && (
                  tx.detail.logs.length > 0 ? (
                    <div className="space-y-1">
                      {tx.detail.logs.map(log => {
                        const logKey = `${tx.id}-${log.idx}`;
                        return (
                          <div key={logKey} className={`lending-log ${openLogs[logKey] ? 'open' : ''}`}>
                            <div className="lending-log-header" onClick={() => setOpenLogs(p => ({ ...p, [logKey]: !p[logKey] }))}>
                              <div className="flex items-center">
                                <div className="lending-log-idx">{log.idx}</div>
                                <div><span className="lending-log-event">{log.event}</span><span className="lending-log-contract">{log.contract}</span></div>
                              </div>
                              <ChevronDown className={`h-4 w-4 text-[rgba(56,112,133,0.3)] transition-transform ${openLogs[logKey] ? 'rotate-180' : ''}`} />
                            </div>
                            <div className="lending-log-body">
                              <div className="lending-log-section-label">Address</div>
                              <div className="lending-log-hex">{log.address}</div>
                              <div className="lending-log-section-label">Topics</div>
                              {log.topics.map((topic, ti) => (
                                <div key={ti} className="lending-log-topic">
                                  <span className="lending-log-topic-idx">{ti}</span>
                                  <span className="lending-log-topic-val">{topic}</span>
                                </div>
                              ))}
                              <div className="lending-log-section-label">Data</div>
                              <div className="lending-log-hex">{log.data}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="lending-empty-state">
                      <FileText className="mx-auto" /><div className="lending-empty-state-text">No Event Logs</div>
                      <div className="lending-empty-state-sub">Transaction was reverted — no events recorded</div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}

          {filteredTxs.length === 0 && (
            <div className="lending-empty-state py-16">
              <Search className="mx-auto h-10 w-10" />
              <div className="lending-empty-state-text mt-3">No transactions found</div>
              <div className="lending-empty-state-sub">Try adjusting your filters or search query</div>
            </div>
          )}
        </div>

        {/* Lending Widget Sidebar */}
        <div className="w-[340px] flex-shrink-0">
          <div className="lending-widget">
            <div className="lending-widget-header">
              <span className="lending-widget-title"><Landmark /> Lend &amp; Borrow</span>
              <button className="lending-widget-settings"><Settings /></button>
            </div>

            <div className="lending-widget-tabs">
              <button className={`lending-widget-tab ${lendingTab === 'supply' ? 'active' : ''}`} onClick={() => setLendingTab('supply')}>Supply</button>
              <button className={`lending-widget-tab ${lendingTab === 'borrow' ? 'active' : ''}`} onClick={() => setLendingTab('borrow')}>Borrow</button>
            </div>

            <div className="lending-widget-body">
              {lendingTab === 'supply' && (
                <>
                  <div className="lending-widget-input-box">
                    <div className="lending-widget-input-label">Supply Amount</div>
                    <div className="lending-widget-input-row">
                      <input className="lending-widget-input" type="text" placeholder="0" value={supplyAmount} onChange={e => setSupplyAmount(e.target.value)} />
                      <button className="lending-widget-token-btn">
                        <span className="lending-widget-token-icon icon-eth" style={{ background: '#627eea' }}>E</span>
                        ETH <ChevronDown />
                      </button>
                    </div>
                    <div className="lending-widget-balance">
                      <span>Balance: 4.2831 ETH</span>
                      <span>
                        <span className="lending-widget-balance-usd">~${Math.round(supplyUsd).toLocaleString()}</span>
                        <button className="lending-widget-max-btn" onClick={() => setSupplyAmount('4.2831')}>MAX</button>
                      </span>
                    </div>
                  </div>
                  <div className="lending-widget-info">
                    <div className="lending-widget-info-row"><span className="lending-widget-info-key">Supply APY</span><span className="lending-widget-info-val" style={{ color: '#387085' }}>3.21%</span></div>
                    <div className="lending-widget-info-row"><span className="lending-widget-info-key">Collateral Factor</span><span className="lending-widget-info-val">82.5%</span></div>
                    <div className="lending-widget-info-row"><span className="lending-widget-info-key">Est. Yearly Earnings</span><span className="lending-widget-info-val" style={{ color: '#387085' }}>~${supplyYearly.toFixed(2)}</span></div>
                  </div>
                  <button className="lending-widget-submit" onClick={() => executeLending('supply')}
                    style={submitState === 'success' ? { background: '#5a8a3c' } : submitState === 'loading' ? { opacity: 0.7 } : {}}>
                    {submitState === 'idle' && <><ArrowDownToLine /> Supply ETH</>}
                    {submitState === 'loading' && <>Supplying...</>}
                    {submitState === 'success' && <><CheckCircle /> Supply Successful!</>}
                  </button>
                </>
              )}

              {lendingTab === 'borrow' && (
                <>
                  <div className="lending-widget-input-box">
                    <div className="lending-widget-input-label">Borrow Amount</div>
                    <div className="lending-widget-input-row">
                      <input className="lending-widget-input" type="text" placeholder="0" value={borrowAmount} onChange={e => setBorrowAmount(e.target.value)} />
                      <button className="lending-widget-token-btn">
                        <span className="lending-widget-token-icon icon-usdc" style={{ background: '#2775ca' }}>$</span>
                        USDC <ChevronDown />
                      </button>
                    </div>
                    <div className="lending-widget-balance">
                      <span>Available: $9,156</span>
                      <span className="lending-widget-balance-usd">~${borrowNum.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="lending-widget-info">
                    <div className="lending-widget-info-row"><span className="lending-widget-info-key">Borrow APY (Variable)</span><span className="lending-widget-info-val" style={{ color: '#cd6332' }}>4.52%</span></div>
                    <div className="lending-widget-info-row"><span className="lending-widget-info-key">Available to Borrow</span><span className="lending-widget-info-val">$9,156</span></div>
                  </div>
                  <div className="lending-widget-hf">
                    <div className="lending-widget-hf-header">
                      <span className="lending-widget-hf-label">Health Factor Impact</span>
                      <span className={`lending-widget-hf-value ${hfClass}`}>2.82 → {newHF}</span>
                    </div>
                    <div className="lending-hf-bar"><div className={`lending-hf-bar-fill ${hfClass}`} style={{ width: `${hfBarPct}%` }} /></div>
                  </div>
                  <button className="lending-widget-submit" onClick={() => executeLending('borrow')}
                    style={submitState === 'success' ? { background: '#5a8a3c' } : submitState === 'loading' ? { opacity: 0.7 } : {}}>
                    {submitState === 'idle' && <><ArrowUpFromLine /> Borrow USDC</>}
                    {submitState === 'loading' && <>Borrowing...</>}
                    {submitState === 'success' && <><CheckCircle /> Borrow Successful!</>}
                  </button>
                </>
              )}
            </div>

            {/* Position Summary */}
            <div className="lending-widget-position">
              <div className="lending-widget-position-title">Your Position</div>
              <div className="lending-widget-position-grid">
                <div className="lending-widget-position-item"><div className="lending-widget-position-val" style={{ color: '#387085' }}>$17,235</div><div className="lending-widget-position-label">Supplied</div></div>
                <div className="lending-widget-position-item"><div className="lending-widget-position-val" style={{ color: '#cd6332' }}>$5,520</div><div className="lending-widget-position-label">Borrowed</div></div>
                <div className="lending-widget-position-item"><div className="lending-widget-position-val" style={{ color: '#387085' }}>2.82</div><div className="lending-widget-position-label">Health Factor</div></div>
                <div className="lending-widget-position-item"><div className="lending-widget-position-val" style={{ color: '#387085' }}>+1.84%</div><div className="lending-widget-position-label">Net APY</div></div>
              </div>
            </div>

            <div className="lending-widget-footer"><ShieldCheck /> Powered by Aave V3</div>
          </div>
        </div>

      </div>
    </div>
  );
}
