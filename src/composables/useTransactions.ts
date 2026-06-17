import { ref, onMounted } from 'vue'
import type { TransactionType, Transaction } from '@/types'
import { getTransactions, addTransaction, editTransaction, deleteTransactions, importTransactions } from '@/service/transactions'

export function useTransactions(type: TransactionType) {
    const data = ref<Transaction[]>([])
    const selection = ref<Transaction[]>([])
    const isLoading = ref(false)
    const showAddDialog = ref(false)
    const showImportDialog = ref(false)

    async function load() {
        isLoading.value = true
        data.value = await getTransactions(type)
        isLoading.value = false
    }

    async function add(record: Omit<Transaction, 'id'>) {
        await addTransaction(type, record)
        await load()
    }

    async function edit(id: number, record: Partial<Transaction>) {
        await editTransaction(type, id, record)
        await load()
    }

    async function remove(ids: number[]) {
        await deleteTransactions(type, ids)
        selection.value = []
        await load()
    }

    async function importRecords(records: Record<string, unknown>[]) {
        await importTransactions(type, records)
        await load()
    }

    onMounted(load)

    return { data, selection, isLoading, showAddDialog, showImportDialog, load, add, edit, remove, importRecords }
}
