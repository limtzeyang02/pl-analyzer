<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { computed } from 'vue'
import { SlidersHorizontalIcon } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const props = defineProps<{
  table: Table<TData>
}>()

const toggleableColumns = computed(() =>
  props.table.getAllColumns().filter(col => col.getCanHide()),
)
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm">
        <SlidersHorizontalIcon class="mr-2 size-4" />
        View
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-48 p-3" align="end">
      <p class="mb-2 text-xs font-medium text-muted-foreground">Toggle columns</p>
      <div class="space-y-1">
        <label
          v-for="col in toggleableColumns"
          :key="col.id"
          class="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-muted"
        >
          <input
            type="checkbox"
            :checked="col.getIsVisible()"
            @change="col.toggleVisibility(!col.getIsVisible())"
          />
          {{ col.id }}
        </label>
      </div>
    </PopoverContent>
  </Popover>
</template>
