"use client";

import {
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type TableOptions,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";

import {
  type Parser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";

import { useState } from "react";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const ARRAY_SEPARATOR = ",";

interface UseDataTableProps<TData>
  extends Omit<
      TableOptions<TData>,
      | "state"
      | "pageCount"
      | "getCoreRowModel"
      | "manualFiltering"
      | "manualPagination"
      | "manualSorting"
    >,
    Required<Pick<TableOptions<TData>, "pageCount">> {
}

export function useDataTable<TData>(props: UseDataTableProps<TData>) {
  const {
    columns,
    pageCount = -1,
    initialState,
    ...tableProps
  } = props;

  // Define query state options directly
  const queryStateOptions = {
    history: "replace" as const,
    scroll: false,
    shallow: false,
    clearOnDefault: true,
  };

  // Client side state (sorting, selection, visibility)
  const [sorting, setSorting] = useState<SortingState>(
    initialState?.sorting ?? []
  );

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(
    initialState?.rowSelection ?? {}
  );

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    initialState?.columnVisibility ?? {}
  );

  // Server side state (pagination, filtering)
  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions).withDefault(1)
  );

  const [perPage, setPerPage] = useQueryState(
    PER_PAGE_KEY,
    parseAsInteger
      .withOptions(queryStateOptions)
      .withDefault(initialState?.pagination?.pageSize ?? 10)
  );

  const pagination: PaginationState = {
    pageIndex: page - 1, // zero-based index -> one-based index
    pageSize: perPage,
  };

  const onPaginationChange = (updaterOrValue: Updater<PaginationState>) => {
    if (typeof updaterOrValue === "function") {
      const newPagination = updaterOrValue(pagination);
      void setPage(newPagination.pageIndex + 1);
      void setPerPage(newPagination.pageSize);
    } else {
      void setPage(updaterOrValue.pageIndex + 1);
      void setPerPage(updaterOrValue.pageSize);
    }
  };

  const filterableColumns = columns.filter((column) => column.enableColumnFilter);

  const filterParsers = filterableColumns.reduce<
    Record<string, Parser<string> | Parser<string[]>>
  >((acc, column) => {
    if (column.meta?.options) {
      acc[column.id ?? ""] = parseAsArrayOf(
        parseAsString,
        ARRAY_SEPARATOR
      ).withOptions(queryStateOptions);
    } else {
      acc[column.id ?? ""] = parseAsString.withOptions(queryStateOptions);
    }
    return acc;
  }, {});

  const [filterValues, setFilterValues] = useQueryStates(filterParsers);

  const setFilterValuesWithPageReset = (values: typeof filterValues) => {
    void setPage(1);
    void setFilterValues(values);
  };

  const initialColumnFilters: ColumnFiltersState = Object.entries(
    filterValues
  ).reduce<ColumnFiltersState>((filters, [key, value]) => {
    if (value !== null) {
      const processedValue = Array.isArray(value)
        ? value
        : typeof value === "string" && /[^a-zA-Z0-9]/.test(value)
          ? value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
          : [value];

      filters.push({
        id: key,
        value: processedValue,
      });
    }
    return filters;
  }, []);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialColumnFilters
  );

  const onColumnFiltersChange = (updaterOrValue: Updater<ColumnFiltersState>) => {
    setColumnFilters((prev) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(prev)
          : updaterOrValue;

      const filterUpdates = next.reduce<
        Record<string, string | string[] | null>
      >((acc, filter) => {
        if (filterableColumns.find((column) => column.id === filter.id)) {
          acc[filter.id] = filter.value as string | string[];
        }
        return acc;
      }, {});

      for (const prevFilter of prev) {
        if (!next.some((filter) => filter.id === prevFilter.id)) {
          filterUpdates[prevFilter.id] = null;
        }
      }

      setFilterValuesWithPageReset(filterUpdates);
      return next;
    });
  };

  const table = useReactTable({
    ...tableProps,
    columns,
    initialState,
    pageCount,
    state: {
      pagination,
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    defaultColumn: {
      ...tableProps.defaultColumn,
      enableColumnFilter: false,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange,
    onSortingChange: setSorting,
    onColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: false,
  });

  return {
    table
  };
}
