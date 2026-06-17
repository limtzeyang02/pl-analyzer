import { ref, onMounted } from 'vue'
import type { Category } from '@/types'
import { getCategories, addCategory, editCategory, deleteCategories } from '@/service/categories'

export function useCategories() {
    const data = ref<Category[]>([])
    const selection = ref<Category[]>([])
    const isLoading = ref(false)
    const showAddDialog = ref(false)

    async function load() {
        isLoading.value = true
        data.value = await getCategories()
        isLoading.value = false
    }

    async function add(record: Omit<Category, 'id'>) {
        await addCategory(record)
        await load()
    }

    async function edit(id: number, record: Partial<Category>) {
        await editCategory(id, record)
        await load()
    }

    async function remove(ids: number[]) {
        await deleteCategories(ids)
        selection.value = []
        await load()
    }

    onMounted(load)

    return { data, selection, isLoading, showAddDialog, load, add, edit, remove }
}
