<script setup lang="ts">
    import { h } from 'vue'
    import type { ColumnDef } from '@tanstack/vue-table'
    import type { CashFlow, FieldDef, ImportFieldDef } from '@/types'
    import { useCashFlow } from '@/composables/useCashFlow'
    import { useConfirmDelete } from '@/composables/useConfirmDelete'
    import { useToast } from '@/composables/useToast'
    import { formatPrice, formatMonth, plColorClass } from '@/utils/format'
    import DataTable from '@/components/data-table/DataTable.vue'
    import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
    import RecordDialog from '@/components/dialogs/RecordDialog.vue'
    import ImportDialog from '@/components/dialogs/ImportDialog.vue'
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from '@/components/ui/alert-dialog'
    import { Button } from '@/components/ui/button'
    import { PlusIcon, UploadIcon } from '@lucide/vue'
    import Toolbar from '@/components/Toolbar.vue'

    const { data, selection, isLoading, showAddDialog, showImportDialog, add, remove, importRecords } = useCashFlow()
    const toast = useToast()

    const confirmDelete = useConfirmDelete({
        message: 'Are you sure you want to delete the selected cash flow records?',
        onConfirm: async () => {
            const dates = data.value
                .filter((_, i) => selection.value[String(i)] === true)
                .map(r => r.date)
            await remove(dates)
            toast.success('Cash flow records deleted successfully.')
        },
    })

    const columns: ColumnDef<CashFlow>[] = [
        {
            accessorKey: 'year',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Year' }),
            cell: ({ row }) => row.getValue('year'),
        },
        {
            accessorKey: 'month',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Month' }),
            cell: ({ row }) => formatMonth(row.getValue('month')),
        },
        {
            accessorKey: 'salary',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Salary' }),
            cell: ({ row }) => formatPrice(row.getValue('salary')),
        },
        {
            accessorKey: 'expenses',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Expenses' }),
            cell: ({ row }) => formatPrice(row.getValue('expenses')),
        },
        {
            accessorKey: 'petty_cash',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Petty Cash' }),
            cell: ({ row }) => formatPrice(row.getValue('petty_cash')),
        },
        {
            accessorKey: 'profit_loss',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Profit / Loss' }),
            cell: ({ row }) => {
                const val: number = row.getValue('profit_loss')
                return h('span', { class: plColorClass(val) }, formatPrice(val))
            },
        },
    ]

    const fieldDefs: FieldDef[] = [
        { id: 'year',      label: 'Year',       type: 'year',     required: true, min: 2000, max: 2100 },
        { id: 'month',     label: 'Month',      type: 'month',    required: true },
        { id: 'salary',    label: 'Salary',     type: 'currency', min: 0 },
        { id: 'expenses',  label: 'Expenses',   type: 'currency', min: 0 },
        { id: 'petty_cash', label: 'Petty Cash', type: 'currency', min: 0 },
    ]

    const importFieldDefs: ImportFieldDef[] = [
        { name: 'year',      label: 'Year',       type: 'year',    mapping: null },
        { name: 'month',     label: 'Month',      type: 'month',   mapping: null },
        { name: 'salary',    label: 'Salary',     type: 'numeric', mapping: null },
        { name: 'expenses',  label: 'Expenses',   type: 'numeric', mapping: null },
        { name: 'petty_cash', label: 'Petty Cash', type: 'numeric', mapping: null },
    ]

    async function handleAdd(values: Record<string, unknown>) {
        const year = values.year as number
        const month = values.month as number
        const date = new Date(year, month - 1, 1)
        await add({
            date,
            year,
            month,
            salary:    values.salary    as number,
            expenses:  values.expenses  as number,
            petty_cash: values.petty_cash as number,
        })
        toast.success('Cash flow record added successfully.')
    }

    async function handleImport(records: Record<string, unknown>[]) {
        await importRecords(records)
        toast.success('Cash flow records imported successfully.')
    }
</script>

<template>
    <div class="flex flex-col gap-4">
        <Toolbar>
            <template #start>
                <span class="text-base font-semibold">Cash Flow</span>
            </template>
            <template #end>
                <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm" @click="showImportDialog = true">
                        <UploadIcon class="mr-1.5 size-4" />
                        Import
                    </Button>
                    <Button size="sm" @click="showAddDialog = true">
                        <PlusIcon class="mr-1.5 size-4" />
                        Add
                    </Button>
                </div>
            </template>
        </Toolbar>

        <DataTable
            :columns="columns"
            :data="data"
            :loading="isLoading"
            v-model:selection="selection"
            export-filename="Cash Flow"
        />

        <RecordDialog
            v-model:open="showAddDialog"
            title="Add Cash Flow"
            :fields="fieldDefs"
            @submit="handleAdd"
        />

        <ImportDialog
            v-model:open="showImportDialog"
            title="Import Cash Flow"
            :fields="importFieldDefs"
            worksheet="Cash Flow"
            @submit="handleImport"
        />

        <AlertDialog :open="confirmDelete.isOpen.value" @update:open="val => { if (!val) confirmDelete.cancel() }">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Cash Flow</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the selected cash flow records? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="confirmDelete.cancel()">Cancel</AlertDialogCancel>
                    <AlertDialogAction @click="confirmDelete.confirm()">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>
