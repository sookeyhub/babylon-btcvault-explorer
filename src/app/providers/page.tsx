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
import { toUsd } from '@/lib/utils';
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

type SortKey = 'commission' | 'vaultCount' | 'totalBtc';
type SortDir = 'asc' | 'desc';

export default function ProvidersPage() {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('totalBtc');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [dappFilter, setDappFilter] = useState<string>('ALL');
  const [dappDropdownOpen, setDappDropdownOpen] = useState(false);

  const allProviders = MOCK_PROVIDERS;
  const uniqueDapps = Array.from(new Set(allProviders.map((p) => p.appName))).sort();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortDir === 'desc' ? '↓' : '↑';
  };

  const providers = (dappFilter === 'ALL'
    ? allProviders
    : allProviders.filter((p) => p.appName === dappFilter)
  ).sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    return mul * (a[sortKey] - b[sortKey]);
  });
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
  const activeVaultCount = vaults.filter((v) => v.status === 'Available').length;

  // ── Period toggle state ─────────────────────────────────────────────────
  type Period = '7D' | '30D' | '180D' | 'YTD' | '1Y' | 'ALL';
  const PERIODS: Period[] = ['7D', '30D', '180D', 'YTD', '1Y', 'ALL'];
  const [trendPeriod, setTrendPeriod] = useState<Period>('ALL');

  // Provider TVL Trend — generate all available data, filtered by period
  const TREND_DAYS = (() => {
    const now = Date.now();
    switch (trendPeriod) {
      case '7D':  return 7;
      case '30D': return 30;
      case '180D': return 180;
      case 'YTD': return Math.ceil((now - new Date(new Date().getFullYear(), 0, 1).getTime()) / (24*60*60*1000)) + 1;
      case '1Y':  return 365;
      case 'ALL': return 365;
    }
  })();
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
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Providers 기획 의도">
        <DevNoteSection heading="페이지 목적">
          <p>Vault를 운영하며 BTC 커스터디와 ZKP 서명을 담당하는 Provider 목록 조회.</p>
          <p>누가 얼마의 자산을 관리하고 어떤 DApp과 연결되어 있는지 파악.</p>
        </DevNoteSection>
        <DevNoteSection heading="KPI 4카드">
          <p>Total Providers: 등록된 Provider 수.</p>
          <p>Locked BTC (ℹ): 전체 Provider가 관리 중인 BTC 합계 (sBTC 단위).</p>
          <p>Avg Commission: 전체 Provider 평균 수수료율 (%).</p>
          <p>Active Vaults: 현재 Active 상태인 Vault 수.</p>
        </DevNoteSection>
        <DevNoteSection heading="Provider TVL Trend 차트">
          <p>최근 30일간 Provider별 일간 관리 BTC(TVL)를 누적 영역으로 시각화.</p>
          <p>created ≤ day &amp; closed &gt; day 인 vault의 vaultSize 합으로 산출.</p>
          <p>Total BTC 기준 상위 10개를 개별 영역, 나머지는 Others로 통합.</p>
          <p>우측 상단에 현재 총 TVL과 30일 변화량(±BTC, ±%)을 표시.</p>
        </DevNoteSection>
        <DevNoteSection heading="테이블 컬럼">
          <p>#(순위) / Provider(이름+복사) / DApp(필터) / Commission(정렬) / Managed Vaults(정렬) / Locked BTC(정렬).</p>
          <p>Provider 이름 클릭 시 /accounts/{'{address}'} 상세 이동.</p>
          <p>DApp 컬럼 헤더에 드롭다운 필터 제공.</p>
          <p>기본 정렬: Locked BTC 내림차순.</p>
        </DevNoteSection>
        <DevNoteSection heading="페이지네이션">
          <p>25개/페이지. 첫/이전/다음/마지막 버튼 제공.</p>
        </DevNoteSection>
      </DevNote>
      {/* Title */}
      <h1 className="text-lg font-semibold text-[#14140f]">Providers</h1>

      {/* KPI summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-[#387085]/10 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Total Providers</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#14140f]">{totalProviders.toLocaleString()}</p>
        </div>
        <div className="border border-[#387085]/10 bg-white p-3">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">
            Locked BTC
            <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
              <title>Total BTC locked across all providers</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
          </p>
          <p className="mt-0.5 text-2xl font-semibold text-[#14140f]">{totalBtc.toFixed(2)} <span className="text-sm font-normal text-[#387085]/50">sBTC</span></p>
          <p className="mt-0.5 text-xs text-[#387085]/40">{toUsd(totalBtc)}</p>
        </div>
        <div className="border border-[#387085]/10 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Avg Commission</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#14140f]">{(avgCommission / 100).toFixed(2)}%</p>
        </div>
        <div className="border border-[#387085]/10 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#387085]/50">Active Vaults</p>
          <p className="mt-0.5 text-2xl font-semibold text-[#14140f]">{activeVaultCount.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-[#387085]/40">out of {vaults.length} vault{vaults.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Provider TVL Trend */}
      <section className="flex h-[380px] flex-col border border-[#387085]/10 bg-white">
        <div className="flex items-center justify-between border-b border-[#387085]/10 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#14140f]">Provider TVL Trend</h2>
            <p className="mt-0.5 text-[11px] text-[#387085]/50">
              Daily managed BTC per provider · Top 10{hasOthers ? ' + Others' : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setTrendPeriod(p)}
                  className={`rounded-none px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    trendPeriod === p
                      ? 'bg-[#cd6332] text-white'
                      : 'text-[rgba(56,112,133,0.6)] hover:text-[#cd6332]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#14140f]">
                {totalNow.toFixed(2)} BTC <span className="text-xs font-normal text-[#387085]/40">{toUsd(totalNow)}</span>
              </p>
              <p className={`text-[10px] ${totalDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {totalDelta >= 0 ? '+' : ''}
                {totalDelta.toFixed(2)} ({totalDeltaPct >= 0 ? '+' : ''}
                {totalDeltaPct.toFixed(1)}%) · {trendPeriod.toLowerCase()}
              </p>
            </div>
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
                formatter={(value: number | undefined, name: string | undefined) => [
                  value != null ? `${value.toFixed(2)} BTC ${toUsd(value)}` : '—',
                  name ?? '',
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
      <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
          <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium w-12">#</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Provider</th>
              <th className="relative whitespace-nowrap px-4 py-2.5 font-medium">
                <button onClick={() => setDappDropdownOpen(!dappDropdownOpen)} className="inline-flex items-center gap-1 uppercase">
                  DApp
                  <svg className="h-3 w-3 opacity-70" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4h14v2H3V4zm2 4h10v2H5V8zm3 4h4v2H8v-2z" /></svg>
                  {dappFilter !== 'ALL' && <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white" />}
                </button>
                {dappDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-0.5 w-40 border border-[#387085]/10 bg-white py-1 shadow-lg" onMouseLeave={() => setDappDropdownOpen(false)}>
                    {[{ value: 'ALL', label: 'All DApps' }, ...uniqueDapps.map((d) => ({ value: d, label: d }))].map((opt) => (
                      <button key={opt.value} onClick={() => { setDappFilter(opt.value); setDappDropdownOpen(false); setPage(1); }}
                        className={`block w-full px-3 py-1.5 text-left text-[11px] transition-colors ${dappFilter === opt.value ? 'bg-[#cd6332]/8 font-semibold text-[#cd6332]' : 'text-[#14140f] hover:bg-[#faf9f5]'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">
                <button onClick={() => toggleSort('commission')} className="inline-flex items-center gap-1 uppercase">
                  Commission <span className="text-[10px]">{sortIcon('commission')}</span>
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">
                <button onClick={() => toggleSort('vaultCount')} className="inline-flex items-center gap-1 uppercase">
                  Managed Vaults <span className="text-[10px]">{sortIcon('vaultCount')}</span>
                </button>
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">
                <button onClick={() => toggleSort('totalBtc')} className="inline-flex items-center gap-1 uppercase">
                  Locked BTC <span className="text-[10px]">{sortIcon('totalBtc')}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((p, i) => {
              const rank = (safePage - 1) * PAGE_SIZE + i + 1;
              return (
                <tr key={p.address} className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">{rank}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#387085]/40">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
                      </span>
                      <Link href={`/accounts/${p.address}`} className="font-medium text-[#14140f] hover:text-[#cd6332]">
                        {p.name}
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
                  <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                    <div className="text-[#14140f]">{p.totalBtc.toFixed(4)} <span className="text-[rgba(56,112,133,0.5)]">sBTC</span></div>
                    <div className="text-[10px] text-[#387085]/40">{toUsd(p.totalBtc)}</div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
      </div>
    </div>
  );
}
