'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Vault, VaultStatus, PaginatedResult, VaultListParams } from '@/lib/types';
import { queryVaults } from '@/lib/utils';
import { MOCK_VAULTS } from '@/lib/mock-data';
import SearchFilter from '@/components/SearchFilter';
import VaultTable from '@/components/VaultTable';
import Pagination from '@/components/Pagination';
import { LoadingSkeleton } from '@/components/LoadingState';

const PAGE_SIZE = 20;

export default function VaultsPage() {
  const [params, setParams] = useState<VaultListParams>({
    search: '',
    status: 'All',
    sortBy: 'newest',
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [result, setResult] = useState<PaginatedResult<Vault> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVaults = useCallback(() => {
    setLoading(true);
    const res = queryVaults(MOCK_VAULTS, params);
    setResult(res);
    setLoading(false);
  }, [params]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <h1 className="text-lg font-semibold text-[#14140f]">Vaults</h1>

      <SearchFilter
        search={params.search}
        status={params.status}
        sortBy={params.sortBy}
        onSearchChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
        onStatusChange={(status: VaultStatus | 'All') => setParams((p) => ({ ...p, status, page: 1 }))}
        onSortChange={(sortBy) =>
          setParams((p) => ({
            ...p,
            sortBy: sortBy as VaultListParams['sortBy'],
            page: 1,
          }))
        }
      />

      <div className="rounded-none border border-[#cd6332]/20 bg-white">
        {loading ? (
          <div className="p-5">
            <LoadingSkeleton rows={10} />
          </div>
        ) : result ? (
          <>
            <VaultTable vaults={result.data} />
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              pageSize={result.pageSize}
              onPageChange={(page) => setParams((p) => ({ ...p, page }))}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
