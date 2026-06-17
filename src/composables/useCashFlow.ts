import { ref, onMounted } from 'vue'
import type { RowSelectionState } from '@tanstack/vue-table'
import type { CashFlow } from '@/types'
import { getCashFlow, addCashFlow, editCashFlow, deleteCashFlow, importCashFlow } from '@/service/cashFlow'

export function useCashFlow() {
    const data = ref<CashFlow[]>([])
    const selection = ref<RowSelectionState>({})
    const isLoading = ref(false)
    const showAddDialog = ref(false)
    const showImportDialog = ref(false)

    async function load() {
        isLoading.value = true
        data.value = await getCashFlow()
        isLoading.value = false
    }

    async function add(record: Omit<CashFlow, 'profit_loss'>) {
        await addCashFlow(record)
        await load()
    }

    async function edit(key: Date, record: Partial<CashFlow>) {
        await editCashFlow(key, record)
        await load()
    }

    async function remove(dates: Date[]) {
        await deleteCashFlow(dates)
        selection.value = {}
        await load()
    }

    async function importRecords(records: Record<string, unknown>[]) {
        await importCashFlow(records)
        await load()
    }

    onMounted(load)

    return { data, selection, isLoading, showAddDialog, showImportDialog, load, add, edit, remove, importRecords }
}
