'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Vault } from '@/lib/types';
import { MOCK_VAULTS } from '@/lib/mock-data';
import { truncateAddress } from '@/lib/utils';

const PAGE_SIZE = 25;

type SortKey = 'status' | 'vaultSize' | 'dappName' | 'createdAt';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<Vault['status'], string> = {
  Active:     '#5a8a3c',
  Expired:    '#6b7280',
  Pending:    '#cd6332',
  Liquidated: '#c83232',
  Redeemed:   '#387085',
};

function formatDateUTC(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

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

export default function VaultsPage() {
  const [page, setPage]           = useState(1);
  const [sortKey, setSortKey]     = useState<SortKey>('createdAt');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');

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
    const copy = [...MOCK_VAULTS];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortKey === 'vaultSize') {
        cmp = a.vaultSize - b.vaultSize;
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status);
      } else if (sortKey === 'dappName') {
        cmp = a.dappName.localeCompare(b.dappName);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [sortKey, sortDir]);

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
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <h1 className="text-lg font-semibold text-[#14140f]">Vaults</h1>

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
                onClick={() => handleSort('status')}
              >
                Status<SortIcon colKey="status" />
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">BTC Address</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Depositor</th>
              <th
                className="cursor-pointer whitespace-nowrap px-4 py-2.5 font-medium select-none"
                onClick={() => handleSort('vaultSize')}
              >
                Amount<SortIcon colKey="vaultSize" />
              </th>
              <th
                className="cursor-pointer whitespace-nowrap px-4 py-2.5 font-medium select-none"
                onClick={() => handleSort('dappName')}
              >
                DApp<SortIcon colKey="dappName" />
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Provider</th>
              <th
                className="cursor-pointer whitespace-nowrap px-4 py-2.5 font-medium select-none"
                onClick={() => handleSort('createdAt')}
              >
                Created<SortIcon colKey="createdAt" />
              </th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Closed</th>
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

                {/* Status */}
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span
                    className="font-medium"
                    style={{ color: STATUS_COLORS[vault.status] }}
                  >
                    {vault.status}
                  </span>
                </td>

                {/* BTC Address */}
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    <span className="font-mono text-[11px] text-[#387085]">
                      {truncateAddress(vault.btcAddress, 6, 4)}
                    </span>
                    <CopyIcon text={vault.btcAddress} />
                  </div>
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

                {/* Amount */}
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#14140f]">
                  {vault.vaultSize.toFixed(8)}{' '}
                  <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
                </td>

                {/* DApp */}
                <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">
                  {vault.dappName}
                </td>

                {/* Provider (hover → address tooltip, click → provider detail) */}
                <td className="whitespace-nowrap px-4 py-2.5">
                  <Link
                    href={`/accounts/${vault.providerAddress}`}
                    className="text-[#14140f] hover:text-[#cd6332]"
                    title={vault.providerAddress}
                  >
                    {vault.providerName}
                  </Link>
                </td>

                {/* Created */}
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                  {formatDateUTC(vault.createdAt)}
                </td>

                {/* Closed */}
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                  {formatDateUTC(vault.closedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
