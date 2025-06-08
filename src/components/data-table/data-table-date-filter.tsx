'use client';

import { CalendarIcon, XCircle } from 'lucide-react';
import type { Column } from '@tanstack/react-table';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/format';

// Type for date selection
type DateSelection = Date[] | DateRange;

interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>;
  title: string;
  multiple?: boolean;
}

// Check if value is DateRange
const isDateRange = (value: unknown): value is DateRange =>
  !!value && typeof value === 'object' && !Array.isArray(value);

// Parse timestamp to Date
const parseDate = (timestamp?: number | string): Date | undefined => {
  if (!timestamp) return undefined;
  const date = new Date(Number(timestamp));
  return !Number.isNaN(date.getTime()) ? date : undefined;
};

// Parse filter value to timestamps
const parseFilterValue = (value: unknown): (string | number | undefined)[] =>
  Array.isArray(value)
    ? value.map(item =>
        typeof item === 'number' || typeof item === 'string' ? item : undefined
      )
    : typeof value === 'string' || typeof value === 'number'
    ? [value]
    : [];

export function DataTableDateFilter<TData>({
  column,
  title,
  multiple,
}: DataTableDateFilterProps<TData>) {
  // Get current filter value
  const filterValue = column.getFilterValue();

  // Convert filter value to selected dates
  const selectedDates: DateSelection = (() => {
    if (!filterValue) return multiple ? { from: undefined, to: undefined } : [];
    const timestamps = parseFilterValue(filterValue);
    if (multiple)
      return { from: parseDate(timestamps[0]), to: parseDate(timestamps[1]) };
    const date = parseDate(timestamps[0]);
    return date ? [date] : [];
  })();

  // Handle date selection
  const onSelect = (date?: Date | DateRange) => {
    if (!date) return column.setFilterValue(undefined);
    if (multiple && isDateRange(date)) {
      const { from, to } = date;
      column.setFilterValue(
        from || to ? [from?.getTime(), to?.getTime()] : undefined
      );
    } else if (!multiple && 'getTime' in date) {
      column.setFilterValue(date.getTime());
    }
  };

  // Clear filter
  const onReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    column.setFilterValue(undefined);
  };

  // Check if filter is active
  const hasValue = isDateRange(selectedDates)
    ? !!selectedDates.from || !!selectedDates.to
    : selectedDates.length > 0;

  // Format date range for display
  const formatRange = ({ from, to }: DateRange) =>
    !from && !to
      ? ''
      : from && to
      ? `${formatDate(from)} - ${formatDate(to)}`
      : formatDate(from ?? to);

  // Create display label
  const label = (
    <span className="flex items-center gap-2">
      <span>{title}</span>
      {hasValue && (
        <>
          <Separator orientation="vertical" className="mx-0.5 h-4" />
          <span>
            {isDateRange(selectedDates)
              ? formatRange(selectedDates)
              : formatDate(selectedDates[0] ?? 'Select date')}
          </span>
        </>
      )}
    </span>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {hasValue ? (
            <div
              role="button"
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              onClick={onReset}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <XCircle />
            </div>
          ) : (
            <CalendarIcon />
          )}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {multiple ? (
          <Calendar
            initialFocus
            mode="range"
            selected={
              isDateRange(selectedDates)
                ? selectedDates
                : { from: undefined, to: undefined }
            }
            onSelect={onSelect as (date?: DateRange) => void}
          />
        ) : (
          <Calendar
            initialFocus
            mode="single"
            selected={
              Array.isArray(selectedDates) ? selectedDates[0] : undefined
            }
            onSelect={onSelect as (date?: Date) => void}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
