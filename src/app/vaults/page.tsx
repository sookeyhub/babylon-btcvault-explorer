'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Vault, VaultStatus } from '@/lib/types';
import { MOCK_VAULTS } from '@/lib/mock-data';
import { truncateAddress, formatRelativeTime, toUsd } from '@/lib/utils';
import {
  MOCK_VAULT_ACTIVITIES,
  type VaultEventType,
} from '@/lib/mock-aave-activity';
import DevNote, { DevNoteSection } from '@/components/DevNote';

const PAGE_SIZE = 25;

type SortKey = 'vaultSize' | 'createdAt';
type SortDir = 'asc' | 'desc';

const ALL_STATUSES: VaultStatus[] = ['Available', 'Pending', 'Verified', 'Signature Collected', 'Redeemed', 'Expired', 'Liquidated'];
const ALL_DAPPS: string[] = [...new Set(MOCK_VAULTS.map((v) => v.dappName))].sort();

const STATUS_COLORS: Record<Vault['status'], string> = {
  Available:            '#5a8a3c',
  Pending:              '#cd6332',
  Verified:             '#7c3aed',
  'Signature Collected':'#ca8a04',
  Redeemed:             '#2563eb',
  Expired:              '#6b7280',
  Liquidated:           '#c83232',
};


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

type PageTab = 'all' | 'activity';

/* ── Vault Activity styles ─────────────────────────────────────────────── */

const VAULT_EVENT_STYLES: Record<VaultEventType, {
  label: string; dot: string; color: string; status: string; pillClass: string;
}> = {
  VAULT_CREATED:    { label: 'Created',    dot: '#cd6332', color: '#cd6332', status: 'Pending',    pillClass: 'bg-amber-50 text-amber-600' },
  VAULT_ACTIVATED:  { label: 'Activated',  dot: '#16a34a', color: '#16a34a', status: 'Available',  pillClass: 'bg-green-50 text-green-700' },
  VAULT_EXPIRED:    { label: 'Expired',    dot: '#6b7280', color: '#6b7280', status: 'Expired',    pillClass: 'bg-gray-100 text-gray-500' },
  VAULT_REDEEMED:   { label: 'Redeemed',   dot: '#2563eb', color: '#2563eb', status: 'Redeemed',   pillClass: 'bg-blue-50 text-blue-700' },
  VAULT_LIQUIDATED: { label: 'Liquidated', dot: '#dc2626', color: '#dc2626', status: 'Liquidated', pillClass: 'bg-red-50 text-red-600' },
};

const VAULT_FILTER_OPTIONS: { value: VaultEventType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'VAULT_CREATED', label: 'Created' },
  { value: 'VAULT_ACTIVATED', label: 'Activated' },
  { value: 'VAULT_EXPIRED', label: 'Expired' },
  { value: 'VAULT_REDEEMED', label: 'Redeemed' },
  { value: 'VAULT_LIQUIDATED', label: 'Liquidated' },
];

