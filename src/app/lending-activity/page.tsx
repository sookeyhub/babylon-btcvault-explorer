'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MOCK_GLOBAL_LENDING_ACTIVITIES,
  type AaveV4Activity,
  type AaveV4ActivityType,
  type TokenAmount,
} from '@/lib/mock-aave-activity';
import { truncateAddress, toUsd, TOKEN_PRICES, formatRelativeTime } from '@/lib/utils';
import DevNote, { DevNoteSection } from '@/components/DevNote';

const PAGE_SIZE = 25;

function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 inline-flex shrink-0 text-[rgba(56,112,133,0.3)] hover:text-[#387085]"
      title={copied ? 'Copied!' : 'Copy'}
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        {copied
          ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
        }
      </svg>
    </button>
  );
}

interface ActivityStyle {
  label: string;
  color: string;
  amountColor: string;
  amountPrefix: string;
}

const ACTIVITY_STYLES: Record<AaveV4ActivityType, ActivityStyle> = {
  ADD_COLLATERAL: {
    label: 'Add Collateral', color: 'text-[#387085]',
    amountColor: 'text-green-600', amountPrefix: '+',
  },
  REMOVE_COLLATERAL: {
    label: 'Remove Collateral', color: 'text-[#cd6332]',
    amountColor: 'text-[#cd6332]', amountPrefix: '-',
  },
  BORROW: {
    label: 'Borrow', color: 'text-[#cd6332]',
    amountColor: 'text-[#cd6332]', amountPrefix: '+',
  },
  REPAY: {
    label: 'Repay', color: 'text-green-700',
    amountColor: 'text-[#387085]', amountPrefix: '-',
  },
  LIQUIDATION: {
    label: 'Liquidation', color: 'text-red-600',
    amountColor: 'text-red-500', amountPrefix: '-',
  },
};

const FILTER_OPTIONS: { value: AaveV4ActivityType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'ADD_COLLATERAL', label: 'Add Collateral' },
  { value: 'REMOVE_COLLATERAL', label: 'Remove Collateral' },
  { value: 'BORROW', label: 'Borrow' },
  { value: 'REPAY', label: 'Repay' },
  { value: 'LIQUIDATION', label: 'Liquidation' },
];

