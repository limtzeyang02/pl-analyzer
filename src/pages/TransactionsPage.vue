<script setup lang="ts">
import { computed, h, ref, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ColumnDef, RowSelectionState } from '@tanstack/vue-table'
import { PlusIcon, UploadIcon } from '@lucide/vue'
import type { FieldDef, ImportFieldDef, Item, Transaction, TransactionType } from '@/types'
import { useTransactions } from '@/composables/useTransactions'
import { getItems } from '@/service/items'
import { formatDateShort, formatWeight, formatPrice } from '@/utils/format'
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
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

const props = defineProps<{
    type: TransactionType
}>()

const router = useRouter()

const { data, isLoading, showAddDialog, showImportDialog, load, add, remove, importRecords } =
    useTransactions(props.type)

// DataTable uses TanStack's RowSelectionState (Record<string, boolean>), keyed by row id.
// We derive selected Transaction objects from it when needed.
const rowSelection = ref<RowSelectionState>({})

// Items for the select field in RecordDialog
const items = ref<Item[]>([])

async function loadItems() {
    items.value = await getItems(props.type)
}

// Watch type to reload items when navigating between tabs.
// load() is called here too so data refreshes with the current type param
// (composable load is bound to the initial type; navigation reloads at least the items list).
watch(
    () => props.type,
    () => {
        rowSelection.value = {}
        loadItems()
        load()
    },
    { immediate: true }
)

// --- Tabs navigation ---

const activeTab = computed(() => props.type)

function onTabChange(value: string | number) {
    router.push(`/transactions/${String(value)}`)
}

// --- Column definitions ---

const columns = computed<ColumnDef<Transaction>[]>(() => [
    {
        accessorKey: 'date',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Date' }),
        cell: ({ row }) => formatDateShort(row.original.date),
    },
    {
        accessorKey: 'item',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Item' }),
        cell: ({ row }) => row.original.item ?? '',
    },
    {
        accessorKey: 'category',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Category' }),
        cell: ({ row }) => row.original.category ?? '',
    },
    {
        accessorKey: 'weight',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Weight' }),
        cell: ({ row }) => formatWeight(row.original.weight),
    },
    {
        accessorKey: 'price',
        header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Price' }),
        cell: ({ row }) => formatPrice(row.original.price),
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) =>
            h(
                Button,
                {
                    variant: 'destructive',
                    size: 'sm',
                    onClick: () => openDeleteDialog([row.original]),
                },
                () => 'Delete'
            ),
        enableSorting: false,
        enableHiding: false,
    },
])

// --- FieldDefs for RecordDialog ---

const fieldDefs = computed<FieldDef[]>(() => [
    { id: 'date', label: 'Date', type: 'date', required: true },
    {
        id: 'item_id',
        label: 'Item',
        type: 'select',
        required: true,
        options: items.value.map(item => ({ label: item.description, value: item.id })),
    },
    { id: 'weight', label: 'Weight', type: 'weight', required: true, min: 0 },
    { id: 'price', label: 'Price', type: 'currency', required: true, min: 0 },
])

// --- ImportFieldDefs for ImportDialog ---

const importFieldDefs: ImportFieldDef[] = [
    { name: 'date',     label: 'Date',     type: 'date',    mapping: null },
    { name: 'item',     label: 'Item',     type: 'string',  mapping: null },
    { name: 'category', label: 'Category', type: 'string',  mapping: null },
    { name: 'weight',   label: 'Weight',   type: 'numeric', mapping: null },
    { name: 'price',    label: 'Price',    type: 'numeric', mapping: null },
]

// --- Add ---

async function handleAdd(values: Record<string, unknown>) {
    // RecordDialog stores the date field as an ISO string (YYYY-MM-DD) from input[type=date].
    // Convert it to Date before passing to the service.
    const dateRaw = values.date
    const date = typeof dateRaw === 'string' && dateRaw
        ? new Date(dateRaw)
        : (dateRaw as Date)

    await add({
        date,
        item_id: Number(values.item_id),
        weight: Number(values.weight),
        price: Number(values.price),
    })
}

// --- Import ---

async function handleImport(records: Record<string, unknown>[]) {
    await importRecords(records)
    showImportDialog.value = false
}

// --- Delete (AlertDialog) ---

const showDeleteDialog = shallowRef(false)
const pendingDelete = ref<Transaction[]>([])

function openDeleteDialog(rows: Transaction[]) {
    pendingDelete.value = rows
    showDeleteDialog.value = true
}

function openSelectionDeleteDialog() {
    openDeleteDialog(
        Object.keys(rowSelection.value)
            .map(id => data.value.find(row => String(row.id) === id))
            .filter((row): row is Transaction => row !== undefined)
    )
}

async function confirmDelete() {
    const ids = pendingDelete.value
        .map(row => row.id)
        .filter((id): id is number => id !== undefined)
    await remove(ids)
    pendingDelete.value = []
    showDeleteDialog.value = false
}

const hasSelection = computed(() => Object.keys(rowSelection.value).length > 0)

const typeLabel = computed(() =>
    props.type === 'purchases' ? 'Purchases' : 'Sales'
)
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Tab switcher -->
        <Tabs :model-value="activeTab" @update:model-value="onTabChange">
            <TabsList>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>
        </Tabs>

        <!-- Toolbar -->
        <div class="flex items-center gap-2">
            <Button size="sm" @click="showAddDialog = true">
                <PlusIcon />
                Add
            </Button>
            <Button size="sm" variant="outline" @click="showImportDialog = true">
                <UploadIcon />
                Import
            </Button>
            <Button
                size="sm"
                variant="destructive"
                :disabled="!hasSelection"
                @click="openSelectionDeleteDialog"
            >
                Delete Selected
            </Button>
        </div>

        <!-- Data table -->
        <DataTable
            v-model:selection="rowSelection"
            :columns="columns"
            :data="data"
            :loading="isLoading"
            :get-row-id="(row) => String(row.id)"
            :title="typeLabel"
            :export-filename="typeLabel"
        />

        <!-- Add dialog -->
        <RecordDialog
            v-model:open="showAddDialog"
            :title="`Add ${typeLabel.slice(0, -1)}`"
            :fields="fieldDefs"
            @submit="handleAdd"
        />

        <!-- Import dialog -->
        <ImportDialog
            v-model:open="showImportDialog"
            :title="`Import ${typeLabel}`"
            :fields="importFieldDefs"
            worksheet="Sheet1"
            @submit="handleImport"
        />

        <!-- Delete confirmation -->
        <AlertDialog v-model:open="showDeleteDialog">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                    <AlertDialogDescription>
                        Delete {{ pendingDelete.length }}
                        {{ pendingDelete.length === 1 ? typeLabel.slice(0, -1).toLowerCase() : typeLabel.toLowerCase() }}?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel @click="showDeleteDialog = false">Cancel</AlertDialogCancel>
                    <AlertDialogAction @click="confirmDelete">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>
