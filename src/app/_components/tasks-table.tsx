'use client';

import type { Task } from '@/db/schema';
import type { DataTableRowAction } from '@/types/data-table';

import { DataTable } from '@/components/data-table/data-table';
import { useDataTable } from '@/hooks/use-data-table';

import { DataTableSortList } from '@/components/data-table/data-table-sort-list';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import type {
  getEstimatedHoursRange,
  getTaskPriorityCounts,
  getTaskStatusCounts,
  getTasks,
} from '../_lib/queries';
import { getTasksTableColumns } from './tasks-table-columns';
import { use, useState } from 'react';

interface TasksTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getTasks>>,
      Awaited<ReturnType<typeof getTaskStatusCounts>>,
      Awaited<ReturnType<typeof getTaskPriorityCounts>>,
      Awaited<ReturnType<typeof getEstimatedHoursRange>>
    ]
  >;
}

export function TasksTable({ promises }: TasksTableProps) {
  // const { enableAdvancedFilter, filterFlag } = useFeatureFlags();

  const [
    { data, pageCount },
    statusCounts,
    priorityCounts,
    estimatedHoursRange,
  ] = use(promises);

  const [rowAction, setRowAction] = useState<DataTableRowAction<Task> | null>(
    null
  );

  const columns = getTasksTableColumns({
    statusCounts,
    priorityCounts,
    estimatedHoursRange,
    setRowAction,
  });

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      columnPinning: { right: ['actions'] },
    },
    getRowId: row => row.id,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
