import type { Vault, VaultListParams, PaginatedResult } from './types';

/** Mock token prices (USD) — replace with live API in production */
export const TOKEN_PRICES: Record<string, number> = {
  sBTC: 104_820,
  BTC: 104_820,
  WBTC: 62_794,
  vaultBTC: 62_794,
  USDC: 1,
  USDT: 1,
  ETH: 2_510,
};

/** Convert a token amount to USD string, e.g. "($104,820)" */
export function toUsd(amount: number, symbol: string = 'sBTC'): string {
  const price = TOKEN_PRICES[symbol] ?? 0;
  const usd = amount * price;
  if (usd < 0.01 && usd > 0) return '($<0.01)';
  return `($${usd.toLocaleString('en-US', { maximumFractionDigits: usd >= 100 ? 0 : 2 })})`;
}

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
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
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
        v.depositorAddress?.toLowerCase().includes(q) ||
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
    case 'Available':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'Pending':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' };
    case 'Verified':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' };
    case 'Signature Collected':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500' };
    case 'Redeemed':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' };
    case 'Expired':
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' };
    case 'Liquidated':
      return { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' };
    default:
      return { bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' };
  }
}
