'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MOCK_VAULTS } from '@/lib/mock-data';
import { MOCK_AAVE_POSITIONS } from '@/lib/mock-aave-activity';
import { truncateAddress } from '@/lib/utils';
import CopyButton from '@/components/CopyButton';
import type { ProviderInfo, VaultStatus } from '@/lib/types';

// ── Styles ───────────────────────────────────────────────────────────────────

const STATUS_ORDER: VaultStatus[] = ['Active', 'Pending', 'Redeemed', 'Expired', 'Liquidated'];

const STATUS_COLORS: Record<VaultStatus, string> = {
  Active:     '#16a34a',
  Pending:    '#d97706',
  Redeemed:   '#387085',
  Expired:    '#9ca3af',
  Liquidated: '#dc2626',
};

// ── Aave helpers ─────────────────────────────────────────────────────────────

function parseAmount(amount: string, decimals: number): number {
  return parseFloat(amount) / Math.pow(10, decimals);
}

function getHealthStatus(hf: number): { label: string; color: string; bg: string; text: string } {
  if (hf >= 2.0) return { label: 'Safe', color: '#16a34a', bg: 'bg-green-50', text: 'text-green-700' };
  if (hf >= 1.5) return { label: 'Healthy', color: '#387085', bg: 'bg-[#387085]/8', text: 'text-[#387085]' };
  if (hf >= 1.2) return { label: 'Caution', color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700' };
  if (hf >= 1.0) return { label: 'At Risk', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700' };
  return { label: 'Liquidation', color: '#dc2626', bg: 'bg-red-50', text: 'text-red-600' };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProviderDashboard({ provider }: { provider: ProviderInfo }) {
  const lcAddress = provider.address.toLowerCase();

  const providerVaults = useMemo(
    () => MOCK_VAULTS.filter((v) => v.providerAddress.toLowerCase() === lcAddress),
    [lcAddress],
  );

  const totalVaults = providerVaults.length;
  const totalBtc = providerVaults.reduce((s, v) => s + v.vaultSize, 0);
  const commissionPct = (provider.commission / 100).toFixed(2);

  // Status distribution (with BTC sum, hide zero-count rows)
  const statusDist = STATUS_ORDER
    .map((status) => ({
      status,
      count: providerVaults.filter((v) => v.status === status).length,
      btc: providerVaults.filter((v) => v.status === status).reduce((s, v) => s + v.vaultSize, 0),
    }))
    .filter((s) => s.count > 0);

  // Provider-level rates
  const liquidatedCount = providerVaults.filter((v) => v.status === 'Liquidated').length;
  const expiredCount = providerVaults.filter((v) => v.status === 'Expired').length;
  const activeCount = providerVaults.filter((v) => v.status === 'Active').length;
  const liquidationRate = totalVaults > 0 ? (liquidatedCount / totalVaults) * 100 : 0;
  const expiryRate = totalVaults > 0 ? (expiredCount / totalVaults) * 100 : 0;
  const activeRate = totalVaults > 0 ? (activeCount / totalVaults) * 100 : 0;

  // Network-wide averages
  const allVaults = MOCK_VAULTS;
  const networkAvgLiquidation =
    (allVaults.filter((v) => v.status === 'Liquidated').length / allVaults.length) * 100;
  const networkAvgExpiry =
    (allVaults.filter((v) => v.status === 'Expired').length / allVaults.length) * 100;
  const networkAvgActive =
    (allVaults.filter((v) => v.status === 'Active').length / allVaults.length) * 100;

  // Expiry breakdown (no real `expired_reason` in mock — split roughly in half)
  const expiredByReason = {
    ackTimeout: Math.floor(expiredCount / 2),
    activationTimeout: expiredCount - Math.floor(expiredCount / 2),
  };

  const rpcUrl = `https://rpc.${provider.name}.btcvault.io`;

  const indicators = [
    {
      label: 'Liquidation Rate',
      value: liquidationRate,
      networkAvg: networkAvgLiquidation,
      good: liquidationRate <= networkAvgLiquidation,
      desc: 'Lower is better',
    },
    {
      label: 'Expiry Rate',
      value: expiryRate,
      networkAvg: networkAvgExpiry,
      good: expiryRate <= networkAvgExpiry,
      desc: 'Lower is better',
    },
    {
      label: 'Active Rate',
      value: activeRate,
      networkAvg: networkAvgActive,
      good: activeRate >= networkAvgActive,
      desc: 'Higher is better',
    },
  ];

  return (
    <div className="space-y-4">

      {/* Row 1 — Provider Overview (inline) */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-[#387085]/10 bg-[#faf9f5] px-5 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/40">Operator</span>
          <span className="font-mono text-xs text-[#387085]">
            {truncateAddress(provider.address, 6, 4)}
          </span>
          <CopyButton text={provider.address} />
        </div>

        <span className="select-none text-[#387085]/15">|</span>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/40">DApp</span>
          <Link
            href={`/accounts/${provider.appAddress}`}
            className="text-sm text-[#14140f] transition-colors hover:text-[#cd6332]"
          >
            {provider.appName}
          </Link>
        </div>

        <span className="select-none text-[#387085]/15">|</span>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/40">Commission</span>
          <span className="text-sm text-[#14140f]">{commissionPct}%</span>
        </div>

        <span className="select-none text-[#387085]/15">|</span>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/40">RPC</span>
          <span className="max-w-[180px] truncate font-mono text-xs text-[#387085]/60" title={rpcUrl}>
            {rpcUrl}
          </span>
          <CopyButton text={rpcUrl} />
        </div>
      </div>

      {/* Row 2 — Vault Status + Health (2 columns) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Left — Vault Status */}
        <section className="border border-[#387085]/10 bg-white">
          <div className="border-b border-[#387085]/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-[#14140f]">Vault Status</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">
              {totalVaults} vaults · {totalBtc.toFixed(4)} sBTC total
            </p>
          </div>
          <div className="space-y-0 px-5 py-3">
            {statusDist.map((s) => {
              const pct = totalVaults > 0 ? Math.round((s.count / totalVaults) * 100) : 0;
              return (
                <div
                  key={s.status}
                  className="flex items-center justify-between border-b border-[#387085]/8 py-2 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[s.status] }}
                    />
                    <span className="text-sm text-[#14140f]">{s.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-20 bg-[#387085]/8">
                      <div
                        className="h-full"
                        style={{
                          width: `${pct}%`,
                          background: STATUS_COLORS[s.status],
                          opacity: 0.75,
                        }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm font-semibold text-[#14140f]">
                      {s.count}
                    </span>
                    <span className="w-8 text-right text-[11px] text-[#387085]/40">{pct}%</span>
                    <span className="w-16 text-right text-[10px] text-[#387085]/40">
                      {s.btc.toFixed(3)} sBTC
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right — Health */}
        <section className="border border-[#387085]/10 bg-white">
          <div className="border-b border-[#387085]/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-[#14140f]">Health</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">vs. network average</p>
          </div>
          <div className="space-y-0 px-5 py-3">
            {indicators.map((indicator) => {
              const diff = indicator.value - indicator.networkAvg;
              const isGood = indicator.good;
              return (
                <div
                  key={indicator.label}
                  className="flex items-center justify-between border-b border-[#387085]/8 py-2.5 last:border-0"
                >
                  <div>
                    <p className="text-sm text-[#14140f]">{indicator.label}</p>
                    <p className="text-[10px] text-[#387085]/40">
                      avg {indicator.networkAvg.toFixed(1)}% · {indicator.desc}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-base font-semibold ${isGood ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {indicator.value.toFixed(1)}%
                    </span>
                    <span
                      className={`text-[11px] font-medium ${isGood ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {diff >= 0 ? '+' : ''}
                      {diff.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}

            {(expiredByReason.ackTimeout > 0 || expiredByReason.activationTimeout > 0) && (
              <div className="mt-1 border-t border-[#387085]/8 pt-2">
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-[#387085]/50">
                  Expiry breakdown
                </p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] text-[#387085]/40">ACK timeout</p>
                    <p className="text-sm font-medium text-[#14140f]">{expiredByReason.ackTimeout}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#387085]/40">Activation timeout</p>
                    <p className="text-sm font-medium text-[#14140f]">
                      {expiredByReason.activationTimeout}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Aave Position Health */}
      <AavePositionHealth />
    </div>
  );
}

// ── Aave Position Health section ─────────────────────────────────────────────

function AavePositionHealth() {
  const positions = MOCK_AAVE_POSITIONS;
  const totalCollateral = positions.reduce(
    (s, p) => s + parseAmount(p.totalCollateral.amount, p.totalCollateral.decimals),
    0,
  );
  const activeBorrowers = positions.filter((p) => p.debts.length > 0).length;
  const atRiskCount = positions.filter((p) => parseFloat(p.healthFactor) < 1.5).length;
  const lowestHf =
    positions.length > 0
      ? Math.min(...positions.map((p) => parseFloat(p.healthFactor)))
      : 0;
  const sortedPositions = [...positions].sort(
    (a, b) => parseFloat(a.healthFactor) - parseFloat(b.healthFactor),
  );

  return (
    <section className="border border-[#387085]/10 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#387085]/10 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#14140f]">Aave Position Health</h2>
          <p className="mt-0.5 text-[11px] text-[#387085]/50">
            Collateral and debt status per depositor
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {atRiskCount > 0 ? (
            <span className="inline-flex items-center gap-1 border border-red-200/60 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
              ⚠ {atRiskCount} at risk
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
              ✓ All healthy
            </span>
          )}
          <span className="text-[11px] text-[#387085]/40">
            {positions.length} borrowers
          </span>
        </div>
      </div>

      {/* KPI summary 4-col */}
      <div className="grid grid-cols-2 border-b border-[#387085]/10 sm:grid-cols-4">
        <div className="border-r border-[#387085]/8 px-5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            Total Collateral
          </p>
          <p className="mt-0.5 text-lg font-semibold text-[#cd6332]">
            {totalCollateral.toFixed(4)} sBTC
          </p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">across all positions</p>
        </div>
        <div className="border-r border-[#387085]/8 px-5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            Active Borrowers
          </p>
          <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{activeBorrowers}</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">with outstanding debt</p>
        </div>
        <div className="border-r border-[#387085]/8 px-5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            At-Risk Positions
          </p>
          <p
            className={`mt-0.5 text-lg font-semibold ${
              atRiskCount > 0 ? 'text-amber-600' : 'text-[#14140f]'
            }`}
          >
            {atRiskCount}
          </p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">Health Factor &lt; 1.5</p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            Lowest Health Factor
          </p>
          <p
            className={`mt-0.5 text-lg font-semibold ${
              lowestHf < 1.2 ? 'text-red-500' : 'text-[#14140f]'
            }`}
          >
            {lowestHf.toFixed(2)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">across all positions</p>
        </div>
      </div>

      {/* Position rows — sorted by HF asc (most risky first) */}
      <div className="divide-y divide-[#387085]/8">
        {sortedPositions.map((position) => {
          const hf = parseFloat(position.healthFactor);
          const status = getHealthStatus(hf);
          const coll = parseAmount(
            position.totalCollateral.amount,
            position.totalCollateral.decimals,
          );
          const isLiquidation = hf < 1.0;
          const ltv = parseFloat(position.currentLtv);
          return (
            <div
              key={position.depositorFull}
              className={`px-5 py-3 transition-colors ${
                isLiquidation ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-[#faf9f5]'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left — depositor + status */}
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}
                  >
                    {isLiquidation && '⚠ '}
                    {status.label}
                  </span>
                  <Link
                    href={`/accounts/${position.depositorFull}`}
                    className="truncate font-mono text-xs text-[#cd6332] hover:underline"
                  >
                    {position.depositor}
                  </Link>
                </div>

                {/* Right — metrics */}
                <div className="flex flex-shrink-0 items-center gap-6 text-right">
                  {/* Collateral */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#387085]/40">
                      Collateral
                    </p>
                    <p className="text-sm font-semibold text-[#14140f]">
                      {coll.toFixed(4)}
                      <span className="ml-1 text-[11px] font-normal text-[#387085]/40">
                        sBTC
                      </span>
                    </p>
                  </div>

                  {/* Debt */}
                  {position.debts.map((debt, i) => {
                    const total = parseAmount(debt.totalAmount, debt.decimals);
                    const interest = parseAmount(debt.accruedInterest, debt.decimals);
                    return (
                      <div key={i}>
                        <p className="text-[10px] uppercase tracking-wide text-[#387085]/40">
                          Debt
                        </p>
                        <p className="text-sm font-semibold text-[#cd6332]">
                          {total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                          <span className="ml-1 text-[11px] font-normal text-[#387085]/40">
                            {debt.symbol}
                          </span>
                        </p>
                        <p className="text-[10px] text-[#387085]/35">
                          +{interest.toLocaleString('en-US', { maximumFractionDigits: 4 })}{' '}
                          interest
                        </p>
                      </div>
                    );
                  })}

                  {/* LTV */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#387085]/40">LTV</p>
                    <p
                      className={`text-sm font-semibold ${
                        ltv > 70
                          ? 'text-red-500'
                          : ltv > 50
                            ? 'text-amber-600'
                            : 'text-[#14140f]'
                      }`}
                    >
                      {position.currentLtv}%
                    </p>
                  </div>

                  {/* Health */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#387085]/40">
                      Health
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: status.color }}
                    >
                      {hf.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
