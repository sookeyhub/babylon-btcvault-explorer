import type { Vault, VaultListParams, PaginatedResult } from './types';

/** Format sBTC amount with proper precision */
export function formatBTC(amount: number): string {
  return `${amount.toFixed(8)} sBTC`;
}

/** Format large numbers with commas */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/** Truncate hash/address for display */
export function truncateAddress(addr: string, start = 6, end = 4): string {
  if (!addr || addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

/** Format ISO timestamp to readable date */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format ISO timestamp to relative time */
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return formatDate(iso);
}

/** Filter, sort, and paginate vaults */
export function queryVaults(
  vaults: Vault[],
  params: VaultListParams,
): PaginatedResult<Vault> {
  let filtered = [...vaults];

  // Search
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.id.toLowerCase().includes(q) ||
        v.btcAddress.toLowerCase().includes(q) ||
        v.depositorAddress.toLowerCase().includes(q) ||
        v.dappName.toLowerCase().includes(q) ||
        v.providerName.toLowerCase().includes(q),
    );
  }

  // Status filter
  if (params.status !== 'All') {
    filtered = filtered.filter((v) => v.status === params.status);
  }

  // Sort
  switch (params.sortBy) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'oldest':
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'size_desc':
      filtered.sort((a, b) => b.vaultSize - a.vaultSize);
      break;
    case 'size_asc':
      filtered.sort((a, b) => a.vaultSize - b.vaultSize);
      break;
  }

  // Paginate
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;
  const data = filtered.slice(start, start + params.pageSize);

  return { data, total, page, pageSize: params.pageSize, totalPages };
}

/** Status color mapping */
export function getStatusColor(status: Vault['status']): {
  bg: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'Active':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'Expired':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' };
    case 'Pending':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' };
    case 'Liquidated':
      return { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' };
    case 'Redeemed':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' };
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' };
  }
}
