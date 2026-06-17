<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = defineProps<{
  table: Table<TData>
}>()

const pageSizeOptions = ['10', '20', '50', '100']
</script>

<template>
  <div class="flex items-center justify-between px-2 py-3">
    <p class="text-sm text-muted-foreground">
      {{ table.getFilteredSelectedRowModel().rows.length }} of
      {{ table.getFilteredRowModel().rows.length }} row(s) selected.
    </p>

    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">Rows per page</span>
        <Select
          :model-value="String(table.getState().pagination.pageSize)"
          @update:model-value="(val) => table.setPageSize(Number(val))"
        >
          <SelectTrigger class="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="size in pageSizeOptions" :key="size" :value="size">
              {{ size }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <span class="text-sm text-muted-foreground">
        Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
      </span>

      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <ChevronLeftIcon class="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <ChevronRightIcon class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
