'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MOCK_PROVIDERS, MOCK_VAULTS } from '@/lib/mock-data';
import { truncateAddress } from '@/lib/utils';
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

export default function ProvidersPage() {
  const [page, setPage] = useState(1);
  const providers = MOCK_PROVIDERS;
  const vaults = MOCK_VAULTS;
  const total = providers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = providers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // KPI summary
  const totalProviders = providers.length;
  const totalBtc = vaults.reduce((s, v) => s + v.vaultSize, 0);
  const avgCommission =
    totalProviders > 0
      ? providers.reduce((s, p) => s + p.commission, 0) / totalProviders
      : 0;
  const activeVaultCount = vaults.filter((v) => v.status === 'Active').length;

  // Provider TVL Trend — last 30 days, top 10 providers + Others
  const TREND_DAYS = 30;
  const PROVIDER_COLORS = [
    '#cd6332',
    '#387085',
    '#16a34a',
    '#d97706',
    '#9333ea',
    '#0891b2',
    '#db2777',
    '#65a30d',
    '#7c3aed',
    '#ea580c',
  ];
  const OTHERS_COLOR = '#9ca3af';

  const sortedProviders = [...providers].sort((a, b) => b.totalBtc - a.totalBtc);
  const topProviders = sortedProviders.slice(0, 10);
  const otherProviders = sortedProviders.slice(10);
  const otherAddrSet = new Set(otherProviders.map((p) => p.address.toLowerCase()));
  const hasOthers = otherProviders.length > 0;

  const seriesKeys = [...topProviders.map((p) => p.name), ...(hasOthers ? ['Others'] : [])];

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const trendData = Array.from({ length: TREND_DAYS }, (_, i) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (TREND_DAYS - 1 - i));
    day.setHours(23, 59, 59, 999);

    const point: Record<string, number | string> = {
      date: day.toISOString(),
      label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    for (const p of topProviders) point[p.name] = 0;
    if (hasOthers) point['Others'] = 0;

    for (const v of vaults) {
      const created = new Date(v.createdAt);
      if (created > day) continue;
      const closed = v.closedAt ? new Date(v.closedAt) : null;
      if (closed && closed <= day) continue;

      const lc = v.providerAddress.toLowerCase();
      const top = topProviders.find((p) => p.address.toLowerCase() === lc);
      if (top) {
        point[top.name] = (point[top.name] as number) + v.vaultSize;
      } else if (otherAddrSet.has(lc)) {
        point['Others'] = (point['Others'] as number) + v.vaultSize;
      }
    }

    for (const k of seriesKeys) {
      point[k] = Number((point[k] as number).toFixed(4));
    }
    return point;
  });

  const firstPoint = trendData[0];
  const lastPoint = trendData[trendData.length - 1];
  const totalNow = seriesKeys.reduce(
    (s, k) => s + ((lastPoint[k] as number) ?? 0),
    0,
  );
  const totalThen = seriesKeys.reduce(
    (s, k) => s + ((firstPoint[k] as number) ?? 0),
    0,
  );
  const totalDelta = totalNow - totalThen;
  const totalDeltaPct = totalThen > 0 ? (totalDelta / totalThen) * 100 : 0;

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      {/* Title */}
      <h1 className="text-lg font-semibold text-[#14140f]">Providers</h1>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total Providers</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#14140f]">{totalProviders.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">registered vault providers</p>
        </div>
        <div className="border border-[#cd6332]/20 bg-[#cd6332]/5 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total BTC Managed</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#cd6332]">{totalBtc.toFixed(2)} BTC</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">across all providers</p>
        </div>
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Avg Commission</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#14140f]">{(avgCommission / 100).toFixed(2)}%</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">average fee rate</p>
        </div>
        <div className="border border-[#387085]/10 bg-[#faf9f5] p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Active Vaults</p>
          <p className="mt-0.5 text-2xl font-semibold text-green-600">{activeVaultCount.toLocaleString()}</p>
          <p className="mt-0.5 text-[11px] text-[#387085]/40">vaults currently active</p>
        </div>
      </div>

      {/* Provider TVL Trend */}
      <div className="relative">
        <DevNote title="Provider TVL Trend 차트">
          <DevNoteSection heading="차트 목적">
            <p>최근 30일간 Provider별 일간 관리 BTC(TVL) 추이를 누적 영역으로 시각화.</p>
            <p>전체 시장 성장세와 Provider별 점유 변화를 한눈에 파악.</p>
          </DevNoteSection>

          <DevNoteSection heading="산출 방식">
            <p>일자별로 created ≤ day &amp; closed &gt; day 인 vault의 vaultSize 합산.</p>
            <p>현재 시점 Total BTC 기준 상위 10개를 개별 Provider로, 나머지는 Others 회색 영역으로 통합.</p>
          </DevNoteSection>

          <DevNoteSection heading="헤더 보조 지표">
            <p>우측 상단에 현재 총 TVL과 30일 변화량(±BTC, ±%)을 함께 표시.</p>
            <p>증감 부호에 따라 그린/레드로 색상 분기.</p>
          </DevNoteSection>
        </DevNote>
        <section className="flex h-[380px] flex-col border border-[#387085]/10 bg-white">
        <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#14140f]">Provider TVL Trend</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">
              Daily managed BTC per provider · last 30 days · Top 10{hasOthers ? ' + Others' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#14140f]">
              {totalNow.toFixed(2)} BTC
            </p>
            <p className={`text-[10px] ${totalDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {totalDelta >= 0 ? '+' : ''}
              {totalDelta.toFixed(2)} ({totalDeltaPct >= 0 ? '+' : ''}
              {totalDeltaPct.toFixed(1)}%) · 30d
            </p>
          </div>
        </div>

        <div className="flex-1 px-4 pb-2 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <defs>
                {seriesKeys.map((k, i) => {
                  const color =
                    k === 'Others' ? OTHERS_COLOR : PROVIDER_COLORS[i % PROVIDER_COLORS.length];
                  return (
                    <linearGradient key={k} id={`tvl-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.35} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#387085"
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#387085', opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(TREND_DAYS / 6)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#387085', opacity: 0.5 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => `${Number(v).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  border: '1px solid rgba(56,112,133,0.15)',
                  borderRadius: 0,
                  fontSize: 11,
                  background: 'white',
                  boxShadow: 'none',
                  padding: '6px 10px',
                }}
                labelStyle={{ color: '#14140f', fontWeight: 500, marginBottom: 4 }}
                formatter={(value: number | undefined, name: string) => [
                  value != null ? `${value.toFixed(2)} BTC` : '—',
                  name,
                ]}
                cursor={{ stroke: '#387085', strokeOpacity: 0.2, strokeWidth: 1 }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: '#387085' }}
              />
              {seriesKeys.map((k, i) => {
                const color =
                  k === 'Others' ? OTHERS_COLOR : PROVIDER_COLORS[i % PROVIDER_COLORS.length];
                return (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stackId="tvl"
                    stroke={color}
                    strokeWidth={1.2}
                    fill={`url(#tvl-grad-${i})`}
                    isAnimationActive={false}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
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
        <DevNote title="Providers 기획 의도">
          <DevNoteSection heading="페이지 목적">
            <p>Vault를 운영하며 BTC 커스터디와 ZKP 서명을 담당하는 운영자 목록을 조회.</p>
            <p>누가 얼마의 자산을 관리하고 어떤 DApp과 연결되어 있는지 파악.</p>
          </DevNoteSection>

          <DevNoteSection heading="표시 대상">
            <p>프로토콜에 등록된 Provider만 포함.</p>
            <p>아직 vault를 배정받지 않은 신규 Provider도 포함.</p>
          </DevNoteSection>

          <DevNoteSection heading="컬럼 구성">
            <p>순위, 이름, 주소, 연결 DApp, 수수료율, 관리 Vault 수, Total BTC.</p>
            <p>수수료율은 사용자가 바로 이해할 수 있도록 % 단위로 변환해 표시.</p>
          </DevNoteSection>

          <DevNoteSection heading="정렬 / 이동">
            <p>Total BTC 내림차순으로 관리 규모가 큰 Provider를 상단 배치.</p>
            <p>이름 또는 주소 클릭 시 통합 Account 상세로 이동.</p>
          </DevNoteSection>
        </DevNote>
        <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
          <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium w-12">#</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Name</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Address</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">DApp</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Commission</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Managed Vaults</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Total BTC</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((p, i) => {
              const rank = (safePage - 1) * PAGE_SIZE + i + 1;
              return (
                <tr key={p.address} className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">{rank}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium text-[#14140f]">{p.name}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center">
                      <Link href={`/accounts/${p.address}`} className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]">
                        {truncateAddress(p.address, 6, 4)}
                      </Link>
                      <CopyIcon text={p.address} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Link href={`/accounts/${p.appAddress}`} className="text-[#387085] hover:text-[#cd6332]">
                      {p.appName}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">
                    {(p.commission / 100).toFixed(1)}%
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">
                    {p.vaultCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-[#14140f]">
                    {p.totalBtc.toFixed(4)} <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
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
