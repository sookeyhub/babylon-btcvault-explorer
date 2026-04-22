'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_TRANSACTIONS, MOCK_VAULTS } from '@/lib/mock-data';
import { truncateAddress, formatRelativeTime } from '@/lib/utils';
import type { Transaction, Vault, AccountType } from '@/lib/types';

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

const STATUS_COLORS: Record<string, string> = {
  Active:     '#5a8a3c',
  Expired:    '#6b7280',
  Pending:    '#cd6332',
  Liquidated: '#c83232',
  Redeemed:   '#387085',
};

interface Props {
  address: string;
  accountType: AccountType;
  isProvider: boolean;
}

type TabKey = 'transactions' | 'deposited' | 'managed';

export default function AccountDetailTabs({ address, accountType, isProvider }: Props) {
  // Check whether this EOA actually deposited any vaults
  const lcAddr = address.toLowerCase();
  const hasDepositedVaults = MOCK_VAULTS.some(
    (v) => v.depositorAddress.toLowerCase() === lcAddr,
  );

  // Build available tabs based on role (Provider / Depositor / neither)
  const tabs: { key: TabKey; label: string }[] = [{ key: 'transactions', label: 'Transactions' }];

  if (accountType === 'EOA') {
    if (hasDepositedVaults) {
      tabs.push({ key: 'deposited', label: 'Deposited Vaults' });
    }
    if (isProvider) {
      tabs.push({ key: 'managed', label: 'Vaults' });
    }
  }

  const [activeTab, setActiveTab] = useState<TabKey>(tabs[0]?.key ?? 'transactions');
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [depositedVaults, setDepositedVaults] = useState<Vault[]>([]);
  const [managedVaults, setManagedVaults] = useState<Vault[]>([]);

  useEffect(() => {
    const addr = address.toLowerCase();
    setTxs(
      MOCK_TRANSACTIONS.filter(
        (t) => t.from.toLowerCase() === addr || t.to.toLowerCase() === addr,
      ),
    );
    setDepositedVaults(
      MOCK_VAULTS.filter((v) => v.depositorAddress.toLowerCase() === addr),
    );
    setManagedVaults(
      MOCK_VAULTS.filter((v) => v.providerAddress.toLowerCase() === addr),
    );
  }, [address]);

  // Get the count for each tab
  const getTabCount = (key: TabKey): number => {
    switch (key) {
      case 'transactions': return txs.length;
      case 'deposited': return depositedVaults.length;
      case 'managed': return managedVaults.length;
      default: return 0;
    }
  };

  return (
    <>
      {/* Tab headers */}
      <div className="flex border-b border-[#387085]/15">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-[#cd6332] text-[#cd6332]'
                : 'text-[rgba(56,112,133,0.5)] hover:text-[#14140f]'
            }`}
          >
            {tab.label} ({getTabCount(tab.key)})
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'transactions' && (
        <TransactionsTable txs={txs} address={address} />
      )}

      {activeTab === 'deposited' && (
        <VaultsTable vaults={depositedVaults} address={address} roleLabel="Depositor" />
      )}

      {activeTab === 'managed' && (
        <ManagedVaultsPanel vaults={managedVaults} address={address} />
      )}
    </>
  );
}

/* ── Transactions Table ───────────────────────────────────────────────── */
function TransactionsTable({ txs, address }: { txs: Transaction[]; address: string }) {
  return (
    <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
      {txs.length === 0 ? (
        <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.5)]">
          No transactions found
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Txn Hash</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Method</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Block</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Age</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">From</th>
              <th className="px-2 py-2.5 font-medium"></th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">To</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Txn Fee</th>
            </tr>
          </thead>
          <tbody>
            {txs.slice(0, 25).map((tx) => (
              <tr
                key={tx.hash}
                className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
              >
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    <Link
                      href={`/tx/${tx.hash}`}
                      className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                    >
                      {truncateAddress(tx.hash, 6, 4)}
                    </Link>
                    <CopyIcon text={tx.hash} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="inline-block rounded bg-[#cd6332] px-2 py-0.5 font-mono text-[10px] font-medium text-white">
                    {tx.method}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="text-[#387085]">{tx.blockNumber}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                  {formatRelativeTime(tx.timestamp)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    {tx.from.toLowerCase() === address.toLowerCase() ? (
                      <span className="font-mono text-[11px] font-medium text-[#14140f]">
                        {truncateAddress(tx.from, 6, 4)}
                      </span>
                    ) : (
                      <Link
                        href={`/accounts/${tx.from}`}
                        className="font-mono text-[11px] text-[#387085] hover:text-[#cd6332]"
                      >
                        {truncateAddress(tx.from, 6, 4)}
                      </Link>
                    )}
                    <CopyIcon text={tx.from} />
                  </div>
                </td>
                <td className="px-2 py-2.5 text-center">
                  <span className="text-[rgba(56,112,133,0.3)]">→</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center">
                    {tx.to.toLowerCase() === address.toLowerCase() ? (
                      <span className="font-mono text-[11px] font-medium text-[#14140f]">
                        {truncateAddress(tx.to, 6, 4)}
                      </span>
                    ) : (
                      <Link
                        href={`/accounts/${tx.to}`}
                        className="font-mono text-[11px] text-[#387085] hover:text-[#cd6332]"
                      >
                        {truncateAddress(tx.to, 6, 4)}
                      </Link>
                    )}
                    <CopyIcon text={tx.to} />
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#14140f]">
                  {tx.amount} ETH
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                  {tx.txFee.toFixed(10)} ETH
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Vaults Table ─────────────────────────────────────────────────────── */
function VaultsTable({ vaults, address, roleLabel }: { vaults: Vault[]; address: string; roleLabel?: string }) {
  return (
    <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
      {vaults.length === 0 ? (
        <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.5)]">
          No vaults found
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
              {!roleLabel && (
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Role</th>
              )}
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">DApp</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Provider</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {vaults.slice(0, 25).map((vault) => {
              const isDepositor = vault.depositorAddress.toLowerCase() === address.toLowerCase();
              return (
                <tr
                  key={vault.id}
                  className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
                >
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
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[vault.status] }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: STATUS_COLORS[vault.status] }}
                      >
                        {vault.status}
                      </span>
                    </span>
                  </td>
                  {!roleLabel && (
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                          isDepositor
                            ? 'bg-[#387085]/10 text-[#387085]'
                            : 'bg-[#5a8a3c]/10 text-[#5a8a3c]'
                        }`}
                      >
                        {isDepositor ? 'Depositor' : 'Provider'}
                      </span>
                    </td>
                  )}
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#14140f]">
                    {vault.vaultSize.toFixed(8)}{' '}
                    <span className="text-[rgba(56,112,133,0.5)]">sBTC</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">
                    {vault.dappName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[#14140f]">
                    {vault.providerName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                    {formatRelativeTime(vault.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Managed Vaults Panel (for Provider accounts) ──────────────────────── */
const PAGE_SIZE_MANAGED = 20;

function ManagedVaultsPanel({ vaults, address }: { vaults: Vault[]; address: string }) {
  const [page, setPage] = useState(1);

  const totalVaults = vaults.length;

  const totalPages = Math.max(1, Math.ceil(totalVaults / PAGE_SIZE_MANAGED));
  const safePage = Math.min(page, totalPages);
  const pageVaults = vaults.slice(
    (safePage - 1) * PAGE_SIZE_MANAGED,
    safePage * PAGE_SIZE_MANAGED,
  );
  const rangeStart = totalVaults === 0 ? 0 : (safePage - 1) * PAGE_SIZE_MANAGED + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE_MANAGED, totalVaults);

  return (
    <div className="space-y-4">
      {/* Managed Vaults table */}
      <div className="overflow-x-auto rounded-none border border-[#cd6332]/20 bg-white">
        {totalVaults === 0 ? (
          <div className="py-12 text-center text-sm text-[rgba(56,112,133,0.5)]">
            No vaults found
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium text-right">Amount (BTC)</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Depositor</th>
                <th className="whitespace-nowrap px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {pageVaults.map((vault) => {
                const usdValue = vault.vaultSize * 60000;
                return (
                  <tr
                    key={vault.id}
                    className="h-10 border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
                  >
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
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[vault.status] }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: STATUS_COLORS[vault.status] }}
                        >
                          {vault.status}
                        </span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">
                      <div className="font-semibold text-[#14140f]">
                        {vault.vaultSize.toFixed(8)}
                      </div>
                      <div className="text-[10px] text-[#387085]/40">
                        ≈ ${usdValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center">
                        <Link
                          href={`/accounts/${vault.depositorAddress}`}
                          className="font-mono text-xs text-[#387085] hover:text-[#cd6332]"
                        >
                          {truncateAddress(vault.depositorAddress, 6, 4)}
                        </Link>
                        <CopyIcon text={vault.depositorAddress} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[rgba(56,112,133,0.5)]">
                      {formatRelativeTime(vault.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalVaults > 0 && (
          <div className="flex items-center justify-between border-t border-[#cd6332]/10 px-4 py-2.5">
            <span className="text-xs text-[#387085]/60">
              Showing <span className="font-semibold text-[#14140f]">{rangeStart}</span>–
              <span className="font-semibold text-[#14140f]">{rangeEnd}</span> of{' '}
              <span className="font-semibold text-[#14140f]">{totalVaults}</span> vaults
            </span>
            <div className="flex items-center gap-1 text-xs text-[rgba(56,112,133,0.5)]">
              <button onClick={() => setPage(1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">«</button>
              <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">‹</button>
              <span className="px-2 text-[#14140f]">
                Page <span className="font-semibold">{safePage}</span> of <span className="font-semibold">{totalPages}</span>
              </span>
              <button onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">›</button>
              <button onClick={() => setPage(totalPages)} disabled={safePage >= totalPages} className="rounded px-1.5 py-1 hover:bg-[rgba(56,112,133,0.05)] disabled:opacity-30">»</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
