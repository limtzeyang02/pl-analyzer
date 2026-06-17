<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { computed } from 'vue'

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: Column<any, any>
  title: string
}>()

const sortIcon = computed(() => {
  const sorted = props.column.getIsSorted()
  if (sorted === 'asc') return ArrowUpIcon
  if (sorted === 'desc') return ArrowDownIcon
  return ArrowUpDownIcon
})
</script>

<template>
  <Button
    variant="ghost"
    size="sm"
    class="-ml-3 h-8"
    @click="column.toggleSorting(column.getIsSorted() === 'asc')"
  >
    {{ title }}
    <component :is="sortIcon" class="ml-1 size-4" />
  </Button>
</template>
