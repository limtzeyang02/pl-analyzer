<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed } from 'vue'
import { DownloadIcon, SearchIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DataTableColumnToggle from './DataTableColumnToggle.vue'

const props = defineProps<{
  table: Table<TData>
}>()

const emit = defineEmits<{
  export: []
}>()

const globalFilter = computed({
  get: () => props.table.getState().globalFilter ?? '',
  set: (val: string) => props.table.setGlobalFilter(val),
})
</script>

<template>
  <div class="flex items-center justify-between gap-2 py-3">
    <div class="relative max-w-xs flex-1">
      <SearchIcon class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        v-model="globalFilter"
        placeholder="Search..."
        class="pl-8"
      />
    </div>

    <div class="flex items-center gap-2">
      <DataTableColumnToggle :table="table" />
      <Button variant="outline" size="sm" @click="emit('export')">
        <DownloadIcon class="mr-2 size-4" />
        Export
      </Button>
    </div>
  </div>
</template>
