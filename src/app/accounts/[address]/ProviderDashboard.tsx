'use client';

import { useMemo } from 'react';
import { MOCK_VAULTS } from '@/lib/mock-data';
import CopyButton from '@/components/CopyButton';
import type { ProviderInfo, VaultStatus } from '@/lib/types';

// ── Styles ───────────────────────────────────────────────────────────────────

const STATUS_BAR_COLORS: Record<string, string> = {
  Active:     '#16a34a',
  Redeemed:   '#387085',
  Expired:    '#9ca3af',
  Pending:    '#d97706',
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

  const statusList: VaultStatus[] = ['Active', 'Redeemed', 'Expired', 'Pending', 'Liquidated'];
  const statusDist = statusList.map((status) => ({
    status,
    count: providerVaults.filter((v) => v.status === status).length,
    btc: providerVaults.filter((v) => v.status === status).reduce((s, v) => s + v.vaultSize, 0),
  }));
  const activeVaults = statusDist.find((s) => s.status === 'Active')?.count ?? 0;

  return (
    <div className="space-y-5">

      {/* KPI strip — 4 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active Vaults',  value: String(activeVaults), good: true },
          { label: 'Total Vaults',   value: String(totalVaults) },
          { label: 'Commission',     value: `${commissionPct}%` },
          { label: 'Connected DApp', value: provider.appName },
        ].map((kpi) => (
          <div key={kpi.label} className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
              {kpi.label}
            </p>
            <p
              className={`mt-0.5 text-lg font-semibold ${
                'good' in kpi && kpi.good ? 'text-green-600' : 'text-[#14140f]'
              }`}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT col — Identity */}
        <section className="border border-[#387085]/10 bg-white lg:col-span-2">
          <div className="border-b border-[#387085]/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-[#14140f]">Overview</h2>
          </div>
          <table className="w-full">
            <tbody>
              {[
                { label: 'Operator Address', val: provider.address, mono: true, copy: true },
                { label: 'Connected DApp',   val: provider.appName, mono: false, copy: false },
                { label: 'DApp Address',     val: provider.appAddress, mono: true, copy: true },
                { label: 'Commission',       val: `${commissionPct}%`, mono: false, copy: false },
              ].map((row, i, arr) => (
                <tr key={row.label} className={i < arr.length - 1 ? 'border-b border-[#387085]/8' : ''}>
                  <td className="w-40 py-2.5 pl-5 pr-4 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
                    {row.label}
                  </td>
                  <td className="py-2.5 pr-5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm text-[#14140f] ${row.mono ? 'break-all font-mono text-[#387085]' : ''}`}>
                        {row.val}
                      </span>
                      {row.copy && <CopyButton text={row.val} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* RIGHT col — Vault Status */}
        <section className="border border-[#387085]/10 bg-white">
          <div className="border-b border-[#387085]/10 px-5 py-3">
            <h2 className="text-sm font-semibold text-[#14140f]">Vault Status</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">
              {totalVaults} vaults · {totalBtc.toFixed(2)} BTC total
            </p>
          </div>
          <div className="space-y-0 px-5 py-4">
            {statusDist.map((s) => {
              const pct = totalVaults > 0 ? Math.round((s.count / totalVaults) * 100) : 0;
              return (
                <div
                  key={s.status}
                  className="flex items-center justify-between border-b border-[#387085]/8 py-2 last:border-0"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: STATUS_BAR_COLORS[s.status] }}
                    />
                    <span className="text-sm text-[#14140f]">{s.status}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-1.5 w-16 bg-[#387085]/8">
                      <div
                        className="h-full"
                        style={{ width: `${pct}%`, background: STATUS_BAR_COLORS[s.status] }}
                      />
                    </div>
                    <span className="w-6 text-right text-sm font-semibold text-[#14140f]">
                      {s.count}
                    </span>
                    <span className="w-8 text-right text-[11px] text-[#387085]/40">
                      {pct}%
                    </span>
                    <span className="w-14 text-right text-[10px] text-[#387085]/40">
                      {s.btc.toFixed(2)} BTC
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
