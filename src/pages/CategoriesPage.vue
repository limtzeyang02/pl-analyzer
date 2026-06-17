<script setup lang="ts">
import { shallowRef, computed, h } from 'vue'
import type { ColumnDef, RowSelectionState } from '@tanstack/vue-table'
import { PlusIcon, TrashIcon } from '@lucide/vue'
import { useCategories } from '@/composables/useCategories'
import { useToast } from '@/composables/useToast'
import { useConfirmDelete } from '@/composables/useConfirmDelete'
import DataTable from '@/components/data-table/DataTable.vue'
import DataTableColumnHeader from '@/components/data-table/DataTableColumnHeader.vue'
import RecordDialog from '@/components/dialogs/RecordDialog.vue'
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
import Toolbar from '@/components/Toolbar.vue'
import type { Category, FieldDef } from '@/types'

const toast = useToast()
const { data, isLoading, showAddDialog, add, edit, remove } = useCategories()

// Dialog state
const showEditDialog = shallowRef(false)
const editingRecord = shallowRef<Category | null>(null)

// Row selection for the DataTable (RowSelectionState = Record<string, boolean>)
const rowSelection = shallowRef<RowSelectionState>({})

// Derive selected Category objects from rowSelection
const selectedCategories = computed(() =>
    data.value.filter(row => rowSelection.value[String(row.id)])
)

const confirmDelete = useConfirmDelete({
    message: 'This will permanently delete the selected categories.',
    onConfirm: async () => {
        await remove(selectedCategories.value.map(r => r.id))
        rowSelection.value = {}
        toast.success('Categories deleted.')
    },
})

const fieldDefs: FieldDef[] = [
    { id: 'name', label: 'Name', type: 'text', required: true },
    {
        id: 'ferous',
        label: 'Type',
        type: 'select',
        options: [
            { label: 'Ferrous', value: true },
            { label: 'Non-ferrous', value: false },
        ],
    },
]

const columns: ColumnDef<Category>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Name' }),
        enableSorting: true,
    },
    {
        accessorKey: 'ferous',
        header: 'Type',
        cell: ({ row }) => row.original.ferous ? 'Ferrous' : 'Non-ferrous',
        enableSorting: false,
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => h('div', { class: 'flex items-center gap-1' }, [
            h(Button, {
                variant: 'ghost',
                size: 'sm',
                onClick: () => openEdit(row.original),
            }, () => 'Edit'),
            h(Button, {
                variant: 'ghost',
                size: 'sm',
                onClick: () => {
                    rowSelection.value = { [String(row.original.id)]: true }
                    confirmDelete.open()
                },
            }, () => h(TrashIcon, { class: 'size-4' })),
        ]),
        enableSorting: false,
        enableHiding: false,
    },
]

function openEdit(record: Category) {
    editingRecord.value = record
    showEditDialog.value = true
}

async function handleAdd(values: Record<string, unknown>) {
    await add({
        name: values.name as string,
        ferous: values.ferous === 'true' || values.ferous === true,
    })
    toast.success('Category added.')
}

async function handleEdit(values: Record<string, unknown>) {
    if (!editingRecord.value) return
    await edit(editingRecord.value.id, {
        name: values.name as string,
        ferous: values.ferous === 'true' || values.ferous === true,
    })
    toast.success('Category updated.')
}
</script>

<template>
    <div class="flex flex-col gap-4 p-4">
        <Toolbar>
            <template #start>
                <span class="text-base font-semibold">Categories</span>
            </template>
            <template #end>
                <Button
                    v-if="selectedCategories.length > 0"
                    variant="destructive"
                    size="sm"
                    @click="confirmDelete.open()"
                >
                    <TrashIcon class="size-4" />
                    Delete ({{ selectedCategories.length }})
                </Button>
                <Button size="sm" @click="showAddDialog = true">
                    <PlusIcon class="size-4" />
                    Add
                </Button>
            </template>
        </Toolbar>

        <DataTable
            :columns="columns"
            :data="data"
            :loading="isLoading"
            :get-row-id="(row) => String(row.id)"
            v-model:selection="rowSelection"
        />

        <!-- Add dialog -->
        <RecordDialog
            v-model:open="showAddDialog"
            title="Add Category"
            :fields="fieldDefs"
            @submit="handleAdd"
        />

        <!-- Edit dialog -->
        <RecordDialog
            v-model:open="showEditDialog"
            title="Edit Category"
            :fields="fieldDefs"
            :initial-values="editingRecord ? (editingRecord as unknown as Record<string, unknown>) : undefined"
            @submit="handleEdit"
        />

        <!-- Confirm delete alert dialog -->
        <AlertDialog :open="confirmDelete.isOpen.value" @update:open="(val) => { if (!val) confirmDelete.cancel() }">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete categories?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the selected
                        {{ selectedCategories.length === 1 ? 'category' : 'categories' }}.
                        This action cannot be undone.
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
