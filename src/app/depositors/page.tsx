'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ComposedChart,
  Bar,
  Cell,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_DEPOSITORS, MOCK_VAULTS } from '@/lib/mock-data';
import { truncateAddress, formatDate } from '@/lib/utils';
import DevNote, { DevNoteSection } from '@/components/DevNote';

const PAGE_SIZE = 25;

function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="ml-1 inline-flex shrink-0 text-[rgba(56,112,133,0.3)] hover:text-[#387085]"
      title={copied ? 'Copied!' : 'Copy'}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        {copied ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
        )}
      </svg>
    </button>
  );
}

export default function DepositorsPage() {
  const [page, setPage] = useState(1);
  const depositors = MOCK_DEPOSITORS;
  const vaults = MOCK_VAULTS;
  const total = depositors.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = depositors.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // KPI summary
  const totalDepositors = depositors.length;
  const totalBtc = vaults.reduce((s, v) => s + v.vaultSize, 0);
  const activeVaultCount = vaults.filter((v) => v.status === 'Active').length;
  const avgBtc = totalDepositors > 0 ? totalBtc / totalDepositors : 0;

  // ── New Depositors — weekly first-time depositors (last 3 months) ───────
  const firstVaultByDepositor = new Map<string, Date>();
  for (const v of vaults) {
    const addr = v.depositorAddress?.toLowerCase();
    if (!addr) continue;
    const date = new Date(v.createdAt);
    const existing = firstVaultByDepositor.get(addr);
    if (!existing || date < existing) {
      firstVaultByDepositor.set(addr, date);
    }
  }

  const today = new Date();
  const WEEK_COUNT = 13;
  const weeks = Array.from({ length: WEEK_COUNT }, (_, i) => {
    const weekStart = new Date(today);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(today.getDate() - (WEEK_COUNT - 1 - i) * 7 - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      week: `W${i + 1}`,
      label: i === WEEK_COUNT - 1 ? 'This week' : startLabel,
      weekStart,
      weekEnd,
      count: 0,
      cumulative: 0,
    };
  });

  firstVaultByDepositor.forEach((date) => {
    for (const w of weeks) {
      if (date >= w.weekStart && date <= w.weekEnd) w.count++;
    }
  });

  const totalFromData = weeks.reduce((s, w) => s + w.count, 0);
  let cumulativeBase: number;
  if (totalFromData < 10) {
    const sampleCounts = [2, 5, 3, 7, 4, 8, 6, 11, 7, 12, 9, 14, 16];
    weeks.forEach((w, i) => { w.count = sampleCounts[i] ?? 0; });
    cumulativeBase = 80;
  } else {
    cumulativeBase = 0;
    for (const date of firstVaultByDepositor.values()) {
      if (date < weeks[0].weekStart) cumulativeBase++;
    }
  }

  let running = cumulativeBase;
  for (const w of weeks) {
    running += w.count;
    w.cumulative = running;
  }

  const totalNewDepositors = weeks.reduce((s, w) => s + w.count, 0);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      {/* Title */}
      <h1 className="text-lg font-semibold text-[#14140f]">Depositors</h1>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total Depositors</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#14140f]">{totalDepositors.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">unique depositor addresses</p>
        </div>
        <div className="border border-[#cd6332]/20 bg-[#cd6332]/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total BTC Deposited</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#cd6332]">{totalBtc.toFixed(2)} BTC</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">sum of all vault amounts</p>
        </div>
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Active Vaults</p>
          <p className="mt-0.5 text-2xl font-semibold text-green-600">{activeVaultCount.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">vaults currently active</p>
        </div>
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Avg BTC per Depositor</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#14140f]">{avgBtc.toFixed(2)} BTC</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">average deposited amount</p>
        </div>
      </div>

      {/* New Depositors chart */}
      <div className="relative">
        <DevNote title="New Depositors 차트">
          <DevNoteSection heading="차트 목적">
            <p>최근 13주(약 3개월)간 신규 Depositor 유입 추이를 주 단위로 풀 너비 노출.</p>
            <p>온보딩 흐름과 누적 사용자 성장세를 한눈에 파악.</p>
          </DevNoteSection>

          <DevNoteSection heading="산출 방식">
            <p>해당 주에 처음으로 vault를 생성한 주소만 신규 Depositor로 카운트.</p>
            <p>막대는 주별 신규 수, 라인은 누적 총 Depositor 수.</p>
          </DevNoteSection>

          <DevNoteSection heading="헤더 보조 지표">
            <p>우측 상단 +N 값은 표시 구간 동안 새로 유입된 총 Depositor 수.</p>
          </DevNoteSection>
        </DevNote>
        <section className="flex h-[360px] flex-col border border-[#387085]/10 bg-white">
        <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#14140f]">New Depositors</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">Weekly · last 3 months</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-semibold text-[#cd6332]">+{totalNewDepositors}</span>
            <p className="text-[10px] text-[#387085]/40">last 3 months</p>
          </div>
        </div>
        <div className="flex-1 px-4 pb-2 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeks} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#387085" strokeOpacity={0.08} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#387085', opacity: 0.5 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="bar" allowDecimals={false} tick={{ fontSize: 11, fill: '#387085', opacity: 0.5 }} axisLine={false} tickLine={false} width={24} />
              <YAxis yAxisId="line" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: '#387085', opacity: 0.5 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ border: '1px solid rgba(56,112,133,0.15)', borderRadius: 0, fontSize: 11, background: 'white', boxShadow: 'none', padding: '6px 10px' }}
                labelFormatter={(_label, payload) => {
                  const p = payload?.[0]?.payload as { weekStart?: Date; weekEnd?: Date } | undefined;
                  if (!p?.weekStart || !p?.weekEnd) return _label as string;
                  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
                  return `${p.weekStart.toLocaleDateString('en-US', opts)} – ${p.weekEnd.toLocaleDateString('en-US', opts)}`;
                }}
                formatter={(value: number | undefined, name: string | undefined) => [
                  value ?? 0,
                  name === 'count' ? 'New Depositors' : 'Total Depositors',
                ]}
                labelStyle={{ color: '#14140f', fontWeight: 500, marginBottom: 4 }}
                cursor={{ fill: 'rgba(56,112,133,0.04)' }}
              />
              <Bar yAxisId="bar" dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={48} isAnimationActive={false} name="count">
                {weeks.map((w, i) => (
                  <Cell key={w.week} fill="#cd6332" fillOpacity={i === 3 ? 0.85 : 0.35 + i * 0.12} />
                ))}
              </Bar>
              <Line yAxisId="line" type="monotone" dataKey="cumulative" stroke="#387085" strokeWidth={1.5} dot={{ r: 3, fill: '#387085', strokeWidth: 0 }} activeDot={{ r: 4 }} name="cumulative" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 border-t border-[#387085]/8 px-5 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-[#cd6332] opacity-75" />
            <span className="text-[11px] text-[#387085]/60">New depositors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-6 shrink-0 bg-[#387085]" />
            <span className="text-[11px] text-[#387085]/60">Total (cumulative)</span>
          </div>
        </div>
      </section>
      </div>

      {/* Results count + Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgba(56,112,133,0.5)]">
          Showing all <span className="font-semibold text-[#14140f]">{total}</span> results
        </p>
        <div className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
          <button onClick={() => setPage(1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">«</button>
          <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">‹</button>
          <span className="px-2 text-[#14140f]">Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span></span>
          <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">›</button>
          <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">»</button>
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        <DevNote title="Depositors 기획 의도">
          <DevNoteSection heading="페이지 목적">
            <p>BTCVault에 BTC를 예치한 개별 사용자 전체를 조회.</p>
            <p>어떤 주소가 얼마나 예치했고, 현재 얼마가 활성 상태인지 파악.</p>
          </DevNoteSection>

          <DevNoteSection heading="표시 대상">
            <p>실제로 Vault를 만든 주소만 포함.</p>
            <p>활동 이력이 없는 일반 지갑 주소는 제외.</p>
          </DevNoteSection>

          <DevNoteSection heading="컬럼 구성">
            <p>순위, 주소, 총 Vault 수, 활성 Vault 수, Total BTC, 첫 예치일.</p>
            <p>활성 수는 현재 사용 중인 예치 규모를 시각적으로 구분하기 위해 녹색으로 표시.</p>
            <p>첫 예치일은 온보딩 시점을 추적하는 용도.</p>
          </DevNoteSection>

          <DevNoteSection heading="정렬 / 이동">
            <p>Total BTC 내림차순으로 규모가 큰 예치자를 상단 배치.</p>
            <p>주소 클릭 시 통합 Account 상세로 이동.</p>
          </DevNoteSection>
        </DevNote>
        <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
          <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium w-12">#</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Address</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Total Vaults</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Active Vaults</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Total BTC</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">First Deposit</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((d, i) => {
              const rank = (safePage - 1) * PAGE_SIZE + i + 1;
              return (
                <tr key={d.address} className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">{rank}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <Link href={`/accounts/${d.address}`} className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]">
                        {truncateAddress(d.address, 6, 4)}
                      </Link>
                      <CopyIcon text={d.address} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">{d.totalVaults}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#5a8a3c]">{d.activeVaults}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">
                    {d.totalBtc.toFixed(4)} <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-[rgba(56,112,133,0.5)]">
                    {formatDate(d.firstDeposit)}
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