/* ── Vault History helpers ─────────────────────────────────────────────── */

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function formatFullTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +UTC`;
}

function vaultGroupByDate(activities: import('@/lib/mock-aave-activity').VaultActivityEvent[]): [string, import('@/lib/mock-aave-activity').VaultActivityEvent[]][] {
  const groups: Record<string, import('@/lib/mock-aave-activity').VaultActivityEvent[]> = {};
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

function vaultDateGroupHeader(dateKey: string): string {
  const day = new Date(dateKey);
  const today = new Date();
  const dayUtc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = Math.floor((todayUtc - dayUtc) / 86400000);
  const rel = days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  const monthNames = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const dateStr = `${monthNames[day.getUTCMonth()]} ${day.getUTCDate()}, ${day.getUTCFullYear()}`;
  return `${rel.toUpperCase()} (${dateStr})`;
}

/* ── Vaults Activity Tab ───────────────────────────────────────────────── */

function VaultsActivityTab() {
  const [filter, setFilter] = useState<VaultEventType | 'ALL'>('ALL');
  const filtered = filter === 'ALL'
    ? MOCK_VAULT_ACTIVITIES
    : MOCK_VAULT_ACTIVITIES.filter((e) => e.type === filter);

  const grouped = vaultGroupByDate(filtered);

  /* Look up provider address from MOCK_VAULTS by vault ID */
  const vaultMap = new Map(MOCK_VAULTS.map((v) => [v.id, v]));

  return (
    <div className="border border-[#cd6332]/20 bg-white">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#387085]/10 px-5 py-3">
        {VAULT_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
              filter === opt.value
                ? 'bg-[#cd6332] text-white'
                : 'bg-[#387085]/8 text-[#387085]/60 hover:bg-[#387085]/15'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#387085]/40">No vault events found</p>
          {filter !== 'ALL' && (
            <button onClick={() => setFilter('ALL')} className="mx-auto mt-1 block text-xs text-[#cd6332] hover:underline">
              Show all events
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6 px-5 py-4">
          {grouped.map(([date, activities]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-[#387085]/50">
                  {vaultDateGroupHeader(date)}
                </span>
                <div className="h-px flex-1 bg-[#387085]/10" />
              </div>
              <div className="space-y-2">
                {activities.map((event) => {
                  const style = VAULT_EVENT_STYLES[event.type];

                  return (
                    <div
                      key={`${event.txHash}-${event.logIndex}`}
                      className="flex items-start gap-3 border border-[#387085]/10 bg-white px-4 py-3 transition-colors hover:bg-[#faf9f5]"
                    >
                      {/* Time column */}
                      <div className="flex w-16 shrink-0 flex-col items-end pt-0.5">
                        <span className="font-mono text-[11px] font-medium text-[#387085]/40">{formatHHMM(event.blockTime)}</span>
                        <span className="text-[9px] text-[#387085]/30">{formatRelativeTime(event.blockTime)}</span>
                      </div>

                      {/* Dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full" style={{ background: style.dot }} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Row 1: Status chip + amount (for terminal states) */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${style.pillClass}`}>
                            {style.status}
                          </span>
                          {/* 물량 표시 기준: 볼트 라이프사이클이 완료된(terminal) 상태에서만 표시
                              - Available: peg-in 완료, 볼트 활성화 → 확정 물량
                              - Redeemed: 정상 상환 완료 → 상환 물량
                              - Expired: 타임아웃으로 만료 → 잠겼던 물량
                              - Liquidated: 청산 처리 완료 → 청산 물량
                              * Pending/Verified/Signature Collected: 아직 진행 중이라 물량 미확정 → 미표시 */}
                          {['Available', 'Redeemed', 'Expired', 'Liquidated'].includes(style.status) && (
                            <span className="flex-shrink-0 font-mono text-sm font-semibold text-[#14140f]">
                              {parseFloat(event.amount).toFixed(6)} <span className="text-xs font-normal text-[#387085]/50">sBTC</span>
                            </span>
                          )}
                        </div>

                        {/* Row 2: Vault | Provider | Depositor */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Vault</span>
                            <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                            <Link href={`/vaults/${event.vaultId}`} className="font-mono text-[10px] text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
                              {truncateAddress(event.vaultId, 6, 4)}
                            </Link>
                          </span>
                          <span className="text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Provider</span>
                            <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                            <span className="font-mono text-[10px] text-[#14140f]/70">{event.providerName}</span>
                          </span>
                          <span className="text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Depositor</span>
                            <svg className="h-3 w-3 text-[#387085]/30" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                            </svg>
                            <Link href={`/accounts/${event.depositorAddress}`} className="font-mono text-[10px] text-[#387085]/70 hover:text-[#cd6332] hover:underline">
                              {truncateAddress(event.depositorAddress, 6, 4)}
                            </Link>
                          </span>
                        </div>

                        {/* Row 3: Txn | Block */}
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Tx</span>
                            <Link href={`/tx/${event.txHash}`} className="font-mono text-[10px] text-[#cd6332]/70 hover:text-[#cd6332] hover:underline">
                              {truncateAddress(event.txHash, 6, 4)}
                            </Link>
                            <CopyIcon text={event.txHash} />
                          </span>
                          <span className="text-[10px] text-[#387085]/20">·</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-[9px] font-medium uppercase tracking-wide text-[#387085]/40">Block</span>
                            <span className="font-mono text-[10px] text-[#387085]/40">
                              #{event.blockNumber.toLocaleString()}
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
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────── */

export default function VaultsPage() {
  const [activeTab, setActiveTab] = useState<PageTab>('all');
  const [page, setPage]           = useState(1);
  const [sortKey, setSortKey]     = useState<SortKey>('createdAt');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');

  /* ── Filter state for Status & DApp ── */
  const [statusFilter, setStatusFilter] = useState<VaultStatus | 'ALL'>('ALL');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [dappFilter, setDappFilter] = useState<string>('ALL');
  const [dappDropdownOpen, setDappDropdownOpen] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    let copy = [...MOCK_VAULTS];
    if (statusFilter !== 'ALL') {
      copy = copy.filter((v) => v.status === statusFilter);
    }
    if (dappFilter !== 'ALL') {
      copy = copy.filter((v) => v.dappName === dappFilter);
    }
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === 'vaultSize') {
        cmp = a.vaultSize - b.vaultSize;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [sortKey, sortDir, statusFilter, dappFilter]);

  const total      = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageVaults = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function SortIcon({ colKey }: { colKey: SortKey }) {
    if (sortKey !== colKey) {
      return <span className="ml-1 opacity-60">↕</span>;
    }
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  return (
    <div className="relative mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <DevNote title="Vaults 기획 의도">
        <DevNoteSection heading="페이지 목적">
          <p>프로토콜에 존재하는 모든 Vault를 탐색하는 전체 목록 페이지.</p>
          <p>두 개의 탭: All Vaults (현재 상태) / Vault History (이벤트 로그).</p>
        </DevNoteSection>
        <DevNoteSection heading="All Vaults 탭">
          <p>컬럼: Vault ID / Amount(정렬) / Status(필터) / Depositor / Provider / DApp(필터) / Created (Age)(정렬) / Closed (Age).</p>
          <p>Status 필터: All / Active / Expired / Pending / Liquidated / Redeemed 드롭다운.</p>
          <p>DApp 필터: 전체 DApp 목록에서 드롭다운 선택.</p>
          <p>기본 정렬: Created 내림차순 (최신순).</p>
          <p>Created/Closed는 상대 시간(e.g. &quot;2 hours ago&quot;)으로 표시.</p>
        </DevNoteSection>
        <DevNoteSection heading="Vault History 탭">
          <p>Vault 상태 변경 이벤트(Created, Activated, Expired, Redeemed, Liquidated)를 시간순으로 나열.</p>
          <p>레이아웃: 날짜별 그룹 → 각 카드에 왼쪽 시간(HH:MM + ago), 상태 chip, 엔티티 정보, Tx/Block.</p>
          <p>엔티티 표시 순서: 라벨 → 아이콘 → 주소 (예: VAULT 🔒 0x1234...abcd).</p>
          <p>엔티티 구성: Vault | Provider | Depositor.</p>
        </DevNoteSection>
        <DevNoteSection heading="물량(Amount) 표시 기준">
          <p>볼트 라이프사이클이 완료된 terminal 상태에서만 오른쪽에 물량(sBTC) 표시.</p>
          <p>✅ Available: peg-in 완료, 볼트 활성화 → 확정 물량.</p>
          <p>✅ Redeemed: 정상 상환 완료 → 상환 물량.</p>
          <p>✅ Expired: 타임아웃 만료 → 잠겼던 물량.</p>
          <p>✅ Liquidated: 청산 처리 완료 → 청산 물량.</p>
          <p>❌ Pending / Verified / Signature Collected: 진행 중이라 물량 미확정 → 미표시.</p>
        </DevNoteSection>
        <DevNoteSection heading="페이지네이션">
          <p>25개/페이지. 첫/이전/다음/마지막 버튼 제공.</p>
        </DevNoteSection>
      </DevNote>
      <h1 className="text-lg font-semibold text-[#14140f]">Vaults</h1>

      {/* Tab bar */}
      <div className="flex border-b border-[#387085]/15">
        {([
          { key: 'all' as PageTab, label: 'All Vaults', count: total },
          { key: 'activity' as PageTab, label: 'Vault History', count: MOCK_VAULT_ACTIVITIES.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-[#cd6332] text-[#cd6332]'
                : 'text-[#387085]/50 hover:text-[#14140f]'
            }`}
          >
            {tab.label} <span className="text-[10px] text-[#387085]/40">({tab.count})</span>
          </button>
        ))}
      </div>

      {activeTab === 'activity' && <VaultsActivityTab />}

      {activeTab === 'all' && <>
      {/* Results count + Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgba(56,112,133,0.5)]">
          Showing all <span className="font-semibold text-[#14140f]">{total}</span> results
        </p>
        <div className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
          <button
            onClick={() => setPage(1)}
            disabled={safePage <= 1}
            className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30"
          >
            «
          </button>
          <button
            onClick={() => setPage(safePage - 1)}
            disabled={safePage <= 1}
            className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30"
          >
            ‹
          </button>
          <span className="px-2 text-[#14140f]">
            Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage(safePage + 1)}
            disabled={safePage >= totalPages}
            className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage >= totalPages}
            className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30"
          >
            »
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
              <th
                className="cursor-pointer whitespace-nowrap px-4 py-2.5 font-medium select-none"
                onClick={() => handleSort('vaultSize')}
              >
                Amount<SortIcon colKey="vaultSize" />
              </th>
              {/* Status with filter dropdown */}
              <th className="relative whitespace-nowrap px-4 py-2.5 font-medium">
                <button onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setDappDropdownOpen(false); }} className="inline-flex items-center gap-1">
                  Status
                  <span className="ml-0.5 text-[10px]">≡</span>
                  {statusFilter !== 'ALL' && <span className="ml-0.5 inline-flex h-1.5 w-1.5 rounded-full bg-white" />}
                </button>
                {statusDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-0.5 w-40 border border-[#387085]/10 bg-white py-1 shadow-lg" onMouseLeave={() => setStatusDropdownOpen(false)}>
                    <button onClick={() => { setStatusFilter('ALL'); setStatusDropdownOpen(false); setPage(1); }}
                      className={`block w-full px-3 py-1.5 text-left text-[11px] transition-colors ${statusFilter === 'ALL' ? 'bg-[#cd6332]/8 font-semibold text-[#cd6332]' : 'text-[#14140f] hover:bg-[#faf9f5]'}`}>
                      All
                    </button>
                    {ALL_STATUSES.map((s) => (
                      <button key={s} onClick={() => { setStatusFilter(s); setStatusDropdownOpen(false); setPage(1); }}
                        className={`block w-full px-3 py-1.5 text-left text-[11px] transition-colors ${statusFilter === s ? 'bg-[#cd6332]/8 font-semibold text-[#cd6332]' : 'text-[#14140f] hover:bg-[#faf9f5]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Depositor</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Provider</th>
              {/* DApp with filter dropdown */}
              <th className="relative whitespace-nowrap px-4 py-2.5 font-medium">
                <button onClick={() => { setDappDropdownOpen(!dappDropdownOpen); setStatusDropdownOpen(false); }} className="inline-flex items-center gap-1">
                  DApp
                  <span className="ml-0.5 text-[10px]">≡</span>
                  {dappFilter !== 'ALL' && <span className="ml-0.5 inline-flex h-1.5 w-1.5 rounded-full bg-white" />}
                </button>
                {dappDropdownOpen && (
                  <div className="absolute left-0 top-full z-50 mt-0.5 w-40 border border-[#387085]/10 bg-white py-1 shadow-lg" onMouseLeave={() => setDappDropdownOpen(false)}>
                    <button onClick={() => { setDappFilter('ALL'); setDappDropdownOpen(false); setPage(1); }}
                      className={`block w-full px-3 py-1.5 text-left text-[11px] transition-colors ${dappFilter === 'ALL' ? 'bg-[#cd6332]/8 font-semibold text-[#cd6332]' : 'text-[#14140f] hover:bg-[#faf9f5]'}`}>
                      All
                    </button>
                    {ALL_DAPPS.map((d) => (
                      <button key={d} onClick={() => { setDappFilter(d); setDappDropdownOpen(false); setPage(1); }}
                        className={`block w-full px-3 py-1.5 text-left text-[11px] transition-colors ${dappFilter === d ? 'bg-[#cd6332]/8 font-semibold text-[#cd6332]' : 'text-[#14140f] hover:bg-[#faf9f5]'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </th>
              <th
                className="cursor-pointer whitespace-nowrap px-4 py-2.5 font-medium select-none"
                onClick={() => handleSort('createdAt')}
              >
                Created (Age)<SortIcon colKey="createdAt" />
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Closed (Age)</th>
            </tr>
          </thead>
          <tbody>
            {pageVaults.map((vault) => (
              <tr
                key={vault.id}
                className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
              >
                {/* Vault ID */}
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    <Link
                      href={`/vaults/${vault.id}`}
                      className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                    >
                      {truncateAddress(vault.id, 6, 4)}
                    </Link>
                    <CopyIcon text={vault.id} />
                  </div>
                </td>

                {/* Amount */}
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#14140f]">
                  {vault.vaultSize.toFixed(8)}{' '}
                  <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
                  <span className="ml-1 text-[10px] text-[#387085]/35">{toUsd(vault.vaultSize)}</span>
                </td>

                {/* Status */}
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span
                    className="font-medium"
                    style={{ color: STATUS_COLORS[vault.status] }}
                  >
                    {vault.status}
                  </span>
                </td>

                {/* Depositor */}
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    <Link
                      href={`/accounts/${vault.depositorAddress}`}
                      className="font-mono text-[11px] text-[#387085] hover:text-[#cd6332]"
                    >
                      {truncateAddress(vault.depositorAddress, 6, 4)}
                    </Link>
                    <CopyIcon text={vault.depositorAddress} />
                  </div>
                </td>

                {/* Provider */}
                <td className="whitespace-nowrap px-4 py-2.5">
                  <Link
                    href={`/accounts/${vault.providerAddress}`}
                    className="text-[#14140f] hover:text-[#cd6332]"
                    title={vault.providerAddress}
                  >
                    {vault.providerName}
                  </Link>
                </td>

                {/* DApp */}
                <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">
                  {vault.dappName}
                </td>

                {/* Created (Age) */}
                <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                  {vault.createdAt ? formatRelativeTime(vault.createdAt) : '—'}
                </td>

                {/* Closed (Age) */}
                <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                  {vault.closedAt ? formatRelativeTime(vault.closedAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>}
    </div>
  );
}
