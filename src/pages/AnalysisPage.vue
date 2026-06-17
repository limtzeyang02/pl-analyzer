<script setup lang="ts">
import { computed, h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import type { ComparisonRecord, TransactionType } from '@/types'
import { useAnalysis } from '@/composables/useAnalysis'
import { formatPrice, formatWeight } from '@/utils/format'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const analysisPurchases = useAnalysis('purchases' as TransactionType)
const analysisSales = useAnalysis('sales' as TransactionType)

const comparisonColumns: ColumnDef<ComparisonRecord>[] = [
    {
        accessorKey: 'category',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Category' }),
        cell: ({ row }) => row.getValue('category'),
    },
    {
        accessorKey: 'weight1',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Weight (Range 1)' }),
        cell: ({ row }) => formatWeight(row.getValue<number>('weight1')),
    },
    {
        accessorKey: 'price1',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Price (Range 1)' }),
        cell: ({ row }) => formatPrice(row.getValue<number>('price1')),
    },
    {
        accessorKey: 'average_price1',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Avg Price (Range 1)' }),
        cell: ({ row }) => formatPrice(row.getValue<number>('average_price1')),
    },
    {
        accessorKey: 'weight2',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Weight (Range 2)' }),
        cell: ({ row }) => formatWeight(row.getValue<number>('weight2')),
    },
    {
        accessorKey: 'price2',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Price (Range 2)' }),
        cell: ({ row }) => formatPrice(row.getValue<number>('price2')),
    },
    {
        accessorKey: 'average_price2',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Avg Price (Range 2)' }),
        cell: ({ row }) => formatPrice(row.getValue<number>('average_price2')),
    },
]

function buildWeightChartData(records: ComparisonRecord[]) {
    return {
        labels: records.map(r => r.category),
        datasets: [
            { label: 'Range 1', data: records.map(r => r.weight1) },
            { label: 'Range 2', data: records.map(r => r.weight2) },
        ],
    }
}

function buildPriceChartData(records: ComparisonRecord[]) {
    return {
        labels: records.map(r => r.category),
        datasets: [
            { label: 'Range 1', data: records.map(r => r.price1) },
            { label: 'Range 2', data: records.map(r => r.price2) },
        ],
    }
}

const purchasesWeightChart = computed(() =>
    buildWeightChartData(analysisPurchases.comparisonData.value)
)
const purchasesPriceChart = computed(() =>
    buildPriceChartData(analysisPurchases.comparisonData.value)
)
const salesWeightChart = computed(() =>
    buildWeightChartData(analysisSales.comparisonData.value)
)
const salesPriceChart = computed(() =>
    buildPriceChartData(analysisSales.comparisonData.value)
)

function toMonthInput(d: Date | null): string {
    if (!d) return ''
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

function fromMonthInput(s: string): Date | null {
    if (!s) return null
    const [year, month] = s.split('-').map(Number)
    return new Date(year, month - 1, 1)
}
</script>

<template>
    <Tabs default-value="purchases" class="p-4">
        <TabsList>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
            <div class="flex flex-col gap-6 pt-4">
                <!-- Date range pickers -->
                <div class="flex flex-wrap items-center gap-6">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">Range 1:</span>
                        <input
                            type="month"
                            :value="toMonthInput(analysisPurchases.range1.value[0])"
                            :min="toMonthInput(analysisPurchases.period.value[0])"
                            :max="toMonthInput(analysisPurchases.period.value[1])"
                            class="rounded border px-2 py-1 text-sm"
                            @change="(e) => {
                                const v = (e.target as HTMLInputElement).value
                                analysisPurchases.range1.value = [fromMonthInput(v), analysisPurchases.range1.value[1]]
                            }"
                        />
                        <span class="text-sm text-muted-foreground">to</span>
                        <input
                            type="month"
                            :value="toMonthInput(analysisPurchases.range1.value[1])"
                            :min="toMonthInput(analysisPurchases.period.value[0])"
                            :max="toMonthInput(analysisPurchases.period.value[1])"
                            class="rounded border px-2 py-1 text-sm"
                            @change="(e) => {
                                const v = (e.target as HTMLInputElement).value
                                analysisPurchases.range1.value = [analysisPurchases.range1.value[0], fromMonthInput(v)]
                            }"
                        />
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">Range 2:</span>
                        <input
                            type="month"
                            :value="toMonthInput(analysisPurchases.range2.value[0])"
                            :min="toMonthInput(analysisPurchases.period.value[0])"
                            :max="toMonthInput(analysisPurchases.period.value[1])"
                            class="rounded border px-2 py-1 text-sm"
                            @change="(e) => {
                                const v = (e.target as HTMLInputElement).value
                                analysisPurchases.range2.value = [fromMonthInput(v), analysisPurchases.range2.value[1]]
                            }"
                        />
                        <span class="text-sm text-muted-foreground">to</span>
                        <input
                            type="month"
                            :value="toMonthInput(analysisPurchases.range2.value[1])"
                            :min="toMonthInput(analysisPurchases.period.value[0])"
                            :max="toMonthInput(analysisPurchases.period.value[1])"
                            class="rounded border px-2 py-1 text-sm"
                            @change="(e) => {
                                const v = (e.target as HTMLInputElement).value
                                analysisPurchases.range2.value = [analysisPurchases.range2.value[0], fromMonthInput(v)]
                            }"
                        />
                    </div>
                </div>

                <!-- Comparison table -->
                <DataTable
                    :columns="comparisonColumns"
                    :data="analysisPurchases.comparisonData.value"
                    :loading="analysisPurchases.isLoading.value"
                    title="Purchases Comparison"
                />

                <!-- Chart panels -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div class="flex flex-col gap-2 rounded-md border p-4">
                        <h3 class="text-sm font-semibold">Weight by Category</h3>
                        <DoughnutChart :data="purchasesWeightChart" />
                    </div>
                    <div class="flex flex-col gap-2 rounded-md border p-4">
                        <h3 class="text-sm font-semibold">Price by Category</h3>
                        <LineChart :data="purchasesPriceChart" />
                    </div>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="sales">
            <div class="flex flex-col gap-6 pt-4">
                <!-- Date range pickers -->
                <div class="flex flex-wrap items-center gap-6">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">Range 1:</span>
                        <input
                            type="month"
                            :value="toMonthInput(analysisSales.range1.value[0])"
                            :min="toMonthInput(analysisSales.period.value[0])"
                            :max="toMonthInput(analysisSales.period.value[1])"
                            class="rounded border px-2 py-1 text-sm"
                            @change="(e) => {
                                const v = (e.target as HTMLInputElement).value
                                analysisSales.range1.value = [fromMonthInput(v), analysisSales.range1.value[1]]
                            }"
                        />
                        <span class="text-sm text-muted-foreground">to</span>
                        <input
                            type="month"
                            :value="toMonthInput(analysisSales.range1.value[1])"
                            :min="toMonthInput(analysisSales.period.value[0])"
                            :max="toMonthInput(analysisSales.period.value[1])"
                            class="rounded border px-2 py-1 text-sm"
                            @change="(e) => {
                                const v = (e.target as HTMLInputElement).value
                                analysisSales.range1.value = [analysisSales.range1.value[0], fromMonthInput(v)]
                            }"
                        />
                    </div>

                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium">Range 2:</span>
                        <input
                            type="month"
                            :value="toMonthInput(analysisSales.range2.value[0])"
                            :min="toMonthInput(analysisSales.period.value[0])"
                            :max="toMonthInput(analysisSales.period.value[1])"
                            class="rounded border px-2 py-1 text-sm"
                            @change="(e) => {
                                const v = (e.target as HTMLInputElement).value
                                analysisSales.range2.value = [fromMonthInput(v), analysisSales.range2.value[1]]
                            }"
                        />
                        <span class="text-sm text-muted-foreground">to</span>
                        <input
                            type="month"
                            :value="toMonthInput(analysisSales.range2.value[1])"
                            :min="toMonthInput(analysisSales.period.value[0])"
                            :max="toMonthInput(analysisSales.period.value[1])"
                            class="rounded border px-2 py-1 text-sm"
                            @change="(e) => {
                                const v = (e.target as HTMLInputElement).value
                                analysisSales.range2.value = [analysisSales.range2.value[0], fromMonthInput(v)]
                            }"
                        />
                    </div>
                </div>

                <!-- Comparison table -->
                <DataTable
                    :columns="comparisonColumns"
                    :data="analysisSales.comparisonData.value"
                    :loading="analysisSales.isLoading.value"
                    title="Sales Comparison"
                />

                <!-- Chart panels -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div class="flex flex-col gap-2 rounded-md border p-4">
                        <h3 class="text-sm font-semibold">Weight by Category</h3>
                        <DoughnutChart :data="salesWeightChart" />
                    </div>
                    <div class="flex flex-col gap-2 rounded-md border p-4">
                        <h3 class="text-sm font-semibold">Price by Category</h3>
                        <LineChart :data="salesPriceChart" />
                    </div>
                </div>
            </div>
        </TabsContent>
    </Tabs>
</template>
