'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { MOCK_VAULTS } from '@/lib/mock-data';
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
    </div>
  );
}
