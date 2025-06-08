'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/format';
import type { Column } from '@tanstack/react-table';
import { CalendarIcon, XCircleIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

interface DataTableDateFilterProps<TData> {
  column: Column<TData, unknown>;
  title: string;
  multiple?: boolean;
}

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
  // Get the current filter value from the column
  const filterValue = column.getFilterValue();

  // Convert filter value to selected dates for display
  const selectedDates = (() => {
    if (!filterValue)
      return multiple ? { from: undefined, to: undefined } : undefined;
    const timestamps = parseFilterValue(filterValue);

    if (multiple) {
      return { from: parseDate(timestamps[0]), to: parseDate(timestamps[1]) };
    } else {
      // For single date mode, use the start date for display
      const date = parseDate(timestamps[0]);
      return date;
    }
  })();

  // Handle date selection
  const onSelect = (date?: Date | DateRange) => {
    if (!date) return column.setFilterValue(undefined);

    if (
      multiple &&
      typeof date === 'object' &&
      !Array.isArray(date) &&
      'from' in date
    ) {
      // Multiple mode: handle DateRange
      const { from, to } = date as DateRange;
      column.setFilterValue(
        from || to ? [from?.getTime(), to?.getTime()] : undefined
      );
    } else if (!multiple && date instanceof Date) {
      // Single mode: create a DateRange covering the whole day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      column.setFilterValue([startOfDay.getTime(), endOfDay.getTime()]);
    }
  };

  // Clear filter
  const onReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    column.setFilterValue(undefined);
  };

  // Check if filter is active
  const hasValue = multiple
    ? selectedDates &&
      typeof selectedDates === 'object' &&
      !Array.isArray(selectedDates) &&
      'from' in selectedDates &&
      (selectedDates.from || selectedDates.to)
    : !!selectedDates;

  // Format display text
  const getDisplayText = () => {
    if (!hasValue) return '';

    if (
      multiple &&
      selectedDates &&
      typeof selectedDates === 'object' &&
      'from' in selectedDates
    ) {
      const { from, to } = selectedDates;
      if (!from && !to) return '';
      if (from && to) return `${formatDate(from)} - ${formatDate(to)}`;
      return formatDate(from ?? to!);
    }

    return selectedDates instanceof Date ? formatDate(selectedDates) : '';
  };

  // Create display label
  const label = (
    <span className="flex items-center gap-2">
      <span>{title}</span>
      {hasValue && (
        <>
          <Separator orientation="vertical" className="mx-0.5 h-4" />
          <span>{getDisplayText()}</span>
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
              <XCircleIcon />
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
              selectedDates &&
              typeof selectedDates === 'object' &&
              !Array.isArray(selectedDates) &&
              'from' in selectedDates
                ? (selectedDates as DateRange)
                : { from: undefined, to: undefined }
            }
            onSelect={onSelect as (date?: DateRange) => void}
          />
        ) : (
          <Calendar
            initialFocus
            mode="single"
            selected={selectedDates instanceof Date ? selectedDates : undefined}
            onSelect={onSelect as (date?: Date) => void}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
