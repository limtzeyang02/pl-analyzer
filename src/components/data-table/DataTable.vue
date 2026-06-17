<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { ColumnDef, RowSelectionState, SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/vue-table'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  FlexRender,
} from '@tanstack/vue-table'
import { computed, h, shallowRef } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { exportXLSX } from '@/utils/exports'
import DataTableToolbar from './DataTableToolbar.vue'
import DataTablePagination from './DataTablePagination.vue'

const props = withDefaults(defineProps<{
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  getRowId?: (row: T) => string
  exportFilename?: string
  title?: string
}>(), {
  loading: false,
  exportFilename: 'export',
})

const selection = defineModel<RowSelectionState>('selection', { default: () => ({}) })

const sorting = shallowRef<SortingState>([])
const columnFilters = shallowRef<ColumnFiltersState>([])
const columnVisibility = shallowRef<VisibilityState>({})

const checkboxColumn: ColumnDef<T> = {
  id: '__select__',
  header: ({ table }) => h('input', {
    type: 'checkbox',
    checked: table.getIsAllPageRowsSelected(),
    indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
    onChange: (e: Event) => table.toggleAllPageRowsSelected((e.target as HTMLInputElement).checked),
    class: 'cursor-pointer',
  }),
  cell: ({ row }) => h('input', {
    type: 'checkbox',
    checked: row.getIsSelected(),
    disabled: !row.getCanSelect(),
    onChange: (e: Event) => row.toggleSelected((e.target as HTMLInputElement).checked),
    class: 'cursor-pointer',
  }),
  enableSorting: false,
  enableHiding: false,
}

const allColumns = computed<ColumnDef<T>[]>(() => [checkboxColumn, ...props.columns])

const table = useVueTable({
  get data() { return props.data },
  get columns() { return allColumns.value },
  ...(props.getRowId ? { getRowId: props.getRowId } : {}),
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return selection.value },
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  onColumnFiltersChange: (updater) => {
    columnFilters.value = typeof updater === 'function' ? updater(columnFilters.value) : updater
  },
  onColumnVisibilityChange: (updater) => {
    columnVisibility.value = typeof updater === 'function' ? updater(columnVisibility.value) : updater
  },
  onRowSelectionChange: (updater) => {
    selection.value = typeof updater === 'function' ? updater(selection.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})

async function handleExport() {
  const rows = table.getFilteredRowModel().rows.map(row => row.original)
  await exportXLSX(rows, props.exportFilename)
}
</script>

<template>
  <div class="flex flex-col gap-0">
    <div v-if="title" class="text-base font-semibold">{{ title }}</div>

    <DataTableToolbar :table="table" @export="handleExport" />

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="{ width: header.getSize() !== 150 ? `${header.getSize()}px` : undefined }"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 5" :key="`skeleton-${i}`">
              <TableCell
                v-for="col in allColumns"
                :key="col.id ?? String(col)"
                class="animate-pulse"
              >
                <div class="h-4 rounded bg-muted" />
              </TableCell>
            </TableRow>
          </template>

          <template v-else-if="table.getRowModel().rows.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>

          <template v-else>
            <TableRow>
              <TableCell :colspan="allColumns.length" class="h-24 text-center text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination :table="table" />
  </div>
</template>
