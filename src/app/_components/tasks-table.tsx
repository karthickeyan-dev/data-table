'use client';

import type { Task } from '@/db/schema';
import type { DataTableRowAction } from '@/types/data-table';

import { DataTable } from '@/components/data-table/data-table';
import { useDataTable } from '@/hooks/use-data-table';

import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { use, useState } from 'react';
import type {
  getEstimatedHoursRange,
  getTaskPriorityCounts,
  getTaskStatusCounts,
  getTasks,
} from '../_lib/queries';
import { getTasksTableColumns } from './tasks-table-columns';

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

  const { table, filterValues } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      columnPinning: { right: ['actions'] },
    },
  });

  console.log(filterValues);

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
