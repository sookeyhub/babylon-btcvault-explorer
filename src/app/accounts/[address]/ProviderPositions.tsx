'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MOCK_AAVE_POSITIONS } from '@/lib/mock-aave-activity';
import { toUsd } from '@/lib/utils';

function parseAmount(amount: string, decimals: number): number {
  return parseFloat(amount) / Math.pow(10, decimals);
}

type HealthLabel = 'Liquidation' | 'At Risk' | 'Caution' | 'Healthy' | 'Safe';

function getHealthStatus(hf: number): { label: HealthLabel; color: string; bg: string; text: string } {
  if (hf >= 2.0) return { label: 'Safe',        color: '#16a34a', bg: 'bg-green-50',      text: 'text-green-700'  };
  if (hf >= 1.5) return { label: 'Healthy',      color: '#387085', bg: 'bg-[#387085]/8',   text: 'text-[#387085]'  };
  if (hf >= 1.2) return { label: 'Caution',      color: '#d97706', bg: 'bg-amber-50',      text: 'text-amber-700'  };
  if (hf >= 1.0) return { label: 'At Risk',      color: '#f97316', bg: 'bg-orange-50',     text: 'text-orange-700' };
  return           { label: 'Liquidation',  color: '#dc2626', bg: 'bg-red-50',        text: 'text-red-600'    };
}

function distanceToLiquidation(hf: number): string {
  if (hf < 1.0) return 'Below liquidation threshold';
  const pct = ((1 - 1 / hf) * 100).toFixed(1);
  return `${pct}% cushion`;
}

type FilterKey = 'All' | HealthLabel;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'All',         label: 'All'         },
  { key: 'Liquidation', label: 'Liquidation' },
  { key: 'At Risk',     label: 'At Risk'     },
  { key: 'Caution',     label: 'Caution'     },
  { key: 'Healthy',     label: 'Healthy'     },
  { key: 'Safe',        label: 'Safe'        },
];

const MAX_LTV = 75; // reference max LTV %

export default function ProviderPositions() {
  const [filter, setFilter] = useState<FilterKey>('All');

  const positions = MOCK_AAVE_POSITIONS;

  // Sort by HF ascending (most risky first) — fixed
  const sorted = [...positions].sort((a, b) => parseFloat(a.healthFactor) - parseFloat(b.healthFactor));

  // Per-label counts for filter chips
  const counts: Record<FilterKey, number> = {
    All: positions.length,
    Liquidation: 0, 'At Risk': 0, Caution: 0, Healthy: 0, Safe: 0,
  };
  for (const p of positions) {
    const hf = parseFloat(p.healthFactor);
    counts[getHealthStatus(hf).label]++;
  }

  const filtered = filter === 'All'
    ? sorted
    : sorted.filter((p) => getHealthStatus(parseFloat(p.healthFactor)).label === filter);

  return (
    <section className="border border-[#387085]/10 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#14140f]">Aave Position Health</h2>
          <p className="mt-0.5 text-[11px] text-[#387085]/50">
            Sorted by health factor · lowest first
          </p>
        </div>
        <div className="flex items-center gap-2">
          {counts.Liquidation + counts['At Risk'] > 0 ? (
            <span className="inline-flex items-center gap-1 border border-red-200/60 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
              ⚠ {counts.Liquidation + counts['At Risk']} at risk
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
              ✓ All healthy
            </span>
          )}
          <span className="text-[11px] text-[#387085]/40">{positions.length} borrowers</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#387085]/8 px-5 py-2.5">
        {FILTER_OPTIONS.map((opt) => {
          const count = counts[opt.key];
          if (opt.key !== 'All' && count === 0) return null;
          const isActive = filter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'bg-[#cd6332] text-white'
                  : 'bg-[#387085]/8 text-[#387085]/60 hover:bg-[#387085]/15'
              }`}
            >
              {opt.label}
              {' '}
              <span className={isActive ? 'opacity-70' : 'opacity-60'}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Position rows */}
      <div className="divide-y divide-[#387085]/8">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#387085]/40">No positions match this filter.</p>
        ) : (
          filtered.map((position) => {
            const hf          = parseFloat(position.healthFactor);
            const status      = getHealthStatus(hf);
            const coll        = parseAmount(position.totalCollateral.amount, position.totalCollateral.decimals);
            const isLiquidation = hf < 1.0;
            const ltv         = parseFloat(position.currentLtv);
            const ltvColor    = ltv >= 90 ? '#dc2626' : ltv >= 75 ? '#d97706' : '#16a34a';
            const ltvFillPct  = Math.min((ltv / MAX_LTV) * 100, 100);
            const distance    = distanceToLiquidation(hf);

            return (
              <Link
                key={position.depositorFull}
                href={`/accounts/${position.depositorFull}`}
                className={`block px-5 py-3 transition-colors ${
                  isLiquidation
                    ? 'bg-red-50/40 hover:bg-red-50/70'
                    : 'hover:bg-[#faf9f5]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: status badge + address + distance */}
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.text}`}>
                        {isLiquidation && '⚠ '}{status.label}
                      </span>
                      <span className="truncate font-mono text-xs text-[#cd6332]">
                        {position.depositor}
                      </span>
                    </div>
                    <p className={`text-[10px] ${isLiquidation ? 'font-medium text-red-500' : 'text-[#387085]/40'}`}>
                      {distance}
                    </p>
                  </div>

                  {/* Right: metrics */}
                  <div className="flex flex-shrink-0 items-start gap-5 text-right">
                    {/* Collateral */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#387085]/40">Collateral</p>
                      <p className="text-sm font-semibold text-[#14140f]">
                        {coll.toFixed(4)}
                        <span className="ml-1 text-[11px] font-normal text-[#387085]/40">sBTC</span>
                        <span className="ml-1 text-[10px] font-normal text-[#387085]/30">{toUsd(coll)}</span>
                      </p>
                    </div>

                    {/* Debt */}
                    {position.debts.map((debt, i) => {
                      const total    = parseAmount(debt.totalAmount, debt.decimals);
                      const interest = parseAmount(debt.accruedInterest, debt.decimals);
                      return (
                        <div key={i}>
                          <p className="text-[10px] uppercase tracking-wide text-[#387085]/40">Debt</p>
                          <p className="text-sm font-semibold text-[#cd6332]">
                            {total.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            <span className="ml-1 text-[11px] font-normal text-[#387085]/40">{debt.symbol}</span>
                          </p>
                          {interest > 0 && (
                            <p className="text-[10px] text-[#387085]/35">
                              +{interest.toLocaleString('en-US', { maximumFractionDigits: 4 })} interest
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* LTV + progress bar */}
                    <div className="w-20">
                      <p className="text-[10px] uppercase tracking-wide text-[#387085]/40">LTV</p>
                      <p className="text-sm font-semibold" style={{ color: ltvColor }}>
                        {position.currentLtv}%
                      </p>
                      <div className="mt-1 h-1 w-full bg-[#387085]/10">
                        <div
                          className="h-full transition-all"
                          style={{ width: `${ltvFillPct}%`, background: ltvColor, opacity: 0.8 }}
                        />
                      </div>
                      <p className="mt-0.5 text-[9px] text-[#387085]/30">of {MAX_LTV}% max</p>
                    </div>

                    {/* Health Factor */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[#387085]/40">Health</p>
                      <p className="text-sm font-semibold" style={{ color: status.color }}>
                        {hf.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
