import { ref, onMounted } from 'vue'
import type { TransactionType, Item } from '@/types'
import { getItems, addItem, editItem, deleteItems } from '@/service/items'

export function useItems(type: TransactionType) {
    const data = ref<Item[]>([])
    const selection = ref<Item[]>([])
    const isLoading = ref(false)
    const showAddDialog = ref(false)

    async function load() {
        isLoading.value = true
        data.value = await getItems(type)
        isLoading.value = false
    }

    async function add(record: Omit<Item, 'id'>) {
        await addItem(type, record)
        await load()
    }

    async function edit(id: number, record: Partial<Item>) {
        await editItem(type, id, record)
        await load()
    }

    async function remove(ids: number[]) {
        await deleteItems(type, ids)
        selection.value = []
        await load()
    }

    onMounted(load)

    return { data, selection, isLoading, showAddDialog, load, add, edit, remove }
}
