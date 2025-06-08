'use client';

import type { Option } from '@/types/data-table';
import type { Column } from '@tanstack/react-table';
import { CheckIcon, PlusCircleIcon, XCircleIcon } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
  multiple?: boolean;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  multiple,
}: DataTableFacetedFilterProps<TData, TValue>) {
  // State to manage the open/close state of the popover
  const [open, setOpen] = useState(false);
  // Get the current filter value from the column
  const columnFilterValue = column?.getFilterValue();
  //  Check if the column filter value is an array
  const isArray = Array.isArray(columnFilterValue);
  // Create a Set of selected values
  const selectedValues = new Set(isArray ? columnFilterValue : []);

  const handleItemSelect = (option: Option, isSelected: boolean) => {
    // Return early if no column
    if (!column) return;
    // Handle multiple selection
    if (multiple) {
      const newSelectedValues = new Set(selectedValues);
      // Remove selection if already selected
      if (isSelected) {
        newSelectedValues.delete(option.value);
      }
      // Else add selection
      else {
        newSelectedValues.add(option.value);
      }
      // Convert Set to Array and set the filter value
      const filterValues = Array.from(newSelectedValues);
      column.setFilterValue(filterValues.length ? filterValues : undefined);
    }
    // If not multiple, toggle the selection
    else {
      column.setFilterValue(isSelected ? undefined : [option.value]);
      setOpen(false);
    }
  };

  // Clear the filter
  const handleReset = () => {
    column?.setFilterValue(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="border-dashed">
          {selectedValues?.size > 0 ? (
            <div
              role="button"
              aria-label={`Clear ${title} filter`}
              tabIndex={0}
              onClick={e => {
                e.stopPropagation();
                handleReset();
              }}
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <XCircleIcon />
            </div>
          ) : (
            <PlusCircleIcon />
          )}
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-0.5" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal"
              >
                {selectedValues.size}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[12.5rem] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList className="max-h-full">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup className="max-h-[18.75rem] overflow-y-auto overflow-x-hidden">
              {options.map(option => {
                const isSelected = selectedValues.has(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleItemSelect(option, isSelected)}
                  >
                    <div
                      className={cn(
                        'flex size-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon />
                    </div>
                    {option.icon && <option.icon />}
                    <span className="truncate">{option.label}</span>
                    {option.count && (
                      <span className="ml-auto font-mono text-xs">
                        {option.count}
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleReset}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