function formatTokenAmount(t: TokenAmount): string {
  const raw = parseFloat(t.amount);
  const value = raw / Math.pow(10, t.decimals);
  if (t.symbol === 'sBTC') return `${value.toFixed(6)} sBTC`;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t.symbol}`;
}

function formatTokenUsd(t: TokenAmount): string {
  const raw = parseFloat(t.amount);
  const value = raw / Math.pow(10, t.decimals);
  const price = TOKEN_PRICES[t.symbol] ?? 0;
  const usd = value * price;
  if (usd < 0.01 && usd > 0) return '$<0.01';
  return `$${usd.toLocaleString('en-US', { maximumFractionDigits: usd >= 100 ? 0 : 2 })}`;
}

function formatTimeHHMM(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDateGroupHeader(dateKey: string): string {
  const day = new Date(dateKey);
  const today = new Date();
  const dayUtc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = Math.floor((todayUtc - dayUtc) / 86400000);

  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const dateStr = `${monthNames[day.getUTCMonth()]} ${day.getUTCDate()}, ${day.getUTCFullYear()}`;

  if (days <= 0) return `TODAY (${dateStr})`;
  if (days === 1) return `YESTERDAY (${dateStr})`;
  return dateStr;
}

function groupByDate(activities: AaveV4Activity[]): [string, AaveV4Activity[]][] {
  const groups: Record<string, AaveV4Activity[]> = {};
  for (const a of activities) {
    const key = new Date(a.blockTime).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
    });
    (groups[key] ||= []).push(a);
  }
  return Object.entries(groups).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
  );
}

export default function LendingActivityPage() {
  const [filter, setFilter] = useState<AaveV4ActivityType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const filtered =
    filter === 'ALL'
      ? MOCK_GLOBAL_LENDING_ACTIVITIES
      : MOCK_GLOBAL_LENDING_ACTIVITIES.filter((a) => a.type === filter);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const grouped = groupByDate(paged);

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Lending Activity 기획 의도">
        <DevNoteSection heading="페이지 목적">
          <p>Aave v4 기반 Lending 이벤트(담보 추가/제거, 대출, 상환, 청산)를 시간순으로 조회.</p>
          <p>전체 Depositor의 활동을 하나의 타임라인으로 통합 노출.</p>
        </DevNoteSection>
        <DevNoteSection heading="필터 탭">
          <p>All / Add Collateral / Remove Collateral / Borrow / Repay / Liquidation.</p>
          <p>선택 시 해당 이벤트 타입만 필터링. 페이지 1로 리셋.</p>
        </DevNoteSection>
        <DevNoteSection heading="타임라인 레이아웃">
          <p>날짜 그룹 헤더: "TODAY (JUNE 5, 2026)" 형식의 대문자.</p>
          <p>각 항목 좌측에 UTC 시간(HH:MM) 표시.</p>
          <p>1행: 이벤트 타입 배지 + (담보 이벤트 시) Vault ID + 우측 금액.</p>
          <p>2행: Depositor 주소 (라벨 → 아이콘 → 주소 순서).</p>
          <p>3행: Tx 해시 · Block 번호.</p>
          <p>엔티티 표시 순서 통일: 라벨 → 아이콘 → 주소 (예: VAULT 🔒 0x1234...abcd).</p>
          <p>금액은 +/- 접두어와 함께 토큰 심볼(sBTC, USDC, USDT 등)로 표시.</p>
        </DevNoteSection>
        <DevNoteSection heading="페이지네이션">
          <p>25개/페이지. 상단/하단 모두 페이지네이션 제공.</p>
        </DevNoteSection>
      </DevNote>

      <h1 className="text-lg font-semibold text-[#14140f]">Lending Activity</h1>

      {/* Filter tabs */}
      <div className="flex items-center gap-1">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setPage(1); }}
              className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#cd6332] text-white'
                  : 'text-[#387085]/60 hover:text-[#14140f]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
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

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#387085]/40">No activity found</p>
          {filter !== 'ALL' && (
            <button onClick={() => setFilter('ALL')} className="mx-auto mt-1 block text-xs text-[#cd6332] hover:underline">
              Show all activity
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, activities]) => (
            <div key={date}>
              <div className="mb-4 text-[11px] font-bold uppercase tracking-wider text-[#14140f]">
                {formatDateGroupHeader(date)}
              </div>
              <div className="space-y-0">
                {activities.map((activity) => {
                  const style = ACTIVITY_STYLES[activity.type];
                  const formattedAmount = formatTokenAmount(activity.tokenAmount);
                  const hasVault = activity.type === 'ADD_COLLATERAL' || activity.type === 'REMOVE_COLLATERAL';
                  return (
                    <div
                      key={`${activity.txHash}-${activity.logIndex}`}
                      className="flex items-start border-b border-[#387085]/8 py-3"
                    >
                      {/* Time */}
                      <div className="w-24 shrink-0 pt-0.5">
                        <div className="text-[11px] font-medium text-[#387085]/40">{formatRelativeTime(activity.blockTime)}</div>
                        <div className="font-mono text-[9px] text-[#387085]/30">({formatTimeHHMM(activity.blockTime)} UTC)</div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Row 1: Action badge + vault info + amount */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-semibold ${style.color}`}>
                              {style.label}
                            </span>
                            {hasVault && activity.vaultId && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Vault</span>
                                <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                <Link href={`/vaults/${activity.vaultId}`} className="font-mono text-[10px] text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
                                  {truncateAddress(activity.vaultId, 6, 4)}
                                </Link>
                                <CopyIcon text={activity.vaultId} />
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className={`font-mono text-sm font-semibold ${style.amountColor}`}>
                              {style.amountPrefix}{formattedAmount}
                            </div>
                            <div className="text-[10px] text-[#387085]/40">{formatTokenUsd(activity.tokenAmount)}</div>
                          </div>
                        </div>

                        {/* Row 2: Depositor + Tx + Block */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Depositor</span>
                            <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                            </svg>
                            <Link href={`/accounts/${activity.depositorAddress}`} className="font-mono text-[10px] text-[#387085]/70 hover:text-[#cd6332] hover:underline">
                              {truncateAddress(activity.depositorAddress, 6, 4)}
                            </Link>
                          </span>
                        </div>
                        {/* Row 3: Tx + Block */}
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Tx</span>
                            <Link href={`/tx/${activity.txHash}`} className="font-mono text-[10px] text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
                              {truncateAddress(activity.txHash, 6, 4)}
                            </Link>
                            <CopyIcon text={activity.txHash} />
                          </span>
                          <span className="text-[10px] text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Block</span>
                            <span className="font-mono text-[10px] text-[#387085]/40">
                              #{activity.blockNumber.toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
            <button onClick={() => setPage(1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">«</button>
            <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">‹</button>
            <span className="px-2 text-[#14140f]">Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span></span>
            <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">›</button>
            <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">»</button>
          </div>
        </div>
      )}
    </div>
  );
}
