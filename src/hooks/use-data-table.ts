'use client';

import {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  TableState,
} from '@tanstack/react-table';

import {
  Parser,
  UseQueryStateOptions,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';

import { useEffect, useState } from 'react';

// URL query parameter keys
const PAGE_KEY = 'page';
const PER_PAGE_KEY = 'perPage';
const ARRAY_SEPARATOR = ',';

// Type for filter parsers
type FilterValues = Record<string, string | string[] | null>;
type FilterParsers = Record<string, Parser<string> | Parser<string[]>>;

// Explicit props for useDataTable
interface UseDataTableProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  pageCount: number;
  initialState?: Partial<
    Pick<TableState, 'columnVisibility' | 'columnPinning'>
  >;
}

export function useDataTable<TData, TValue>({
  data,
  columns,
  pageCount,
  initialState = {},
}: UseDataTableProps<TData, TValue>) {
  // Query state options for URL synchronization
  const queryStateOptions: Omit<UseQueryStateOptions<string>, 'parse'> = {
    history: 'replace',
    scroll: false,
    shallow: false,
    clearOnDefault: true,
  };

  // Client-only state (tanstack)
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState.columnVisibility ?? {}
  );

  // URL-synced pagination state (nuqs)
  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1)
  );
  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(10)
  );

  // Convert page and perPage to tanstack's PaginationState format
  // Note: page is 1-indexed, while PaginationState.pageIndex is 0-indexed
  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: perPage,
  };

  // Handle pagination change
  function onPaginationChange(
    updaterOrValue:
      | PaginationState
      | ((old: PaginationState) => PaginationState)
  ) {
    // Calculate next pagination state from tanstack's PaginationState
    const next =
      typeof updaterOrValue === 'function'
        ? updaterOrValue(pagination)
        : updaterOrValue;
    // Update URL query parameters for page and perPage (convert to 1-indexed)
    setPage(next.pageIndex + 1);
    setPerPage(next.pageSize);
  }

  // Get filterable columns (enableColumnFilter: true)
  const filterable = columns.filter(col => col.enableColumnFilter);
  // Create parsers for filterable columns
  const parsers = filterable.reduce<FilterParsers>((acc, col) => {
    const key = col.id as string;
    acc[key] = col.meta?.options
      ? // Parse ar array of strings if meta.options is defined
        parseAsArrayOf(parseAsString, ARRAY_SEPARATOR).withOptions(
          queryStateOptions
        )
      : // Else parse as string
        parseAsString.withOptions(queryStateOptions);
    return acc;
  }, {});

  // URL-synced filter values (nuqs)
  const [filterValues, setFilterValues] = useQueryStates(parsers);

  // Update filters and reset page to 1 (for url)
  function updateUrlFilters(newFilterValues: FilterValues) {
    setPage(1);
    setFilterValues(newFilterValues);
  }

  // Client state for column filters (tanstack)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Sync tanstack column filters with URL filter values
  useEffect(() => {
    const newFilters: ColumnFiltersState = Object.entries(filterValues).flatMap(
      ([id, val]) => {
        if (!val || (Array.isArray(val) && val.length === 0)) return [];

        const values = Array.isArray(val)
          ? val.filter(Boolean)
          : val.trim() === ''
          ? []
          : [val];

        return values.length > 0 ? [{ id, value: values }] : [];
      }
    );
    setColumnFilters(newFilters);
  }, [filterValues]);

  // Handle column filter changes (tanstack & URL sync)
  function onColumnFiltersChange(
    updaterOrValue:
      | ColumnFiltersState
      | ((prev: ColumnFiltersState) => ColumnFiltersState)
  ) {
    setColumnFilters(prevFilters => {
      const nextColumnFilters =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(prevFilters)
          : updaterOrValue;

      const nextFilterValues: FilterValues = {};

      // Add or update non-empty filters
      for (const { id, value } of nextColumnFilters) {
        const isValid =
          typeof value === 'string'
            ? value.trim() !== ''
            : Array.isArray(value)
            ? value.filter(Boolean).length > 0
            : value != null;

        if (isValid) {
          nextFilterValues[id] = value as string | string[];
        }
      }

      // Remove filters that existed before but were cleared
      for (const { id } of prevFilters) {
        const stillExists = nextColumnFilters.some(f => f.id === id);
        if (!stillExists) {
          nextFilterValues[id] = null; // Explicitly remove from URL
        }
      }

      // Sync with URL (reset to page 1)
      updateUrlFilters(nextFilterValues);

      return nextColumnFilters;
    });
  }

  // Sanitize filter values to remove empty or null values
  const NormalizedFilterValues = Object.keys(filterValues)
    .sort() // Normalize key order
    .reduce<FilterValues>((acc, key) => {
      const value = filterValues[key];

      // Sanitize - skip empty/null values
      if (value === null) return acc;
      if (typeof value === 'string' && value.trim() === '') return acc;
      if (Array.isArray(value) && value.length === 0) return acc;

      // Normalize - sort arrays
      if (typeof value !== 'undefined') {
        acc[key] = Array.isArray(value) ? [...value].sort() : value;
      }
      return acc;
    }, {});

  // Create table instance
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      rowSelection,
      columnVisibility,
      columnFilters,
      columnPinning: initialState.columnPinning,
    },
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: true,
    onPaginationChange,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return { table, filterValues: NormalizedFilterValues, page, perPage };
}
