'use client';

import type { Column, Table } from '@tanstack/react-table';
import { XIcon } from 'lucide-react';

import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter';
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DataTableToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  // Check if there are any column filters applied
  const isFiltered = table.getState().columnFilters.length > 0;

  // Get all columns that can be filtered
  const columns = table.getAllColumns().filter(column => column.getCanFilter());

  // handle reset of column filters
  const onReset = () => {
    table.resetColumnFilters();
  };

  return (
    <div
      className={cn(
        'flex w-full items-start justify-between gap-2 p-1',
        className
      )}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map(column => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        {/* ------ RESET FILTER ------ */}
        {isFiltered && (
          <Button
            size="sm"
            variant="outline"
            className="border-dashed"
            onClick={onReset}
          >
            <XIcon />
            Reset
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {/* ------ VIEW OPTIONS ------ */}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData> {
  column: Column<TData>;
}

function DataTableToolbarFilter<TData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  // Get the column metadata
  const columnMeta = column.columnDef.meta;

  const onFilterRender = () => {
    // Return null if the column meta is not defined
    if (!columnMeta?.variant) return null;

    switch (columnMeta.variant) {
      case 'text':
        return (
          <Input
            placeholder={columnMeta.placeholder ?? columnMeta.label}
            value={(column.getFilterValue() as string) ?? ''}
            onChange={event => column.setFilterValue(event.target.value)}
            className="h-8 w-40 lg:w-56"
          />
        );

      case 'date':
      case 'dateRange':
        return (
          <DataTableDateFilter
            column={column}
            title={columnMeta.label ?? column.id}
            multiple={columnMeta.variant === 'dateRange'}
          />
        );

      case 'select':
      case 'multiSelect':
        return (
          <DataTableFacetedFilter
            column={column}
            title={columnMeta.label ?? column.id}
            options={columnMeta.options ?? []}
            multiple={columnMeta.variant === 'multiSelect'}
          />
        );

      default:
        return null;
    }
  };
  return onFilterRender();
}
