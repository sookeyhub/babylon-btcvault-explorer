'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MOCK_VAULTS, MOCK_DEPOSITORS } from '@/lib/mock-data';
import type { VaultStatus } from '@/lib/types';

// ── Styles ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  Active:     'bg-green-50 text-green-700',
  Redeemed:   'bg-blue-50 text-blue-700',
  Expired:    'bg-gray-100 text-gray-500',
  Pending:    'bg-amber-50 text-amber-700',
  Liquidated: 'bg-red-50 text-red-600',
};
const DOT_COLORS: Record<string, string> = {
  Active:     'bg-green-500',
  Redeemed:   'bg-blue-500',
  Expired:    'bg-gray-400',
  Pending:    'bg-amber-500',
  Liquidated: 'bg-red-500',
};
const STATUS_BAR_COLOR: Record<string, string> = {
  Active:     '#16a34a',
  Redeemed:   '#2563eb',
  Expired:    '#9ca3af',
  Pending:    '#d97706',
  Liquidated: '#dc2626',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncateAddr(addr: string, start = 6, end = 4): string {
  if (!addr) return '';
  if (addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DepositorDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = use(params);
  const lcAddress = address.toLowerCase();

  const depositor = MOCK_DEPOSITORS.find(
    (d) => d.address.toLowerCase() === lcAddress,
  );

  // Vaults owned by this depositor
  const vaults = MOCK_VAULTS.filter(
    (v) => v.depositorAddress?.toLowerCase() === lcAddress,
  );

  if (!depositor || vaults.length === 0) {
    notFound();
  }

  const totalVaults = vaults.length;
  const totalBtc = depositor.totalBtc;
  const avgVaultSize = totalVaults > 0 ? totalBtc / totalVaults : 0;

  // Status distribution with count and BTC
  const statusList: VaultStatus[] = ['Active', 'Pending', 'Redeemed', 'Expired', 'Liquidated'];
  const statusDist = statusList.map((status) => ({
    status,
    count: vaults.filter((v) => v.status === status).length,
    btc: vaults
      .filter((v) => v.status === status)
      .reduce((s, v) => s + v.vaultSize, 0),
  }));

  const providersUsed = new Set(vaults.map((v) => v.providerAddress)).size;
  const dappsUsed = new Set(vaults.map((v) => v.dappName)).size;

  // Activity
  const sorted = [...vaults].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const firstVault = sorted[0];
  const latestVault = sorted[sorted.length - 1];
  const activeBtc = vaults.filter((v) => v.status === 'Active').reduce((s, v) => s + v.vaultSize, 0);
  const redeemedBtc = vaults.filter((v) => v.status === 'Redeemed').reduce((s, v) => s + v.vaultSize, 0);

  // DeFi Exposure — group by DApp
  const dappExposure = Array.from(
    vaults.reduce((map, v) => {
      const key = v.dappName;
      const existing = map.get(key);
      if (existing) {
        existing.vaults += 1;
        existing.btc += v.vaultSize;
        if (v.status === 'Active') existing.active += 1;
        if (v.status === 'Redeemed') existing.redeemed += 1;
        existing.providerName = v.providerName;
      } else {
        map.set(key, {
          dapp: v.dappName,
          providerName: v.providerName,
          vaults: 1,
          btc: v.vaultSize,
          active: v.status === 'Active' ? 1 : 0,
          redeemed: v.status === 'Redeemed' ? 1 : 0,
        });
      }
      return map;
    }, new Map<string, {
      dapp: string;
      providerName: string;
      vaults: number;
      btc: number;
      active: number;
      redeemed: number;
    }>()).values(),
  ).sort((a, b) => b.btc - a.btc);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">

      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-[13px] text-[#387085]/60">
        <Link href="/" className="transition-colors hover:text-[#cd6332]">Home</Link>
        <span>/</span>
        <Link href="/depositors" className="transition-colors hover:text-[#cd6332]">Depositors</Link>
        <span>/</span>
        <span className="font-mono text-[#14140f]">{truncateAddr(depositor.address, 6, 4)}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#14140f]">Depositor</h1>
          <p className="mt-1 break-all font-mono text-sm text-[#387085]">{depositor.address}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-[#cd6332]">{totalBtc.toFixed(2)} BTC</p>
          <p className="text-sm text-[#387085]/60">{totalVaults} vaults</p>
        </div>
      </div>

      {/* KPI strip — 7 cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: 'Total Vaults',    value: String(totalVaults) },
          { label: 'Active',          value: String(statusDist.find((s) => s.status === 'Active')?.count ?? 0) },
          { label: 'Redeemed',        value: String(statusDist.find((s) => s.status === 'Redeemed')?.count ?? 0) },
          { label: 'Total BTC',       value: `${totalBtc.toFixed(2)} BTC` },
          { label: 'Avg Vault Size',  value: `${avgVaultSize.toFixed(2)} BTC` },
          { label: 'Providers Used',  value: String(providersUsed) },
          { label: 'DApps Used',      value: String(dappsUsed) },
        ].map((kpi) => (
          <div key={kpi.label} className="border border-[#387085]/10 bg-[#faf9f5] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">{kpi.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-[#14140f]">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Overview — full width */}
      <section className="mb-5 border border-[#387085]/10 bg-white">
        <div className="border-b border-[#387085]/10 px-5 py-3">
          <h2 className="text-sm font-semibold text-[#14140f]">Overview</h2>
        </div>
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
          {/* Left — Activity Summary */}
          <div className="border-[#387085]/10 px-5 py-4 lg:border-r">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#387085]/40">
              Activity Summary
            </h3>
            <div>
              {[
                { label: 'First Vault',  value: firstVault ? formatLongDate(firstVault.createdAt) : '—' },
                { label: 'Latest Vault', value: latestVault ? formatLongDate(latestVault.createdAt) : '—' },
                { label: 'Active BTC',   value: `${activeBtc.toFixed(4)} BTC` },
                { label: 'Redeemed BTC', value: `${redeemedBtc.toFixed(4)} BTC` },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between border-b border-[#387085]/8 py-2 last:border-0">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/40">
                    {row.label}
                  </span>
                  <span className="text-sm font-medium text-[#14140f]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — DeFi Exposure */}
          <div className="px-5 py-4">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#387085]/40">
              DeFi Exposure
            </h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#387085]/8">
                  <th className="pb-1.5 pr-3 text-left text-[10px] font-medium uppercase tracking-wide text-[#387085]/40">DApp</th>
                  <th className="pb-1.5 pr-3 text-left text-[10px] font-medium uppercase tracking-wide text-[#387085]/40">Provider</th>
                  <th className="pb-1.5 pr-3 text-right text-[10px] font-medium uppercase tracking-wide text-[#387085]/40">Vaults</th>
                  <th className="pb-1.5 pr-3 text-right text-[10px] font-medium uppercase tracking-wide text-[#387085]/40">BTC</th>
                  <th className="pb-1.5 text-right text-[10px] font-medium uppercase tracking-wide text-[#387085]/40">Status</th>
                </tr>
              </thead>
              <tbody>
                {dappExposure.map((e) => (
                  <tr key={e.dapp} className="border-b border-[#387085]/8 last:border-0">
                    <td className="py-2 pr-3 text-sm font-medium text-[#14140f]">{e.dapp}</td>
                    <td className="py-2 pr-3 text-xs text-[#387085]/70">{e.providerName}</td>
                    <td className="py-2 pr-3 text-right text-sm text-[#14140f]">{e.vaults}</td>
                    <td className="py-2 pr-3 text-right text-sm font-semibold text-[#14140f]">{e.btc.toFixed(4)}</td>
                    <td className="py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        {e.active > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-green-700">
                            <span className="h-1 w-1 rounded-full bg-green-500" />A:{e.active}
                          </span>
                        )}
                        {e.redeemed > 0 && (
                          <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-blue-700">
                            <span className="h-1 w-1 rounded-full bg-blue-500" />R:{e.redeemed}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── LEFT col ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Identity */}
          <section className="border border-[#387085]/10 bg-white">
            <div className="border-b border-[#387085]/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-[#14140f]">Identity</h2>
            </div>
            <table className="w-full">
              <tbody>
                {[
                  { label: 'EVM Address',        val: depositor.address, mono: true },
                  { label: 'First Deposit',      val: formatLongDate(depositor.firstDeposit), mono: false },
                ].map((row, i, arr) => (
                  <tr key={row.label} className={i < arr.length - 1 ? 'border-b border-[#387085]/8' : ''}>
                    <td className="w-44 py-2.5 pl-5 pr-4 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">{row.label}</td>
                    <td className="py-2.5 pr-5">
                      <span className={`text-sm text-[#14140f] ${row.mono ? 'break-all font-mono' : ''}`}>{row.val}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Vault list with Created column */}
          <section className="border border-[#387085]/10 bg-white">
            <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-[#14140f]">Vaults</h2>
              <span className="text-xs text-[#387085]/50">{totalVaults} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#387085]/8">
                    {['Vault ID', 'Status', 'BTC', 'Provider', 'DApp', 'Created'].map((h) => (
                      <th key={h} className="py-2 pl-5 pr-3 text-left text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vaults.slice(0, 25).map((v, i, arr) => (
                    <tr key={v.id} className={`${i < arr.length - 1 ? 'border-b border-[#387085]/8' : ''} transition-colors hover:bg-[#faf9f5]`}>
                      <td className="py-2.5 pl-5 pr-3">
                        <Link href={`/vaults/${v.id}`} className="font-mono text-xs text-[#cd6332] hover:underline">
                          {truncateAddr(v.id, 6, 4)}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[v.status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[v.status]}`} />{v.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-[#14140f]">{v.vaultSize.toFixed(4)}</td>
                      <td className="py-2.5 pr-3">
                        <Link href={`/accounts/${v.providerAddress}`} className="text-sm text-[#387085] transition-colors hover:text-[#cd6332]">
                          {v.providerName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-sm text-[#14140f]">{v.dappName}</td>
                      <td className="py-2.5 pr-5 text-[11px] text-[#387085]/50">{formatLongDate(v.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── RIGHT col ── */}
        <div className="space-y-5">

          {/* Vault Status Distribution (count + % + BTC) */}
          <section className="border border-[#387085]/10 bg-white">
            <div className="border-b border-[#387085]/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-[#14140f]">Vault Status Distribution</h2>
            </div>
            <div className="px-5 py-2">
              {statusDist
                .filter((s) => s.count > 0)
                .map((s) => {
                  const pct = totalVaults > 0 ? Math.round((s.count / totalVaults) * 100) : 0;
                  return (
                    <div
                      key={s.status}
                      className="flex items-center justify-between border-b border-[#387085]/8 py-2 last:border-0"
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: STATUS_BAR_COLOR[s.status] }}
                        />
                        <span className="text-sm text-[#14140f]">{s.status}</span>
                      </div>
                      <div className="mx-3 h-1.5 w-16 bg-[#387085]/10">
                        <div className="h-full" style={{ width: `${pct}%`, background: STATUS_BAR_COLOR[s.status] }} />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold tabular-nums text-[#14140f]">
                        {s.count}
                      </span>
                      <span className="w-9 text-right text-[11px] tabular-nums text-[#387085]/40">
                        ({pct}%)
                      </span>
                      <span className="w-20 text-right text-[11px] tabular-nums text-[#387085]/50">
                        {s.btc.toFixed(2)} BTC
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Used Providers / DApps */}
          <section className="border border-[#387085]/10 bg-white">
            <div className="border-b border-[#387085]/10 px-5 py-3">
              <h2 className="text-sm font-semibold text-[#14140f]">Providers & DApps</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4">
              {Array.from(
                new Map(
                  vaults.map((v) => [v.providerAddress, v]),
                ).values(),
              ).map((v) => (
                <Link
                  key={v.providerAddress}
                  href={`/accounts/${v.providerAddress}`}
                  className="block border border-[#387085]/10 bg-[#faf9f5] p-3 transition-colors hover:border-[#cd6332]/30"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#387085]/40">Provider</p>
                  <p className="mt-0.5 text-sm font-medium text-[#14140f]">{v.providerName}</p>
                  <p className="text-xs text-[#387085]/60">{v.dappName}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
