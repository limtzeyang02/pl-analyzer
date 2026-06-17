<script setup lang="ts">
import { computed, h, onMounted, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ColumnDef, RowSelectionState } from '@tanstack/vue-table'
import type { TransactionType, Item, Category, FieldDef } from '@/types'
import { useItems } from '@/composables/useItems'
import { getCategories } from '@/service/categories'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusIcon } from '@lucide/vue'

const props = defineProps<{
    type: TransactionType
}>()

const router = useRouter()

const { data, selection, isLoading, showAddDialog, load, add, edit, remove } = useItems(props.type)

// Track a pending edit item for the edit dialog.
const editTarget = shallowRef<Item | null>(null)
const showEditDialog = shallowRef(false)

// Categories loaded once on mount and reused for the select field options.
const categories = shallowRef<Category[]>([])

onMounted(async () => {
    categories.value = await getCategories()
})

// Reload items whenever the route type changes.
watch(
    () => props.type,
    () => load(),
)

// ColumnDef for Item (category_name is the joined display field).
const columns = computed<ColumnDef<Item>[]>(() => [
    {
        accessorKey: 'description',
        header: ({ column }) =>
            h(DataTableColumnHeader, { column, title: 'Description' }),
        cell: ({ row }) => row.getValue<string>('description'),
        enableSorting: true,
    },
    {
        accessorKey: 'category_name',
        header: ({ column }) =>
            h(DataTableColumnHeader, { column, title: 'Category' }),
        cell: ({ row }) => row.getValue<string>('category_name') ?? '—',
        enableSorting: true,
    },
    {
        id: 'actions',
        header: () => null,
        cell: ({ row }) =>
            h('div', { class: 'flex items-center gap-2 justify-end' }, [
                h(
                    Button,
                    {
                        variant: 'ghost',
                        size: 'sm',
                        onClick: () => openEditDialog(row.original),
                    },
                    () => 'Edit',
                ),
                h(
                    Button,
                    {
                        variant: 'ghost',
                        size: 'sm',
                        class: 'text-destructive hover:text-destructive',
                        onClick: () => confirmDeleteOne(row.original),
                    },
                    () => 'Delete',
                ),
            ]),
        enableSorting: false,
        enableHiding: false,
    },
])

// Field definitions for add/edit dialog.
const fieldDefs = computed<FieldDef[]>(() => [
    {
        id: 'description',
        label: 'Description',
        type: 'text',
        required: true,
    },
    {
        id: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: categories.value.map(c => ({ label: c.name, value: c.id })),
    },
])

// Add dialog.
function openAddDialog() {
    editTarget.value = null
    showAddDialog.value = true
}

async function handleAddSubmit(values: Record<string, unknown>) {
    await add({
        description: values.description as string,
        category: Number(values.category),
    })
}

// Edit dialog.
function openEditDialog(item: Item) {
    editTarget.value = item
    showEditDialog.value = true
}

async function handleEditSubmit(values: Record<string, unknown>) {
    if (!editTarget.value) return
    await edit(editTarget.value.id, {
        description: values.description as string,
        category: Number(values.category),
    })
    editTarget.value = null
}

// Per-row delete (single item confirm).
const deleteTarget = shallowRef<Item | null>(null)
const showDeleteOneDialog = shallowRef(false)

function confirmDeleteOne(item: Item) {
    deleteTarget.value = item
    showDeleteOneDialog.value = true
}

async function handleDeleteOne() {
    if (!deleteTarget.value) return
    await remove([deleteTarget.value.id])
    deleteTarget.value = null
    showDeleteOneDialog.value = false
}

// Bulk delete from table selection.
const showDeleteManyDialog = shallowRef(false)

const selectionState = computed<RowSelectionState>({
    get: () =>
        Object.fromEntries(
            selection.value.map(item => [String(item.id), true]),
        ),
    set: (state) => {
        selection.value = data.value.filter(item => state[String(item.id)])
    },
})

function confirmDeleteMany() {
    showDeleteManyDialog.value = true
}

async function handleDeleteMany() {
    await remove(selection.value.map(item => item.id))
    showDeleteManyDialog.value = false
}

// Tab navigation.
function onTabChange(value: string | number) {
    router.push(`/items/${String(value)}`)
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Purchases / Sales tab switcher -->
        <Tabs :default-value="type" @update:model-value="onTabChange">
            <TabsList>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>
        </Tabs>

        <!-- Toolbar: Add + Delete selected -->
        <div class="flex items-center gap-2">
            <Button size="sm" @click="openAddDialog">
                <PlusIcon class="mr-1 size-4" />
                Add
            </Button>
            <Button
                v-if="selection.length > 0"
                size="sm"
                variant="destructive"
                @click="confirmDeleteMany"
            >
                Delete ({{ selection.length }})
            </Button>
        </div>

        <!-- Data table -->
        <DataTable
            :columns="columns"
            :data="data"
            :loading="isLoading"
            v-model:selection="selectionState"
            :get-row-id="(row) => String(row.id)"
            :export-filename="`items-${type}`"
        />

        <!-- Add dialog -->
        <RecordDialog
            title="Add Item"
            :fields="fieldDefs"
            v-model:open="showAddDialog"
            @submit="handleAddSubmit"
        />

        <!-- Edit dialog -->
        <RecordDialog
            title="Edit Item"
            :fields="fieldDefs"
            :initial-values="editTarget
                ? { description: editTarget.description, category: String(editTarget.category) }
                : undefined"
            v-model:open="showEditDialog"
            @submit="handleEditSubmit"
        />

        <!-- Delete one confirm dialog -->
        <AlertDialog v-model:open="showDeleteOneDialog">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Item</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete
                        <strong>{{ deleteTarget?.description }}</strong>?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" @click="handleDeleteOne">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <!-- Delete many confirm dialog -->
        <AlertDialog v-model:open="showDeleteManyDialog">
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Items</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete
                        {{ selection.length }} item{{ selection.length === 1 ? '' : 's' }}?
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" @click="handleDeleteMany">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
</template>
