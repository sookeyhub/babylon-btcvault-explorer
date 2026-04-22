import Link from 'next/link';
import { getDashboardKPIs, getAnalyticsData, getVaults } from '@/lib/data';
import { truncateAddress, formatBTC } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import HeroBanner from '@/components/HeroBanner';
import TVLHistorySection from '@/components/TVLHistorySection';
import CopyButton from '@/components/CopyButton';

export const revalidate = 60;

/** Format ISO timestamp as YYYY/MM/DD HH:mm:ss (UTC) */
function formatDateUTC(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
}

export default async function HomePage() {
  const [kpis, analytics, allVaults] = await Promise.all([
    getDashboardKPIs(),
    getAnalyticsData(),
    getVaults(),
  ]);

  const recentVaults = allVaults.slice(0, 10);

  const kpiCards = [
    {
      label: 'Total Value Locked',
      value: formatBTC(kpis.currentTVL),
    },
    {
      label: 'Active Vaults',
      value: String(kpis.activeVaultCount),
    },
    {
      label: 'Total Value Processed',
      value: formatBTC(kpis.totalValueProcessed),
    },
    {
      label: 'Total Vaults',
      value: String(kpis.totalNumberOfVaults),
    },
  ];

  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner />

      {/* Main content */}
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6">

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <div
              key={card.label}
              className="rounded-none border border-[#387085]/20 bg-white px-5 py-4"
            >
              <p className="text-xs text-[rgba(56,112,133,0.55)]">{card.label}</p>
              <p className="mt-1.5 text-xl font-bold tabular-nums text-[#14140f]">{card.value}</p>
              <p className="mt-1 text-xs text-[rgba(56,112,133,0.4)]">0% (24h)</p>
            </div>
          ))}
        </div>

        {/* TVL History Chart */}
        <TVLHistorySection data={analytics.tvlHistory} />

        {/* Recent Vaults Table */}
        <div className="rounded-none border border-[#cd6332]/20 bg-white">
          {/* Section heading */}
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-semibold text-[#14140f]">Recent Vaults</h2>
            <Link
              href="/vaults"
              className="text-xs font-medium text-[#cd6332] hover:text-[#b8562b]"
            >
              View All Vaults →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#cd6332] text-[11px] font-medium uppercase tracking-wider text-white">
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Vault ID</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Status</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">BTC Address</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Depositor</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Amount</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">DApp</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Created (UTC)</th>
                  <th className="whitespace-nowrap px-4 py-2.5 font-medium">Closed (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {recentVaults.map((vault) => (
                  <tr
                    key={vault.id}
                    className="border-b border-[#cd6332]/10 transition-colors hover:bg-[rgba(56,112,133,0.03)]"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center">
                        <Link
                          href={`/vaults/${vault.id}`}
                          className="font-mono text-[11px] font-medium text-[#cd6332] hover:text-[#b8562b]"
                        >
                          {truncateAddress(vault.id, 6, 4)}
                        </Link>
                        <CopyButton text={vault.id} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <StatusBadge status={vault.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center">
                        <span className="font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                          {truncateAddress(vault.btcAddress, 6, 4)}
                        </span>
                        <CopyButton text={vault.btcAddress} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center">
                        <Link
                          href={`/accounts/${vault.depositorAddress}`}
                          className="font-mono text-[11px] text-[rgba(56,112,133,0.5)] hover:text-[#cd6332]"
                        >
                          {truncateAddress(vault.depositorAddress, 6, 4)}
                        </Link>
                        <CopyButton text={vault.depositorAddress} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-medium tabular-nums text-[#14140f]">
                      {vault.vaultSize.toFixed(8)} sBTC
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[#387085]">{vault.dappName}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                      {formatDateUTC(vault.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-[rgba(56,112,133,0.5)]">
                      {formatDateUTC(vault.closedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
