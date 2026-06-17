<script setup lang="ts">
import { computed, h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import type { OverviewRecord } from '@/types'
import { useOverview } from '@/composables/useOverview'
import {
    formatPrice,
    formatWeight,
    formatDateLabel,
    plColorClass,
} from '@/utils/format'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Button } from '@/components/ui/button'
import { DownloadIcon } from '@lucide/vue'
import Toolbar from '@/components/Toolbar.vue'

const { interval, period, range, data, breakdownData, isLoading } = useOverview()

// Derive Date objects from range refs for date input binding
const rangeStart = computed({
    get: () => range.value[0] ? toDateInputValue(range.value[0]) : '',
    set: (val: string) => {
        const d = val ? new Date(val) : null
        range.value = [d, range.value[1]]
    },
})

const rangeEnd = computed({
    get: () => range.value[1] ? toDateInputValue(range.value[1]) : '',
    set: (val: string) => {
        const d = val ? new Date(val) : null
        range.value = [range.value[0], d]
    },
})

function toDateInputValue(date: Date): string {
    // YYYY-MM format for month input; YYYY for year input
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    return interval.value === 'Monthly' ? `${y}-${m}` : String(y)
}

function periodDateRecord(record: OverviewRecord): Date {
    // Build a Date from the record's year (and optional month) for label formatting
    return new Date(record.year, (record.month ?? 1) - 1, 1)
}

const columns = computed<ColumnDef<OverviewRecord>[]>(() => [
    {
        id: 'period',
        accessorFn: (row) => periodDateRecord(row),
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Period' }),
        cell: ({ row }) => formatDateLabel(periodDateRecord(row.original), interval.value),
        sortingFn: (a, b) => {
            const ad = periodDateRecord(a.original)
            const bd = periodDateRecord(b.original)
            return ad.getTime() - bd.getTime()
        },
    },
    {
        accessorKey: 'buy_weight',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Buy Weight' }),
        cell: ({ row }) => formatWeight(row.original.buy_weight),
    },
    {
        accessorKey: 'buy_price',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Buy Price' }),
        cell: ({ row }) => formatPrice(row.original.buy_price),
    },
    {
        accessorKey: 'buy_average_price',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Buy Avg Price' }),
        cell: ({ row }) => formatPrice(row.original.buy_average_price),
    },
    {
        accessorKey: 'sell_weight',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sell Weight' }),
        cell: ({ row }) => formatWeight(row.original.sell_weight),
    },
    {
        accessorKey: 'sell_price',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sell Price' }),
        cell: ({ row }) => formatPrice(row.original.sell_price),
    },
    {
        accessorKey: 'sell_average_price',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Sell Avg Price' }),
        cell: ({ row }) => formatPrice(row.original.sell_average_price),
    },
    {
        accessorKey: 'stock_weight',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Stock' }),
        cell: ({ row }) => formatWeight(row.original.stock_weight),
    },
    {
        accessorKey: 'salary',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Salary' }),
        cell: ({ row }) => formatPrice(row.original.salary),
    },
    {
        accessorKey: 'expenses',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Expenses' }),
        cell: ({ row }) => formatPrice(row.original.expenses),
    },
    {
        accessorKey: 'petty_cash',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Petty Cash' }),
        cell: ({ row }) => formatPrice(row.original.petty_cash),
    },
    {
        accessorKey: 'profit_loss',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'P&L' }),
        cell: ({ row }) => {
            const val = row.original.profit_loss
            const colorClass = plColorClass(val)
            return h('span', { class: colorClass ?? undefined }, formatPrice(val))
        },
    },
])

// Doughnut chart: one slice per category, data = buy_weight
const doughnutChartData = computed(() => ({
    labels: breakdownData.value.map((r) => r.category),
    datasets: [
        {
            data: breakdownData.value.map((r) => r.weight),
        },
    ],
}))

// Line chart: one dataset per category, x-axis = categories, y-axis = weight
// Since breakdownData is a flat per-category summary (not time-series), each
// category becomes its own dataset with a single point.
const lineChartData = computed(() => ({
    labels: breakdownData.value.map((r) => r.category),
    datasets: breakdownData.value.map((r) => ({
        label: r.category,
        data: [r.weight],
    })),
}))
</script>

<template>
    <div class="flex flex-col gap-4">
        <Toolbar>
            <template #start>
                <h2 class="text-lg font-semibold">Overview</h2>
            </template>
            <template #center>
                <ToggleGroup
                    v-model="interval"
                    type="single"
                    variant="outline"
                >
                    <ToggleGroupItem value="Monthly">Monthly</ToggleGroupItem>
                    <ToggleGroupItem value="Yearly">Yearly</ToggleGroupItem>
                </ToggleGroup>
            </template>
            <template #end>
                <div class="flex items-center gap-2">
                    <input
                        v-model="rangeStart"
                        :type="interval === 'Monthly' ? 'month' : 'number'"
                        :min="period[0] ? toDateInputValue(period[0]) : undefined"
                        :max="period[1] ? toDateInputValue(period[1]) : undefined"
                        class="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <span class="text-muted-foreground">—</span>
                    <input
                        v-model="rangeEnd"
                        :type="interval === 'Monthly' ? 'month' : 'number'"
                        :min="period[0] ? toDateInputValue(period[0]) : undefined"
                        :max="period[1] ? toDateInputValue(period[1]) : undefined"
                        class="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button variant="outline" size="sm">
                        <DownloadIcon class="mr-2 size-4" />
                        Export
                    </Button>
                </div>
            </template>
        </Toolbar>

        <DataTable
            :columns="columns"
            :data="data"
            :loading="isLoading"
            title="Overview"
            export-filename="overview.xlsx"
        />

        <section class="flex flex-col gap-4">
            <h3 class="text-base font-semibold">Breakdown</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div class="flex items-center justify-center rounded-md border p-4">
                    <DoughnutChart :data="doughnutChartData" />
                </div>
                <div class="flex items-center justify-center rounded-md border p-4">
                    <LineChart :data="lineChartData" />
                </div>
            </div>
        </section>
    </div>
</template>
