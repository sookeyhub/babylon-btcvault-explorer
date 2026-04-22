import Link from 'next/link';
import type { Vault } from '@/lib/types';
import { truncateAddress, formatBTC, formatDate } from '@/lib/utils';
import StatusBadge from './StatusBadge';

interface VaultTableProps {
  vaults: Vault[];
  compact?: boolean;
  title?: string;
  headerLink?: { href: string; label: string };
}

export default function VaultTable({ vaults, compact, title, headerLink }: VaultTableProps) {
  if (vaults.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[rgba(56,112,133,0.4)]">
        No vaults found
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-none border border-[#cd6332]/20">
      {title && (
        <div className="flex items-center justify-between bg-[#cd6332] px-5 py-3">
          <p className="text-sm font-semibold text-white">{title}</p>
          {headerLink && (
            <Link href={headerLink.href} className="text-white/80 hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          )}
        </div>
      )}
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#cd6332]/10 text-[11px] font-medium uppercase tracking-wider text-[rgba(56,112,133,0.45)]">
              <th className="px-5 py-3 font-medium">Vault ID</th>
              <th className="px-5 py-3 font-medium">Status</th>
              {!compact && (
                <th className="hidden px-5 py-3 font-medium lg:table-cell">BTC Address</th>
              )}
              <th className="px-5 py-3 font-medium">Depositor</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">DApp</th>
              {!compact && (
                <>
                  <th className="hidden px-5 py-3 font-medium md:table-cell">Provider</th>
                  <th className="hidden px-5 py-3 font-medium xl:table-cell">Provider Address</th>
                </>
              )}
              <th className="px-5 py-3 font-medium">Created</th>
              {!compact && (
                <th className="hidden px-5 py-3 font-medium md:table-cell">Closed</th>
              )}
            </tr>
          </thead>
          <tbody>
            {vaults.map((vault) => (
              <tr
                key={vault.id}
                className="border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
              >
                <td className="px-5 py-3">
                  <Link
                    href={`/vaults/${vault.id}`}
                    className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                  >
                    {truncateAddress(vault.id, 6, 4)}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={vault.status} />
                </td>
                {!compact && (
                  <td className="hidden px-5 py-3 lg:table-cell">
                    <span className="font-mono text-[11px] text-[rgba(56,112,133,0.4)]">
                      {truncateAddress(vault.btcAddress, 6, 4)}
                    </span>
                  </td>
                )}
                <td className="px-5 py-3">
                  <Link href={`/accounts/${vault.depositorAddress}`} className="font-mono text-[11px] text-[rgba(56,112,133,0.5)] transition-colors hover:text-[#cd6332]">
                    {truncateAddress(vault.depositorAddress, 6, 4)}
                  </Link>
                </td>
                <td className="px-5 py-3 font-medium tabular-nums text-[#14140f]">
                  {vault.vaultSize.toFixed(8)} sBTC
                </td>
                <td className="px-5 py-3 text-[#387085]">{vault.dappName}</td>
                {!compact && (
                  <>
                    <td className="hidden px-5 py-3 md:table-cell">
                      <Link href={`/accounts/${vault.providerAddress}`} className="text-[rgba(56,112,133,0.6)] transition-colors hover:text-[#cd6332]">
                        {vault.providerName}
                      </Link>
                    </td>
                    <td className="hidden px-5 py-3 xl:table-cell">
                      <span className="font-mono text-[11px] text-[rgba(56,112,133,0.4)]">
                        {truncateAddress(vault.providerAddress, 6, 4)}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-5 py-3 text-[rgba(56,112,133,0.5)]">{formatDate(vault.createdAt)}</td>
                {!compact && (
                  <td className="hidden px-5 py-3 text-[rgba(56,112,133,0.5)] md:table-cell">
                    {vault.closedAt ? formatDate(vault.closedAt) : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
